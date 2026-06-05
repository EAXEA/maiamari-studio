/**
 * MAIAMARI.STUDIO — Kategori veri erişimi (DB)
 * --------------------------------------------
 * Mağaza kategorileri. DB yoksa null döner; lib/data.ts statik
 * CATEGORIES listesine düşer.
 */
import { asc, eq } from "drizzle-orm";
import { getDb } from "./client";
import { categories as C, type NewCategoryRow, type CategoryRow } from "./schema";
import type { Category } from "@/lib/types";

function toCategory(row: {
  slug: string;
  name: string;
  nameEn: string;
  description: string;
}): Category {
  return {
    slug: row.slug as Category["slug"],
    name: row.name,
    nameEn: row.nameEn,
    description: row.description,
  };
}

/** Tüm kategoriler (sıralı). DB yoksa null. */
export async function dbGetCategories(): Promise<Category[] | null> {
  const db = getDb();
  if (!db) return null;
  const rows = await db.select().from(C).orderBy(asc(C.sortOrder), asc(C.name));
  return rows.map(toCategory);
}

export async function dbGetCategoryBySlug(
  slug: string,
): Promise<Category | null | undefined> {
  const db = getDb();
  if (!db) return undefined; // undefined = DB yok → fallback
  const rows = await db.select().from(C).where(eq(C.slug, slug)).limit(1);
  return rows[0] ? toCategory(rows[0]) : null;
}

/** Düzenleme için ham satır (sortOrder dahil). */
export async function dbGetCategoryRow(
  slug: string,
): Promise<CategoryRow | null> {
  const db = getDb();
  if (!db) return null;
  const rows = await db.select().from(C).where(eq(C.slug, slug)).limit(1);
  return rows[0] ?? null;
}

export async function dbCreateCategory(data: NewCategoryRow): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL tanımlı değil");
  await db.insert(C).values(data);
}

export async function dbUpdateCategory(
  slug: string,
  data: Partial<NewCategoryRow>,
): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL tanımlı değil");
  await db
    .update(C)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(C.slug, slug));
}

export async function dbDeleteCategory(slug: string): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL tanımlı değil");
  await db.delete(C).where(eq(C.slug, slug));
}

/** Kategori slug'ı DB'de var mı (validasyon için). */
export async function dbCategoryExists(slug: string): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  const rows = await db
    .select({ slug: C.slug })
    .from(C)
    .where(eq(C.slug, slug))
    .limit(1);
  return !!rows[0];
}
