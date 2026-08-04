/**
 * "İsimsiz / Untitled" eserlerin görünen adlandırması — birim testleri.
 * Yayındaki 57 eserin 27'si bu başlığı taşıyor (kapilar 20, odak 4,
 * basilmis-ankara 3). Her biri kendi sayfasını aldığı için başlıkların
 * ayrışması şart; ayrışma seri adı + eser numarasından türetilir.
 * DB'ye DOKUNULMAZ: sanatçının "İsimsiz" tercihi veride korunur.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { artworkNaming } from "../../lib/gallery/artwork-naming";
import type { PortfolioWork, Series } from "../../lib/types";

const kapilar: Series = {
  slug: "kapilar",
  title: "Kapılar",
  description: "",
};

function work(over: Partial<PortfolioWork>): PortfolioWork {
  return {
    id: "1",
    slug: "kapilar-03",
    title: "İsimsiz / Untitled",
    description: "",
    image: "/images/x.jpg",
    year: 2015,
    ...over,
  };
}

test("adi olan eserde her alan basligin kendisidir", () => {
  const n = artworkNaming(work({ title: "Lord of Fire", slug: "lord-of-01" }), kapilar);
  assert.equal(n.heading, "Lord of Fire");
  assert.equal(n.cardTitle, "Lord of Fire");
  assert.equal(n.pageTitle, "Lord of Fire");
  assert.equal(n.schemaName, "Lord of Fire");
});

test("adi olan eserde eyebrow seri adidir", () => {
  const n = artworkNaming(work({ title: "Lord of Fire" }), kapilar);
  assert.equal(n.eyebrow, "Kapılar");
});

test("isimsiz eserde baslik veride oldugu gibi kalir", () => {
  const n = artworkNaming(work({}), kapilar);
  assert.equal(n.heading, "İsimsiz / Untitled");
});

test("isimsiz eserde kart adi seri + numaradir", () => {
  const n = artworkNaming(work({}), kapilar);
  assert.equal(n.cardTitle, "Kapılar 03");
});

test("isimsiz eserde eyebrow seri ve eser numarasini gosterir", () => {
  const n = artworkNaming(work({}), kapilar);
  assert.equal(n.eyebrow, "Kapılar · Eser 03");
});

test("isimsiz eserde sayfa basligi yil ile ayrisir", () => {
  const n = artworkNaming(work({}), kapilar);
  assert.equal(n.pageTitle, "Kapılar 03 · İsimsiz, 2015");
});

test("isimsiz eserde schema adi muze kunyesi bicimindedir", () => {
  const n = artworkNaming(work({}), kapilar);
  assert.equal(n.schemaName, "İsimsiz (Kapılar 03), 2015");
});

test("yili olmayan isimsiz eserde yil eklenmez", () => {
  const n = artworkNaming(work({ year: undefined }), kapilar);
  assert.equal(n.pageTitle, "Kapılar 03 · İsimsiz");
  assert.equal(n.schemaName, "İsimsiz (Kapılar 03)");
});

test("serisi olmayan isimsiz eserde ayrisma yapilamaz, baslik korunur", () => {
  const n = artworkNaming(work({ slug: "tekil-eser" }), null);
  assert.equal(n.heading, "İsimsiz / Untitled");
  assert.equal(n.cardTitle, "İsimsiz / Untitled");
  assert.equal(n.pageTitle, "İsimsiz / Untitled");
  assert.equal(n.eyebrow, null);
});

test("slug'inda numara olmayan isimsiz eserde ayrisma yapilamaz", () => {
  const n = artworkNaming(work({ slug: "tatbikat" }), kapilar);
  assert.equal(n.cardTitle, "İsimsiz / Untitled");
  assert.equal(n.eyebrow, "Kapılar");
});

test("yalnizca Untitled yazan baslik da isimsiz sayilir", () => {
  const n = artworkNaming(work({ title: "Untitled" }), kapilar);
  assert.equal(n.cardTitle, "Kapılar 03");
});
