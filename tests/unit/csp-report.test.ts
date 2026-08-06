/**
 * CSP ihlal raporu ayrıştırma + gürültü filtresi — birim testleri.
 * Koşum: `npm run test:unit` (tsx --test; node:test). HTTP'ye dokunmaz:
 * yalnız lib/security/csp-report.ts'in saf fonksiyonları.
 *
 * Doğrulanan kurallar:
 * - İki gövde biçimi de ayrıştırılır (eski report-uri, yeni Reporting API)
 * - Bozuk/tanınmayan gövde THROW ETMEZ, boş dizi döner (uç herkese açıktır)
 * - Tarayıcı eklentisi kaynaklı ihlaller gürültü sayılır
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseCspReport,
  isExtensionNoise,
  formatViolation,
  type CspViolation,
} from "../../lib/security/csp-report";

/** Eski biçim: Content-Type: application/csp-report, tek "csp-report" nesnesi. */
const LEGACY_BODY = JSON.stringify({
  "csp-report": {
    "document-uri": "https://www.maiamari.art/checkout",
    "violated-directive": "script-src",
    "effective-directive": "script-src",
    "blocked-uri": "https://evil.example.com/x.js",
    "original-policy": "default-src 'self'",
    disposition: "report",
  },
});

/** Yeni biçim: Content-Type: application/reports+json, rapor DİZİSİ. */
const MODERN_BODY = JSON.stringify([
  {
    type: "csp-violation",
    url: "https://www.maiamari.art/",
    body: {
      documentURL: "https://www.maiamari.art/",
      effectiveDirective: "img-src",
      blockedURL: "https://cdn.example.com/a.png",
      disposition: "report",
    },
  },
]);

test("parseCspReport: eski report-uri biçimini ayrıştırır", () => {
  const out = parseCspReport("application/csp-report", LEGACY_BODY);
  assert.equal(out.length, 1);
  assert.equal(out[0].directive, "script-src");
  assert.equal(out[0].blockedUri, "https://evil.example.com/x.js");
  assert.equal(out[0].documentUri, "https://www.maiamari.art/checkout");
});

test("parseCspReport: yeni Reporting API biçimini ayrıştırır", () => {
  const out = parseCspReport("application/reports+json", MODERN_BODY);
  assert.equal(out.length, 1);
  assert.equal(out[0].directive, "img-src");
  assert.equal(out[0].blockedUri, "https://cdn.example.com/a.png");
});

test("parseCspReport: Reporting API gövdesinde csp-violation olmayan raporlar atlanır", () => {
  // Aynı uca deprecation/intervention raporları da düşebilir; bunlar CSP değil.
  const body = JSON.stringify([
    { type: "deprecation", url: "https://www.maiamari.art/", body: { id: "x" } },
    JSON.parse(MODERN_BODY)[0],
  ]);
  const out = parseCspReport("application/reports+json", body);
  assert.equal(out.length, 1);
  assert.equal(out[0].directive, "img-src");
});

test("parseCspReport: bozuk JSON'da THROW ETMEZ, boş dizi döner", () => {
  // Uç herkese açık; gövde tamamen saldırgan kontrolünde. Exception fırlatmak
  // 500 üretir ve logu kirletir.
  const out = parseCspReport("application/csp-report", "{bozuk json");
  assert.deepEqual(out, []);
});

test("parseCspReport: tanınmayan content-type boş dizi döner", () => {
  const out = parseCspReport("text/plain", LEGACY_BODY);
  assert.deepEqual(out, []);
});

test("parseCspReport: content-type parametreli olsa da tanınır (charset eki)", () => {
  const out = parseCspReport("application/csp-report; charset=utf-8", LEGACY_BODY);
  assert.equal(out.length, 1);
});

test("parseCspReport: beklenen alanlar eksikse o rapor atlanır", () => {
  const out = parseCspReport("application/csp-report", JSON.stringify({ "csp-report": {} }));
  assert.deepEqual(out, []);
});

test("isExtensionNoise: tarayıcı eklentisi kaynaklı ihlaller gürültüdür", () => {
  const şemalar = ["chrome-extension", "moz-extension", "safari-web-extension"];
  for (const ş of şemalar) {
    const v: CspViolation = {
      directive: "script-src",
      blockedUri: `${ş}://abcdef/inject.js`,
      documentUri: "https://www.maiamari.art/",
    };
    assert.equal(isExtensionNoise(v), true, `${ş} gürültü sayılmalı`);
  }
});

test("isExtensionNoise: kendi kodumuzdan gelen ihlal gürültü DEĞİLDİR", () => {
  const v: CspViolation = {
    directive: "script-src",
    blockedUri: "https://cdn.example.com/x.js",
    documentUri: "https://www.maiamari.art/",
  };
  assert.equal(isExtensionNoise(v), false);
});

test("isExtensionNoise: inline/eval gibi şemasız değerler gürültü DEĞİLDİR", () => {
  // "inline" bizim kendi sayfamızın ihlalidir — enforce'a geçerken en çok
  // önemsediğimiz sinyal budur, filtrelenmemeli.
  const v: CspViolation = {
    directive: "style-src",
    blockedUri: "inline",
    documentUri: "https://www.maiamari.art/",
  };
  assert.equal(isExtensionNoise(v), false);
});

test("formatViolation: tek satır, [csp] önekli, alanları içerir", () => {
  const line = formatViolation({
    directive: "script-src",
    blockedUri: "https://evil.example.com/x.js",
    documentUri: "https://www.maiamari.art/checkout",
  });
  assert.ok(line.startsWith("[csp] "), "log satırı [csp] ile başlamalı");
  assert.ok(!line.includes("\n"), "log satırı tek satır olmalı");
  assert.ok(line.includes("script-src"));
  assert.ok(line.includes("https://evil.example.com/x.js"));
  assert.ok(line.includes("/checkout"));
});
