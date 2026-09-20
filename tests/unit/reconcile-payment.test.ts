/**
 * "iyzico'ya sor" kararı — birim testleri.
 * Koşum: `npm run test:unit`. Ağ/DB yok: karar saf fonksiyon.
 *
 * Bu karar PARA DURUMUNU değiştiriyor. Yanlış "paid" demek, alınmamış parayı
 * alınmış saymaktır; yanlış "not-paid" demek, alınmış parayı görmezden
 * gelmektir. İkisi de testle kilitlenir.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { decideReconcile } from "../../lib/checkout/reconcile-payment";
import type { PaymentDetailResult } from "../../lib/payment/iyzico";

const ORDER = { id: "order-uuid-1", totalTry: "20.00", status: "pending" };

function basari(over: Partial<PaymentDetailResult> = {}): PaymentDetailResult {
  return {
    status: "success",
    paymentStatus: "SUCCESS",
    paymentId: "4209477732",
    basketId: "order-uuid-1",
    conversationId: "conv-1",
    price: "20.00",
    paidPrice: "20.00",
    currency: "TRY",
    signature: "imza",
    ...over,
  };
}

test("basarili odeme paid doner", () => {
  const d = decideReconcile({ order: ORDER, result: basari(), signatureOk: true });
  assert.deepEqual(d, { kind: "paid", paymentId: "4209477732" });
});

test("paymentId sayi gelse de stringe cevrilir", () => {
  const d = decideReconcile({
    order: ORDER,
    result: basari({ paymentId: 4209477732 }),
    signatureOk: true,
  });
  assert.deepEqual(d, { kind: "paid", paymentId: "4209477732" });
});

test("imza tutmazsa ODENDI DENMEZ", () => {
  const d = decideReconcile({ order: ORDER, result: basari(), signatureOk: false });
  assert.equal(d.kind, "mismatch");
});

test("baska siparisin yaniti kabul edilmez", () => {
  const d = decideReconcile({
    order: ORDER,
    result: basari({ basketId: "baska-order" }),
    signatureOk: true,
  });
  assert.equal(d.kind, "mismatch");
});

test("tutar uyusmazsa kabul edilmez", () => {
  for (const price of ["19.00", "21.00", "0", undefined]) {
    const d = decideReconcile({
      order: ORDER,
      result: basari({ price }),
      signatureOk: true,
    });
    assert.equal(d.kind, "mismatch", `price=${String(price)}`);
  }
});

test("kurus farki olmayan ayni tutar kabul edilir (20 ile 20.00)", () => {
  const d = decideReconcile({
    order: { ...ORDER, totalTry: 20 },
    result: basari({ price: "20" }),
    signatureOk: true,
  });
  assert.equal(d.kind, "paid");
});

test("odeme basarisizsa not-paid doner", () => {
  const d = decideReconcile({
    order: ORDER,
    result: basari({ paymentStatus: "FAILURE" }),
    signatureOk: true,
  });
  assert.equal(d.kind, "not-paid");
});

test("iyzico failure donerse not-paid doner ve mesaji tasir", () => {
  const d = decideReconcile({
    order: ORDER,
    result: { status: "failure", errorMessage: "Kayıt bulunamadı" },
    signatureOk: false,
  });
  assert.equal(d.kind, "not-paid");
  assert.match((d as { detail: string }).detail, /Kayıt bulunamadı/);
});

test("paymentId yoksa kabul edilmez", () => {
  const d = decideReconcile({
    order: ORDER,
    result: basari({ paymentId: undefined }),
    signatureOk: true,
  });
  assert.equal(d.kind, "mismatch");
});

test("basketId bos gelirse siparis eslesmesi ENGEL olmaz", () => {
  // iyzico bazi yanitlarda basketId dondurmeyebilir; o zaman eslesme
  // conversationId sorgusunun kendisiyle zaten saglanmistir.
  const d = decideReconcile({
    order: ORDER,
    result: basari({ basketId: undefined }),
    signatureOk: true,
  });
  assert.equal(d.kind, "paid");
});
