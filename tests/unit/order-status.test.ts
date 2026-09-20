/**
 * Sipariş durumu kuralları — birim testleri.
 * Koşum: `npm run test:unit`. DB/ağ yok, saf fonksiyon.
 *
 * "İade edildi" ile "iptal edildi" ayrı durumlardır. Tek durumda toplanırlarsa
 * para iadesi bilgisi kayıtta kaybolur; bu testler ayrımı yerinde tutar.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ORDER_STATUS,
  ARCHIVED_STATUSES,
  isArchivedStatus,
  isKnownStatus,
  isRefundable,
  nextFulfillmentStatus,
  orderStatusLabel,
} from "../../lib/order-status";

test("iade, iptalden ayrı bir durumdur ve kendi etiketi vardır", () => {
  assert.equal(orderStatusLabel("refunded"), "İade edildi");
  assert.equal(orderStatusLabel("cancelled"), "İptal edildi");
  assert.notEqual(ORDER_STATUS.refunded, ORDER_STATUS.cancelled);
});

test("parası alınmış sipariş iade edilebilir", () => {
  for (const s of ["paid", "shipped", "delivered"]) {
    assert.equal(isRefundable(s), true, s);
  }
});

test("parası alınmamış veya sonlanmış sipariş iade edilemez", () => {
  for (const s of ["pending", "failed", "cancelled", "refunded"]) {
    assert.equal(isRefundable(s), false, s);
  }
});

test("iade arşivliktir; aktif sipariş listesinde işlem beklemez", () => {
  assert.equal(isArchivedStatus("refunded"), true);
  assert.ok(ARCHIVED_STATUSES.includes("refunded"));
});

test("iade sonrası ilerletilecek kargo adımı yoktur", () => {
  assert.equal(nextFulfillmentStatus("refunded"), null);
});

test("yalnız bilinen durumlar yazılabilir", () => {
  for (const s of Object.keys(ORDER_STATUS)) {
    assert.equal(isKnownStatus(s), true, s);
  }
  for (const s of ["", "iade", "REFUNDED", "toString", "__proto__"]) {
    assert.equal(isKnownStatus(s), false, s);
  }
});
