/**
 * MAIAMARI.STUDIO — Veri katmanı
 * ---------------------------------
 * Ürünler: DATABASE_URL tanımlıysa Supabase'ten (async), değilse JSON'dan.
 * Galeri / seri / işletme / journal: hâlâ data/*.json (arşivden türetilir).
 * Bu modül server-only'dir (fs okur); client component'lere import edilmez.
 */
import fs from "node:fs";
import path from "node:path";
import {
  dbGetAllProducts,
  dbGetProductsByCategory,
  dbGetProductBySlug,
  dbGetProductById,
  dbGetArtworksBySeries,
} from "./db/products";
import { dbGetCategories, dbGetCategoryBySlug } from "./db/categories";
import { dbGetSeries, dbGetSeriesBySlug } from "./db/series";
import { dbGetArtists, dbGetArtistBySlug } from "./db/artists";
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
  Artist,
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
      "Doğal liflerden el yapımı kâğıtlar. Bir kısmı atölyenin kendi üretimi, bir kısmı özenle seçilen tedariktir.",
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
    description:
      "Duygu Sinan'ın elden tasarlayıp diktiği kanvas ve puffer kitap çantaları. Kumaş ve baskılar dışarıdan tedarik edilir; tasarım ve dikim sanatçıya aittir. Hediyelik olarak önerilir.",
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
export async function getAllProducts(): Promise<Product[]> {
  const fromDb = await dbGetAllProducts();
  return fromDb ?? loadProducts();
}

export async function getProductsByCategory(
  slug: CategorySlug,
): Promise<Product[]> {
  const fromDb = await dbGetProductsByCategory(slug);
  return fromDb ?? loadProducts().filter((p) => p.categorySlug === slug);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const fromDb = await dbGetProductBySlug(slug);
  // undefined = DB yok → JSON fallback; null = DB'de bulunamadı
  if (fromDb !== undefined) return fromDb;
  return loadProducts().find((p) => p.slug === slug) || null;
}

export async function getProductById(id: string): Promise<Product | null> {
  const fromDb = await dbGetProductById(id);
  if (fromDb !== undefined) return fromDb;
  return loadProducts().find((p) => p.id === id) || null;
}

export async function getCategories(): Promise<Category[]> {
  const fromDb = await dbGetCategories();
  return fromDb ?? CATEGORIES;
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const fromDb = await dbGetCategoryBySlug(slug);
  // undefined = DB yok → statik fallback; null = DB'de bulunamadı
  if (fromDb !== undefined) return fromDb;
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

export async function getSeries(): Promise<Series[]> {
  const fromDb = await dbGetSeries();
  return fromDb ?? readJson<Series[]>("series.json");
}

export async function getSeriesBySlug(slug: string): Promise<Series | null> {
  const fromDb = await dbGetSeriesBySlug(slug);
  if (fromDb !== undefined) return fromDb;
  return readJson<Series[]>("series.json").find((s) => s.slug === slug) || null;
}

// ----------------------------------------------------------------
// Sanatçılar (çok sanatçılı galeri; DB + business.json fallback)
// ----------------------------------------------------------------
export async function getArtists(): Promise<Artist[]> {
  const fromDb = await dbGetArtists();
  if (fromDb) return fromDb;
  const biz = readJson<Business>("business.json");
  return biz.artist ? [{ ...biz.artist, slug: "duygu-sinan" }] : [];
}

export async function getArtistBySlug(slug: string): Promise<Artist | null> {
  const fromDb = await dbGetArtistBySlug(slug);
  if (fromDb !== undefined) return fromDb;
  const all = await getArtists();
  return all.find((a) => a.slug === slug) || null;
}

/** Bir sanatçının tüm eserleri (galeri sanatçı sayfası için). */
export async function getPortfolioByArtist(
  artistSlug: string,
): Promise<PortfolioWork[]> {
  const allSeries = await getSeries();
  const mine = allSeries.filter(
    (s) => (s.artistSlug ?? "duygu-sinan") === artistSlug,
  );
  const arrays = await Promise.all(
    mine.map((s) => getPortfolioBySeries(s.slug as SeriesSlug)),
  );
  return arrays.flat();
}

export async function getPortfolioBySeries(
  slug: SeriesSlug,
): Promise<PortfolioWork[]> {
  // Eserler DB'ye taşındı: DB bu seri için kayıt döndürüyorsa o esastır
  // (çift gösterimi önler). DB yok/boşsa data/portfolio.json'a düşer.
  const fromDb = await dbGetArtworksBySeries(slug);
  if (fromDb && fromDb.length) return fromDb;
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

