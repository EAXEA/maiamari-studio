/**
 * MAIAMARI.STUDIO — Günce (journal) veri erişimi (DB)
 * ---------------------------------------------------
 * Atölye notları & etkinlikler. DB yoksa null döner; lib/data.ts
 * data/journal.json'a düşer. Public sayfa yalnız yayında olanları,
 * tarih azalan sırada okur.
 */
import { asc, desc, eq } from "drizzle-orm";
import { getDb } from "./client";
import { journal as J, type JournalRow, type NewJournalRow } from "./schema";
import type { JournalPost } from "@/lib/types";

const orNull = (s: unknown) => {
  const v = s == null ? "" : String(s);
  return v.trim() ? v : undefined;
};

function toJournalPost(row: JournalRow): JournalPost {
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    body: orNull(row.body),
    date: row.date,
    dateLabel: orNull(row.dateLabel),
    category: orNull(row.category),
    location: orNull(row.location),
    locationUrl: orNull(row.locationUrl),
    image: orNull(row.image),
    imageAlt: orNull(row.imageAlt),
    gallery: row.gallery && row.gallery.length ? row.gallery : undefined,
    instagramUrl: orNull(row.instagramUrl),
  };
}

/** Yayında olan günceler, tarih azalan (newest first). DB yoksa null. */
export async function dbGetJournalPosts(): Promise<JournalPost[] | null> {
  const db = getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(J)
    .where(eq(J.isPublished, true))
    .orderBy(desc(J.date), asc(J.sortOrder));
  return rows.map(toJournalPost);
}

/** Tüm günceler (taslaklar dahil) — admin listesi için ham satırlar. DB yoksa null. */
export async function dbGetJournalRowsAdmin(): Promise<JournalRow[] | null> {
  const db = getDb();
  if (!db) return null;
  return db.select().from(J).orderBy(desc(J.date), asc(J.sortOrder));
}

/** Düzenleme için ham satır. */
export async function dbGetJournalRow(slug: string): Promise<JournalRow | null> {
  const db = getDb();
  if (!db) return null;
  const rows = await db.select().from(J).where(eq(J.slug, slug)).limit(1);
  return rows[0] ?? null;
}

export async function dbCreateJournal(data: NewJournalRow): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL tanımlı değil");
  await db.insert(J).values(data);
}

export async function dbUpdateJournal(
  slug: string,
  data: Partial<NewJournalRow>,
): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL tanımlı değil");
  await db
    .update(J)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(J.slug, slug));
}

export async function dbDeleteJournal(slug: string): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL tanımlı değil");
  await db.delete(J).where(eq(J.slug, slug));
}

/** Slug DB'de var mı (benzersiz slug üretimi için). */
export async function dbJournalExists(slug: string): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  const rows = await db
    .select({ slug: J.slug })
    .from(J)
    .where(eq(J.slug, slug))
    .limit(1);
  return !!rows[0];
}
