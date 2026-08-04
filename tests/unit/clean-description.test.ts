/**
 * Eser açıklamasından arşiv şablon CTA cümlesinin düşürülmesi — birim testleri.
 * Kaynak veriye DOKUNULMAZ; temizlik yalnız render katmanındadır.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanDescription } from "../../lib/gallery/clean-description";

test("sablon CTA cumlesini duser", () => {
  const input =
    "Kapılar serisinden bir linol baskı. Edisyon, boyut ve fiyat bilgisi için iletişime geçin.";
  assert.equal(cleanDescription(input), "Kapılar serisinden bir linol baskı.");
});

test("cumle sonundaki nokta olmasa da duser", () => {
  const input = "Metin. Edisyon, boyut ve fiyat bilgisi için iletişime geçin";
  assert.equal(cleanDescription(input), "Metin.");
});

test("bastaki ve sondaki bosluklari kirpar", () => {
  const input =
    "  Edisyon, boyut ve fiyat bilgisi için iletişime geçin. Asıl metin.  ";
  assert.equal(cleanDescription(input), "Asıl metin.");
});

test("sablon cumle yoksa metni aynen dondurur", () => {
  assert.equal(cleanDescription("Sade bir açıklama."), "Sade bir açıklama.");
});

test("bos metin bos doner", () => {
  assert.equal(cleanDescription(""), "");
});
