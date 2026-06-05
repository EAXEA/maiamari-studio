/**
 * MAIAMARI.STUDIO — Drizzle / Postgres bağlantısı
 * ------------------------------------------------
 * DATABASE_URL tanımlı değilse null döner; bu durumda veri katmanı
 * (lib/data.ts) otomatik olarak JSON dosyalarına düşer. Böylece
 * Supabase kurulmadan önce de site sorunsuz çalışır.
 *
 * Supabase pooler (pgbouncer, port 6543) prepared statement desteklemez,
 * bu yüzden `prepare: false` zorunludur.
 */
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;

/**
 * Singleton'ı globalThis'te tut: dev'de Turbopack HMR modülü yeniden
 * değerlendirince yeni bir postgres pool açıp eskisini sızdırmasın
 * (aksi halde pooler'da "max client connections" hatası alınır).
 * Pool boyutu da sınırlandı (max: 5).
 */
const g = globalThis as unknown as {
  _maiamariDb?: PostgresJsDatabase<typeof schema>;
};

export function getDb(): PostgresJsDatabase<typeof schema> | null {
  if (!url) return null;
  // Production build (SSG) sırasında DB'ye vurma. Aksi halde build, 150+ statik
  // sayfayı üretirken Supabase pooler'ı (Nano: 15 bağlantı) tıkayıp timeout'a
  // düşüyor. Build JSON fallback'ten üretilir (içerik DB ile aynı; seed/migrate
  // ondan yapıldı); runtime'da (ISR / on-demand) DB-otoriter olur, admin
  // düzenlemeleri revalidatePath ile yansır.
  if (process.env.NEXT_PHASE === "phase-production-build") return null;
  if (!g._maiamariDb) {
    const client = postgres(url, {
      prepare: false,
      max: 5,
      idle_timeout: 20,
    });
    g._maiamariDb = drizzle(client, { schema });
  }
  return g._maiamariDb;
}

export const isDbConfigured = (): boolean => !!url;
