/**
 * iyzico Checkout Form ödemesinin uzlaştırılması — callback ve webhook
 * uçlarının ORTAK mantığı. İki ayrı ödeme mantığı bulunmaz.
 *
 * Otorite zinciri (değişmedi, callback route'undan taşındı):
 *   token → server-to-server RETRIEVE → response signature doğrula →
 *   basketId'den siparişi bul → tutar/para birimi çapraz kontrol →
 *   paymentStatus SUCCESS ve sipariş pending ise paid.
 *
 * `source` yalnız iki şeyi belirler; ikisi de "bu yol kendi kendine tekrar
 * dener mi" sorusundan türer:
 *
 *   callback → siparişi `failed` işaretleyebilir (alıcı akışı bitirip geri
 *     döndü, o ödeme oturumu kapandı); `retryable` durumunda uyarı maili atar,
 *     çünkü callback bir daha GELMEZ.
 *   webhook → siparişi ASLA `failed` yapmaz: alıcı iyzico'nun sayfasında aynı
 *     oturumda ikinci kartı deneyebilir ve webhook ara durumları da bildirir;
 *     erken kapatırsak sonraki SUCCESS'i işleyemeyiz. `retryable` durumunda
 *     sessiz kalır, çünkü iyzico 15 dk sonra tekrar dener (çağıran 503 döner).
 *
 * `deps` yalnız TEST içindir; üretimde `defaultSettleDeps` kullanılır.
 */
import {
  dbGetOrder,
  dbFindOrderByTokenHash,
  dbFindPendingOrderByLegacyToken,
  dbMarkOrderPaid,
  dbMarkOrderFailed,
  dbFlagOrderAttention,
  dbClearOrderAttention,
  type OrderWithItems,
} from "@/lib/db/orders";
import {
  notifyNewOrder,
  notifyPaymentNeedsAttention,
} from "@/lib/notify/order-email";
import {
  retrieveCheckoutForm,
  verifyCfRetrieveSignature,
  hashCallbackToken,
  type CfRetrieveResult,
} from "@/lib/payment/iyzico";
import { resolveCallbackOrder } from "@/lib/checkout/resolve-callback-order";
import type { OrderRow, OrderItemRow } from "@/lib/db/schema";

export type SettleOutcome =
  | { kind: "paid"; orderId: string; orderNo: string; firstTime: boolean }
  | { kind: "already-paid"; orderId: string }
  | { kind: "not-paid"; orderId: string }
  | { kind: "retryable"; reason: string }
  | {
      kind: "needs-attention";
      reason: string;
      detail: Record<string, unknown>;
      orderId?: string;
    };

export type AttentionInput = {
  orderId?: string;
  orderNo?: string;
  reason: string;
  detail: Record<string, unknown>;
};

export type SettleDeps = {
  hashToken: (token: string) => string;
  findByTokenHash: (hash: string) => Promise<OrderWithItems | null>;
  findPendingByLegacyToken: (token: string) => Promise<OrderWithItems | null>;
  retrieve: (token: string) => Promise<CfRetrieveResult>;
  verifyRetrieveSignature: (r: CfRetrieveResult) => boolean;
  getOrder: (id: string) => Promise<OrderWithItems | null>;
  markPaid: (
    id: string,
    ref: { paymentProvider?: string; paymentId?: string },
  ) => Promise<boolean>;
  markFailed: (id: string, status?: "failed" | "cancelled") => Promise<void>;
  flagAttention: (id: string, reason: string) => Promise<boolean>;
  clearAttention: (id: string) => Promise<void>;
  notifyNewOrder: (order: OrderRow, items: OrderItemRow[]) => Promise<void>;
  notifyAttention: (input: AttentionInput) => Promise<void>;
};

export const defaultSettleDeps: SettleDeps = {
  hashToken: hashCallbackToken,
  findByTokenHash: dbFindOrderByTokenHash,
  findPendingByLegacyToken: dbFindPendingOrderByLegacyToken,
  retrieve: retrieveCheckoutForm,
  verifyRetrieveSignature: verifyCfRetrieveSignature,
  getOrder: dbGetOrder,
  markPaid: dbMarkOrderPaid,
  markFailed: dbMarkOrderFailed,
  flagAttention: dbFlagOrderAttention,
  clearAttention: dbClearOrderAttention,
  notifyNewOrder,
  notifyAttention: notifyPaymentNeedsAttention,
};

/**
 * Bayrağı koyar ve (bastırılmamışsa) uyarı maili gönderir. Hatası akışı
 * BOZMAZ: uyarı gönderilemediği için ödeme işlemi geri alınmaz.
 */
async function raiseAttention(
  deps: SettleDeps,
  input: AttentionInput,
): Promise<void> {
  try {
    let shouldNotify = true;
    if (input.orderId) {
      shouldNotify = await deps.flagAttention(input.orderId, input.reason);
    }
    if (shouldNotify) await deps.notifyAttention(input);
  } catch (e) {
    console.error("Ödeme uyarısı gönderilemedi:", e);
  }
}

/**
 * Dış kabuk: beklenmedik hiçbir istisna dışarı sızmaz.
 *
 * Neden: uzlaştırma DB'ye ve ağa dokunur. Bir istisna route'a kadar çıkarsa
 * webhook 500 döner; 500 de 2xx olmadığı için iyzico tekrar dener, yani sonuç
 * tesadüfen doğrudur ama sözleşmemiz belirsizleşir ve log kirlenir. Burada
 * açıkça `retryable` diyoruz: çağıran 503 döner, niyet okunur olur.
 * (Şema migration'ı uygulanmadan deploy edilirse tam olarak bu yaşanır.)
 */
export async function settleCheckoutFormPayment(
  token: string,
  opts: { source: "callback" | "webhook" },
  deps: SettleDeps = defaultSettleDeps,
): Promise<SettleOutcome> {
  try {
    return await settle(token, opts, deps);
  } catch (e) {
    console.error("Ödeme uzlaştırma beklenmedik hatayla durdu:", e);
    return {
      kind: "retryable",
      reason: "Ödeme sonucu işlenemedi, beklenmedik bir hata oluştu.",
    };
  }
}

async function settle(
  token: string,
  opts: { source: "callback" | "webhook" },
  deps: SettleDeps,
): Promise<SettleOutcome> {
  const isCallback = opts.source === "callback";
  const tokenHash = deps.hashToken(token);

  // Hızlı yol araması. Öncelik hash'te; bulunamazsa CUTOVER FALLBACK olarak
  // yalnız `pending` siparişlerde eski ham `paymentToken` denenir. İkisi de
  // boş dönebilir — bu bir RET SEBEBİ DEĞİLDİR, aşağıda iyzico'ya sorulur.
  const byHash = await deps.findByTokenHash(tokenHash);
  const byLegacyToken = byHash
    ? null
    : await deps.findPendingByLegacyToken(token);
  const local = resolveCallbackOrder(byHash, byLegacyToken);

  // Kestirme: zaten ödenmiş — idempotent replay, iyzico'ya gitmeye gerek yok.
  if (local && local.order.status === "paid") {
    return { kind: "already-paid", orderId: local.order.id };
  }

  let result: CfRetrieveResult;
  try {
    result = await deps.retrieve(token);
  } catch (e) {
    console.error("iyzico retrieve isteği başarısız:", e);
    const reason = "iyzico'ya bağlanılamadı, ödeme sonucu doğrulanamadı.";
    if (isCallback) {
      await raiseAttention(deps, {
        orderId: local?.order.id,
        orderNo: local?.order.orderNo,
        reason,
        detail: { hata: String(e) },
      });
    }
    return { kind: "retryable", reason };
  }

  if (result.status !== "success") {
    console.error("iyzico retrieve reddetti:", result.errorMessage);
    const reason = "iyzico sorguyu reddetti, ödeme sonucu doğrulanamadı.";
    if (isCallback) {
      await raiseAttention(deps, {
        orderId: local?.order.id,
        orderNo: local?.order.orderNo,
        reason,
        detail: {
          errorCode: result.errorCode,
          errorMessage: result.errorMessage,
        },
      });
    }
    return { kind: "retryable", reason };
  }

  if (!deps.verifyRetrieveSignature(result)) {
    // İmza tutmuyorsa yanıtın bütünlüğüne güvenilemez — siparişe DOKUNMA.
    console.error("iyzico retrieve imzası DOĞRULANAMADI", {
      basketId: result.basketId,
      conversationId: result.conversationId,
    });
    const reason = "iyzico yanıtının imzası doğrulanamadı, siparişe dokunulmadı.";
    await raiseAttention(deps, {
      orderId: local?.order.id,
      orderNo: local?.order.orderNo,
      reason,
      detail: {
        basketId: result.basketId,
        conversationId: result.conversationId,
      },
    });
    return {
      kind: "needs-attention",
      reason,
      detail: { basketId: result.basketId },
      orderId: local?.order.id,
    };
  }

  const orderId = String(result.basketId ?? "");

  // Çapraz kontrol: yerelde bir eşleşme bulduysak, iyzico'nun döndüğü basketId
  // ile aynı siparişi göstermeli. Uyuşmuyorsa eşleştirme karışıklığı var.
  if (local && local.order.id !== orderId) {
    console.error("iyzico: yerel eşleşme basketId ile uyuşmuyor — reddedildi", {
      localOrderId: local.order.id,
      basketId: orderId,
    });
    const reason = "Ödeme başka bir siparişle eşleşti, siparişe dokunulmadı.";
    await raiseAttention(deps, {
      orderId: local.order.id,
      orderNo: local.order.orderNo,
      reason,
      detail: { yerelSiparis: local.order.id, iyzicoBasketId: orderId },
    });
    return {
      kind: "needs-attention",
      reason,
      detail: { localOrderId: local.order.id, basketId: orderId },
      orderId: local.order.id,
    };
  }

  // Otoriter satırı retrieve SONRASI taze oku (ağ çağrısı sırasında durum
  // değişmiş olabilir).
  const data = orderId ? await deps.getOrder(orderId) : null;
  if (!data) {
    const reason = "Ödeme alındı ama eşleşen sipariş bulunamadı.";
    await raiseAttention(deps, {
      reason,
      detail: { basketId: orderId, paymentId: result.paymentId },
    });
    return { kind: "needs-attention", reason, detail: { basketId: orderId } };
  }
  const { order } = data;

  const success = result.paymentStatus === "SUCCESS";
  const amountOk =
    Number(result.paidPrice) === Number(order.totalTry) &&
    (result.currency ?? "TRY") === "TRY";

  if (success && amountOk) {
    if (order.status === "pending") {
      // Koşullu UPDATE: eşzamanlı çifte istekte yalnız biri true alır →
      // e-posta bildirimi tek sefer gider (para tarafı zaten idempotent).
      const updated = await deps.markPaid(order.id, {
        paymentProvider: "iyzico",
        paymentId: result.paymentId ? String(result.paymentId) : undefined,
      });
      if (updated) {
        // Bayrak temizliği ve bildirim best-effort: ödeme zaten yazıldı,
        // buradaki bir hata onu geri almaz ve `retryable`a düşürmez.
        try {
          await deps.clearAttention(order.id);
          const fresh = await deps.getOrder(order.id);
          if (fresh) await deps.notifyNewOrder(fresh.order, fresh.items);
        } catch (e) {
          console.error("Sipariş bildirimi gönderilemedi:", e);
        }
      } else {
        // Okuma anında pending'di ama UPDATE 0 satır etkiledi: bu istekle
        // yarışan bir işlem durumu değiştirdi. Para çekilmiş olabilir.
        console.error(
          "iyzico: ödeme başarılı ama pending→paid geçişi bu istekte olmadı (yarış)",
          {
            orderId: order.id,
            orderNo: order.orderNo,
            paymentId: result.paymentId,
          },
        );
      }
      return {
        kind: "paid",
        orderId: order.id,
        orderNo: order.orderNo,
        firstTime: updated,
      };
    }
    if (order.status === "paid") {
      return { kind: "already-paid", orderId: order.id };
    }
    // Para çekilmiş ama sipariş paid de pending de değil (örn. alıcı ödeme
    // sayfasındayken admin iptal etti). paid YAZMA; iade/manuel inceleme.
    const reason = `Ödeme başarılı ama sipariş durumu "${order.status}". Paid yazılmadı.`;
    console.error("iyzico: ödeme başarılı ama sipariş durumu uyumsuz", {
      orderId: order.id,
      orderNo: order.orderNo,
      status: order.status,
      paymentId: result.paymentId,
    });
    await raiseAttention(deps, {
      orderId: order.id,
      orderNo: order.orderNo,
      reason,
      detail: { durum: order.status, paymentId: result.paymentId },
    });
    return {
      kind: "needs-attention",
      reason,
      detail: { status: order.status },
      orderId: order.id,
    };
  }

  if (success && !amountOk) {
    // Ödeme alınmış ama tutar/para birimi uyuşmuyor: paid YAZMA.
    const reason = "Ödeme alındı ama tutar siparişle uyuşmuyor. Paid yazılmadı.";
    console.error("iyzico tutar UYUŞMAZLIĞI — manuel inceleme gerekli", {
      orderId: order.id,
      orderNo: order.orderNo,
      expected: order.totalTry,
      paidPrice: result.paidPrice,
      currency: result.currency,
      paymentId: result.paymentId,
    });
    await raiseAttention(deps, {
      orderId: order.id,
      orderNo: order.orderNo,
      reason,
      detail: {
        beklenen: order.totalTry,
        cekilen: result.paidPrice,
        paraBirimi: result.currency,
        paymentId: result.paymentId,
      },
    });
    return {
      kind: "needs-attention",
      reason,
      detail: { expected: order.totalTry, paidPrice: result.paidPrice },
      orderId: order.id,
    };
  }

  // Ödeme başarısız. Yalnız callback siparişi kapatabilir; webhook ara
  // durumları da bildirdiği için siparişe DOKUNMAZ (bkz. dosya başı).
  if (isCallback && order.status === "pending") {
    await deps.markFailed(order.id, "failed");
  }
  return { kind: "not-paid", orderId: order.id };
}
