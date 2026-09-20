/**
 * E-posta gönderim kaydı — birim testleri.
 * Koşum: `npm run test:unit`. DB/ağ yok, saf fonksiyonlar.
 *
 * İki şeyi korur: (1) alıcı adresi panelde maskeli görünür, açık adres bu
 * tabloya ikinci kez yazılmaz; (2) bir gönderim düştüğünde sağlık kartı
 * "Dikkat"e döner, yoksa hata yine sessizce kaybolur.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { maskEmail } from "../../lib/db/email-events";
import { emailDeliveryVerdict } from "../../lib/health";

test("adres maskelenir: ilk harf + alan adı kalır", () => {
  assert.equal(maskEmail("fatmazehrauygun42@gmail.com"), "f***@gmail.com");
  assert.equal(maskEmail("a@b.co"), "a***@b.co");
});

test("artı etiketli ve noktalı adreslerde de yerel kısım sızmaz", () => {
  assert.equal(maskEmail("ad.soyad+etiket@maiamari.art"), "a***@maiamari.art");
});

test("bozuk veya boş girdi adres sızdırmaz", () => {
  assert.equal(maskEmail(""), "");
  assert.equal(maskEmail("   "), "");
  assert.equal(maskEmail("adres-degil"), "***");
  assert.equal(maskEmail("@alan.com"), "***");
  assert.equal(maskEmail("yerel@"), "***");
});

test("yapılandırma yoksa durum unconfigured", () => {
  const v = emailDeliveryVerdict({
    configured: false,
    total24h: 0,
    failed24h: 0,
    hasOlderRecords: false,
  });
  assert.equal(v.state, "unconfigured");
});

test("son 24 saatte tek bir düşen gönderim bile warn yapar", () => {
  const v = emailDeliveryVerdict({
    configured: true,
    total24h: 9,
    failed24h: 1,
    hasOlderRecords: true,
  });
  assert.equal(v.state, "warn");
  assert.match(v.detail, /1 gönderim düştü/);
});

test("hepsi başarılıysa ok ve sayı yazılır", () => {
  const v = emailDeliveryVerdict({
    configured: true,
    total24h: 3,
    failed24h: 0,
    hasOlderRecords: true,
  });
  assert.equal(v.state, "ok");
  assert.match(v.detail, /3 gönderim/);
});

test("hiç kayıt yoksa ok kalır; sessizlik hata sayılmaz", () => {
  const v = emailDeliveryVerdict({
    configured: true,
    total24h: 0,
    failed24h: 0,
    hasOlderRecords: false,
  });
  assert.equal(v.state, "ok");
  assert.match(v.detail, /Henüz kayıtlı gönderim yok/);
});
