/**
 * Seri içi önceki/sonraki eser hesabı — birim testleri.
 * Koşum: `npm run test:unit` (tsx --test; node:test). DB'ye dokunmaz: yalnız
 * lib/gallery/adjacent-works.ts'in saf fonksiyonu.
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

test("ortadaki eserin iki komsusu da vardir", () => {
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

test("tek elemanli seride iki komsu da null'dur", () => {
  const { prev, next } = adjacentWorks([work("a")], "a");
  assert.equal(prev, null);
  assert.equal(next, null);
});

test("bos listede iki komsu da null'dur", () => {
  const { prev, next } = adjacentWorks([], "a");
  assert.equal(prev, null);
  assert.equal(next, null);
});

test("listede olmayan slug icin iki komsu da null'dur", () => {
  const works = [work("a"), work("b")];
  const { prev, next } = adjacentWorks(works, "yok");
  assert.equal(prev, null);
  assert.equal(next, null);
});
