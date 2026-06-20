/**
 * MAIAMARI.STUDIO - Env degeri temizleme (server-only)
 * ----------------------------------------------------
 * Vercel paneline / PowerShell uzerinden yapistirilan env degerlerinin basina
 * UTF-8 BOM (U+FEFF) veya gorunmez zero-width / satir sonu karakterleri
 * sizabilir. Bunlar bir HTTP header'a yazilirken (or. Supabase Storage'in
 * Authorization: Bearer <key> / apikey basliklari) su hatayi verir:
 *
 *   "Cannot convert argument to a ByteString because the character at index 0
 *    has a value of 65279 which is greater than 255"
 *
 * (65279 = 0xFEFF = BOM). Header degeri yalniz byte <= 255 kabul eder; gorunmez
 * BOM bu siniri asar. Burada BOM/zero-width karakterleri ve bas/son bosluklari
 * temizleyip degeri normalize ediyoruz. Secret'in gorunur icerigini degistirmez.
 */

/** Gorunmez/sifir-genislikli karakter mi (BOM dahil). */
function isInvisible(codePoint: number): boolean {
  return (
    codePoint === 0xfeff || // BOM / zero-width no-break space
    (codePoint >= 0x200b && codePoint <= 0x200d) // zero-width space/non-joiner/joiner
  );
}

/** Bir env degiskenini BOM/zero-width/whitespace'ten arindirip doner. */
export function cleanEnv(name: string): string | undefined {
  const raw = process.env[name];
  if (raw == null) return undefined;
  let out = "";
  for (const ch of raw) {
    if (!isInvisible(ch.codePointAt(0) as number)) out += ch;
  }
  const cleaned = out.trim();
  return cleaned.length ? cleaned : undefined;
}
