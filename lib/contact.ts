/**
 * Client-safe iletişim sabitleri. `lib/data.ts` server-only (`node:fs`)
 * olduğundan client component'lerden import edilemez. Burada düz
 * string'ler tutulur — değiştiğinde tek noktadan güncellenir.
 */
export const PHONE_PRIMARY = "+90 506 588 92 77";
export const PHONE_PRIMARY_TEL = PHONE_PRIMARY.replace(/\s/g, "");
export const INSTAGRAM_URL = "https://www.instagram.com/maiamari.studio/";
export const INSTAGRAM_HANDLE = "maiamari.studio";
