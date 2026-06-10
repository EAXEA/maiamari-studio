/**
 * iyzico Checkout Form callback'i.
 *
 * iyzico, alıcının tarayıcısını ödeme sonrası buraya POST'lar (body: token).
 * Bu POST'a GÜVENİLMEZ — herkes POST'layabilir. Otorite zinciri:
 *   token → server-to-server RETRIEVE → response signature doğrula →
 *   basketId'den siparişi bul → tutar/para birimi çapraz kontrol →
 *   paymentStatus SUCCESS ise (ve sipariş hâlâ pending ise) paid işaretle.
 * Sonra alıcı /checkout/sonuc'a yönlendirilir (sayfa sahiplik cookie'sini
 * zaten doğruluyor; cookie alıcının tarayıcısında startCheckout'ta kuruldu).
 *
 * Idempotent: tekrarlanan POST'larda sipariş zaten paid ise yalnız yönlendirir
 * (e-posta tekrar gitmez).
 */
import { NextResponse } from "next/server";
import {
  dbGetOrder,
  dbMarkOrderPaid,
  dbMarkOrderFailed,
} from "@/lib/db/orders";
import { notifyNewOrder } from "@/lib/notify/order-email";
import {
  paymentMode,
  retrieveCheckoutForm,
  verifyCfRetrieveSignature,
} from "@/lib/payment/iyzico";

export const dynamic = "force-dynamic";

function back(req: Request, path: string): NextResponse {
  // Yönlendirme istek host'una göre (preview/tünel testinde de doğru kalsın).
  return NextResponse.redirect(new URL(path, req.url), 303);
}

export async function POST(req: Request) {
  if (paymentMode() !== "iyzico") return back(req, "/cart");

  let token = "";
  try {
    const form = await req.formData();
    token = String(form.get("token") ?? "").trim();
  } catch {
    /* gövde form değilse token boş kalır */
  }
  if (!token) return back(req, "/cart");

  // Otorite: iyzico'dan sonucu çek.
  let result;
  try {
    result = await retrieveCheckoutForm(token);
  } catch (e) {
    console.error("iyzico retrieve isteği başarısız:", e);
    return back(req, "/cart");
  }
  if (result.status !== "success") {
    console.error("iyzico retrieve reddetti:", result.errorMessage);
    return back(req, "/cart");
  }
  if (!verifyCfRetrieveSignature(result)) {
    // İmza tutmuyorsa yanıtın bütünlüğüne güvenilemez — siparişe DOKUNMA.
    console.error("iyzico retrieve imzası DOĞRULANAMADI", {
      basketId: result.basketId,
      conversationId: result.conversationId,
    });
    return back(req, "/cart");
  }

  const orderId = String(result.basketId ?? "");
  const data = orderId ? await dbGetOrder(orderId) : null;
  if (!data) return back(req, "/cart");
  const { order } = data;

  const success = result.paymentStatus === "SUCCESS";
  const amountOk =
    Number(result.paidPrice) === Number(order.totalTry) &&
    (result.currency ?? "TRY") === "TRY";

  if (success && amountOk) {
    if (order.status === "pending") {
      await dbMarkOrderPaid(order.id, {
        paymentProvider: "iyzico",
        paymentId: result.paymentId ? String(result.paymentId) : undefined,
        paymentToken: token,
      });
      // Bildirim best-effort: e-posta gönderilemese de ödeme akışı bozulmaz.
      try {
        const fresh = await dbGetOrder(order.id);
        if (fresh) await notifyNewOrder(fresh.order, fresh.items);
      } catch (e) {
        console.error("Sipariş bildirimi gönderilemedi:", e);
      }
    }
    return back(req, `/checkout/sonuc?order=${order.id}`);
  }

  if (success && !amountOk) {
    // Ödeme alınmış ama tutar/para birimi siparişle uyuşmuyor: paid YAZMA,
    // manuel inceleme gerekir (iade/itiraz). Yüksek sesle logla.
    console.error("iyzico tutar UYUŞMAZLIĞI — manuel inceleme gerekli", {
      orderId: order.id,
      orderNo: order.orderNo,
      expected: order.totalTry,
      paidPrice: result.paidPrice,
      currency: result.currency,
      paymentId: result.paymentId,
    });
  }
  if (order.status === "pending") {
    await dbMarkOrderFailed(order.id, "failed");
  }
  return back(req, `/checkout/sonuc?order=${order.id}`);
}

/** Elle/GET gelenler için nazik yönlendirme (iyzico her zaman POST kullanır). */
export async function GET(req: Request) {
  return back(req, "/cart");
}
