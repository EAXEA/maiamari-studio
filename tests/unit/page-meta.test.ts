/**
 * Statik sayfa meta description'ları — birim testleri.
 *
 * Kilitlenen regresyon: sayfa kendi `description`'ını tanımlamayınca
 * `app/layout.tsx`'in site açıklamasını miras alır ve Google bunu kopya sinyali
 * olarak okur (07.09.2026'da /shop, /journal, /atolyeler, /about, /contact
 * canlıda ana sayfanın açıklamasını basıyordu).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PAGE_DESCRIPTIONS,
  SITE_DESCRIPTION,
  pageDescription,
  type StaticPagePath,
} from "../../lib/seo/page-meta";
import { META_MAX } from "../../lib/seo/product-meta";

const paths = Object.keys(PAGE_DESCRIPTIONS) as StaticPagePath[];

test("her sayfanin aciklamasi doludur", () => {
  for (const p of paths) {
    assert.ok(pageDescription(p).trim().length > 0, `${p} bos`);
  }
});

test("hicbir sayfa site geneli aciklamayi tekrar etmez", () => {
  for (const p of paths) {
    assert.notEqual(
      pageDescription(p),
      SITE_DESCRIPTION,
      `${p} layout'un aciklamasini miras aliyor`,
    );
  }
});

test("aciklamalar birbirinden farklidir", () => {
  const values = paths.map((p) => pageDescription(p));
  assert.equal(new Set(values).size, values.length);
});

test("aciklamalar META_MAX sinirini asmaz", () => {
  for (const p of paths) {
    const d = pageDescription(p);
    assert.ok(d.length <= META_MAX, `${p} ${d.length} karakter`);
  }
});

test("em-dash kullanilmaz (maiamari editorial kurali)", () => {
  for (const p of paths) {
    assert.ok(!pageDescription(p).includes("—"), `${p} em-dash iceriyor`);
  }
});

test("aciklamalar tek satirdir, fazla bosluk icermez", () => {
  for (const p of paths) {
    const d = pageDescription(p);
    assert.equal(d, d.replace(/\s+/g, " ").trim(), `${p} bosluk/satir sonu`);
  }
});
