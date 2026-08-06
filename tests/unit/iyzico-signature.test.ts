/**
 * iyzico imza yardımcıları — birim testleri.
 * Koşum: `npm run test:unit` (tsx --test; framework yok, node:test).
 * Ağ/Next/DB yok: yalnız lib/payment/iyzico.ts'in saf imza fonksiyonları.
 * Sentetik secret kullanılır; gerçek anahtar gerekmez ve okunmaz.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  normalizePriceForSignature,
  verifyCfRetrieveSignature,
  verifyCfInitSignature,
  latin1Safe,
  hashCallbackToken,
  type CfRetrieveResult,
  type CfInitializeResult,
} from "../../lib/payment/iyzico";

const TEST_SECRET = "test-secret-key-0123456789";

/** iyzico'nun yaptığı gibi ':' ayraçlı HMAC-SHA256 hex imza üretir. */
function sign(params: Array<string | number | null | undefined>): string {
  const data = params.map((p) => (p == null ? "" : String(p))).join(":");
  return crypto
    .createHmac("sha256", TEST_SECRET)
    .update(data, "utf8")
    .digest("hex");
}

/** Geçerli imzalı sentetik CF Retrieve yanıtı (testler bunu tahrif eder). */
function makeRetrieveResult(): CfRetrieveResult {
  const r: CfRetrieveResult = {
    status: "success",
    paymentStatus: "SUCCESS",
    paymentId: "12345678",
    currency: "TRY",
    basketId: "order-uuid-1",
    conversationId: "conv-uuid-1",
    paidPrice: "150.00",
    price: "150.00",
    token: "cf-token-abc",
  };
  // Param sırası resmi dokümandan; tutarlar trailing-zero normalize edilir.
  r.signature = sign([
    r.paymentStatus,
    r.paymentId,
    r.currency,
    r.basketId,
    r.conversationId,
    normalizePriceForSignature(r.paidPrice),
    normalizePriceForSignature(r.price),
    r.token,
  ]);
  return r;
}

test("normalizePriceForSignature: trailing-zero kuralı", () => {
  assert.equal(normalizePriceForSignature("50.00"), "50");
  assert.equal(normalizePriceForSignature("10.50"), "10.5");
  assert.equal(normalizePriceForSignature("10.510"), "10.51");
  assert.equal(normalizePriceForSignature("10.0"), "10");
  assert.equal(normalizePriceForSignature("0.00"), "0");
  // Nokta yoksa dokunulmaz (tam sayının sıfırları atılmaz).
  assert.equal(normalizePriceForSignature("50"), "50");
  assert.equal(normalizePriceForSignature("100"), "100");
  // Sayı tipi de kabul edilir.
  assert.equal(normalizePriceForSignature(10.5), "10.5");
  // Boş girişler boş string olur (imza dizisinde boş alan).
  assert.equal(normalizePriceForSignature(null), "");
  assert.equal(normalizePriceForSignature(undefined), "");
});

test("verifyCfRetrieveSignature: doğru imza kabul edilir", () => {
  process.env.IYZICO_SECRET_KEY = TEST_SECRET;
  assert.equal(verifyCfRetrieveSignature(makeRetrieveResult()), true);
});

test("verifyCfRetrieveSignature: paidPrice tahrifatı reddedilir", () => {
  process.env.IYZICO_SECRET_KEY = TEST_SECRET;
  const r = makeRetrieveResult();
  r.paidPrice = "999.00"; // imza 150 üzerinden atıldı
  assert.equal(verifyCfRetrieveSignature(r), false);
});

test("verifyCfRetrieveSignature: imza eksikse reddedilir", () => {
  process.env.IYZICO_SECRET_KEY = TEST_SECRET;
  const r = makeRetrieveResult();
  delete r.signature;
  assert.equal(verifyCfRetrieveSignature(r), false);
});

test("verifyCfRetrieveSignature: yanlış/uzunluğu tutmayan imza reddedilir", () => {
  process.env.IYZICO_SECRET_KEY = TEST_SECRET;
  const r = makeRetrieveResult();
  r.signature = "deadbeef"; // hex ama yanlış ve kısa (timingSafeEqual guard'ı)
  assert.equal(verifyCfRetrieveSignature(r), false);
});

test("verifyCfRetrieveSignature: secret tanımsızsa reddedilir", () => {
  const r = makeRetrieveResult();
  delete process.env.IYZICO_SECRET_KEY;
  try {
    assert.equal(verifyCfRetrieveSignature(r), false);
  } finally {
    process.env.IYZICO_SECRET_KEY = TEST_SECRET;
  }
});

test("verifyCfRetrieveSignature: BOM'lu secret env'i de doğrular (cleanEnv)", () => {
  // Prod'da 2 kez yaşanan BOM kazasının regresyon testi: env değeri başına
  // U+FEFF sızsa bile imza doğrulaması aynı kalmalı.
  process.env.IYZICO_SECRET_KEY = String.fromCharCode(0xfeff) + TEST_SECRET;
  try {
    assert.equal(verifyCfRetrieveSignature(makeRetrieveResult()), true);
  } finally {
    process.env.IYZICO_SECRET_KEY = TEST_SECRET;
  }
});

test("latin1Safe: iyzico CPP btoa güvenliği (Türkçe karakterler)", () => {
  // ş/ğ/ı Latin1 dışı → ASCII'ye çevrilir; ç/ö/ü Latin1 içinde → korunur.
  assert.equal(latin1Safe("cihan şenocak"), "cihan senocak");
  assert.equal(latin1Safe("Baskı Atölyesi"), "Baski Atölyesi");
  assert.equal(latin1Safe("İsimsiz / Untitled"), "Isimsiz / Untitled");
  assert.equal(latin1Safe("Ağaç Göğe Şükür"), "Agaç Göge Sükür");
  assert.equal(latin1Safe("çanta ödeme ünite"), "çanta ödeme ünite");
  // Sonuçta Latin1 dışı hiçbir karakter kalmamalı (btoa garantisi).
  const hard = latin1Safe("Ayşe 🎨 Ürgüp — İğne");
  for (const ch of hard) {
    assert.ok((ch.codePointAt(0) as number) <= 0xff, `Latin1 dışı kaldı: ${ch}`);
  }
});

test("hashCallbackToken: deterministik, girdi değişince çıktı değişir, ham token'ı içermez", () => {
  const h1 = hashCallbackToken("cf-token-abc");
  const h2 = hashCallbackToken("cf-token-abc");
  const h3 = hashCallbackToken("cf-token-DEĞİŞİK");
  assert.equal(h1, h2); // deterministik
  assert.notEqual(h1, h3); // girdi değişince çıktı değişir
  assert.match(h1, /^[0-9a-f]{64}$/); // sha256 hex, 64 karakter
  assert.equal(h1.includes("cf-token-abc"), false); // ham token sızmıyor
});

test("verifyCfInitSignature: doğru imza kabul, tahrifat reddedilir", () => {
  process.env.IYZICO_SECRET_KEY = TEST_SECRET;
  const r: CfInitializeResult = {
    status: "success",
    conversationId: "conv-uuid-1",
    token: "cf-token-abc",
  };
  r.signature = sign([r.conversationId, r.token]);
  assert.equal(verifyCfInitSignature(r), true);

  const tampered = { ...r, token: "cf-token-BAŞKA" };
  assert.equal(verifyCfInitSignature(tampered), false);
});
