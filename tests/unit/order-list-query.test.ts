/**
 * Sipariş listesi URL parametreleri — birim testleri.
 * Koşum: `npm run test:unit`. DB/ağ yok, saf fonksiyonlar.
 *
 * Sayfalama ile sıralamanın birlikte yanlış kurulması sinsi bir hatadır:
 * kayıt iki sayfada birden görünür ya da hiç görünmez. Kural burada kilitli.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ORDERS_PAGE_SIZE,
  pageCount,
  parseOrdersQuery,
  ordersHref,
  toggleSortPatch,
} from "../../lib/admin/order-list-query";

test("varsayılan: aktif sekme, 1. sayfa, en yeni önce", () => {
  const q = parseOrdersQuery({});
  assert.equal(q.tab, "aktif");
  assert.equal(q.page, 1);
  assert.equal(q.sort, "tarih");
  assert.equal(q.dir, "desc");
  assert.equal(q.offset, 0);
});

test("sayfa numarası offset'e çevrilir (25'lik sayfa)", () => {
  assert.equal(ORDERS_PAGE_SIZE, 25);
  assert.equal(parseOrdersQuery({ page: "2" }).offset, 25);
  assert.equal(parseOrdersQuery({ page: "3" }).offset, 50);
});

test("bozuk parametreler varsayılana düşer, hata vermez", () => {
  for (const page of ["0", "-4", "abc", "", "1e9999"]) {
    const q = parseOrdersQuery({ page });
    assert.ok(q.page >= 1, page);
    assert.ok(q.offset >= 0, page);
  }
  assert.equal(parseOrdersQuery({ tab: "saçma" }).tab, "aktif");
  assert.equal(parseOrdersQuery({ sirala: "renk" }).sort, "tarih");
  assert.equal(parseOrdersQuery({ yon: "yukari" }).dir, "desc");
});

test("arşiv sekmesi ve tutar sıralaması tanınır", () => {
  const q = parseOrdersQuery({ tab: "arsiv", sirala: "tutar", yon: "asc" });
  assert.deepEqual(
    { tab: q.tab, sort: q.sort, dir: q.dir },
    { tab: "arsiv", sort: "tutar", dir: "asc" },
  );
});

test("varsayılan değerler URL'e yazılmaz, adres temiz kalır", () => {
  assert.equal(ordersHref(parseOrdersQuery({})), "/admin/orders");
});

test("link kurulurken sekme, sıralama ve sayfa korunur", () => {
  const q = parseOrdersQuery({ tab: "arsiv", sirala: "tutar" });
  assert.equal(
    ordersHref(q, { page: 3 }),
    "/admin/orders?tab=arsiv&sirala=tutar&page=3",
  );
});

test("aynı sütuna tıklamak yönü çevirir ve sayfa 1'e döner", () => {
  const q = parseOrdersQuery({ sirala: "tutar", yon: "desc", page: "4" });
  assert.deepEqual(toggleSortPatch(q, "tutar"), { dir: "asc", page: 1 });
});

test("başka sütuna geçmek azalan başlatır ve sayfa 1'e döner", () => {
  const q = parseOrdersQuery({ sirala: "tarih", yon: "asc", page: "2" });
  assert.deepEqual(toggleSortPatch(q, "tutar"), {
    sort: "tutar",
    dir: "desc",
    page: 1,
  });
});

test("sekme değişince sayfa 1'e döner", () => {
  const q = parseOrdersQuery({ page: "5" });
  assert.equal(ordersHref(q, { tab: "arsiv", page: 1 }), "/admin/orders?tab=arsiv");
});

test("sayfa sayısı: 0 kayıtta bile en az 1", () => {
  assert.equal(pageCount(0), 1);
  assert.equal(pageCount(1), 1);
  assert.equal(pageCount(25), 1);
  assert.equal(pageCount(26), 2);
  assert.equal(pageCount(50), 2);
  assert.equal(pageCount(51), 3);
});
