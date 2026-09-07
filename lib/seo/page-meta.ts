/**
 * Statik sayfaların <head> meta description'ları.
 *
 * Neden burada: `app/layout.tsx`'teki site açıklaması, kendi `description`'ını
 * tanımlamayan HER sayfaya miras kalır. 07.09.2026'da canlıda `/shop`,
 * `/journal`, `/atolyeler`, `/about` ve `/contact` birebir ana sayfanın
 * açıklamasını basıyordu; Search Console bunu kopya sinyali olarak okuyup
 * `/shop`'u "tarandı, dizine eklenmedi" durumunda tutuyordu. Canonical'lar
 * 04.08.2026'da düzeltilmişti, eksik kalan yarısı buydu.
 *
 * Metinler burada tek kaynakta tutulur ki benzersizlikleri testle kilitlenebilsin
 * (`tests/unit/page-meta.test.ts`). Sayfanın kendi `metadata` nesnesi bu
 * haritadan okur.
 *
 * Kapsam: yalnızca <head>. Sayfada görünen kopya bu modülden etkilenmez.
 * Ürünlerin meta'sı ayrı üretilir: `lib/seo/product-meta.ts`.
 */

/**
 * `app/layout.tsx`'in site geneli açıklaması. Root metadata bunu buradan okur;
 * aşağıdaki sayfa açıklamalarının hiçbiri buna eşit olmamalıdır (test eder).
 */
export const SITE_DESCRIPTION =
  "Ankara Çankaya'da bir baskı atölyesi ve galeri. Özgün linol baskılar, el yapımı kâğıtlar, baskı malzemeleri ve atölye programları.";

/** Kendi açıklamasını bu haritadan okuyan sayfaların yolları. */
export type StaticPagePath =
  | "/shop"
  | "/journal"
  | "/atolyeler"
  | "/about"
  | "/contact";

/**
 * Her metin sayfanın NE OLDUĞUNU söyler; site tanıtımını tekrar etmez.
 * Em-dash kullanılmaz (atölyenin editorial kuralı; meta arama sonucunda
 * kullanıcıya görünen metindir).
 */
export const PAGE_DESCRIPTIONS: Record<StaticPagePath, string> = {
  "/shop":
    "Atölyenin kendi kullandığı baskı malzemeleri: linol boyaları, linolyum plakalar, merdaneler, el yapımı kâğıtlar, oyma aletleri ve kitap çantaları.",
  "/journal":
    "Maiamari atölyesinden notlar ve etkinlikler: baskı denemeleri, el yapımı kâğıt üretimi, sergi ve atölye duyuruları.",
  "/atolyeler":
    "Ankara Çankaya'da linol baskı, suluboya, çanta baskı ve el yapımı kâğıt atölyeleri. Aylık program, kontenjan ve kayıt bilgileri.",
  "/about":
    "Bir atölye, bir galeri ve bir kâğıt fabrikası. Maiamari'nin hikâyesi, üretim biçimi, sanatçıları ve Ankara Çankaya'daki atölye pratiği.",
  "/contact":
    "Maiamari baskı atölyesine ulaşın: Küçükesat Bülbülderesi Caddesi No:90/B, Çankaya, Ankara. Telefon, WhatsApp, ziyaret ve atölye kaydı bilgileri.",
};

/** Sayfanın meta description'ı. Bilinmeyen yol derleme zamanında yakalanır. */
export function pageDescription(path: StaticPagePath): string {
  return PAGE_DESCRIPTIONS[path];
}
