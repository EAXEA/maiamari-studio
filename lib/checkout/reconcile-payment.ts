/**
 * Bekleyen bir siparişi iyzico'ya SORARAK uzlaştırma kararı.
 *
 * `settle-payment.ts` callback/webhook anında, ham `token` ile çalışır.
 * Burası ise sonradan, yalnız `conversationId` ile çalışır: callback anında
 * iyzico'ya ulaşılamadığında (18.09 BC2F, 20.09 A666) tek kalan yol budur.
 *
 * Karar SAF tutulur, yan etkisi yoktur; yazma işini çağıran yapar. Böylece
 * "ne zaman ödendi denir" kuralı testle kilitlenir: para durumunu değiştiren
 * bir karar, gözle doğrulanamayan bir yerde durmamalı.
 */
import {
  retrievePaymentByConversationId,
  verifyPaymentDetailSignature,
  type PaymentDetailResult,
} from "@/lib/payment/iyzico";
import {
  dbGetOrder,
  dbMarkOrderPaid,
  dbClearOrderAttention,
} from "@/lib/db/orders";
import { notifyNewOrder } from "@/lib/notify/order-email";

export type ReconcileDecision =
  /** iyzico ödemeyi başarılı gösteriyor ve her şey tutuyor. */
  | { kind: "paid"; paymentId: string }
  /** iyzico'ya göre bu sipariş için başarılı bir ödeme yok. */
  | { kind: "not-paid"; detail: string }
  /** Yanıt geldi ama güvenilmez: imza, sipariş ya da tutar tutmuyor. */
  | { kind: "mismatch"; detail: string }
  /** Soru sorulamadı ya da iyzico hata döndü. */
  | { kind: "error"; detail: string };

export type ReconcileInput = {
  order: { id: string; totalTry: string | number; status: string };
  result: PaymentDetailResult;
  signatureOk: boolean;
};

export function decideReconcile({
  order,
  result,
  signatureOk,
}: ReconcileInput): ReconcileDecision {
  if (result.status !== "success") {
    // iyzico hataları 200 + {status:"failure"} ile döner; kayıt yoksa da böyle.
    const msg = result.errorMessage || result.errorCode || "bilinmeyen hata";
    return { kind: "not-paid", detail: `iyzico: ${msg}` };
  }

  // İmza, yanıtın gerçekten iyzico'dan ve DEĞİŞTİRİLMEDEN geldiğinin kanıtı.
  // Tutmuyorsa hiçbir alanına güvenilmez, "ödendi" yazılmaz.
  if (!signatureOk) {
    return { kind: "mismatch", detail: "Yanıt imzası doğrulanamadı." };
  }

  // Sipariş eşleşmesi: initialize'da basketId = sipariş id'sidir. Farklıysa
  // elimizdeki yanıt BAŞKA bir siparişe aittir.
  if (result.basketId && result.basketId !== order.id) {
    return {
      kind: "mismatch",
      detail: `Yanıt başka bir siparişe ait (basketId ${result.basketId}).`,
    };
  }

  if (result.paymentStatus !== "SUCCESS") {
    return {
      kind: "not-paid",
      detail: `Ödeme durumu: ${result.paymentStatus || "bilinmiyor"}.`,
    };
  }

  // Tutar çapraz kontrolü: istemci fiyatına güvenilmediği gibi, iyzico'dan
  // gelen tutarın da siparişin tutarıyla birebir olması gerekir.
  const beklenen = Number(order.totalTry);
  const gelen = Number(result.price);
  if (!(beklenen > 0) || !(gelen > 0) || Math.abs(beklenen - gelen) > 0.009) {
    return {
      kind: "mismatch",
      detail: `Tutar uyuşmuyor: sipariş ${order.totalTry}, iyzico ${result.price}.`,
    };
  }

  const paymentId = result.paymentId != null ? String(result.paymentId) : "";
  if (!paymentId) {
    return { kind: "mismatch", detail: "Yanıtta paymentId yok." };
  }

  return { kind: "paid", paymentId };
}


export type ReconcileOutcome = {
  /** Sipariş bu çağrının sonunda ödenmiş sayılıyor mu. */
  paid: boolean;
  /** Soru iyzico'ya sorulabildi mi (false = ulaşılamadı). */
  reachable: boolean;
  /** Panelde gösterilecek açıklama. Müşteriye bu metin GÖSTERİLMEZ. */
  message: string;
};

/**
 * Bekleyen siparişi iyzico'ya sorup uzlaştırır. Yetki kontrolü YAPMAZ;
 * çağıran yapar (panelde `requireAdmin`, sonuç sayfasında sipariş sahipliği).
 *
 * Hem panel hem müşterinin sonuç sayfası bunu kullanır: iki ayrı uzlaştırma
 * mantığı bulunmamalı, yoksa biri düzelirken diğeri eskir.
 *
 * `retries` çağırana bırakılır: panelde geniş (kimse beklemiyor), alıcının
 * sonuç sayfasında dar olmalı, yoksa sayfa saniyelerce asılı kalır.
 */
export async function reconcilePendingOrder(
  orderId: string,
  opts?: { retries?: number },
): Promise<ReconcileOutcome> {
  const data = await dbGetOrder(orderId);
  if (!data) return { paid: false, reachable: true, message: "Sipariş bulunamadı." };
  const { order } = data;

  if (order.status === "paid") {
    return { paid: true, reachable: true, message: "Sipariş zaten ödendi." };
  }
  if (order.status !== "pending") {
    return {
      paid: false,
      reachable: true,
      message: `Sipariş durumu ${order.status}, sorgulanmadı.`,
    };
  }
  if (!order.conversationId) {
    return {
      paid: false,
      reachable: true,
      message: "Siparişte conversationId yok, iyzico'ya sorulamaz.",
    };
  }

  let result: PaymentDetailResult;
  try {
    result = await retrievePaymentByConversationId(order.conversationId, {
      retries: opts?.retries,
    });
  } catch (e) {
    // Sorunun kendisi bu: iyzico'ya ulaşılamıyor. Sipariş DEĞİŞTİRİLMEZ.
    console.error("iyzico sorgusu düştü:", e);
    return {
      paid: false,
      reachable: false,
      message: "iyzico'ya ulaşılamadı. Sipariş değiştirilmedi.",
    };
  }

  const karar = decideReconcile({
    order: { id: order.id, totalTry: order.totalTry, status: order.status },
    result,
    signatureOk: verifyPaymentDetailSignature(result),
  });

  if (karar.kind !== "paid") {
    return { paid: false, reachable: true, message: karar.detail };
  }

  const updated = await dbMarkOrderPaid(order.id, {
    paymentProvider: "iyzico",
    paymentId: karar.paymentId,
  });
  await dbClearOrderAttention(order.id);

  // Bildirim yalnız gerçek pending→paid geçişinde. Mail hatası uzlaştırmayı
  // bozmaz: para durumu doğru yazıldı, haber verememek ayrı bir sorundur.
  if (updated) {
    try {
      const fresh = await dbGetOrder(order.id);
      if (fresh) await notifyNewOrder(fresh.order, fresh.items);
    } catch (e) {
      console.error("Sipariş bildirimi gönderilemedi:", e);
    }
  }

  return {
    paid: true,
    reachable: true,
    message: `Ödeme doğrulandı (${karar.paymentId}).`,
  };
}
