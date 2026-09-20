"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import {
  dbSetOrderStatus,
  dbClearOrderAttention,
  dbGetOrder,
  dbMarkOrderPaid,
} from "@/lib/db/orders";
import {
  retrievePaymentByConversationId,
  verifyPaymentDetailSignature,
} from "@/lib/payment/iyzico";
import { decideReconcile } from "@/lib/checkout/reconcile-payment";
import { notifyNewOrder } from "@/lib/notify/order-email";

/**
 * Admin: sipariş durumunu ilerletir (kargo/teslim). Yetki zorunlu.
 *
 * Durumu elle değiştirmek, "ödeme doğrulanamadı" uyarısının ele alındığı
 * anlamına gelir: bayrak da temizlenir, yoksa çözülmüş bir sorun panelde
 * asılı kalırdı.
 */
export async function setOrderStatus(
  orderId: string,
  status: string,
): Promise<void> {
  await requireAdmin();
  await dbSetOrderStatus(orderId, status);
  await dbClearOrderAttention(orderId);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}

/**
 * Admin: "iyzico'ya sor". Bekleyen bir siparişin gerçek ödeme durumunu
 * conversationId ile iyzico'dan sorar ve SUCCESS ise siparişi kapatır.
 *
 * NEDEN VAR: callback anında iyzico'ya ulaşılamazsa (ölçülmüş ~%17 bağlantı
 * kopması) sipariş "bilmiyorum" durumunda asılı kalıyordu; para çekilmiş
 * olmasına rağmen 18.09'da 18 saat, 20.09'da yine fark edilmedi. Webhook
 * yedek yoldu ama o da aynı iyzico çağrısına bağlı, yani aynı anda ölüyor.
 * Bu düğme, zamana bağlı olmayan ÜÇÜNCÜ yol: soru istenildiği an sorulur.
 *
 * Karar mantığı `decideReconcile`'da ve testlidir; burada yalnız yazma var.
 */
export async function reconcileOrderWithIyzico(
  orderId: string,
): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();

  const data = await dbGetOrder(orderId);
  if (!data) return { ok: false, message: "Sipariş bulunamadı." };
  const { order } = data;

  if (order.status === "paid") {
    return { ok: true, message: "Bu sipariş zaten ödendi olarak işaretli." };
  }
  if (!order.conversationId) {
    return {
      ok: false,
      message: "Siparişte conversationId yok, iyzico'ya sorulamaz.",
    };
  }

  let result;
  try {
    result = await retrievePaymentByConversationId(order.conversationId);
  } catch (e) {
    // Sorunun kendisi bu: iyzico'ya ulaşılamıyor. Sipariş DEĞİŞTİRİLMEZ.
    console.error("iyzico sorgusu düştü:", e);
    return {
      ok: false,
      message:
        "iyzico'ya ulaşılamadı. Sipariş değiştirilmedi, birkaç dakika sonra tekrar deneyin.",
    };
  }

  const karar = decideReconcile({
    order: { id: order.id, totalTry: order.totalTry, status: order.status },
    result,
    signatureOk: verifyPaymentDetailSignature(result),
  });

  if (karar.kind !== "paid") {
    return { ok: false, message: karar.detail };
  }

  const updated = await dbMarkOrderPaid(order.id, {
    paymentProvider: "iyzico",
    paymentId: karar.paymentId,
  });
  await dbClearOrderAttention(order.id);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${order.id}`);

  // Bildirim yalnız gerçek pending→paid geçişinde; alıcı ödemesinin
  // karşılığını görmeli. Mail hatası uzlaştırmayı bozmaz.
  if (updated) {
    try {
      const fresh = await dbGetOrder(order.id);
      if (fresh) await notifyNewOrder(fresh.order, fresh.items);
    } catch (e) {
      console.error("Sipariş bildirimi gönderilemedi:", e);
    }
  }

  return {
    ok: true,
    message: `Ödeme doğrulandı (${karar.paymentId}). Sipariş ödendi olarak işaretlendi.`,
  };
}
