/**
 * MAIAMARI.STUDIO — Veri katmanı
 * ---------------------------------
 * Ürünler: DATABASE_URL tanımlıysa Supabase'ten (async), değilse JSON'dan.
 * Galeri / seri / işletme / journal: hâlâ data/*.json (arşivden türetilir).
 * Bu modül server-only'dir (fs okur); client component'lere import edilmez.
 */
import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import { slugify } from "./slug";
import {
  dbGetAllProducts,
  dbGetProductsByCategory,
  dbGetProductBySlug,
  dbGetProductById,
  dbGetRelatedProducts,
  dbGetArtworksBySeries,
  dbGetArtworkBySlug,
  dbGetAllArtworks,
} from "./db/products";
import { dbGetCategories, dbGetCategoryBySlug } from "./db/categories";
import { dbGetSeries, dbGetSeriesBySlug } from "./db/series";
import { dbGetArtists, dbGetArtistBySlug } from "./db/artists";
import { dbGetJournalPosts } from "./db/journal";
import { dbGetWorkshops } from "./db/workshops";
import { WORKSHOP_IMAGES } from "./workshop-images";
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

/**
 * DB snapshot fallback (data/snapshot/*.json, `npm run db:snapshot` üretir).
 * Build'de DB bilinçli kapalı olduğundan (NEXT_PHASE skip) prerender bu
 * dosyalardan beslenir; legacy data/*.json yalnız snapshot yoksa devreye
 * girer. Dosya yoksa/bozuksa null → zincir legacy fallback'e düşer.
 */
function readSnapshot<T>(file: string): T | null {
  const full = path.join(DATA_ROOT, "snapshot", file);
  if (!fs.existsSync(full)) return null;
  try {
    return JSON.parse(fs.readFileSync(full, "utf-8")) as T;
  } catch {
    return null;
  }
}

/**
 * İçerik okuması için DB timeout'u. Soğuk/çapraz-bölge bir bağlantı kurulumu
 * fonksiyon süresini (Vercel ~10s) aşıp 504 (FUNCTION_INVOCATION_TIMEOUT)
 * üretebiliyor; `readDb` yalnız HATA yakalar, ASILMAYI değil. Asılı sorguyu
 * burada keserek `readDb` aşağıdaki JSON/snapshot fallback zincirine düşürür
 * (504 yerine 200, bayat olsa da içerik gelir). Warm + co-located fra1'de
 * sorgular <100ms olduğundan bu eşik normalde hiç tetiklenmez.
 */
const CONTENT_DB_TIMEOUT_MS = 4000;

function withDbTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`db-read-timeout >${ms}ms`)), ms);
  });
  return Promise.race([p, timeout]).finally(() => clearTimeout(timer));
}

/**
 * İçerik okuma fallback'i. Bir DB okuması bağlantı/sorgu hatasıyla `throw`
 * ederse VEYA timeout'a uğrarsa, hatayı YUTMADAN loglar ve "DB yok"
 * sentinel'ini (`absent`) döndürür; böylece aşağıdaki getter'lar mevcut
 * snapshot/JSON fallback zincirine düşer ve sayfa 500/504 yerine son iyi
 * içerikle açılır.
 *
 * Sözleşme korunur: `absent` = listelerde `null`, tekil getter'larda `undefined`
 * (DB erişilebilir ama satır yoksa getter normal `null` döndürmeye devam eder →
 * `notFound()` bozulmaz; yalnız GERÇEK hata fallback'i tetikler).
 *
 * Kapsam YALNIZ içerik okumalarıdır: yazma / sipariş / ödeme / auth bu yoldan
 * geçmediğinden onların hata-fırlatma davranışı aynen korunur.
 *
 * Sabit prefix `[content-fallback]` Vercel loglarında filtrelenebilir.
 */
async function readDb<T>(
  label: string,
  run: () => Promise<T>,
  absent: T,
): Promise<T> {
  try {
    return await withDbTimeout(run(), CONTENT_DB_TIMEOUT_MS);
  } catch (err) {
    console.error("[content-fallback]", label, err);
    return absent;
  }
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

/** Ürün fallback'i: DB snapshot'ı varsa o, yoksa legacy Shopier arşivi. */
function fallbackProducts(): Product[] {
  return readSnapshot<Product[]>("products.json") ?? loadProducts();
}

// ----------------------------------------------------------------
// Public API
// ----------------------------------------------------------------
// NOT: Getter'lar React `cache()` ile sarılı — tek render/istek geçişinde aynı
// sorgu/fs-okuması tekilleşir (örn. urun sayfasında getAllProducts 3-4 kez
// çağrılıyordu). cache yalnız o render boyunca geçerlidir; ISR/SSG semantiğini
// değiştirmez, fallback davranışı aynen korunur.
export const getAllProducts = cache(async (): Promise<Product[]> => {
  const fromDb = await readDb("getAllProducts", dbGetAllProducts, null);
  return fromDb ?? fallbackProducts();
});

export const getProductsByCategory = cache(
  async (slug: CategorySlug): Promise<Product[]> => {
    const fromDb = await readDb(
      "getProductsByCategory",
      () => dbGetProductsByCategory(slug),
      null,
    );
    return fromDb ?? fallbackProducts().filter((p) => p.categorySlug === slug);
  },
);

export const getProductBySlug = cache(
  async (slug: string): Promise<Product | null> => {
    const fromDb = await readDb(
      "getProductBySlug",
      () => dbGetProductBySlug(slug),
      undefined,
    );
    // undefined = DB yok → JSON fallback; null = DB'de bulunamadı
    if (fromDb !== undefined) return fromDb;
    return fallbackProducts().find((p) => p.slug === slug) || null;
  },
);

/** Aynı kategoriden ilgili ürünler — ürün detayındaki "Aynı koleksiyondan". */
export const getRelatedProducts = cache(
  async (
    categorySlug: CategorySlug,
    excludeId: string,
    limit = 4,
  ): Promise<Product[]> => {
    const fromDb = await readDb(
      "getRelatedProducts",
      () => dbGetRelatedProducts(categorySlug, excludeId, limit),
      null,
    );
    if (fromDb) return fromDb;
    return fallbackProducts()
      .filter((p) => p.categorySlug === categorySlug && p.id !== excludeId)
      .slice(0, limit);
  },
);

export const getProductById = cache(
  async (id: string): Promise<Product | null> => {
    const fromDb = await readDb(
      "getProductById",
      () => dbGetProductById(id),
      undefined,
    );
    if (fromDb !== undefined) return fromDb;
    return fallbackProducts().find((p) => p.id === id) || null;
  },
);

export const getCategories = cache(async (): Promise<Category[]> => {
  const fromDb = await readDb("getCategories", dbGetCategories, null);
  return fromDb ?? readSnapshot<Category[]>("categories.json") ?? CATEGORIES;
});

export const getCategoryBySlug = cache(
  async (slug: string): Promise<Category | null> => {
    const fromDb = await readDb(
      "getCategoryBySlug",
      () => dbGetCategoryBySlug(slug),
      undefined,
    );
    // undefined = DB yok → snapshot/statik fallback; null = DB'de bulunamadı
    if (fromDb !== undefined) return fromDb;
    const all = readSnapshot<Category[]>("categories.json") ?? CATEGORIES;
    return all.find((c) => c.slug === slug) || null;
  },
);

export const getBusiness = cache((): Business => {
  return readJson<Business>("business.json");
});

export const getWorkshops = cache(async (): Promise<Workshop[]> => {
  // DB varsa ondan (boş tablo = [] döner, fallback'e DÜŞMEZ); DB yoksa
  // (build / DATABASE_URL tanımsız → null) önce DB snapshot'ı, o da yoksa
  // business.json fallback. Yalnız business fallback'inde görsel kod-içi
  // WORKSHOP_IMAGES haritasından enjekte edilir (snapshot görseli DB'den taşır).
  const fromDb = await readDb("getWorkshops", dbGetWorkshops, null);
  if (fromDb) return fromDb;
  const snap = readSnapshot<Workshop[]>("workshops.json");
  if (snap) return snap;
  const business = getBusiness();
  return (business.workshops || []).map((w, idx) => {
    const slug = slugify(w.title) || `workshop-${idx}`;
    const img = WORKSHOP_IMAGES[slug];
    return { ...w, slug, image: w.image ?? img?.src, imageAlt: img?.alt };
  });
});

export const getPortfolio = cache((): PortfolioWork[] => {
  return (
    readSnapshot<PortfolioWork[]>("portfolio.json") ??
    readJson<PortfolioWork[]>("portfolio.json")
  );
});

export const getSeries = cache(async (): Promise<Series[]> => {
  const fromDb = await readDb("getSeries", dbGetSeries, null);
  return (
    fromDb ??
    readSnapshot<Series[]>("series.json") ??
    readJson<Series[]>("series.json")
  );
});

export const getSeriesBySlug = cache(
  async (slug: string): Promise<Series | null> => {
    const fromDb = await readDb(
      "getSeriesBySlug",
      () => dbGetSeriesBySlug(slug),
      undefined,
    );
    if (fromDb !== undefined) return fromDb;
    const all =
      readSnapshot<Series[]>("series.json") ?? readJson<Series[]>("series.json");
    return all.find((s) => s.slug === slug) || null;
  },
);

// ----------------------------------------------------------------
// Sanatçılar (çok sanatçılı galeri; DB + business.json fallback)
// ----------------------------------------------------------------
export const getArtists = cache(async (): Promise<Artist[]> => {
  const fromDb = await readDb("getArtists", dbGetArtists, null);
  if (fromDb) return fromDb;
  const snap = readSnapshot<Artist[]>("artists.json");
  if (snap) return snap;
  const biz = readJson<Business>("business.json");
  return biz.artist ? [{ ...biz.artist, slug: "duygu-sinan" }] : [];
});

export const getArtistBySlug = cache(
  async (slug: string): Promise<Artist | null> => {
    const fromDb = await readDb(
      "getArtistBySlug",
      () => dbGetArtistBySlug(slug),
      undefined,
    );
    if (fromDb !== undefined) return fromDb;
    const all = await getArtists();
    return all.find((a) => a.slug === slug) || null;
  },
);

/** Bir sanatçının tüm eserleri (galeri sanatçı sayfası için). */
export const getPortfolioByArtist = cache(
  async (artistSlug: string): Promise<PortfolioWork[]> => {
    const allSeries = await getSeries();
    const mine = allSeries.filter(
      (s) => (s.artistSlug ?? "duygu-sinan") === artistSlug,
    );
    const arrays = await Promise.all(
      mine.map((s) => getPortfolioBySeries(s.slug as SeriesSlug)),
    );
    return arrays.flat();
  },
);

export const getPortfolioBySeries = cache(
  async (slug: SeriesSlug): Promise<PortfolioWork[]> => {
    // Eserler DB'ye taşındı: DB bu seri için kayıt döndürüyorsa o esastır
    // (çift gösterimi önler). DB yok/boşsa data/portfolio.json'a düşer.
    const fromDb = await readDb(
      "getPortfolioBySeries",
      () => dbGetArtworksBySeries(slug),
      null,
    );
    if (fromDb && fromDb.length) return fromDb;
    return getPortfolio().filter((w) => (w.series ?? "kapilar") === slug);
  },
);

/** Tek eser, slug ile (eser detay sayfası). DB yoksa portfolio.json'a düşer. */
export const getArtworkBySlug = cache(
  async (slug: string): Promise<PortfolioWork | null> => {
    const fromDb = await readDb(
      "getArtworkBySlug",
      () => dbGetArtworkBySlug(slug),
      undefined,
    );
    // undefined = DB yok → JSON fallback; null = DB'de bulunamadı
    if (fromDb !== undefined) return fromDb;
    return getPortfolio().find((w) => w.slug === slug) || null;
  },
);

/** Yayındaki tüm eserler (statik parametreler + sitemap). */
export const getAllArtworks = cache(async (): Promise<PortfolioWork[]> => {
  const fromDb = await readDb("getAllArtworks", dbGetAllArtworks, null);
  return fromDb ?? getPortfolio();
});

export const getJournalPosts = cache(async (): Promise<JournalPost[]> => {
  // DB varsa ondan (boş tablo = [] döner, fallback'e DÜŞMEZ); DB yoksa
  // (build / DATABASE_URL tanımsız → null) snapshot → JSON fallback. `??` ile
  // null ve boş-dizi ayrımı net: null = DB yok, [] = DB var ama kayıt yok.
  return (
    (await readDb("getJournalPosts", dbGetJournalPosts, null)) ??
    readSnapshot<JournalPost[]>("journal.json") ??
    readJson<JournalPost[]>("journal.json").sort((a, b) =>
      b.date.localeCompare(a.date),
    )
  );
});

export const getJournalPostBySlug = cache(
  async (slug: string): Promise<JournalPost | null> => {
    const all = await getJournalPosts();
    return all.find((p) => p.slug === slug) || null;
  },
);

