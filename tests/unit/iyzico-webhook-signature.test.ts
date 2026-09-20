/**
 * iyzico webhook (HPP) imza doğrulaması — birim testleri.
 * Koşum: `npm run test:unit` (tsx --test; framework yok, node:test).
 * Ağ/DB yok; sentetik secret kullanılır, gerçek anahtar okunmaz.
 *
 * Resmî HPP formülü (docs.iyzico.com/ek-servisler/webhook):
 *   HMAC-SHA256(key=secretKey,
 *     data = secretKey + iyziEventType + iyziPaymentId + token
 *            + paymentConversationId + status) → hex
 * Mevcut CF retrieve imzasından FARKLI: ayraç yok, secretKey dizgenin başında.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  verifyWebhookSignature,
  diagnoseWebhookSignature,
  type IyzicoWebhookBody,
} from "../../lib/payment/iyzico";

const TEST_SECRET = "test-secret-key-0123456789";

function makeBody(): IyzicoWebhookBody {
  return {
    iyziEventType: "CHECKOUT_FORM_AUTH",
    iyziPaymentId: 4207393587,
    token: "cf-token-abc123",
    paymentConversationId: "conv-uuid-1",
    status: "SUCCESS",
  };
}

/** iyzico'nun yaptığı gibi ayraçsız, secretKey-önekli HMAC-SHA256 hex imza. */
function sign(b: IyzicoWebhookBody): string {
  const data =
    TEST_SECRET +
    String(b.iyziEventType ?? "") +
    String(b.iyziPaymentId ?? "") +
    String(b.token ?? "") +
    String(b.paymentConversationId ?? "") +
    String(b.status ?? "");
  return crypto
    .createHmac("sha256", TEST_SECRET)
    .update(data, "utf8")
    .digest("hex");
}

test("gecerli imza kabul edilir", () => {
  process.env.IYZICO_SECRET_KEY = TEST_SECRET;
  const b = makeBody();
  assert.equal(verifyWebhookSignature(sign(b), b), true);
});

test("buyuk harf hex imza kabul edilir", () => {
  // iyzico'nun 20.09'da gonderdigi ilk gercek webhook 401 aldi ve sebep
  // gorunmuyordu. Hex'te buyuk/kucuk harf ANLAMLI DEGIL; gonderen buyuk
  // harf yollarsa formul dogru olsa bile imza tutmazdi.
  process.env.IYZICO_SECRET_KEY = TEST_SECRET;
  const b = makeBody();
  assert.equal(verifyWebhookSignature(sign(b).toUpperCase(), b), true);
});

test("bastaki ve sondaki bosluk imzayi bozmaz", () => {
  process.env.IYZICO_SECRET_KEY = TEST_SECRET;
  const b = makeBody();
  assert.equal(verifyWebhookSignature(`  ${sign(b)}
`, b), true);
});

test("normalizasyon tahrifi gizlemez", () => {
  // Harf buyuklugu gevsetildi diye imzanin kendisi gevsemis olmamali.
  process.env.IYZICO_SECRET_KEY = TEST_SECRET;
  const b = makeBody();
  const bozuk = sign(b).slice(0, -1) + (sign(b).endsWith("a") ? "b" : "a");
  assert.equal(verifyWebhookSignature(bozuk.toUpperCase(), b), false);
});

test("her alanin tahrifi imzayi bozar", () => {
  process.env.IYZICO_SECRET_KEY = TEST_SECRET;
  const b = makeBody();
  const good = sign(b);
  const tampered: IyzicoWebhookBody[] = [
    { ...b, iyziEventType: "BKM_AUTH" },
    { ...b, iyziPaymentId: 4207393588 },
    { ...b, token: "cf-token-abc124" },
    { ...b, paymentConversationId: "conv-uuid-2" },
    { ...b, status: "FAILURE" },
  ];
  for (const t of tampered) {
    assert.equal(verifyWebhookSignature(good, t), false);
  }
});

test("eksik veya bos baslik reddedilir", () => {
  process.env.IYZICO_SECRET_KEY = TEST_SECRET;
  const b = makeBody();
  assert.equal(verifyWebhookSignature(null, b), false);
  assert.equal(verifyWebhookSignature(undefined, b), false);
  assert.equal(verifyWebhookSignature("", b), false);
});

test("farkli uzunluktaki imza patlamadan reddedilir", () => {
  process.env.IYZICO_SECRET_KEY = TEST_SECRET;
  const b = makeBody();
  assert.equal(verifyWebhookSignature("kisa", b), false);
  assert.equal(verifyWebhookSignature(sign(b) + "00", b), false);
});

test("secret yoksa reddedilir", () => {
  const b = makeBody();
  const good = sign(b);
  delete process.env.IYZICO_SECRET_KEY;
  assert.equal(verifyWebhookSignature(good, b), false);
  process.env.IYZICO_SECRET_KEY = TEST_SECRET;
});

test("eksik alanlar bos dizge sayilir, patlamaz", () => {
  process.env.IYZICO_SECRET_KEY = TEST_SECRET;
  const partial: IyzicoWebhookBody = { iyziEventType: "CHECKOUT_FORM_AUTH" };
  assert.equal(verifyWebhookSignature(sign(partial), partial), true);
});

test("teshis taramasi buyuk harf hex imzada dogru varyanti bulur", () => {
  // Normalizasyon verify tarafina eklenmis ama teshis tarafina eklenmemis
  // olsaydi, tarama dogru varyantta bile 'hicbiri-eslesmedi' der ve bizi
  // formulu degistirmeye ugrasirdi.
  process.env.IYZICO_SECRET_KEY = TEST_SECRET;
  const b = makeBody();
  assert.equal(diagnoseWebhookSignature(sign(b).toUpperCase(), b), "hpp-dokuman");
  assert.equal(diagnoseWebhookSignature(`  ${sign(b)} `, b), "hpp-dokuman");
});

test("teshis taramasi alakasiz imzada hicbiri-eslesmedi der", () => {
  process.env.IYZICO_SECRET_KEY = TEST_SECRET;
  const b = makeBody();
  assert.equal(diagnoseWebhookSignature("f".repeat(64), b), "hicbiri-eslesmedi");
  assert.equal(diagnoseWebhookSignature(null, b), "baslik-yok");
});
