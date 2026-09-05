/**
 * Product / CollectionPage JSON-LD izleyici (audience) alanları — birim testleri.
 *
 * Amaç: mağaza malzemelerinin güzel sanatlar öğrencisi + baskı atölyesi
 * kitlesine hitap ettiği makine-okur biçimde beyan edilsin. Sayfada görünür
 * hiçbir değişiklik yok; yalnız <script type="application/ld+json">.
 *
 * Eserlerde (kind="artwork" → visualArtworkSchema) audience İSTENMEZ; bu alan
 * malzemeye özgüdür.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  productSchema,
  categoryCollectionPageSchema,
} from "../../lib/structured-data";
import type { Category, Product } from "../../lib/types";

function makeProduct(over: Partial<Product> = {}): Product {
  return {
    id: "1",
    slug: "gold-linol-boyasi",
    title: "Gold Linol Baskı Boyası",
    description: "100 cc amber cam kavanozda.",
    priceTRY: 294,
    compareAtTRY: null,
    status: "in_stock",
    statuses: [],
    categorySlug: "linol-boyalari",
    coverImage: "/images/gold.jpg",
    gallery: [],
    sourceUrl: "",
    ...over,
  };
}

const category: Category = {
  slug: "linolyum",
  name: "Linolyum Plaka",
  nameEn: "Linoleum Blocks",
  description: "A4 ve A5 ebatında, oyma için hazır linolyum plakalar.",
};

test("productSchema EducationalAudience/student beyan eder", () => {
  const s = productSchema(makeProduct()) as Record<string, unknown>;
  assert.deepEqual(s.audience, {
    "@type": "EducationalAudience",
    educationalRole: "student",
    audienceType: "Güzel sanatlar öğrencileri ve baskı atölyeleri",
  });
});

test("kategori adi verilince category alani okunabilir adi tasir", () => {
  const s = productSchema(
    makeProduct(),
    undefined,
    "Linol Boyaları",
  ) as Record<string, unknown>;
  assert.equal(s.category, "Linol Boyaları");
});

test("kategori adi verilmezse category alani hic basilmaz", () => {
  // Slug ("linol-boyalari") markup'ta okunabilir bir kategori adı değildir;
  // ad yoksa alanı hiç basmamak yanlış değer basmaktan iyidir.
  const s = productSchema(makeProduct()) as Record<string, unknown>;
  assert.ok(!("category" in s));
});

test("productSchema kategoriye ozel keywords uretir", () => {
  const s = productSchema(makeProduct()) as unknown as Record<string, string>;
  assert.match(s.keywords, /linol baskı boyası/i);
  assert.match(s.keywords, /güzel sanatlar/i);
});

test("bilinmeyen kategoride keywords alani hic bulunmaz", () => {
  const s = productSchema(
    makeProduct({ categorySlug: "yok" as Product["categorySlug"] }),
  ) as Record<string, unknown>;
  assert.ok(!("keywords" in s));
});

test("eserde (kategorisiz Product) audience ve category hic basilmaz", () => {
  // /eser/[slug] eserleri de productSchema'dan geçirir; categorySlug boştur.
  // Öğrenci malzemesi izleyicisi esere ait DEĞİLDİR.
  const s = productSchema(
    makeProduct({ categorySlug: "" as Product["categorySlug"] }),
    "https://www.maiamari.art/eser/kapi-01",
  ) as Record<string, unknown>;
  assert.ok(!("audience" in s), "eserde audience bulunmamalı");
  assert.ok(!("category" in s), "eserde category bulunmamalı");
});

test("categoryCollectionPageSchema ayni audience'i beyan eder", () => {
  const s = categoryCollectionPageSchema(category, [makeProduct()]) as Record<
    string,
    unknown
  >;
  assert.deepEqual(s.audience, {
    "@type": "EducationalAudience",
    educationalRole: "student",
    audienceType: "Güzel sanatlar öğrencileri ve baskı atölyeleri",
  });
});
