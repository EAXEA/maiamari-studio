/**
 * MAIAMARI.STUDIO — Seri veri erişimi (DB)
 * ----------------------------------------
 * Galeri serileri. DB yoksa null döner; lib/data.ts data/series.json'a düşer.
 */
import { asc, eq } from "drizzle-orm";
import { getDb } from "./client";
import { createSlugRepository } from "./repository";
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

// --- Ortak slug CRUD (createSlugRepository) ---
const repo = createSlugRepository<SeriesRow, NewSeriesRow>(S);

/** Düzenleme için ham satır. DB yok/bulunamadı → null. */
export const dbGetSeriesRow = repo.getRow;
export const dbCreateSeries = repo.create;
export const dbUpdateSeries = repo.update;
export const dbDeleteSeries = repo.remove;
export const dbSeriesExists = repo.exists;
