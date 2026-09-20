/**
 * Satın alınabilirlik kuralı — birim testleri.
 * Koşum: `npm run test:unit`. DB/ağ yok, saf fonksiyon.
 *
 * Bu kural hem ödeme hem sepet tarafında kullanılır; ayrışırsa müşteri sepette
 * duran ürünü ödemede sessizce kaybeder.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  purchaseBlockReason,
  unavailableMessage,
  type PurchasableRow,
} from "../../lib/checkout/purchasable";

const ok: PurchasableRow = {
  isPublished: true,
  forSale: true,
  status: "in_stock",
  priceTry: "450.00",
};

test("yayında + satılık + stokta + fiyatlı ürün satın alınabilir", () => {
  assert.equal(purchaseBlockReason(ok), null);
});

test("numeric fiyat string olarak gelse de kabul edilir", () => {
  assert.equal(purchaseBlockReason({ ...ok, priceTry: 450 }), null);
});

test("tükenen ürün sold_out döner", () => {
  assert.equal(
    purchaseBlockReason({ ...ok, status: "out_of_stock" }),
    "sold_out",
  );
});

test("tükendi, yayından kaldırılmaya göre önceliklidir", () => {
  // Panelden hem tükendi işaretlenip hem yayından kaldırılan ürün için
  // müşteriye "artık satışta değil" değil "tükendi" denmeli.
  assert.equal(
    purchaseBlockReason({ ...ok, status: "out_of_stock", isPublished: false }),
    "sold_out",
  );
});

test("yayından kaldırılan ürün unavailable döner", () => {
  assert.equal(
    purchaseBlockReason({ ...ok, isPublished: false }),
    "unavailable",
  );
});

test("satışa kapalı ürün unavailable döner", () => {
  assert.equal(purchaseBlockReason({ ...ok, forSale: false }), "unavailable");
});

test("fiyatı sıfır, negatif veya boş ürün unavailable döner", () => {
  for (const priceTry of [0, "0", -5, null, undefined, ""]) {
    assert.equal(
      purchaseBlockReason({ ...ok, priceTry }),
      "unavailable",
      `priceTry=${String(priceTry)}`,
    );
  }
});

test("silinmiş ürün (kayıt yok) unavailable döner", () => {
  assert.equal(purchaseBlockReason(null), "unavailable");
  assert.equal(purchaseBlockReason(undefined), "unavailable");
});

test("status null ise diğer kurallara bakılır", () => {
  assert.equal(purchaseBlockReason({ ...ok, status: null }), null);
});

test("müşteri metni sebebe göre ayrışır", () => {
  assert.equal(unavailableMessage("sold_out"), "tükendi");
  assert.equal(unavailableMessage("unavailable"), "artık satışta değil");
});
