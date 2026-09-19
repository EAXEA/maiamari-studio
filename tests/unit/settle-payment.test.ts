/**
 * Ortak ödeme uzlaştırma — birim testleri.
 * Koşum: `npm run test:unit`. Ağ/DB yok: tüm bağımlılıklar enjekte edilir.
 *
 * Kritik davranış: `source` alanı yolun kendi kendine tekrar deneyip
 * denemediğine göre iki şeyi belirler — siparişi `failed` yazma yetkisi ve
 * `retryable` durumunda uyarı maili.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  settleCheckoutFormPayment,
  type SettleDeps,
} from "../../lib/checkout/settle-payment";
import type { OrderWithItems } from "../../lib/db/orders";
import type { OrderRow } from "../../lib/db/schema";

type Calls = {
  markPaid: string[];
  markFailed: string[];
  flagged: Array<{ id: string; reason: string }>;
  cleared: string[];
  notifiedNewOrder: string[];
  notifiedAttention: string[];
};

function makeOrder(over: Partial<OrderRow> = {}): OrderWithItems {
  const order: OrderRow = {
    id: "order-1",
    orderNo: "MA-20260919-TEST",
    status: "pending",
    buyerName: "Test Alıcı",
    buyerEmail: "test@example.com",
    buyerPhone: "+905551112233",
    addressLine: "Test adres",
    city: "Konya",
    totalTry: "1250.00",
    currency: "TRY",
    paymentProvider: "iyzico",
    paymentId: null,
    paymentToken: null,
    paymentTokenHash: null,
    paymentPageUrl: null,
    paymentTokenIssuedAt: null,
    conversationId: "conv-1",
    paymentAttentionReason: null,
    paymentAttentionAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  };
  return { order, items: [] };
}

function makeDeps(over: Partial<SettleDeps> = {}): {
  deps: SettleDeps;
  calls: Calls;
} {
  const calls: Calls = {
    markPaid: [],
    markFailed: [],
    flagged: [],
    cleared: [],
    notifiedNewOrder: [],
    notifiedAttention: [],
  };
  const order = makeOrder();
  const deps: SettleDeps = {
    hashToken: (t) => `hash(${t})`,
    findByTokenHash: async () => order,
    findPendingByLegacyToken: async () => null,
    retrieve: async () => ({
      status: "success",
      paymentStatus: "SUCCESS",
      paymentId: "4207393587",
      basketId: "order-1",
      paidPrice: "1250.00",
      currency: "TRY",
    }),
    verifyRetrieveSignature: () => true,
    getOrder: async () => order,
    markPaid: async (id) => {
      calls.markPaid.push(id);
      return true;
    },
    markFailed: async (id) => {
      calls.markFailed.push(id);
    },
    flagAttention: async (id, reason) => {
      calls.flagged.push({ id, reason });
      return true;
    },
    clearAttention: async (id) => {
      calls.cleared.push(id);
    },
    notifyNewOrder: async (o) => {
      calls.notifiedNewOrder.push(o.id);
    },
    notifyAttention: async (i) => {
      calls.notifiedAttention.push(i.reason);
    },
    ...over,
  };
  return { deps, calls };
}

test("basarili odeme siparisi paid yapar ve mail gonderir", async () => {
  const { deps, calls } = makeDeps();
  const out = await settleCheckoutFormPayment("tok", { source: "callback" }, deps);
  assert.equal(out.kind, "paid");
  assert.deepEqual(calls.markPaid, ["order-1"]);
  assert.deepEqual(calls.notifiedNewOrder, ["order-1"]);
  assert.deepEqual(calls.cleared, ["order-1"]);
});

test("zaten paid ise iyzico'ya hic gidilmez", async () => {
  let retrieved = false;
  const paid = makeOrder({ status: "paid" });
  const { deps } = makeDeps({
    findByTokenHash: async () => paid,
    getOrder: async () => paid,
    retrieve: async () => {
      retrieved = true;
      return {};
    },
  });
  const out = await settleCheckoutFormPayment("tok", { source: "webhook" }, deps);
  assert.equal(out.kind, "already-paid");
  assert.equal(retrieved, false);
});

test("retrieve ag hatasi retryable doner, siparise dokunmaz", async () => {
  const { deps, calls } = makeDeps({
    retrieve: async () => {
      throw new TypeError("fetch failed");
    },
  });
  const out = await settleCheckoutFormPayment("tok", { source: "webhook" }, deps);
  assert.equal(out.kind, "retryable");
  assert.deepEqual(calls.markPaid, []);
  assert.deepEqual(calls.markFailed, []);
});

test("callback yolunda retryable uyari maili gonderir, webhook yolunda gondermez", async () => {
  const fail = {
    retrieve: async () => {
      throw new TypeError("fetch failed");
    },
  };
  const cb = makeDeps(fail);
  await settleCheckoutFormPayment("tok", { source: "callback" }, cb.deps);
  assert.equal(cb.calls.notifiedAttention.length, 1);

  const wh = makeDeps(fail);
  await settleCheckoutFormPayment("tok", { source: "webhook" }, wh.deps);
  assert.equal(wh.calls.notifiedAttention.length, 0);
});

test("retrieve imzasi tutmazsa siparise dokunulmaz", async () => {
  const { deps, calls } = makeDeps({ verifyRetrieveSignature: () => false });
  const out = await settleCheckoutFormPayment("tok", { source: "callback" }, deps);
  assert.equal(out.kind, "needs-attention");
  assert.deepEqual(calls.markPaid, []);
  assert.equal(calls.notifiedAttention.length, 1);
});

test("tutar uyusmazsa paid yazilmaz, bayrak konur", async () => {
  const { deps, calls } = makeDeps({
    retrieve: async () => ({
      status: "success",
      paymentStatus: "SUCCESS",
      paymentId: "1",
      basketId: "order-1",
      paidPrice: "1.00",
      currency: "TRY",
    }),
  });
  const out = await settleCheckoutFormPayment("tok", { source: "callback" }, deps);
  assert.equal(out.kind, "needs-attention");
  assert.deepEqual(calls.markPaid, []);
  assert.equal(calls.flagged.length, 1);
});

test("yerel eslesme basketId ile uyusmazsa reddedilir", async () => {
  const { deps, calls } = makeDeps({
    retrieve: async () => ({
      status: "success",
      paymentStatus: "SUCCESS",
      paymentId: "1",
      basketId: "baska-order",
      paidPrice: "1250.00",
      currency: "TRY",
    }),
  });
  const out = await settleCheckoutFormPayment("tok", { source: "callback" }, deps);
  assert.equal(out.kind, "needs-attention");
  assert.deepEqual(calls.markPaid, []);
});

test("FAILURE: callback siparisi failed yapar", async () => {
  const { deps, calls } = makeDeps({
    retrieve: async () => ({
      status: "success",
      paymentStatus: "FAILURE",
      basketId: "order-1",
    }),
  });
  const out = await settleCheckoutFormPayment("tok", { source: "callback" }, deps);
  assert.equal(out.kind, "not-paid");
  assert.deepEqual(calls.markFailed, ["order-1"]);
});

test("FAILURE: webhook siparise DOKUNMAZ (coklu kart denemesi)", async () => {
  const { deps, calls } = makeDeps({
    retrieve: async () => ({
      status: "success",
      paymentStatus: "FAILURE",
      basketId: "order-1",
    }),
  });
  const out = await settleCheckoutFormPayment("tok", { source: "webhook" }, deps);
  assert.equal(out.kind, "not-paid");
  assert.deepEqual(calls.markFailed, []);
});

test("bayrak zaten varsa uyari maili tekrar gitmez", async () => {
  const { deps, calls } = makeDeps({
    verifyRetrieveSignature: () => false,
    flagAttention: async () => false,
  });
  await settleCheckoutFormPayment("tok", { source: "callback" }, deps);
  assert.equal(calls.notifiedAttention.length, 0);
});

test("beklenmedik hata (DB dustu) retryable doner, istisna sizmaz", async () => {
  const { deps, calls } = makeDeps({
    findByTokenHash: async () => {
      throw new Error('column "payment_attention_reason" does not exist');
    },
  });
  const out = await settleCheckoutFormPayment("tok", { source: "webhook" }, deps);
  assert.equal(out.kind, "retryable");
  assert.deepEqual(calls.markPaid, []);
  assert.deepEqual(calls.markFailed, []);
});

test("paid yazildiktan sonraki hata odemeyi retryable'a dusurmez", async () => {
  // markPaid basarili oldu; sonrasindaki bildirim/temizlik hatasi ödemeyi
  // geri almaz, sonuc paid kalmalidir.
  const { deps } = makeDeps({
    clearAttention: async () => {
      throw new Error("bayrak temizlenemedi");
    },
  });
  const out = await settleCheckoutFormPayment("tok", { source: "callback" }, deps);
  assert.equal(out.kind, "paid");
});

test("markPaid false donerse (yaris) mail gonderilmez", async () => {
  const { deps, calls } = makeDeps({ markPaid: async () => false });
  const out = await settleCheckoutFormPayment("tok", { source: "callback" }, deps);
  assert.equal(out.kind, "paid");
  assert.equal(out.kind === "paid" && out.firstTime, false);
  assert.deepEqual(calls.notifiedNewOrder, []);
});
