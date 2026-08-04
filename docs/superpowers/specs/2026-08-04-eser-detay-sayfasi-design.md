# Eser detay sayfası (`/eser/[slug]`) — tasarım

Tarih: 2026-08-04
Durum: onay bekliyor
Kapsam: maiamari.art galeri eserlerine tekil, indekslenebilir URL kazandırmak

---

## 1. Neden

Bugün galeri eserlerinin kendi adresi yok. Eserler `/galeri/<seri>` sayfasında
`WorksDetailList` içinde listeleniyor, karta tıklanınca client-side lightbox
açılıyor ve URL değişmiyor. Sonuçları:

- **SEO:** Her seri tek bir sayfa. İçindeki 10-20 eser Google için ayrı bir
  belge değil. Eser adı, teknik, ölçü gibi long-tail aramalarda site görünmüyor.
- **Paylaşım:** Tek bir eserin linki verilemiyor; karşı taraf seri sayfasına
  düşüp aşağı kaydırmak zorunda.
- **Ticaret:** Fiyatlı eserler `Product` structured data ile Google Shopping'e
  giremiyor (benzersiz landing page zorunlu). iyzico eserler için açıldığında
  satılabilir sayfa altyapısı hazır olmayacak.
- **Duplicate content riski (mevcut):** `dbGetProductBySlug` kind filtresiz
  olduğu için `/urun/<eser-slug>` bugün de açılıyor. Hiçbir yerden link
  verilmiyor ve sitemap'te yok, ama teknik olarak erişilebilir orphan sayfa.

## 2. Kararlar (kullanıcı onaylı)

| # | Karar | Seçim |
|---|---|---|
| 1 | Hangi eserler sayfa alır | **Tüm yayındaki eserler** (`isPublished=true`), satılık olsun olmasın |
| 2 | URL şeması | **`/eser/[slug]`** (düz). `/galeri/[series]/[work]` elendi: `seriesSlug` nullable olduğu için istisna kovası borcu doğuruyor, seri değişimi URL kırıyor |
| 3 | Seri sayfası davranışı | **Kart artık `/eser/<slug>`'a link.** Lightbox kaldırılıyor; seri içi gezinme eser sayfasındaki önceki/sonraki linkleriyle karşılanıyor (bunlar server HTML'de olduğu için Google seriyi zincirleme tarar) |
| 4 | Satılık olmayan eserde CTA | **Yok.** Sadece görsel + künye + açıklama. WhatsApp/Instagram butonu gösterilmez |

## 3. Veri katmanı

Mevcut desen korunuyor: `lib/db/products.ts` sorguları → `lib/data.ts` içinde
`readDb` + `cache()` sarmalayıcısı → fallback JSON snapshot.

**Yeni:**

- `dbGetArtworkBySlug(slug)` — `kind="artwork" AND isPublished AND slug=?`,
  `toPortfolioWork` ile map'lenir. `PortfolioWork | null | undefined` döner
  (undefined = DB yok → fallback).
- `dbGetAllArtworks()` — `kind="artwork" AND isPublished`, `sortOrder, title`.
  `generateStaticParams` ve sitemap için.
- `getArtworkBySlug(slug)` — `lib/data.ts` sarmalayıcısı; DB yoksa
  `getPortfolio()` (portfolio.json) içinden slug ile bulur.
- `getAllArtworks()` — aynı desen, fallback `getPortfolio()`.

**Değişen:**

- `dbGetProductBySlug` sorgusuna `eq(T.kind, "material")` eklenir. Bu, eserlerin
  `/urun/` altında sızmasını kapatır. Çağıranlar yalnız `app/urun/[slug]/page.tsx`
  ve `lib/og-image.tsx` olduğu için yan etki yüzeyi dar.
- `visualArtworkSchema(work, series)` imzası `series: Series | null` olur;
  `isPartOf` alanı koşullu üretilir. `seriesCollectionPageSchema` içindeki
  mevcut çağrı etkilenmez.

**Önceki/sonraki için yeni sorgu yok.** Sayfa `getPortfolioBySeries(work.series)`
çağırır (mevcut, `cache()` sarılı) ve dizide indeks bularak komşuları çıkarır.

## 4. Sayfa: `app/eser/[slug]/page.tsx`

`app/urun/[slug]/page.tsx` yapısı kalıp alınır (`revalidate = 60`,
`generateStaticParams`, `generateMetadata`, JSON-LD script'leri, breadcrumb).

**İçerik blokları:**

1. Kırıntı navigasyon: `Galeri › <Seri> › <Eser>`. `seriesSlug` yoksa
   `Galeri › <Eser>`.
2. Görsel. Eser tek görselli olduğu için `ProductGallery` yerine sade bir
   `next/image` + tıklayınca büyütme. Görsel oranı `imageWidth/imageHeight`
   alanlarından korunur (CLS önlemi).
3. Başlık (`h1`) + sanatçı adı, sanatçı sayfasına link (`/galeri/sanatci/<slug>`).
4. Künye tablosu: teknik, kâğıt, ölçü, edisyon (`editionSize`), ilk seri no
   (`firstSerial`), yıl. Boş alanlar satır olarak render edilmez.
5. Açıklama metni (`description`).
6. **Satış bloğu — yalnız `forSale && priceTRY > 0` ise:** fiyat + `AddToCart`
   (mevcut bileşen). Aksi halde bu blok hiç render edilmez (karar #4).
7. Önceki / sonraki eser linkleri (aynı seri içinde). Seri yoksa gizli.
8. `opengraph-image.tsx` — `app/urun/[slug]/opengraph-image.tsx` deseni; eser
   görselini ve başlığı basar.

**Structured data:**

- `visualArtworkSchema(work, series)` her eserde.
- `productSchema` **yalnız** `forSale && priceTRY > 0` eserlerde. Satılık
  olmayan eser Product schema almaz; fiyatsız Product markup Merchant Center'da
  hata üretir.
- `breadcrumbSchema`.

**Metadata:** `title` = eser başlığı, `description` = açıklama (boşsa künyeden
üretilen kısa metin), `alternates.canonical` = `/eser/<slug>`.

## 5. Keşif ve yönlendirme

- **Seri sayfası:** `components/portfolio/works-detail-list.tsx` (486 satır)
  sadeleşir. Lightbox state'i, klavye yakalama, focus yönetimi ve `addArtwork`
  mantığı kaldırılır; kart düz bir `<Link href={/eser/${w.slug}}>` olur.
  Sepete ekleme sorumluluğu eser sayfasına taşınır.
- **Sitemap:** `app/sitemap.ts` içine `getAllArtworks()` üzerinden
  `/eser/<slug>` girdileri, `priority: 0.7`, `changeFrequency: "monthly"`.
- **301 yönlendirme:** `app/urun/[slug]/page.tsx` içinde ürün bulunamazsa
  `getArtworkBySlug(slug)` denenir; eser bulunursa `permanentRedirect(/eser/<slug>)`,
  yoksa `notFound()`. Bu, bugün erişilebilir olan `/urun/<eser-slug>` orphan
  sayfalarını tek canonical'a toplar.
- **Admin:** `app/admin/[id]/page.tsx:69` içindeki "görüntüle" linki
  `isArtwork ? /galeri/${seriesSlug} : /urun/${slug}` idi; artık
  `isArtwork ? /eser/${slug} : /urun/${slug}` olur.
- **Site içi arama:** `app/api/search/route.ts` eser sonuçlarını seri URL'ine
  yolluyor. Eser kayıtları eklenip `/eser/<slug>`'a yönlendirilir.

## 6. Test

- **Unit:** önceki/sonraki komşu hesabı saf fonksiyona çıkarılır
  (`lib/gallery/adjacent-works.ts`) ve test edilir: dizi başı, dizi sonu, tek
  elemanlı seri, seri yok.
- **E2E (`tests/e2e/smoke.spec.ts`):** mevcut galeri testi lightbox yerine
  navigasyonu doğrulayacak şekilde güncellenir. Yeni akış: `/galeri` → seri →
  ilk eser kartı → URL `/eser/...` → `h1` görünür → önceki/sonraki link çalışır.
- **Yönlendirme testi:** bir eser slug'ı ile `/urun/<slug>` çağrısı 301 ile
  `/eser/<slug>`'a gider.
- `npm run build` + `npm run lint` temiz geçmeli.

## 7. Riskler ve açık noktalar

1. **Açıklama metni boş eserler.** Sayfa açılır ama Google gözünde ince içerik
   (thin content) olur. Bu kodla çözülmez; panelden tek tek doldurulacak bir
   içerik işi. Kısa vadede künyeden türetilen fallback description yazılır,
   uzun vadede sahibi doldurur.
2. **Karar #4'ün yan etkisi.** Satılık olmayan bir esere Google'dan doğrudan
   düşen ziyaretçinin sayfada iletişim yolu olmaz (site header'ındaki genel
   iletişim linki dışında). Kabul edilmiş bir bedel; sonradan tek satırlık bir
   ekle-çıkar ile değiştirilebilir.
3. **Slug kalitesi.** Eser slug'ları arşiv senkronundan geliyor. Anlamsız veya
   çakışan slug varsa URL kalitesi düşer. Uygulama öncesi eser slug listesi
   gözden geçirilmeli (tek seferlik kontrol).
4. **Çalışma ağacı kirli.** `master` üzerinde commit'lenmemiş checkout
   token-hash işi ve `db-backup.yml` duruyor, ayrıca `stash@{0}`'da CSP v2.3
   var. Bu iş **ayrı bir dalda** yapılmalı; mevcut değişikliklerle karışmamalı.

## 8. Kapsam dışı

- Eserler için iyzico'nun açılması (`kind="material"` filtresinin mağazada
  gevşetilmesi) ayrı bir iş.
- Merchant Center feed'ine eser eklenmesi.
- Mevcut ürün adlandırma / duplicate `/shop` canonical işi (ayrı backlog).
- Seri sayfalarının yeniden tasarımı.
