# Eser Detay Sayfası (`/eser/[slug]`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Yayındaki her galeri eserine kendi indekslenebilir URL'ini (`/eser/<slug>`) kazandırmak; seri sayfasını vitrine, eser sayfasını detaya dönüştürmek.

**Architecture:** Eserler `products` tablosunda `kind="artwork"` satırları olarak zaten duruyor ve `toPortfolioWork` ile `PortfolioWork` tipine map'leniyor. Yeni bir tablo veya migration YOK. İş üç katmanda: (1) eser slug'ıyla okuma yapan yeni sorgular, (2) `app/eser/[slug]` sayfası, (3) keşif yolları (seri sayfası linkleri, sitemap, `/urun` → `/eser` 301, admin ve arama linkleri).

**Tech Stack:** Next.js 16 App Router (RSC), TypeScript, Drizzle ORM + postgres.js, Tailwind v4, node:test + tsx (unit), Playwright (e2e).

**Spec:** `docs/superpowers/specs/2026-08-04-eser-detay-sayfasi-design.md`

## Global Constraints

- **Sunucu bileşeni varsayılan.** `"use client"` yalnız gerçekten etkileşim gerektiren yerde (`AddToCart` zaten client). Yeni sayfa ve kart bileşeni server component olmalı; aksi halde SEO için gereken HTML sunucuda üretilmez.
- **Türkçe arayüz metni.** Tüm kullanıcıya görünen metin Türkçe.
- **Em-dash yasağı.** Kullanıcıya görünen metinlerde `—` kullanılmaz; nokta + ayrı cümle tercih edilir. (Kod yorumlarında serbest.)
- **Mevcut veri deseni korunur.** Yeni okuma fonksiyonları `lib/db/*.ts` içinde sorgu + `lib/data.ts` içinde `readDb(...)` + `cache(...)` sarmalayıcısı biçiminde yazılır. DB yokken JSON fallback zorunlu.
- **Migration yok.** `lib/db/schema.ts` bu planda DEĞİŞMEZ. (Çalışma ağacında schema.ts'te başka bir işe ait commit'lenmemiş değişiklik var; ona dokunulmayacak.)
- **BASE_URL** = `https://www.maiamari.art` (mevcut dosyalarda sabit olarak tekrarlanıyor, aynı deseni sürdür).
- **Dal:** `feat/eser-detay-sayfasi`. Bu dalda `master`'dan taşınan commit'siz değişiklikler var (`app/api/payment/**`, `lib/db/orders.ts`, `lib/db/schema.ts`, `lib/payment/iyzico.ts`, `tests/unit/iyzico-signature.test.ts`, `package.json`, `.github/workflows/db-backup.yml`, `lib/checkout/resolve-callback-order.ts`, `tests/unit/resolve-callback-order.test.ts`). **Bunlar başka bir işe ait. Hiçbir commit'e dahil etme.** `git add` daima açık dosya yolu ile yapılır, `git add -A` veya `git add .` YASAK.
- **Push yok.** Hiçbir adımda `git push` çalıştırılmaz.

---

## File Structure

**Yeni:**

| Dosya | Sorumluluk |
|---|---|
| `lib/gallery/adjacent-works.ts` | Bir eserin seri içindeki önceki/sonraki komşusunu bulan saf fonksiyon |
| `lib/gallery/clean-description.ts` | Arşiv şablon cümlesini render'da düşüren saf fonksiyon (bugün `works-detail-list.tsx` içinde gömülü) |
| `tests/unit/adjacent-works.test.ts` | Task 1 testi |
| `tests/unit/clean-description.test.ts` | Task 2 testi |
| `tests/unit/artwork-schema.test.ts` | Task 4 testi |
| `app/eser/[slug]/page.tsx` | Eser detay sayfası |
| `app/eser/[slug]/opengraph-image.tsx` | Eser OG görseli (file convention) |
| `components/portfolio/works-grid.tsx` | Seri sayfasının yeni vitrin kartları |

**Değişen:**

| Dosya | Değişiklik |
|---|---|
| `lib/db/products.ts` | `dbGetArtworkBySlug`, `dbGetAllArtworks` eklenir; `dbGetProductBySlug`'a `kind="material"` filtresi |
| `lib/data.ts` | `getArtworkBySlug`, `getAllArtworks` sarmalayıcıları |
| `lib/structured-data.ts` | `visualArtworkSchema` imzası `series: Series \| null`, `url`/`@id` eser sayfasına döner |
| `lib/og-image.tsx` | `artworkOGImage(slug)` |
| `app/galeri/[series]/page.tsx` | `WorksDetailList` yerine `WorksGrid` |
| `app/sitemap.ts` | `/eser/<slug>` girdileri |
| `app/urun/[slug]/page.tsx` | Eser slug'ı gelirse `/eser/<slug>`'a 301 |
| `app/admin/[id]/page.tsx` | Eser "görüntüle" linki `/eser/<slug>` |
| `app/api/search/route.ts` | Eser sonuçları `/eser/<slug>`'a |
| `tests/e2e/smoke.spec.ts` | Galeri testi navigasyonu doğrular |
| `package.json` | `test:unit` yeni test dosyalarını içerir |

**Silinen:**

| Dosya | Neden |
|---|---|
| `components/portfolio/works-detail-list.tsx` | Yerini `works-grid.tsx` alır (Task 6'da silinir, öncesinde değil) |

---

### Task 1: Seri içi komşu hesabı (saf fonksiyon)

**Files:**
- Create: `lib/gallery/adjacent-works.ts`
- Test: `tests/unit/adjacent-works.test.ts`
- Modify: `package.json` (`test:unit` script'i)

**Interfaces:**
- Consumes: `PortfolioWork` tipi (`lib/types.ts`)
- Produces: `adjacentWorks(works: PortfolioWork[], slug: string): { prev: PortfolioWork | null; next: PortfolioWork | null }` — Task 5 kullanır.

**Kural:** Liste **sarmalamaz** (wrap yok). İlk eserin `prev`'i `null`, son eserin `next`'i `null`. Slug listede yoksa ikisi de `null`.

- [ ] **Step 1: Write the failing test**

`tests/unit/adjacent-works.test.ts`:

```ts
/**
 * Seri içi önceki/sonraki eser hesabı — birim testleri.
 * Koşum: `npm run test:unit` (tsx --test; node:test). DB'ye dokunmaz.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { adjacentWorks } from "../../lib/gallery/adjacent-works";
import type { PortfolioWork } from "../../lib/types";

function work(slug: string): PortfolioWork {
  return {
    id: `id-${slug}`,
    slug,
    title: `Eser ${slug}`,
    description: "",
    image: `/images/${slug}.jpg`,
  };
}

test("ortadaki eserin iki komşusu da vardır", () => {
  const works = [work("a"), work("b"), work("c")];
  const { prev, next } = adjacentWorks(works, "b");
  assert.equal(prev?.slug, "a");
  assert.equal(next?.slug, "c");
});

test("ilk eserde prev null'dur (sarmalama yok)", () => {
  const works = [work("a"), work("b"), work("c")];
  const { prev, next } = adjacentWorks(works, "a");
  assert.equal(prev, null);
  assert.equal(next?.slug, "b");
});

test("son eserde next null'dur (sarmalama yok)", () => {
  const works = [work("a"), work("b"), work("c")];
  const { prev, next } = adjacentWorks(works, "c");
  assert.equal(prev?.slug, "b");
  assert.equal(next, null);
});

test("tek elemanlı seride iki komşu da null'dur", () => {
  const { prev, next } = adjacentWorks([work("a")], "a");
  assert.equal(prev, null);
  assert.equal(next, null);
});

test("boş listede iki komşu da null'dur", () => {
  const { prev, next } = adjacentWorks([], "a");
  assert.equal(prev, null);
  assert.equal(next, null);
});

test("listede olmayan slug için iki komşu da null'dur", () => {
  const works = [work("a"), work("b")];
  const { prev, next } = adjacentWorks(works, "yok");
  assert.equal(prev, null);
  assert.equal(next, null);
});
```

- [ ] **Step 2: Add the test file to the test script**

`package.json` içinde `test:unit` değerinin sonuna dosyayı ekle (mevcut iki dosya korunur):

```json
"test:unit": "tsx --test tests/unit/iyzico-signature.test.ts tests/unit/resolve-callback-order.test.ts tests/unit/adjacent-works.test.ts",
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test:unit`
Expected: FAIL — `Cannot find module '../../lib/gallery/adjacent-works'`

- [ ] **Step 4: Write minimal implementation**

`lib/gallery/adjacent-works.ts`:

```ts
import type { PortfolioWork } from "@/lib/types";

/**
 * Bir eserin kendi serisi içindeki önceki/sonraki komşusu.
 * Sarmalama YOK: seri başında prev, seri sonunda next null döner. Eser sayfası
 * bu linkleri server HTML'de basar; Google seriyi zincirleme tarar.
 */
export function adjacentWorks(
  works: PortfolioWork[],
  slug: string,
): { prev: PortfolioWork | null; next: PortfolioWork | null } {
  const idx = works.findIndex((w) => w.slug === slug);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? works[idx - 1] : null,
    next: idx < works.length - 1 ? works[idx + 1] : null,
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test:unit`
Expected: PASS (6 yeni test dahil, mevcut testler de geçmeye devam eder)

- [ ] **Step 6: Commit**

```bash
git add lib/gallery/adjacent-works.ts tests/unit/adjacent-works.test.ts package.json
git commit -m "feat(galeri): seri ici onceki/sonraki eser hesabi"
```

---

### Task 2: `cleanDescription` yardımcısını paylaşılır hale getir

**Files:**
- Create: `lib/gallery/clean-description.ts`
- Test: `tests/unit/clean-description.test.ts`
- Modify: `components/portfolio/works-detail-list.tsx:23-30` (yerel kopyayı sil, import et)
- Modify: `package.json` (`test:unit`)

**Interfaces:**
- Produces: `cleanDescription(desc: string): string` — Task 5 (eser sayfası) kullanır.

**Neden:** Bu fonksiyon bugün `works-detail-list.tsx` içinde gömülü. O dosya Task 6'da silinecek; fonksiyon eser sayfasında lazım olduğu için önce dışarı çıkarılır. Bu görev davranışı değiştirmez, sadece taşır.

- [ ] **Step 1: Write the failing test**

`tests/unit/clean-description.test.ts`:

```ts
/**
 * Eser açıklamasından arşiv şablon CTA cümlesinin düşürülmesi — birim testleri.
 * Kaynak veriye DOKUNULMAZ; temizlik yalnız render katmanındadır.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanDescription } from "../../lib/gallery/clean-description";

test("sablon CTA cumlesini duser", () => {
  const input =
    "Kapılar serisinden bir linol baskı. Edisyon, boyut ve fiyat bilgisi için iletişime geçin.";
  assert.equal(
    cleanDescription(input),
    "Kapılar serisinden bir linol baskı.",
  );
});

test("buyuk-kucuk harf ve nokta farkina duyarsizdir", () => {
  const input = "Metin. EDİSYON, BOYUT VE FİYAT BİLGİSİ İÇİN İLETİŞİME GEÇİN";
  assert.equal(cleanDescription(input), "Metin.");
});

test("sablon cumle yoksa metni aynen dondurur", () => {
  assert.equal(cleanDescription("Sade bir açıklama."), "Sade bir açıklama.");
});

test("bos metin bos doner", () => {
  assert.equal(cleanDescription(""), "");
});
```

- [ ] **Step 2: Add the test file to the test script**

`package.json`:

```json
"test:unit": "tsx --test tests/unit/iyzico-signature.test.ts tests/unit/resolve-callback-order.test.ts tests/unit/adjacent-works.test.ts tests/unit/clean-description.test.ts",
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test:unit`
Expected: FAIL — `Cannot find module '../../lib/gallery/clean-description'`

- [ ] **Step 4: Create the module (mevcut gövde birebir taşınır)**

`lib/gallery/clean-description.ts`:

```ts
/**
 * Arşiv sync'inden gelen şablon CTA cümlesini gösterimde temizler.
 * "...Edisyon, boyut ve fiyat bilgisi için iletişime geçin." — edisyon, boyut
 * (ve fiyatlı eserlerde fiyat) zaten künyede gösterildiğinden bu cümle
 * gereksiz/çelişik. Kaynak veriye/DB'ye DOKUNULMAZ; yalnız render'da düşülür.
 */
export function cleanDescription(desc: string): string {
  return desc
    .replace(
      /\s*Edisyon,\s*boyut\s*ve\s*fiyat\s*bilgisi\s*için\s*iletişime\s*geçin\.?\s*/giu,
      " ",
    )
    .trim();
}
```

- [ ] **Step 5: Point the existing component at the new module**

`components/portfolio/works-detail-list.tsx`: 17-30. satırlardaki yerel `cleanDescription` tanımını (JSDoc bloğu dahil) sil ve import bloğuna ekle:

```ts
import { cleanDescription } from "@/lib/gallery/clean-description";
```

- [ ] **Step 6: Run tests and lint**

Run: `npm run test:unit`
Expected: PASS

Run: `npm run lint`
Expected: temiz (kullanılmayan import/uyarı yok)

- [ ] **Step 7: Commit**

```bash
git add lib/gallery/clean-description.ts tests/unit/clean-description.test.ts components/portfolio/works-detail-list.tsx package.json
git commit -m "refactor(galeri): cleanDescription yardimcisini lib/gallery'e tasi"
```

---

### Task 3: Eser okuma sorguları

**Files:**
- Modify: `lib/db/products.ts` (yeni iki fonksiyon + `dbGetProductBySlug`'a kind filtresi)
- Modify: `lib/data.ts` (iki sarmalayıcı)

**Interfaces:**
- Consumes: mevcut `toPortfolioWork`, `getDb`, `T` (products tablosu), `readDb`, `cache`, `getPortfolio`
- Produces:
  - `dbGetArtworkBySlug(slug: string): Promise<PortfolioWork | null | undefined>`
  - `dbGetAllArtworks(): Promise<PortfolioWork[] | null>`
  - `getArtworkBySlug(slug: string): Promise<PortfolioWork | null>` (Task 5, 7 kullanır)
  - `getAllArtworks(): Promise<PortfolioWork[]>` (Task 5, 7 kullanır)

**Not:** Bu görevde otomatik test yok. Sorgular canlı DB'ye bağlı ve projede DB test altyapısı bulunmuyor. Doğrulama `npm run build` (tip + derleme) ve `npm run dev` üzerinde elle kontrol ile yapılır. Sonraki görevlerin e2e testi bu katmanı dolaylı olarak kapsar.

- [ ] **Step 1: Add the artwork queries**

`lib/db/products.ts` içinde, `dbGetArtworksBySeries` fonksiyonunun hemen ardına ekle:

```ts
/** Tek eser, slug ile (eser detay sayfası). Yayında olmayan eser dönmez. */
export async function dbGetArtworkBySlug(
  slug: string,
): Promise<PortfolioWork | null | undefined> {
  const db = getDb();
  if (!db) return undefined; // undefined = DB yok → fallback; null = bulunamadı
  const rows = await db
    .select()
    .from(T)
    .where(and(eq(T.kind, "artwork"), eq(T.isPublished, true), eq(T.slug, slug)))
    .limit(1);
  return rows[0] ? toPortfolioWork(rows[0]) : null;
}

/** Yayındaki tüm eserler (generateStaticParams + sitemap). */
export async function dbGetAllArtworks(): Promise<PortfolioWork[] | null> {
  const db = getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(T)
    .where(and(eq(T.kind, "artwork"), eq(T.isPublished, true)))
    .orderBy(asc(T.sortOrder), asc(T.title));
  return rows.map(toPortfolioWork);
}
```

- [ ] **Step 2: Close the `/urun` leak**

Aynı dosyada `dbGetProductBySlug` sorgusunun `where` koşulunu değiştir. Öncesi:

```ts
  const rows = await db.select().from(T).where(eq(T.slug, slug)).limit(1);
```

Sonrası:

```ts
  // kind filtresi: eser (kind="artwork") /urun/ altından açılmasın. Eserlerin
  // kanonik adresi /eser/<slug>; yönlendirme app/urun/[slug]/page.tsx'te.
  const rows = await db
    .select()
    .from(T)
    .where(and(eq(T.slug, slug), eq(T.kind, "material")))
    .limit(1);
```

- [ ] **Step 3: Add the data-layer wrappers**

`lib/data.ts`: import bloğuna `dbGetArtworkBySlug, dbGetAllArtworks` ekle (mevcut `dbGetArtworksBySeries` importunun yanına), sonra `getPortfolioBySeries` tanımının ardına:

```ts
/** Tek eser, slug ile. DB yoksa portfolio.json'a düşer. */
export const getArtworkBySlug = cache(
  async (slug: string): Promise<PortfolioWork | null> => {
    const fromDb = await readDb(
      "getArtworkBySlug",
      () => dbGetArtworkBySlug(slug),
      undefined,
    );
    if (fromDb !== undefined) return fromDb;
    return getPortfolio().find((w) => w.slug === slug) || null;
  },
);

/** Yayındaki tüm eserler (statik parametreler + sitemap). */
export const getAllArtworks = cache(async (): Promise<PortfolioWork[]> => {
  const fromDb = await readDb("getAllArtworks", dbGetAllArtworks, null);
  return fromDb ?? getPortfolio();
});
```

- [ ] **Step 4: Verify it compiles**

Run: `npm run build`
Expected: başarılı derleme, tip hatası yok. (Build sırasında DB yoksa fallback yolu çalışır, bu beklenen davranıştır.)

Run: `npm run lint`
Expected: temiz

- [ ] **Step 5: Commit**

```bash
git add lib/db/products.ts lib/data.ts
git commit -m "feat(veri): eser slug/liste sorgulari + /urun kind filtresi"
```

---

### Task 4: JSON-LD eser sayfasını işaret etsin

**Files:**
- Modify: `lib/structured-data.ts:115-151` (`productSchema`) ve `:174-203` (`visualArtworkSchema`)
- Test: `tests/unit/artwork-schema.test.ts`
- Modify: `package.json` (`test:unit`)

**Interfaces:**
- Produces:
  - `visualArtworkSchema(work: PortfolioWork, series: Series | null)` — dönen nesnede `url` ve `@id` artık `${BASE_URL}/eser/${work.slug}`; `isPartOf` yalnız `series` doluysa bulunur.
  - `productSchema(product: Product, urlOverride?: string)` — `urlOverride` verilirse hem üst `url` hem `offers.url` bu değeri kullanır.
- Task 5 ikisini de kullanır.

**Neden:** `visualArtworkSchema` bugün `url`'ü seri sayfasına veriyor. `productSchema` ise `url`'ü `${BASE_URL}/urun/${slug}` olarak sabit üretiyor; eserde bu adres Task 7'den sonra 301 veren bir URL olur, yani markup canonical ile çelişir. İkisi de eserin kendi sayfasını göstermeli. Ayrıca `seriesSlug` null olan eserler için `series` zorunlu olmaktan çıkmalı.

- [ ] **Step 1: Write the failing test**

`tests/unit/artwork-schema.test.ts`:

```ts
/**
 * VisualArtwork JSON-LD — birim testleri.
 * Kritik kural: eserin kanonik adresi /eser/<slug>; markup ile canonical
 * çelişmemeli. Serisi olmayan eserde isPartOf hiç bulunmamalı.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { visualArtworkSchema, productSchema } from "../../lib/structured-data";
import type { PortfolioWork, Series, Product } from "../../lib/types";

const work: PortfolioWork = {
  id: "1",
  slug: "kapi-01",
  title: "Kapı 01",
  description: "Açıklama.",
  image: "/images/kapi-01.jpg",
  series: "kapilar",
  technique: "X3- Linolyum Baskı",
  year: 2015,
  editionSize: 10,
};

const series: Series = {
  slug: "kapilar",
  title: "Kapılar",
  description: "Seri açıklaması.",
};

test("url ve @id eser sayfasini gosterir", () => {
  const schema = visualArtworkSchema(work, series) as Record<string, unknown>;
  assert.equal(schema.url, "https://www.maiamari.art/eser/kapi-01");
  assert.equal(schema["@id"], "https://www.maiamari.art/eser/kapi-01");
});

test("serili eserde isPartOf seri koleksiyonunu gosterir", () => {
  const schema = visualArtworkSchema(work, series) as Record<string, unknown>;
  assert.deepEqual(schema.isPartOf, {
    "@id": "https://www.maiamari.art/galeri/kapilar#collection",
  });
});

test("serisiz eserde isPartOf hic bulunmaz", () => {
  const schema = visualArtworkSchema(work, null) as Record<string, unknown>;
  assert.equal("isPartOf" in schema, false);
});

test("serisiz eserde aciklama bos ise fallback seri adi icermez", () => {
  const bare = { ...work, description: "" };
  const schema = visualArtworkSchema(bare, null) as Record<string, unknown>;
  assert.equal(schema.description, "Kapı 01. Linol baskı.");
});

test("productSchema urlOverride verilince eser sayfasini gosterir", () => {
  const product: Product = {
    id: "1",
    slug: "kapi-01",
    title: "Kapı 01",
    description: "Açıklama.",
    priceTRY: 2500,
    compareAtTRY: null,
    status: "in_stock",
    statuses: [],
    categorySlug: "" as Product["categorySlug"],
    coverImage: "/images/kapi-01.jpg",
    gallery: ["/images/kapi-01.jpg"],
    sourceUrl: "",
  };
  const schema = productSchema(
    product,
    "https://www.maiamari.art/eser/kapi-01",
  ) as Record<string, unknown>;
  assert.equal(schema.url, "https://www.maiamari.art/eser/kapi-01");
  assert.equal(
    (schema.offers as Record<string, unknown>).url,
    "https://www.maiamari.art/eser/kapi-01",
  );
});

test("productSchema urlOverride yoksa urun adresini korur", () => {
  const product: Product = {
    id: "2",
    slug: "linol-boya",
    title: "Linol Boya",
    description: "Açıklama.",
    priceTRY: 120,
    compareAtTRY: null,
    status: "in_stock",
    statuses: [],
    categorySlug: "linol-boyalari",
    coverImage: "/images/boya.jpg",
    gallery: [],
    sourceUrl: "",
  };
  const schema = productSchema(product) as Record<string, unknown>;
  assert.equal(schema.url, "https://www.maiamari.art/urun/linol-boya");
});
```


- [ ] **Step 2: Add the test file to the test script**

`package.json`:

```json
"test:unit": "tsx --test tests/unit/iyzico-signature.test.ts tests/unit/resolve-callback-order.test.ts tests/unit/adjacent-works.test.ts tests/unit/clean-description.test.ts tests/unit/artwork-schema.test.ts",
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test:unit`
Expected: FAIL — `url` seri adresini döndüğü için ilk test kırılır; `null` geçilen testler tip/çalışma hatası verir; `productSchema` ikinci argüman kabul etmediği için tip hatası verir.

- [ ] **Step 4: Add the URL override to `productSchema`**

`lib/structured-data.ts` içinde `productSchema`'nın ilk iki satırını değiştir. Öncesi:

```ts
export function productSchema(product: Product) {
  const url = `${BASE_URL}/urun/${product.slug}`;
```

Sonrası:

```ts
/**
 * Product JSON-LD. `urlOverride`: eserler `/eser/<slug>` adresinde yaşar;
 * markup'taki url canonical ile çelişmemeli (aksi halde /urun/... 301 veren
 * bir adres gösterilir).
 */
export function productSchema(product: Product, urlOverride?: string) {
  const url = urlOverride ?? `${BASE_URL}/urun/${product.slug}`;
```

Gövdenin geri kalanı değişmez: `url` değişkeni hem üst seviye `url` alanında hem `offers.url` içinde zaten kullanılıyor.

- [ ] **Step 5: Rewrite `visualArtworkSchema`**

`lib/structured-data.ts` içinde `visualArtworkSchema`'yı şununla değiştir:

```ts
export function visualArtworkSchema(work: PortfolioWork, series: Series | null) {
  const absoluteImage = work.image.startsWith("http")
    ? work.image
    : `${BASE_URL}${work.image}`;
  // Eserin kanonik adresi kendi sayfasıdır; markup canonical ile çelişmemeli.
  const workUrl = `${BASE_URL}/eser/${work.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "VisualArtwork",
    "@id": workUrl,
    name: work.title,
    image: absoluteImage,
    url: workUrl,
    description:
      work.description ||
      (series
        ? `${work.title}. ${series.title} serisinden linol baskı.`
        : `${work.title}. Linol baskı.`),
    creator: {
      "@type": "Person",
      name: work.artist || "Duygu Sinan",
      sameAs: "https://www.instagram.com/duygu.sinan.printmaker/",
    },
    artform: "Printmaking",
    artMedium: work.technique || "Linol baskı (Linocut)",
    ...(work.paper && { artworkSurface: work.paper }),
    ...(work.editionSize && { artEdition: work.editionSize }),
    ...(work.year && {
      dateCreated: String(work.year),
      copyrightYear: work.year,
    }),
    ...(series && {
      isPartOf: { "@id": `${BASE_URL}/galeri/${series.slug}#collection` },
    }),
  };
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm run test:unit`
Expected: PASS

- [ ] **Step 7: Verify the existing callers still compile**

`seriesCollectionPageSchema` içindeki `hasPart: works.map((w) => visualArtworkSchema(w, series))` çağrısı değişmeden çalışır (`Series` argümanı `Series | null` parametresine uyar). `app/urun/[slug]/page.tsx` içindeki `productSchema(product)` çağrısı da değişmez (ikinci argüman opsiyonel).

Run: `npm run build`
Expected: başarılı

- [ ] **Step 8: Commit**

```bash
git add lib/structured-data.ts tests/unit/artwork-schema.test.ts package.json
git commit -m "feat(seo): VisualArtwork markup eser sayfasini kanonik alsin"
```

---

### Task 5: Eser detay sayfası

**Files:**
- Create: `app/eser/[slug]/page.tsx`
- Create: `app/eser/[slug]/opengraph-image.tsx`
- Modify: `lib/og-image.tsx` (yeni `artworkOGImage`)

**Interfaces:**
- Consumes: `getArtworkBySlug`, `getAllArtworks`, `getPortfolioBySeries`, `getSeriesBySlug` (`lib/data.ts`); `adjacentWorks` (Task 1); `cleanDescription` (Task 2); `visualArtworkSchema`, `productSchema`, `breadcrumbSchema`, `jsonLdScript` (`lib/structured-data.ts`); `AddToCart` (`components/cart/add-to-cart.tsx`); `formatTRY` (`lib/format.ts`)
- Produces: `/eser/<slug>` rotası. Task 6, 7, 8 bu adrese link verir.

**Davranış kuralları (spec kararları):**
- Satış bloğu **yalnız** `forSale === true && priceTRY > 0` ise render edilir. Aksi halde fiyat, buton, WhatsApp/Instagram bağlantısı, "Sergilik" etiketi dahil **hiçbir şey** basılmaz (karar #4).
- `productSchema` **yalnız** aynı koşulda basılır. Fiyatsız Product markup Merchant Center'da hata üretir.
- `work.series` boşsa: kırıntı navigasyonda seri adımı yok, önceki/sonraki bloğu hiç render edilmez.

- [ ] **Step 1: Add the artwork OG image helper**

`lib/og-image.tsx`: import satırına `getArtworkBySlug` ekle, dosyanın sonuna:

```tsx
export async function artworkOGImage(slug: string) {
  const fonts = await loadFonts();
  const work = await getArtworkBySlug(slug);
  if (!work) return defaultOGImage();
  const image = work.image ? await loadPublicAsBase64(work.image) : null;
  const meta = [
    work.technique ?? "Linol baskı",
    work.year ? String(work.year) : null,
    work.editionSize ? `${work.editionSize} adetlik edisyon` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return new ImageResponse(
    (
      <Frame>
        <div style={{ width: "100%", height: "100%", display: "flex", gap: 56 }}>
          <div
            style={{
              width: 470,
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: BRAND.surface,
              padding: 36,
              boxSizing: "border-box",
            }}
          >
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt=""
                width={398}
                height={430}
                style={{ objectFit: "contain", maxWidth: "100%", maxHeight: "100%" }}
              />
            ) : (
              <div style={{ display: "flex", fontSize: 24, color: BRAND.muted }}>
                {work.title}
              </div>
            )}
          </div>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              paddingTop: 12,
              paddingBottom: 12,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
              <div style={{ display: "flex", fontSize: 54, color: BRAND.foreground }}>
                {work.title}
              </div>
              <div style={{ display: "flex", fontSize: 26, color: BRAND.muted }}>
                {meta}
              </div>
            </div>
            <BrandFooter />
          </div>
        </div>
      </Frame>
    ),
    { ...OG_SIZE, fonts },
  );
}
```

**Not:** `Frame`, `BrandFooter`, `BRAND`, `loadFonts`, `loadPublicAsBase64`, `ImageResponse`, `OG_SIZE`, `defaultOGImage` aynı dosyada zaten tanımlı; yeni import gerekmez (`getArtworkBySlug` hariç).

- [ ] **Step 2: Create the OG image route**

`app/eser/[slug]/opengraph-image.tsx`:

```tsx
import { artworkOGImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-image";
import { getAllArtworks } from "@/lib/data";

export const alt = "MAIAMARI · Eser";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export async function generateStaticParams() {
  return (await getAllArtworks()).map((w) => ({ slug: w.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return artworkOGImage(slug);
}
```

- [ ] **Step 3: Create the page**

`app/eser/[slug]/page.tsx`:

```tsx
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  getArtworkBySlug,
  getAllArtworks,
  getSeriesBySlug,
  getPortfolioBySeries,
} from "@/lib/data";
import type { SeriesSlug, Product } from "@/lib/types";
import { formatTRY } from "@/lib/format";
import { adjacentWorks } from "@/lib/gallery/adjacent-works";
import { cleanDescription } from "@/lib/gallery/clean-description";
import { AddToCart } from "@/components/cart/add-to-cart";
import {
  visualArtworkSchema,
  productSchema,
  breadcrumbSchema,
  jsonLdScript,
} from "@/lib/structured-data";

const BASE_URL = "https://www.maiamari.art";

export const revalidate = 60;

export async function generateStaticParams() {
  return (await getAllArtworks()).map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const work = await getArtworkBySlug(slug);
  if (!work) return {};
  const desc = cleanDescription(work.description || "");
  const fallbackDesc = [
    work.title,
    work.technique ?? "Linol baskı",
    work.dimensions,
    work.year ? String(work.year) : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return {
    title: work.title,
    description: desc || fallbackDesc,
    alternates: { canonical: `/eser/${work.slug}` },
    openGraph: {
      title: work.title,
      description: desc || fallbackDesc,
    },
  };
}

export default async function ArtworkPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const work = await getArtworkBySlug(slug);
  if (!work) notFound();

  const series = work.series ? await getSeriesBySlug(work.series) : null;
  const siblings = work.series
    ? await getPortfolioBySeries(work.series as SeriesSlug)
    : [];
  const { prev, next } = adjacentWorks(siblings, work.slug);

  // Satış bloğu ve Product markup yalnız fiyatlı-satılık eserde (karar #4).
  const isPriced =
    !!work.forSale && typeof work.priceTRY === "number" && work.priceTRY > 0;

  const description = cleanDescription(work.description || "");

  const breadcrumb = breadcrumbSchema([
    { name: "Ana sayfa", url: `${BASE_URL}/` },
    { name: "Galeri", url: `${BASE_URL}/galeri` },
    ...(series
      ? [{ name: series.title, url: `${BASE_URL}/galeri/${series.slug}` }]
      : []),
    { name: work.title, url: `${BASE_URL}/eser/${work.slug}` },
  ]);

  return (
    <div className="container-x py-12 lg:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(visualArtworkSchema(work, series))}
      />
      {isPriced && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLdScript(
            productSchema(
              {
                id: work.id,
                slug: work.slug,
                title: work.title,
                description,
                priceTRY: work.priceTRY!,
                compareAtTRY: work.compareAtTRY ?? null,
                status: work.soldOut ? "out_of_stock" : "in_stock",
                statuses: [],
                // Eserin mağaza kategorisi yok; productSchema bu alanı yalnız
                // Product tipini karşılamak için ister, markup'ta kullanmaz.
                categorySlug: "" as Product["categorySlug"],
                coverImage: work.image,
                gallery: [work.image],
                sourceUrl: "",
              },
              `${BASE_URL}/eser/${work.slug}`,
            ),
          )}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(breadcrumb)}
      />

      {/* Kırıntı navigasyon */}
      <nav className="mb-10 text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
        <Link href="/galeri">Galeri</Link>
        {series && (
          <>
            <span className="mx-2">·</span>
            <Link href={`/galeri/${series.slug}`}>{series.title}</Link>
          </>
        )}
      </nav>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-12 lg:gap-20 items-start">
        {/* Görsel — pasapartu çerçeve, seri kartlarıyla aynı dil */}
        <figure className="bg-[color:var(--color-surface)] p-5 sm:p-7 lg:p-9 ring-1 ring-[color:var(--color-hairline)] shadow-[0_1px_2px_rgba(60,40,28,0.05),0_18px_40px_-22px_rgba(60,40,28,0.20)]">
          <div className="relative ring-[0.5px] ring-[color:var(--color-hairline)] overflow-hidden bg-[color:var(--color-surface-2)]">
            <Image
              src={work.image}
              alt={work.title}
              width={work.width ?? 1200}
              height={work.height ?? 1200}
              priority
              sizes="(max-width: 1024px) 100vw, 56vw"
              className="block w-full h-auto select-none"
              draggable={false}
            />
          </div>
        </figure>

        <div className="lg:pt-6">
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl leading-[1.05] tracking-tight">
            <span className="italic">{work.title}</span>
          </h1>

          <dl className="mt-8 grid grid-cols-[max-content_1fr] gap-x-8 gap-y-2 text-sm">
            <dt className="text-[color:var(--color-muted)]">Sanatçı</dt>
            <dd>{work.artist ?? "Duygu Sinan"}</dd>
            {series && (
              <>
                <dt className="text-[color:var(--color-muted)]">Seri</dt>
                <dd>
                  <Link href={`/galeri/${series.slug}`} className="editorial-link">
                    {series.title}
                  </Link>
                </dd>
              </>
            )}
            <dt className="text-[color:var(--color-muted)]">Teknik</dt>
            <dd>{work.technique ?? "Linol baskı, elle çoğaltılmış"}</dd>
            {work.paper && (
              <>
                <dt className="text-[color:var(--color-muted)]">Kâğıt</dt>
                <dd>{work.paper}</dd>
              </>
            )}
            {work.dimensions && (
              <>
                <dt className="text-[color:var(--color-muted)]">Boyut</dt>
                <dd className="leading-relaxed">{work.dimensions}</dd>
              </>
            )}
            {work.year && (
              <>
                <dt className="text-[color:var(--color-muted)]">Yıl</dt>
                <dd>{work.year}</dd>
              </>
            )}
            <dt className="text-[color:var(--color-muted)]">Edisyon</dt>
            <dd>
              {work.editionSize
                ? `${work.editionSize} adetlik sayılı edisyon`
                : "Sayılı edisyon"}
            </dd>
            {work.firstSerial && (
              <>
                <dt className="text-[color:var(--color-muted)]">Serial</dt>
                <dd className="font-mono text-xs tabular-nums tracking-tight">
                  {work.firstSerial}
                </dd>
              </>
            )}
            <dt className="text-[color:var(--color-muted)]">Filigran</dt>
            <dd className="text-[color:var(--color-muted)] text-xs leading-relaxed">
              MAIAMARI © · yalnızca dijital gösterimde.
              Teslim edilen fiziksel baskı filigransızdır.
            </dd>
          </dl>

          {description && (
            <p className="mt-8 text-base leading-relaxed text-[color:var(--color-muted)] max-w-prose">
              {description}
            </p>
          )}

          {isPriced && (
            <div className="mt-8">
              <p className="font-display tabular-nums text-2xl">
                {formatTRY(work.priceTRY!)}
                {work.compareAtTRY != null &&
                  work.compareAtTRY > work.priceTRY! && (
                    <span className="ml-3 line-through text-base text-[color:var(--color-muted)]">
                      {formatTRY(work.compareAtTRY)}
                    </span>
                  )}
              </p>
              <AddToCart
                id={work.id}
                slug={work.slug}
                title={work.title}
                priceTry={work.priceTRY!}
                image={work.image}
                outOfStock={work.soldOut}
                href={`/eser/${work.slug}`}
              />
            </div>
          )}
        </div>
      </div>

      {/* Seri içi gezinme — server HTML'de, Google zincirleme tarar */}
      {(prev || next) && (
        <nav className="mt-20 pt-10 border-t border-[color:var(--color-hairline)] flex justify-between gap-6 text-sm">
          {prev ? (
            <Link href={`/eser/${prev.slug}`} className="editorial-link">
              ← {prev.title}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link href={`/eser/${next.slug}`} className="editorial-link text-right">
              {next.title} →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Verify build and lint**

Run: `npm run build`
Expected: başarılı; çıktıda `/eser/[slug]` rotası görünür.

Run: `npm run lint`
Expected: temiz

- [ ] **Step 5: Manual check in dev**

Run: `npm run dev`

Tarayıcıda bir eser slug'ı ile `/eser/<slug>` aç. Doğrula:
- Başlık, görsel, künye görünüyor
- Satılık olmayan eserde fiyat/buton/CTA **yok**
- Sayfa kaynağında (`view-source`) `VisualArtwork` JSON-LD ve `canonical` etiketi var
- Önceki/sonraki linkleri çalışıyor

- [ ] **Step 6: Commit**

```bash
git add app/eser lib/og-image.tsx
git commit -m "feat(galeri): eser detay sayfasi /eser/[slug]"
```

---

### Task 6: Seri sayfası vitrine dönüşsün

**Files:**
- Create: `components/portfolio/works-grid.tsx`
- Modify: `app/galeri/[series]/page.tsx:13,191-196`
- Delete: `components/portfolio/works-detail-list.tsx`

**Interfaces:**
- Consumes: `PortfolioWork`, `formatTRY`, `Reveal`, `adjacentWorks` kullanılmaz
- Produces: `WorksGrid({ works, paperNote }: { works: PortfolioWork[]; paperNote?: string })`

**Neden (spec karar #5):** Seri sayfası bugün her eserin tam künyesini, açıklamasını ve satış bloğunu basıyor. Eser sayfası aynı metni tekrarlarsa iki URL kopya içerik olur. Kart vitrine indirgenir, detay eser sayfasına taşınır.

**Kartta kalanlar:** görsel, başlık, tek satır özet (`technique · year · editionSize`), satılık ve tükenmemişse fiyat, "Eseri gör →" ipucu. **Kartta artık olmayanlar:** tam `<dl>` künyesi, açıklama paragrafı, filigran notu, sepet/hemen al butonları, WhatsApp ve Instagram CTA'ları, lightbox.

- [ ] **Step 1: Create the grid component**

`components/portfolio/works-grid.tsx`:

```tsx
import Image from "next/image";
import Link from "next/link";
import type { PortfolioWork } from "@/lib/types";
import { formatTRY } from "@/lib/format";
import { Reveal } from "@/components/motion/reveal";

/** Eser fiyatlı satışa açık mı (fiyat gösterimi için). */
function isPriced(w: PortfolioWork): boolean {
  return !!w.forSale && typeof w.priceTRY === "number" && w.priceTRY > 0;
}

/** "Linol baskı · 2015 · 10 adetlik edisyon" */
function summaryLine(w: PortfolioWork, paperNote?: string): string {
  return [
    w.technique ?? "Linol baskı",
    w.paper ?? paperNote,
    w.year ? String(w.year) : null,
    w.editionSize ? `${w.editionSize} adetlik edisyon` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

/**
 * Seri sayfası vitrini: her eser bir karttır ve kendi sayfasına link verir.
 * Tam künye, açıklama ve satın alma /eser/<slug> sayfasındadır. Bu ayrım
 * seri ve eser sayfalarının kopya içerik üretmesini önler.
 * Server component: linkler ilk HTML'de yer alır, arama motoru tarar.
 */
export function WorksGrid({
  works,
  paperNote,
}: {
  works: PortfolioWork[];
  paperNote?: string;
}) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
      {works.map((work, idx) => (
        <Reveal key={work.id}>
          <Link href={`/eser/${work.slug}`} className="group block">
            <figure className="bg-[color:var(--color-surface)] p-4 sm:p-5 ring-1 ring-[color:var(--color-hairline)] shadow-[0_1px_2px_rgba(60,40,28,0.05),0_18px_40px_-22px_rgba(60,40,28,0.20)]">
              <div className="relative ring-[0.5px] ring-[color:var(--color-hairline)] overflow-hidden bg-[color:var(--color-surface-2)]">
                <Image
                  src={work.image}
                  alt={work.title}
                  width={work.width ?? 1200}
                  height={work.height ?? 1200}
                  priority={idx < 3}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="block w-full h-auto select-none"
                  draggable={false}
                />
              </div>
            </figure>
            <h2 className="font-display italic mt-5 text-xl lg:text-2xl leading-tight">
              {work.title}
            </h2>
            <p className="mt-2 text-sm text-[color:var(--color-muted)]">
              {summaryLine(work, paperNote)}
            </p>
            {isPriced(work) && !work.soldOut && (
              <p className="mt-2 text-sm tabular-nums">
                {formatTRY(work.priceTRY!)}
              </p>
            )}
            {work.soldOut && (
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[color:var(--color-press)]">
                Tükendi
              </p>
            )}
            <span className="mt-3 inline-block text-sm editorial-link">
              Eseri gör →
            </span>
          </Link>
        </Reveal>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Swap the component on the series page**

`app/galeri/[series]/page.tsx`:

13. satırdaki importu değiştir:

```tsx
import { WorksGrid } from "@/components/portfolio/works-grid";
```

191-196. satırlardaki kullanımı değiştir:

```tsx
        <WorksGrid works={works} paperNote={series.paperNote} />
```

(`seriesName` ve `inquiryPath` prop'ları artık gerekmez. Sayfanın üst kısmındaki seri açıklaması, WhatsApp ve Instagram bağlantıları **olduğu gibi kalır**; kaldırılan yalnız kart içi tekrarlardır.)

- [ ] **Step 3: Delete the old component**

```bash
git rm components/portfolio/works-detail-list.tsx
```

- [ ] **Step 4: Verify nothing else imports it**

Run: `grep -rn "works-detail-list\|WorksDetailList" --include=*.tsx --include=*.ts . --exclude-dir=node_modules`
Expected: sonuç yok

- [ ] **Step 5: Verify build and lint**

Run: `npm run build`
Expected: başarılı

Run: `npm run lint`
Expected: temiz

- [ ] **Step 5: Manual check in dev**

Run: `npm run dev`

`/galeri/<seri>` aç. Doğrula:
- Kartlar ızgara halinde, her biri görsel + başlık + tek satır özet
- Karta tıklayınca `/eser/<slug>` açılıyor
- Sayfa kaynağında `href="/eser/..."` linkleri var (JS kapalıyken de görünür olmalı)
- Sayfa üstündeki seri açıklaması ve iletişim bağlantıları duruyor

- [ ] **Step 7: Commit**

```bash
git add components/portfolio/works-grid.tsx app/galeri/[series]/page.tsx
git commit -m "feat(galeri): seri sayfasi vitrin izgarasina donsun"
```

---

### Task 7: Keşif yolları ve yönlendirme

**Files:**
- Modify: `app/sitemap.ts`
- Modify: `app/urun/[slug]/page.tsx`
- Modify: `app/admin/[id]/page.tsx:69`
- Modify: `app/api/search/route.ts`

**Interfaces:**
- Consumes: `getAllArtworks`, `getArtworkBySlug` (Task 3)

- [ ] **Step 1: Add artworks to the sitemap**

`app/sitemap.ts`: importa `getAllArtworks` ekle, `productRoutes` tanımının ardına:

```ts
  const artworkRoutes: MetadataRoute.Sitemap = (await getAllArtworks()).map((w) => ({
    url: `${BASE_URL}/eser/${w.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));
```

ve dönüş dizisine `...artworkRoutes,` ekle (`...productRoutes,` satırından sonra).

- [ ] **Step 2: Redirect legacy `/urun/<artwork-slug>` to `/eser/<slug>`**

`app/urun/[slug]/page.tsx`: importa ekle:

```tsx
import { notFound, permanentRedirect } from "next/navigation";
import { getArtworkBySlug } from "@/lib/data";
```

`ProductPage` içinde `if (!product) notFound();` satırını şununla değiştir:

```tsx
  if (!product) {
    // Eserlerin kanonik adresi /eser/<slug>. /urun/<eser-slug> eskiden
    // açılıyordu (kind filtresiz sorgu); kopya içerik olmasın diye 301.
    const artwork = await getArtworkBySlug(slug);
    if (artwork) permanentRedirect(`/eser/${slug}`);
    notFound();
  }
```

- [ ] **Step 3: Fix the admin "view" link**

`app/admin/[id]/page.tsx:69`: mevcut satırı

```tsx
        {isArtwork ? `/galeri/${row.seriesSlug ?? ""}` : `/urun/${row.slug}`}
```

şununla değiştir:

```tsx
        {isArtwork ? `/eser/${row.slug}` : `/urun/${row.slug}`}
```

Aynı ifadenin `href` olarak kullanıldığı satır varsa (aynı dosyada, yakınında) onu da güncelle. Dosyayı okuyup her iki kullanımın da `/eser/<slug>`'a gittiğinden emin ol.

- [ ] **Step 4: Point search results at artwork pages**

`app/api/search/route.ts:69` civarındaki eser/seri sonuç üretimini oku. Seri sonuçları `/galeri/<slug>` olarak kalır. Eserler sonuçlara dahil ediliyorsa `url` alanı `/eser/<work.slug>` olmalı. Eserler bugün sonuçlarda yoksa bu adımda **değişiklik yapma**; dosyayı olduğu gibi bırak ve commit mesajından çıkar.

- [ ] **Step 5: Verify build and lint**

Run: `npm run build`
Expected: başarılı

Run: `npm run lint`
Expected: temiz

- [ ] **Step 6: Manual redirect check**

Run: `npm run dev`

Bir eser slug'ı ile `/urun/<eser-slug>` aç. Beklenen: tarayıcı `/eser/<eser-slug>` adresine düşer. Var olmayan bir slug ile `/urun/olmayan-sey` aç. Beklenen: 404.

- [ ] **Step 7: Commit**

```bash
git add app/sitemap.ts app/urun/[slug]/page.tsx app/admin/[id]/page.tsx
git commit -m "feat(seo): eser sitemap girdileri + /urun eser 301 + admin linki"
```

(4. adımda `app/api/search/route.ts` değiştiyse onu da `git add`'e ekle.)

---

### Task 8: E2E testi ve bütün doğrulama

**Files:**
- Modify: `tests/e2e/smoke.spec.ts:29-38`

**Interfaces:**
- Consumes: Task 5, 6, 7 çıktıları

- [ ] **Step 1: Rewrite the gallery smoke test**

`tests/e2e/smoke.spec.ts` içindeki `"galeri: landing ve seri sayfası render olur"` testini şununla değiştir:

```ts
test("galeri: landing → seri → eser sayfası gezinmesi", async ({ page }) => {
  await page.goto("/galeri");
  await expect(page.locator("h1").first()).toBeVisible();
  const firstSeries = page.locator('main a[href^="/galeri/"]').first();
  await expect(firstSeries).toBeVisible();
  await firstSeries.click();
  await expect(page).toHaveURL(/\/galeri\/.+/);
  await expect(page.locator("h1").first()).toBeVisible();

  // Seri sayfasındaki eser kartları kendi sayfalarına link vermeli.
  const firstWork = page.locator('main a[href^="/eser/"]').first();
  await expect(firstWork).toBeVisible();
  await firstWork.click();
  await expect(page).toHaveURL(/\/eser\/.+/);
  await expect(page.locator("h1").first()).toBeVisible();
  await expect(page.locator("main img").first()).toBeVisible();
});

test("eser sayfası canonical ve VisualArtwork markup basar", async ({ page }) => {
  await page.goto("/galeri");
  await page.locator('main a[href^="/galeri/"]').first().click();
  await page.locator('main a[href^="/eser/"]').first().click();
  const url = new URL(page.url());

  const canonical = await page
    .locator('link[rel="canonical"]')
    .getAttribute("href");
  expect(canonical).toContain(url.pathname);

  const blocks = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents();
  expect(blocks.some((b) => b.includes('"VisualArtwork"'))).toBe(true);
});
```

- [ ] **Step 2: Run the e2e suite**

Run: `npm run test:e2e`
Expected: tüm testler PASS. Kırılan varsa Task 5/6'daki işaretleyicileri (selector) kontrol et, testi zayıflatmak yerine sayfayı düzelt.

- [ ] **Step 3: Run the full verification set**

```bash
npm run lint
npm run test:unit
npm run build
npm run test:e2e
```

Expected: dördü de temiz. Herhangi biri kırmızıysa **durup düzelt**, sonraki adıma geçme.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/smoke.spec.ts
git commit -m "test(e2e): galeri akisi eser sayfasi navigasyonunu dogrular"
```

- [ ] **Step 5: Report, do not push**

Dalı (`feat/eser-detay-sayfasi`) push ETME. Kullanıcıya rapor et: hangi görevler bitti, dört doğrulama komutunun çıktısı ne, elle kontrol edilmesi gereken ne kaldı (özellikle açıklaması boş eserler).

---

## Uygulama sonrası, kod dışı işler

Bunlar bu planın parçası değil; bitince kullanıcıya hatırlat:

1. **Eser açıklamaları.** Açıklaması boş eserlerde sayfa ince içerik olur. Panelden doldurulacak.
2. **Search Console.** Yayına çıktıktan sonra sitemap yeniden gönderilir, `/eser/` örneklerinde URL denetimi yapılır.
3. **Slug denetimi.** Eser slug'ları arşiv sync'inden geliyor. Anlamsız veya çok uzun slug varsa yayın öncesi gözden geçirilmeli (slug değişimi sonradan 301 borcu yaratır).
4. **Deploy.** Kullanıcı onayı olmadan push/deploy yok.
