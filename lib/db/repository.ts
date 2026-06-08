/**
 * MAIAMARI.STUDIO — Slug-anahtarlı tablolar için ortak CRUD üreticisi.
 * --------------------------------------------------------------------
 * categories / artists / series / journal / workshops modüllerinde birebir
 * tekrarlanan guard + CRUD bloklarını tek yere toplar. Entity'ye özel okuma
 * (public liste, bySlug→Domain eşleme, admin ham listesi) modülde bespoke kalır.
 *
 * Davranış SÖZLEŞMESİ (eski modüllerle bire bir korunur):
 *   getRow(slug):  DB yok → null;        bulunamadı → null
 *   create(data):  DB yok → throw NO_DB
 *   update(slug):  DB yok → throw NO_DB; updatedAt otomatik now() set edilir
 *   remove(slug):  DB yok → throw NO_DB
 *   exists(slug):  DB yok → false
 *
 * products tablosu (id-anahtarlı + bespoke sorgular) bilinçli olarak kapsam
 * dışıdır; kendi modülünde kalır.
 */
import { eq } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import { getDb } from "./client";

const NO_DB = "DATABASE_URL tanımlı değil";

/** slug + updatedAt kolonu olan herhangi bir Drizzle tablosu. */
type SlugTable = PgTable & { slug: PgColumn; updatedAt: PgColumn };

export function createSlugRepository<TRow, TInsert>(table: SlugTable) {
  return {
    /** Tek ham satır (slug ile). DB yok ya da bulunamadı → null. */
    async getRow(slug: string): Promise<TRow | null> {
      const db = getDb();
      if (!db) return null;
      const rows = await db
        .select()
        .from(table)
        .where(eq(table.slug, slug))
        .limit(1);
      return (rows[0] as TRow) ?? null;
    },

    /** Yeni kayıt. DB yoksa fırlatır. */
    async create(data: TInsert): Promise<void> {
      const db = getDb();
      if (!db) throw new Error(NO_DB);
      await db.insert(table).values(data as never);
    },

    /** Slug ile güncelle; updatedAt otomatik now(). DB yoksa fırlatır. */
    async update(slug: string, data: Partial<TInsert>): Promise<void> {
      const db = getDb();
      if (!db) throw new Error(NO_DB);
      await db
        .update(table)
        .set({ ...data, updatedAt: new Date() } as never)
        .where(eq(table.slug, slug));
    },

    /** Slug ile sil. DB yoksa fırlatır. */
    async remove(slug: string): Promise<void> {
      const db = getDb();
      if (!db) throw new Error(NO_DB);
      await db.delete(table).where(eq(table.slug, slug));
    },

    /** Slug DB'de var mı. DB yok → false. */
    async exists(slug: string): Promise<boolean> {
      const db = getDb();
      if (!db) return false;
      const rows = await db
        .select({ slug: table.slug })
        .from(table)
        .where(eq(table.slug, slug))
        .limit(1);
      return !!rows[0];
    },
  };
}
