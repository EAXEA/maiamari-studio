/**
 * iyzico isteklerinde tekrar deneme — birim testleri.
 * Koşum: `npm run test:unit`. Gerçek ağ YOK: globalThis.fetch değiştirilir.
 *
 * Neden var: 18.09 ve 19.09'da iyzico API'si bağlantıları `ECONNRESET` ile
 * kesti. 19.09'da ölçüldü: imzasız, kimliksiz isteklerde bile 12 denemeden
 * 2'si koptu (~%17). Tek deneme yapan kod bu oranda alıcıyı "ödeme
 * sağlayıcısına ulaşılamadı" ekranına düşürüyordu.
 */
import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  retrieveCheckoutForm,
  initializeCheckoutForm,
} from "../../lib/payment/iyzico";
import type { OrderRow } from "../../lib/db/schema";

const realFetch = globalThis.fetch;

beforeEach(() => {
  process.env.IYZICO_API_KEY = "test-api-key";
  process.env.IYZICO_SECRET_KEY = "test-secret-key-0123456789";
  process.env.IYZICO_BASE_URL = "https://sandbox-api.iyzipay.com";
});

afterEach(() => {
  globalThis.fetch = realFetch;
});

/** ECONNRESET'i node'un ürettiği biçimde taklit eder. */
function connReset(): TypeError {
  const e = new TypeError("fetch failed");
  (e as unknown as { cause: unknown }).cause = Object.assign(
    new Error("read ECONNRESET"),
    { errno: -104, code: "ECONNRESET", syscall: "read" },
  );
  return e;
}

function jsonOk(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

/** İlk `failures` çağrıda kopar, sonra başarılı döner. Çağrı sayısını tutar. */
function flakyFetch(failures: number, body: unknown): { calls: number } {
  const state = { calls: 0 };
  globalThis.fetch = (async () => {
    state.calls++;
    if (state.calls <= failures) throw connReset();
    return jsonOk(body);
  }) as unknown as typeof fetch;
  return state;
}

function makeOrder(): OrderRow {
  return {
    id: "order-1",
    orderNo: "MA-TEST-1",
    status: "pending",
    buyerName: "Test Alici",
    buyerEmail: "test@example.com",
    buyerPhone: "+905551112233",
    addressLine: "Test adres",
    city: "Konya",
    totalTry: "20.00",
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
  } as OrderRow;
}

test("retrieve: tek kopmadan sonra ikinci denemede basarili olur", async () => {
  const state = flakyFetch(1, { status: "success", paymentStatus: "SUCCESS" });
  const r = await retrieveCheckoutForm("tok");
  assert.equal(r.status, "success");
  assert.equal(state.calls, 2);
});

test("retrieve: iki kopmadan sonra ucuncu denemede basarili olur", async () => {
  const state = flakyFetch(2, { status: "success", paymentStatus: "SUCCESS" });
  const r = await retrieveCheckoutForm("tok");
  assert.equal(r.status, "success");
  assert.equal(state.calls, 3);
});

test("retrieve: tum denemeler koparsa hata firlatir", async () => {
  const state = flakyFetch(99, {});
  await assert.rejects(() => retrieveCheckoutForm("tok"));
  assert.equal(state.calls, 3);
});

test("initialize: kopan baglanti tekrar denenir", async () => {
  const state = flakyFetch(2, {
    status: "success",
    token: "cf-token",
    paymentPageUrl: "https://iyzico.example/odeme",
    conversationId: "conv-1",
  });
  await initializeCheckoutForm(makeOrder(), [], "1.2.3.4");
  assert.equal(state.calls, 3);
});

test("initialize: tum denemeler koparsa nazik hata doner, istisna sizmaz", async () => {
  const state = flakyFetch(99, {});
  const out = await initializeCheckoutForm(makeOrder(), [], "1.2.3.4");
  assert.equal(out.ok, false);
  assert.equal(state.calls, 3);
});

test("her deneme YENI randomKey kullanir", async () => {
  const seen: string[] = [];
  let calls = 0;
  globalThis.fetch = (async (_url: unknown, init: RequestInit) => {
    calls++;
    const h = init.headers as Record<string, string>;
    seen.push(h["x-iyzi-rnd"]);
    if (calls <= 2) throw connReset();
    return jsonOk({ status: "success" });
  }) as unknown as typeof fetch;
  await retrieveCheckoutForm("tok");
  assert.equal(seen.length, 3);
  assert.equal(new Set(seen).size, 3, "randomKey her denemede farkli olmali");
});
