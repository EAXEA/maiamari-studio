/**
 * Ürün <head> meta description üretimi.
 *
 * Neden: ham `description` ürün sayfasında doğru metin ama arama sonucu için
 * yanlış giriş yapıyor. Çoğu tedarikçi diliyle ("100 cc, amber cam kavanozda")
 * başlıyor; ürünün kim tarafından, hangi iş için alındığını söylemiyor. Burada
 * başlık + kategori bağlam cümlesi + açıklama kırpması ile arama sonucunda
 * okunan ilk satır ürünün kullanım bağlamını taşır. Başlık her üründe benzersiz
 * olduğundan üretilen meta da benzersizdir.
 *
 * Kapsam: yalnızca <head>. Sayfada görünen kopya bu modülden etkilenmez.
 */
import type { CategorySlug, Product } from "../types";

/** Google sonuçlarda ~155-160 karakterden sonrasını kırpar. */
export const META_MAX = 160;

/**
 * Kategori başına, ürünün hangi iş için alındığını anlatan tek cümle.
 * Güzel sanatlar öğrencisi / atölye katılımcısı arama niyetini doğal dille
 * karşılar — anahtar kelime yığmak değil, ürünün gerçek kullanım bağlamı.
 */
const CATEGORY_CLAUSE: Record<CategorySlug, string> = {
  "linol-boyalari":
    "Güzel sanatlar öğrencileri ve baskı atölyeleri için amber cam kavanozda su bazlı linol baskı boyası",
  linolyum:
    "Güzel sanatlar bölümü oyma ve yüksek baskı derslerinde kullanılan, oymaya hazır linolyum plaka",
  merdaneler:
    "Linol ve yüksek baskıda boyayı plakaya eşit dağıtan kauçuk merdane; güzel sanatlar atölyeleri için",
  "el-yapimi-kagitlar":
    "Baskı ve resim derslerinde kullanılan, doğal liflerden el yapımı kâğıt; güzel sanatlar öğrencilerine uygun",
  aletler:
    "Linol oyma ve baskı atölyesi el aleti; güzel sanatlar öğrencilerinin günlük pratiğine göre seçilmiş",
  cantalar: "Maiamari atölyesinde elden tasarlanıp dikilen kitap çantası",
};

const FALLBACK_CLAUSE = "Maiamari baskı atölyesinden malzeme";

/** Satır sonlarını ve tekrar eden boşlukları tek boşluğa indirger. */
function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/**
 * `limit` karakteri aşan metni kelime sınırından kırpar ve sonuna "…" koyar.
 * Sığıyorsa metin olduğu gibi döner.
 */
function truncateAtWord(text: string, limit: number): string {
  if (text.length <= limit) return text;
  // "…" için bir karakter ayır.
  const kesit = text.slice(0, limit - 1);
  const sonBosluk = kesit.lastIndexOf(" ");
  const govde = sonBosluk > 0 ? kesit.slice(0, sonBosluk) : kesit;
  return `${govde.replace(/[.,;:·\-–—]+$/, "").trimEnd()}…`;
}

/**
 * Ürün için benzersiz meta description üretir.
 *
 * Biçim: "<Başlık>. <kategori cümlesi>. <ham açıklama>" → META_MAX'e kırpılır.
 * Başlık her ürün için benzersiz olduğundan sonuç da benzersizdir.
 * Em-dash kullanılmaz (atölyenin editorial kuralı; meta arama sonucunda
 * kullanıcıya görünür metindir).
 */
export function productMetaDescription(product: Product): string {
  const baslik = normalize(product.title);
  const clause =
    CATEGORY_CLAUSE[product.categorySlug as CategorySlug] ?? FALLBACK_CLAUSE;
  const aciklama = normalize(product.description);

  const parcalar = [`${baslik}. ${clause}.`];
  if (aciklama) parcalar.push(aciklama);

  return truncateAtWord(normalize(parcalar.join(" ")), META_MAX);
}
