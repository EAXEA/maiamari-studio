/**
 * MAIAMARI.STUDIO — Sanatçı veri erişimi (DB)
 * -------------------------------------------
 * Galeri sanatçıları (çok sanatçılı). DB yoksa null döner;
 * lib/data.ts business.json'daki tek sanatçıya düşer.
 */
import { asc, eq } from "drizzle-orm";
import { getDb } from "./client";
import { createSlugRepository } from "./repository";
import { artists as A, type ArtistRow, type NewArtistRow } from "./schema";
import type { Artist } from "@/lib/types";

const orUndef = (s: unknown) => {
  const v = s == null ? "" : String(s);
  return v.trim() ? v : undefined;
};

function toArtist(row: ArtistRow): Artist {
  return {
    slug: row.slug,
    name: row.name,
    title: orUndef(row.title),
    bio: orUndef(row.bio),
    coverImage: orUndef(row.coverImage),
    instagramHandle: orUndef(row.instagramHandle),
    instagramUrl: orUndef(row.instagramUrl),
  };
}

export async function dbGetArtists(): Promise<Artist[] | null> {
  const db = getDb();
  if (!db) return null;
  const rows = await db.select().from(A).orderBy(asc(A.sortOrder), asc(A.name));
  return rows.map(toArtist);
}

export async function dbGetArtistBySlug(
  slug: string,
): Promise<Artist | null | undefined> {
  const db = getDb();
  if (!db) return undefined;
  const rows = await db.select().from(A).where(eq(A.slug, slug)).limit(1);
  return rows[0] ? toArtist(rows[0]) : null;
}

// --- Ortak slug CRUD (createSlugRepository) ---
const repo = createSlugRepository<ArtistRow, NewArtistRow>(A);

/** Düzenleme için ham satır. DB yok/bulunamadı → null. */
export const dbGetArtistRow = repo.getRow;
export const dbCreateArtist = repo.create;
export const dbUpdateArtist = repo.update;
export const dbDeleteArtist = repo.remove;
export const dbArtistExists = repo.exists;
