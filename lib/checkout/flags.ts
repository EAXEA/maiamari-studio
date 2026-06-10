/**
 * Checkout (sepet + kendi ödememiz) canlıda açık mı.
 *
 * iyzico gerçek ödeme hazır olana kadar PROD'da KAPALI tutulur: müşteri mock
 * test ödemesine ulaşamaz. Kapalıyken "Sepete ekle"/sepet/checkout gizlenir,
 * "Online ödeme yakında" gösterilir (materyalde diskret Shopier köprüsü,
 * eserde WhatsApp bilgi köprüsü kalır).
 *
 * NEXT_PUBLIC_ olduğu için hem client hem server bileşenleri okuyabilir;
 * değer build anında gömülür. Lokal `.env.local`: =1 (geliştirme açık).
 * Vercel Production'da KONMAZ (kapalı); iyzico hazır olunca =1 yapılır.
 */
export const CHECKOUT_ENABLED =
  process.env.NEXT_PUBLIC_CHECKOUT_ENABLED === "1";
