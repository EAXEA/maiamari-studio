/**
 * iyzico Checkout Form callback'i — BİRİNCİ haber yolu (alıcının tarayıcısı).
 *
 * iyzico, alıcının tarayıcısını ödeme sonrası buraya POST'lar (body: token).
 * Bu POST'a GÜVENİLMEZ — herkes POST'layabilir. Otorite zinciri ve tüm
 * uzlaştırma mantığı lib/checkout/settle-payment.ts'te; bu route yalnız
 * token'ı alır, ortak fonksiyonu çağırır ve alıcıyı yönlendirir.
 *
 * Mantık 2026-09-19'da buradan çıkarıldı: aynı uzlaştırma artık iyzico'nun
 * sunucu-sunucu bildirimi (app/api/payment/iyzico/webhook) tarafından da
 * çağrılıyor. Sebep: 18.09'da bu callback geldi ama retrieve çağrısı
 * ECONNRESET ile düştü, tekrar deneme olmadığı için 1.250 TL'lik ödeme
 * işlenmeden kaldı. Webhook o senaryoyu kapatır.
 *
 * Alıcı /checkout/sonuc'a yönlendirilir (sayfa sahiplik cookie'sini zaten
 * doğruluyor; cookie alıcının tarayıcısında startCheckout'ta kuruldu).
 */
import { NextResponse } from "next/server";
import { settleCheckoutFormPayment } from "@/lib/checkout/settle-payment";
import { paymentMode, siteBaseUrl } from "@/lib/payment/iyzico";

export const dynamic = "force-dynamic";

function back(path: string): NextResponse {
  // Yönlendirme tabanı SITE_URL (yoksa canlı domain). req.url KULLANILMAZ:
  // tünel/proxy arkasında req.url "https://localhost:3000" çözülüyor ve alıcı
  // ödeme sonrası SSL hatasına düşüyordu (Faz C sandbox testinde yaşandı).
  // callbackUrl da zaten siteBaseUrl'den üretiliyor; ikisi hep aynı origin.
  return NextResponse.redirect(new URL(path, siteBaseUrl()), 303);
}

export async function POST(req: Request) {
  if (paymentMode() !== "iyzico") return back("/cart");

  let token = "";
  try {
    const form = await req.formData();
    token = String(form.get("token") ?? "").trim();
  } catch {
    /* gövde form değilse token boş kalır */
  }
  if (!token) return back("/cart");

  // source: "callback" → siparişi failed yazabilir ve retryable durumunda
  // uyarı maili atar, çünkü bu yol bir daha GELMEZ (bkz. settle-payment.ts).
  const outcome = await settleCheckoutFormPayment(token, { source: "callback" });

  switch (outcome.kind) {
    case "paid":
    case "already-paid":
    case "not-paid":
      return back(`/checkout/sonuc?order=${outcome.orderId}`);
    case "needs-attention":
      return outcome.orderId
        ? back(`/checkout/sonuc?order=${outcome.orderId}`)
        : back("/cart");
    case "retryable":
      return back("/cart");
  }
}

/** Elle/GET gelenler için nazik yönlendirme (iyzico her zaman POST kullanır). */
export async function GET() {
  return back("/cart");
}
