/**
 * MAIAMARI.STUDIO — Seri veri erişimi (DB)
 * ----------------------------------------
 * Galeri serileri. DB yoksa null döner; lib/data.ts data/series.json'a düşer.
 */
import { asc, eq } from "drizzle-orm";
import { getDb } from "./client";
import { series as S, type SeriesRow, type NewSeriesRow } from "./schema";
// SeriesRow düzenleme sayfasında ham satır (sortOrder dahil) için kullanılır.
import type { Series, SeriesSlug } from "@/lib/types";

const orNull = (s: unknown) => {
  const v = s == null ? "" : String(s);
  return v.trim() ? v : undefined;
};

function toSeries(row: SeriesRow): Series {
  return {
    slug: row.slug as SeriesSlug,
    title: row.title,
    subtitle: orNull(row.subtitle),
    year: row.year ?? undefined,
    yearRange: orNull(row.yearRange),
    description: row.description,
    coverImage: orNull(row.coverImage),
    paperNote: orNull(row.paperNote),
    artistSlug: row.artistSlug,
  };
}

export async function dbGetSeries(): Promise<Series[] | null> {
  const db = getDb();
  if (!db) return null;
  const rows = await db.select().from(S).orderBy(asc(S.sortOrder), asc(S.title));
  return rows.map(toSeries);
}

export async function dbGetSeriesBySlug(
  slug: string,
): Promise<Series | null | undefined> {
  const db = getDb();
  if (!db) return undefined; // undefined = DB yok → fallback
  const rows = await db.select().from(S).where(eq(S.slug, slug)).limit(1);
  return rows[0] ? toSeries(rows[0]) : null;
}

/** Düzenleme için ham satır (sortOrder dahil). */
export async function dbGetSeriesRow(slug: string): Promise<SeriesRow | null> {
  const db = getDb();
  if (!db) return null;
  const rows = await db.select().from(S).where(eq(S.slug, slug)).limit(1);
  return rows[0] ?? null;
}

export async function dbCreateSeries(data: NewSeriesRow): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL tanımlı değil");
  await db.insert(S).values(data);
}

export async function dbUpdateSeries(
  slug: string,
  data: Partial<NewSeriesRow>,
): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL tanımlı değil");
  await db
    .update(S)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(S.slug, slug));
}

export async function dbDeleteSeries(slug: string): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL tanımlı değil");
  await db.delete(S).where(eq(S.slug, slug));
}

export async function dbSeriesExists(slug: string): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  const rows = await db
    .select({ slug: S.slug })
    .from(S)
    .where(eq(S.slug, slug))
    .limit(1);
  return !!rows[0];
}
