/**
 * Ödeme sağlayıcı modu.
 *
 * - `iyzico` : IYZICO_API_KEY + IYZICO_SECRET_KEY tanımlıysa → gerçek iyzico
 *   Checkout Form (kart verisi bizde durmaz). Initialize/retrieve uçları
 *   anahtarlar + public callbackUrl geldiğinde bağlanacak (bkz. memory
 *   reference_iyzico_integration: endpoint, IYZWSv2 imza, response signature).
 * - `mock`   : anahtar yoksa → yerel "sandbox/test ödeme" adımı. Tüm akış
 *   (sepet → checkout → ödeme → sonuç → sipariş kaydı) anahtarsız görülebilir.
 *
 * Sadece sunucu tarafında kullanılır (process.env okur).
 */
export type PaymentMode = "iyzico" | "mock";

export function isIyzicoConfigured(): boolean {
  return Boolean(process.env.IYZICO_API_KEY && process.env.IYZICO_SECRET_KEY);
}

export function paymentMode(): PaymentMode {
  return isIyzicoConfigured() ? "iyzico" : "mock";
}

/**
 * GERÇEK iyzico Checkout Form initialize/retrieve buraya gelecek (anahtar +
 * public callbackUrl hazır olunca). İskelet:
 *   initialize: POST {base}/payment/iyzipos/checkoutform/initialize/auth/ecom
 *     → { token, checkoutFormContent } ; iframe olarak render edilir.
 *   retrieve:   POST {base}/payment/iyzipos/checkoutform/auth/ecom/detail
 *     → paymentStatus==='SUCCESS' + response signature + tutar çapraz kontrol.
 * Şu an mock modda bu uçlara gerek yok; akış yerel test ödeme adımıyla işler.
 */
