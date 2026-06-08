/**
 * MAIAMARI.STUDIO — Tek kanonik slug üretimi.
 * ------------------------------------------------
 * Türkçe harfleri ASCII'ye indirger ve URL-güvenli bir slug üretir.
 * Önceden aynı mantığın üç ayrı (ve birbirinden sapmış) kopyası vardı:
 *   - lib/data.ts:slugify          (â/ä'yı da ele alıyordu)
 *   - app/admin/actions.ts:slugifyTr (â/ä'yı ele almıyordu)
 *   - lib/db/products.ts içi inline  (â/ä'yı ele almıyordu)
 * Kanonik sürüm en kapsamlı olanıdır (â/ä → a). Slug yalnız YENİ kayıt
 * oluşturulurken üretildiğinden mevcut/yayınlı URL'ler etkilenmez.
 */
export function slugify(input: string, fallback = ""): string {
  const s = input
    .toLocaleLowerCase("tr-TR")
    .replace(/â|ä/g, "a")
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ğ/g, "g")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || fallback;
}
