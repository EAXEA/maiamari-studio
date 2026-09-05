/**
 * Ürün meta description üretimi — birim testleri.
 *
 * Amaç: her ürünün <head> içindeki description'ı BENZERSİZ olsun (28 kâğıt/alet
 * ürünü aynı ham açıklamayı paylaşıyor) ve kategori bazında öğrenci/atölye
 * niyetini doğal biçimde taşısın. Sayfada görünen kopyaya DOKUNULMAZ.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { productMetaDescription, META_MAX } from "../../lib/seo/product-meta";
import type { Product } from "../../lib/types";

function makeProduct(over: Partial<Product> = {}): Product {
  return {
    id: "1",
    slug: "test-urun",
    title: "Test Ürün",
    description: "Kısa bir açıklama.",
    priceTRY: 100,
    compareAtTRY: null,
    status: "in_stock",
    statuses: [],
    categorySlug: "linol-boyalari",
    coverImage: "",
    gallery: [],
    sourceUrl: "",
    ...over,
  };
}

test("meta description META_MAX sinirini asmaz", () => {
  const p = makeProduct({
    title: "Çok Uzun Bir Ürün Başlığı Olan Parlak Linol Baskı Boyası Kavanozu",
    description: "Lorem ipsum dolor sit amet. ".repeat(20),
  });
  assert.ok(productMetaDescription(p).length <= META_MAX);
});

test("ayni aciklamayi paylasan iki urun farkli meta uretir", () => {
  const ortak = "100 cc amber cam kavanozda su bazlı linol baskı boyası.";
  const a = makeProduct({ slug: "gold", title: "Gold Linol Boyası", description: ortak });
  const b = makeProduct({ slug: "gumus", title: "Gümüş Linol Boyası", description: ortak });
  assert.notEqual(productMetaDescription(a), productMetaDescription(b));
});

test("kategoriye ozel ogrenci/atolye ifadesini icerir", () => {
  const p = makeProduct({ categorySlug: "linolyum", title: "A4 Linolyum Plaka" });
  assert.match(productMetaDescription(p), /güzel sanatlar/i);
});

test("bilinmeyen kategori icin genel ifadeye duser", () => {
  const p = makeProduct({ categorySlug: "yok-boyle-kategori" as Product["categorySlug"] });
  const meta = productMetaDescription(p);
  assert.ok(meta.length > 0);
  assert.match(meta, /Maiamari/);
});

test("aciklamasi bos urun icin de bos olmayan meta uretir", () => {
  const p = makeProduct({ description: "", title: "Kayıt Pini" });
  const meta = productMetaDescription(p);
  assert.ok(meta.length > 0);
  assert.match(meta, /Kayıt Pini/);
});

test("kirpma kelime sinirinda yapilir, kelime ortasindan kesilmez", () => {
  const p = makeProduct({
    title: "Merdane",
    categorySlug: "merdaneler",
    description:
      "Kauçuk yüzeyli merdane boyayı plakaya eşit dağıtır ve baskı sırasında iz bırakmadan ilerler. ".repeat(
        5,
      ),
  });
  const meta = productMetaDescription(p);
  assert.ok(meta.endsWith("…"), `beklenen '…' ile bitmesi, gelen: ${meta}`);
  // '…' atıldığında son karakter kelime ortası değil: öncesi boşluk olmamalı
  // ama kırpılan parça tam bir kelime olmalı — yani orijinal metinde
  // "<kirpilan> " veya "<kirpilan>" sonu olarak geçmeli.
  const govde = meta.slice(0, -1).trimEnd();
  const sonKelime = govde.split(/\s+/).pop()!;
  assert.match(p.description + " " + p.title, new RegExp(`${sonKelime}(\\s|$|\\.)`));
});

test("em-dash kullanmaz (maiamari editorial kurali)", () => {
  const p = makeProduct({ title: "Gold Linol Boyası" });
  assert.doesNotMatch(productMetaDescription(p), /—/);
});

test("ham aciklamadaki fazla bosluk ve satir sonlari tek bosluga iner", () => {
  const p = makeProduct({ description: "İlk satır.\n\n  İkinci   satır." });
  assert.doesNotMatch(productMetaDescription(p), /\s{2,}|\n/);
});
