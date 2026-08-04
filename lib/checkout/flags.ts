/**
 * Checkout (sepet + kendi ödememiz) canlıda açık mı.
 *
 * DURUM: PROD'DA AÇIK. Vercel Production'da `NEXT_PUBLIC_CHECKOUT_ENABLED=1`
 * tanımlı; iyzico canlı ödeme 2026-07-08'de gerçek kartla doğrulandı ve
 * mağaza ürünleri de galeri eserleri de online satılıyor.
 *
 * Kapatılırsa (kill switch: flag→0 + cache'siz redeploy) "Sepete ekle"/sepet/
 * checkout gizlenir ve yerine "Online ödeme yakında" yazısı çıkar. DİKKAT:
 * o durumda fiyatlı eser sayfalarında satın alma da iletişim de kalmaz,
 * kapatmadan önce bir iletişim köprüsü (WhatsApp) eklenmelidir.
 *
 * NEXT_PUBLIC_ olduğu için hem client hem server bileşenleri okuyabilir;
 * değer build anında gömülür. Lokal `.env.local`: =1.
 */
export const CHECKOUT_ENABLED =
  process.env.NEXT_PUBLIC_CHECKOUT_ENABLED === "1";
