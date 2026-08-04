/**
 * VisualArtwork / Product JSON-LD — birim testleri.
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
