/**
 * Callback sipariş eşleştirme önceliği — birim testleri.
 * Koşum: `npm run test:unit` (tsx --test; node:test). DB'ye dokunmaz: yalnız
 * lib/checkout/resolve-callback-order.ts'in saf fonksiyonu.
 *
 * Doğrulanan kural: hash eşleşmesi HER ZAMAN önceliklidir; legacy (ham
 * paymentToken kolonu) eşleşmesi yalnız hash bulunamazsa devreye girer
 * (cutover geçişinde hash'i olmayan eski pending siparişler için).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveCallbackOrder } from "../../lib/checkout/resolve-callback-order";
import type { OrderWithItems } from "../../lib/db/orders";
import type { OrderRow } from "../../lib/db/schema";

function makeOrder(id: string, status: OrderRow["status"] = "pending"): OrderWithItems {
  const order: OrderRow = {
    id,
    orderNo: `MA-TEST-${id}`,
    status,
    buyerName: "Test Alıcı",
    buyerEmail: "test@example.com",
    buyerPhone: "+905551112233",
    addressLine: "Test adres",
    city: "İstanbul",
    totalTry: "100.00",
    currency: "TRY",
    paymentProvider: "iyzico",
    paymentId: null,
    paymentToken: null,
    paymentTokenHash: null,
    paymentPageUrl: null,
    paymentTokenIssuedAt: null,
    conversationId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  return { order, items: [] };
}

test("resolveCallbackOrder: hash eşleşmesi varsa her zaman o kazanır", () => {
  const byHash = makeOrder("order-hash");
  const byLegacy = makeOrder("order-legacy");
  const resolved = resolveCallbackOrder(byHash, byLegacy);
  assert.equal(resolved?.order.id, "order-hash");
});

test("resolveCallbackOrder: hash yoksa legacy (pending) eşleşmesi kabul edilir (cutover fallback)", () => {
  const byLegacy = makeOrder("order-legacy", "pending");
  const resolved = resolveCallbackOrder(null, byLegacy);
  assert.equal(resolved?.order.id, "order-legacy");
});

test("resolveCallbackOrder: ikisi de yoksa null döner (çağıran iyzico-otoriter yola düşer)", () => {
  // null = "hızlı yol bulunamadı", RET DEĞİL. route.ts bu durumda
  // retrieveCheckoutForm + basketId ile eski akışa devam eder; aksi hâlde
  // yeniden initialize edilmiş siparişlerde ödeme kaybolurdu.
  const resolved = resolveCallbackOrder(null, null);
  assert.equal(resolved, null);
});
