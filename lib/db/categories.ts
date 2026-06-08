/**
 * MAIAMARI.STUDIO — Kategori veri erişimi (DB)
 * --------------------------------------------
 * Mağaza kategorileri. DB yoksa null döner; lib/data.ts statik
 * CATEGORIES listesine düşer.
 */
import { asc, eq } from "drizzle-orm";
import { getDb } from "./client";
import { createSlugRepository } from "./repository";
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

// --- Ortak slug CRUD (createSlugRepository) ---
const repo = createSlugRepository<CategoryRow, NewCategoryRow>(C);

/** Düzenleme için ham satır. DB yok/bulunamadı → null. */
export const dbGetCategoryRow = repo.getRow;
export const dbCreateCategory = repo.create;
export const dbUpdateCategory = repo.update;
export const dbDeleteCategory = repo.remove;
/** Kategori slug'ı DB'de var mı (validasyon için). */
export const dbCategoryExists = repo.exists;
