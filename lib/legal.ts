/**
 * Yasal sayfalar için tek kaynak satıcı bilgisi (client-safe sabitler;
 * lib/contact.ts kalıbı). Bu bilgiler 6502 sayılı Kanun gereği kamuya açık
 * olarak sitede gösterilir, gizli değildir.
 *
 * Satıcı tipi: ŞAHIS İŞLETMESİ (yasal satıcı gerçek kişidir).
 *    `legalName` TAM YASAL İSİMDİR ve yalnız yasal sayfalardaki satıcı / veri
 *    sorumlusu alanında kullanılır. Sitedeki marka/sanatçı adı "Duygu Sinan"
 *    olarak ayrı kalır (feedback_duygu_sinan_yazim yalnız site metinleri için).
 */
export const SELLER = {
  legalName: "Fatma Duygu Sinan Şenocak",
  tradeName: "Maiamari Baskı Atölyesi",
  formType: "Şahıs işletmesi",
  address: "Küçükesat, Bülbülderesi Cd. No:90 D:B, 06660 Çankaya / Ankara",
  phone: "+90 506 588 92 77",
  phoneHref: "tel:+905065889277",
  email: "info@maiamari.art",
  website: "www.maiamari.art",
  taxOffice: "Cumhuriyet Vergi Dairesi",
  taxNumber: "7700294792",
} as const;

export const LEGAL_UPDATED = "20 Temmuz 2026";

/** Cayma hakkı süresi (gün) ve bedel iadesi süresi (gün), yasal standart. */
export const WITHDRAWAL_DAYS = 14;
export const REFUND_DAYS = 14;
