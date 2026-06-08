/**
 * MAIAMARI.STUDIO — Atölye (workshop) veri erişimi (DB)
 * ----------------------------------------------------
 * Atölye programları. DB yoksa null döner; lib/data.ts data/business.json
 * (+ lib/workshop-images.ts görselleri) fallback'ine düşer. Public sayfa
 * yalnız yayında olanları, sortOrder artan sırada okur.
 */
import { asc, eq } from "drizzle-orm";
import { getDb } from "./client";
import { createSlugRepository } from "./repository";
import {
  workshops as W,
  type WorkshopRow,
  type NewWorkshopRow,
} from "./schema";
import type { Workshop } from "@/lib/types";

const orUndef = (s: unknown) => {
  const v = s == null ? "" : String(s);
  return v.trim() ? v : undefined;
};

function toWorkshop(row: WorkshopRow): Workshop {
  return {
    slug: row.slug,
    title: row.title,
    instructor: row.instructor,
    instructorInstagramHandle: orUndef(row.instructorInstagramHandle),
    instructorInstagramUrl: orUndef(row.instructorInstagramUrl),
    schedule: orUndef(row.schedule),
    description: orUndef(row.description),
    priceTRY: row.priceTry != null ? Number(row.priceTry) : null,
    image: orUndef(row.image),
    imageAlt: orUndef(row.imageAlt),
  };
}

/** Yayında olan atölyeler, sortOrder artan. DB yoksa null. */
export async function dbGetWorkshops(): Promise<Workshop[] | null> {
  const db = getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(W)
    .where(eq(W.isPublished, true))
    .orderBy(asc(W.sortOrder));
  return rows.map(toWorkshop);
}

/** Tüm atölyeler (taslaklar dahil) — admin listesi için ham satırlar. DB yoksa null. */
export async function dbGetWorkshopRowsAdmin(): Promise<WorkshopRow[] | null> {
  const db = getDb();
  if (!db) return null;
  return db.select().from(W).orderBy(asc(W.sortOrder));
}

// --- Ortak slug CRUD (createSlugRepository) ---
const repo = createSlugRepository<WorkshopRow, NewWorkshopRow>(W);

/** Düzenleme için ham satır. DB yok/bulunamadı → null. */
export const dbGetWorkshopRow = repo.getRow;
export const dbCreateWorkshop = repo.create;
export const dbUpdateWorkshop = repo.update;
export const dbDeleteWorkshop = repo.remove;
/** Slug DB'de var mı (benzersiz slug üretimi için). */
export const dbWorkshopExists = repo.exists;
