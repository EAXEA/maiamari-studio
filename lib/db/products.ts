/**
 * MAIAMARI.STUDIO — Ürün veri erişimi (DB)
 * -----------------------------------------
 * DB'den okuyup public `Product` tipine map'ler. DB yoksa fonksiyonlar
 * `null` döner ve lib/data.ts JSON fallback'e geçer.
 */
import { eq, asc, and, ne } from "drizzle-orm";
import { getDb } from "./client";
import { slugify } from "@/lib/slug";
import { products as T, type ProductRow, type NewProductRow } from "./schema";
import type {
  Product,
  ProductStatus,
  CategorySlug,
  PortfolioWork,
  SeriesSlug,
} from "@/lib/types";

/** Panel statüsünden vitrinde gösterilecek rozet etiketleri üret. */
function deriveBadges(row: ProductRow): string[] {
  const price = Number(row.priceTry);
  const compareAt = row.compareAtTry == null ? null : Number(row.compareAtTry);
  const badges: string[] = [];
  if (row.status === "out_of_stock") badges.push("Tükendi");
  else if (row.status === "low_stock") badges.push("Son ürün");
  if (row.status === "new") badges.push("Yeni");
  if (row.status === "sale" || (compareAt !== null && compareAt > price))
    badges.push("İndirim");
  return badges;
}

function toProduct(row: ProductRow): Product {
  // numeric kolonlar Drizzle'da string döner; sayıya çevir.
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    priceTRY: Number(row.priceTry),
    compareAtTRY: row.compareAtTry == null ? null : Number(row.compareAtTry),
    status: row.status as ProductStatus,
    statuses: deriveBadges(row),
    categorySlug: row.categorySlug as CategorySlug,
    coverImage: row.coverImage || "/images/placeholder.jpg",
    gallery: row.gallery ?? [],
    sourceUrl: row.sourceUrl,
  };
}

/** Eser satırını galeri için PortfolioWork'e map'ler. */
function toPortfolioWork(row: ProductRow): PortfolioWork {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    image: row.coverImage || "/images/placeholder.jpg",
    width: row.imageWidth ?? undefined,
    height: row.imageHeight ?? undefined,
    year: row.year ?? undefined,
    series: (row.seriesSlug as SeriesSlug) ?? undefined,
    technique: row.technique ?? undefined,
    paper: row.paper ?? undefined,
    dimensions: row.dimensions ?? undefined,
    editionSize: row.editionSize ?? undefined,
    printCount: row.printCount ?? row.editionSize ?? undefined,
    firstSerial: row.firstSerial ?? undefined,
    artist: row.artist ?? undefined,
    // Satış alanları — galeride iyzico öncesi fiyat gösterimi için (numeric→number).
    forSale: row.forSale,
    priceTRY: row.priceTry != null ? Number(row.priceTry) : undefined,
    compareAtTRY: row.compareAtTry != null ? Number(row.compareAtTry) : null,
  };
}

// ---------------------------------------------------------------
// Okuma — vitrin (yayında + satışa açık + mağaza ürünü)
// Not: kind="material" filtresi eserleri (kind="artwork") iyzico'ya kadar
// mağazadan tamamen dışarıda tutar — eser "Satılık" işaretli olsa bile.
// iyzico canlıya alınınca bu kind filtresi gevşetilip satılık eserler
// mağazaya dahil edilir. forSale ayrıca taslak/satış-dışı ürünleri eler.
// ---------------------------------------------------------------
export async function dbGetAllProducts(): Promise<Product[] | null> {
  const db = getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(T)
    .where(
      and(eq(T.isPublished, true), eq(T.forSale, true), eq(T.kind, "material")),
    )
    .orderBy(asc(T.sortOrder), asc(T.title));
  return rows.map(toProduct);
}

export async function dbGetProductsByCategory(
  slug: CategorySlug,
): Promise<Product[] | null> {
  const db = getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(T)
    .where(
      and(
        eq(T.isPublished, true),
        eq(T.forSale, true),
        eq(T.kind, "material"),
        eq(T.categorySlug, slug),
      ),
    )
    .orderBy(asc(T.sortOrder), asc(T.title));
  return rows.map(toProduct);
}

// ---------------------------------------------------------------
// Okuma — galeri (kind="artwork", yayında)
// ---------------------------------------------------------------
export async function dbGetArtworksBySeries(
  seriesSlug: string,
): Promise<PortfolioWork[] | null> {
  const db = getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(T)
    .where(
      and(
        eq(T.kind, "artwork"),
        eq(T.isPublished, true),
        eq(T.seriesSlug, seriesSlug),
      ),
    )
    .orderBy(asc(T.sortOrder), asc(T.title));
  return rows.map(toPortfolioWork);
}

export async function dbGetProductBySlug(
  slug: string,
): Promise<Product | null | undefined> {
  const db = getDb();
  if (!db) return undefined; // undefined = DB yok → fallback; null = DB'de bulunamadı
  const rows = await db.select().from(T).where(eq(T.slug, slug)).limit(1);
  return rows[0] ? toProduct(rows[0]) : null;
}

export async function dbGetProductById(
  id: string,
): Promise<Product | null | undefined> {
  const db = getDb();
  if (!db) return undefined;
  const rows = await db.select().from(T).where(eq(T.id, id)).limit(1);
  return rows[0] ? toProduct(rows[0]) : null;
}

// ---------------------------------------------------------------
// Okuma — admin (taslaklar dahil hepsi, ham satır)
// ---------------------------------------------------------------
export async function dbGetAllProductsAdmin(
  kind?: "material" | "artwork",
  seriesSlug?: string,
): Promise<ProductRow[]> {
  const db = getDb();
  if (!db) return [];
  const conds = [];
  if (kind) conds.push(eq(T.kind, kind));
  if (seriesSlug) conds.push(eq(T.seriesSlug, seriesSlug));
  const where = conds.length ? and(...conds) : undefined;
  const base = db.select().from(T);
  const rows = where
    ? await base.where(where).orderBy(asc(T.sortOrder), asc(T.title))
    : await base.orderBy(asc(T.sortOrder), asc(T.title));
  return rows;
}

export async function dbGetRowById(id: string): Promise<ProductRow | null> {
  const db = getDb();
  if (!db) return null;
  const rows = await db.select().from(T).where(eq(T.id, id)).limit(1);
  return rows[0] ?? null;
}

/** Verilen tabandan, DB'de çakışmayan benzersiz bir slug üretir. */
export async function dbGenerateUniqueSlug(
  base: string,
  excludeId?: string,
): Promise<string> {
  const db = getDb();
  const clean = slugify(base, "urun");
  if (!db) return clean;

  let slug = clean;
  let i = 2;
  // Aynı slug başka bir kayıtta varsa sonuna sayı ekle.
  while (true) {
    const rows = await db
      .select({ id: T.id })
      .from(T)
      .where(
        excludeId
          ? and(eq(T.slug, slug), ne(T.id, excludeId))
          : eq(T.slug, slug),
      )
      .limit(1);
    if (!rows[0]) return slug;
    slug = `${clean}-${i++}`;
  }
}

// ---------------------------------------------------------------
// Yazma — admin CRUD
// ---------------------------------------------------------------
export async function dbCreateProduct(data: NewProductRow): Promise<ProductRow> {
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL tanımlı değil");
  const rows = await db.insert(T).values(data).returning();
  return rows[0];
}

export async function dbUpdateProduct(
  id: string,
  data: Partial<NewProductRow>,
): Promise<ProductRow | null> {
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL tanımlı değil");
  const rows = await db
    .update(T)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(T.id, id))
    .returning();
  return rows[0] ?? null;
}

export async function dbDeleteProduct(id: string): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL tanımlı değil");
  await db.delete(T).where(eq(T.id, id));
}
