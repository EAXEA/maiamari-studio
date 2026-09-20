"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { dbSetOrderStatus, dbClearOrderAttention } from "@/lib/db/orders";
import { reconcilePendingOrder } from "@/lib/checkout/reconcile-payment";

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
  const sonuc = await reconcilePendingOrder(orderId);
  if (sonuc.paid) {
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    return { ok: true, message: sonuc.message };
  }
  if (!sonuc.reachable) {
    return {
      ok: false,
      message:
        "iyzico'ya ulaşılamadı. Sipariş değiştirilmedi, birkaç dakika sonra tekrar deneyin.",
    };
  }
  return { ok: false, message: sonuc.message };
}
