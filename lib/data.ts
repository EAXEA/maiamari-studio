/**
 * MAIAMARI.STUDIO — Local data layer
 * ---------------------------------
 * Şu an JSON dosyalarını okur (Faz 1).
 * İleride Supabase'e geçildiğinde sadece bu modül değişecek.
 */
import fs from "node:fs";
import path from "node:path";
import type {
  Product,
  Category,
  CategorySlug,
  ProductStatus,
  Business,
  Workshop,
  PortfolioWork,
  JournalPost,
  Series,
  SeriesSlug,
} from "./types";

// ----------------------------------------------------------------
// Yardımcılar
// ----------------------------------------------------------------
const DATA_ROOT = path.join(process.cwd(), "data");

function readJson<T>(file: string): T {
  const full = path.join(DATA_ROOT, file);
  return JSON.parse(fs.readFileSync(full, "utf-8")) as T;
}

function slugify(s: string): string {
  return s
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
}

// ----------------------------------------------------------------
// Kategoriler (statik tanım)
// ----------------------------------------------------------------
export const CATEGORIES: Category[] = [
  {
    slug: "linol-boyalari",
    name: "Linol Boyaları",
    nameEn: "Block Printing Inks",
    description: "Amber cam kavanozda, su bazlı linol baskı boyaları.",
  },
  {
    slug: "linolyum",
    name: "Linolyum Plaka",
    nameEn: "Linoleum Blocks",
    description: "A4 ve A5 ebatında, oyma için hazır linolyum plakalar.",
  },
  {
    slug: "merdaneler",
    name: "Merdaneler",
    nameEn: "Brayers",
    description: "1, 2 ve 3 cm kauçuk merdane seçenekleri.",
  },
  {
    slug: "el-yapimi-kagitlar",
    name: "El Yapımı Kâğıtlar",
    nameEn: "Handmade Papers",
    description:
      "Atölyemizde tek tek üretilen, doğal liflerden el yapımı kâğıtlar.",
  },
  {
    slug: "aletler",
    name: "Aletler",
    nameEn: "Tools",
    description: "Oyma bıçakları, kayıt pinleri ve yardımcı el aletleri.",
  },
  {
    slug: "cantalar",
    name: "Çantalar",
    nameEn: "Bags",
    description: "Atölye dokunuşlu, kanvas ve puffer kitap çantaları.",
  },
];

// ----------------------------------------------------------------
// Kategorileme — ürün adına göre
// ----------------------------------------------------------------
function classify(title: string): CategorySlug {
  const t = title.toLocaleLowerCase("tr-TR");
  if (t.includes("boyas") || t.includes("boyası") || t.includes("baskı boyas")) return "linol-boyalari";
  if (t.includes("linolyum")) return "linolyum";
  if (t.includes("merdane")) return "merdaneler";
  if (t.includes("kâğıt") || t.includes("kagit") || t.includes("kâğit")) return "el-yapimi-kagitlar";
  if (
    t.includes("bıça") || // bıçak, bıçağı
    t.includes("bica") ||
    t.includes("oyma") || // oyma bıçağı / oyma seti
    t.includes("essdee") ||
    t.includes("esdee") ||
    t.includes("pin") ||
    t.includes("kalem") ||
    t.includes("şerit") || // ayırma şeritleri
    t.includes("strip") // stripping tabs
  ) return "aletler";
  if (t.includes("çanta") || t.includes("canta")) return "cantalar";
  // Düşmeyen ürün için en yakın varsayılan: malzeme
  return "aletler";
}

function deriveStatus(statuses: string[]): ProductStatus {
  if (statuses.some((s) => /tükendi/i.test(s))) return "out_of_stock";
  if (statuses.some((s) => /son ürün/i.test(s))) return "low_stock";
  if (statuses.some((s) => /yeni/i.test(s))) return "new";
  if (statuses.some((s) => /indirim/i.test(s))) return "sale";
  return "in_stock";
}

// ----------------------------------------------------------------
// Ürün cache
// ----------------------------------------------------------------
let _productsCache: Product[] | null = null;

function loadProducts(): Product[] {
  if (_productsCache) return _productsCache;
  type Raw = {
    id: string;
    url: string;
    title: string;
    title_full?: string;
    description?: string;
    statuses: string[];
    priceTRY: number;
    compareAtTRY: number | null;
    coverImage?: string;
    gallery?: string[];
    localImages?: string[];
  };
  const raw = readJson<Raw[]>("products_full.json");
  const used = new Set<string>();

  const products: Product[] = raw.map((r) => {
    const fullTitle = (r.title_full || r.title).trim();
    const base = slugify(fullTitle);
    let slug = base;
    let i = 2;
    while (used.has(slug)) {
      slug = `${base}-${i++}`;
    }
    used.add(slug);

    // /data/images/shopier/<id>/img_NN.jpeg → /images/shopier/<id>/img_NN.jpeg (public dir)
    const localImgs = (r.localImages || []).map((p) =>
      "/" + p.replace(/^data\//, "")
    );
    const cover = localImgs[0] || "/images/placeholder.jpg";

    return {
      id: r.id,
      slug,
      title: fullTitle,
      description: r.description?.trim() || "",
      priceTRY: r.priceTRY,
      compareAtTRY: r.compareAtTRY,
      status: deriveStatus(r.statuses || []),
      statuses: r.statuses || [],
      categorySlug: classify(fullTitle),
      coverImage: cover,
      gallery: localImgs,
      sourceUrl: r.url,
    };
  });

  _productsCache = products;
  return products;
}

// ----------------------------------------------------------------
// Public API
// ----------------------------------------------------------------
export function getAllProducts(): Product[] {
  return loadProducts();
}

export function getProductsByCategory(slug: CategorySlug): Product[] {
  return loadProducts().filter((p) => p.categorySlug === slug);
}

export function getProductBySlug(slug: string): Product | null {
  return loadProducts().find((p) => p.slug === slug) || null;
}

export function getProductById(id: string): Product | null {
  return loadProducts().find((p) => p.id === id) || null;
}

export function getCategories(): Category[] {
  return CATEGORIES;
}

export function getCategoryBySlug(slug: string): Category | null {
  return CATEGORIES.find((c) => c.slug === slug) || null;
}

export function getBusiness(): Business {
  return readJson<Business>("business.json");
}

export function getWorkshops(): Workshop[] {
  const business = getBusiness();
  return (business.workshops || []).map((w, idx) => ({
    ...w,
    slug: slugify(w.title) || `workshop-${idx}`,
  }));
}

export function getPortfolio(): PortfolioWork[] {
  return readJson<PortfolioWork[]>("portfolio.json");
}

export function getSeries(): Series[] {
  return readJson<Series[]>("series.json");
}

export function getSeriesBySlug(slug: SeriesSlug): Series | null {
  return getSeries().find((s) => s.slug === slug) || null;
}

export function getPortfolioBySeries(slug: SeriesSlug): PortfolioWork[] {
  return getPortfolio().filter((w) => (w.series ?? "kapilar") === slug);
}

export function getJournalPosts(): JournalPost[] {
  return readJson<JournalPost[]>("journal.json").sort((a, b) =>
    b.date.localeCompare(a.date),
  );
}

export function getJournalPostBySlug(slug: string): JournalPost | null {
  return getJournalPosts().find((p) => p.slug === slug) || null;
}

export function formatTRY(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(amount);
}
