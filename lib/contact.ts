/**
 * Client-safe iletişim sabitleri. `lib/data.ts` server-only (`node:fs`)
 * olduğundan client component'lerden import edilemez. Burada düz
 * string'ler tutulur — değiştiğinde tek noktadan güncellenir.
 */
export const PHONE_PRIMARY = "+90 506 588 92 77";
export const PHONE_PRIMARY_TEL = PHONE_PRIMARY.replace(/\s/g, "");
export const EMAIL = "info@maiamari.art";
export const EMAIL_MAILTO = `mailto:${EMAIL}`;
export const INSTAGRAM_URL = "https://www.instagram.com/maiamari.studio/";
export const INSTAGRAM_HANDLE = "maiamari.studio";
// WhatsApp: aynı numara, wa.me formatı (uluslararası prefix + boşluksuz, "+" olmadan)
export const WHATSAPP_NUMBER = PHONE_PRIMARY_TEL.replace(/^\+/, "");
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;
