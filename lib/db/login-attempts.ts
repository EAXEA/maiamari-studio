/**
 * MAIAMARI.STUDIO — Admin giriş rate limit (server-only)
 * ------------------------------------------------------
 * IP başına brute-force koruması. Politika:
 *   - 3 başarısız deneme → 3 dakika kilit (cooldown).
 *   - Son denemeden 15 dk geçtiyse sayaç sıfırlanır (eski denemeler birikmez).
 *   - DB yoksa veya hata olursa FAIL-OPEN: girişi engelleme (gerçek admin bir
 *     DB sorunundan dolayı kilitlenmesin). Parola zaten güçlü; bu katman
 *     defense-in-depth'tir.
 *
 * Sayaç Postgres'te tutulur; Vercel serverless instance'ları arası in-memory
 * sayaç güvenilmez (her instance ayrı bellek, cold start'ta sıfırlanır).
 */
import { eq } from "drizzle-orm";
import { getDb } from "./client";
import { adminLoginAttempts as T } from "./schema";

export const MAX_FAILS = 3;
const COOLDOWN_MS = 3 * 60 * 1000; // 3 dakika
const STALE_MS = 15 * 60 * 1000; // 15 dk sonra streak sıfırlanır

export type RateState = {
  /** Şu an kilitli mi (cooldown sürüyor mu). */
  locked: boolean;
  /** Kilit bitene kadar kalan saniye. */
  retryAfterSec: number;
  /** Kilitlenmeden önce kalan deneme hakkı. */
  remaining: number;
};

const OPEN: RateState = { locked: false, retryAfterSec: 0, remaining: MAX_FAILS };

/** Girişi denemeden ÖNCE: IP kilitli mi? (mutasyon yok) */
export async function checkLoginRate(ip: string): Promise<RateState> {
  const db = getDb();
  if (!db) return OPEN;
  try {
    const rows = await db.select().from(T).where(eq(T.ip, ip)).limit(1);
    const rec = rows[0];
    if (!rec) return OPEN;
    const now = Date.now();
    if (rec.lockedUntil && rec.lockedUntil.getTime() > now) {
      return {
        locked: true,
        retryAfterSec: Math.ceil((rec.lockedUntil.getTime() - now) / 1000),
        remaining: 0,
      };
    }
    const fresh = now - rec.updatedAt.getTime() <= STALE_MS;
    const fails = fresh ? rec.fails : 0;
    return { locked: false, retryAfterSec: 0, remaining: Math.max(0, MAX_FAILS - fails) };
  } catch {
    return OPEN; // fail-open
  }
}

/** Başarısız denemeyi kaydet; eşik dolduysa kilitle. Yeni durumu döner. */
export async function recordLoginFailure(ip: string): Promise<RateState> {
  const db = getDb();
  if (!db) return OPEN;
  try {
    const now = new Date();
    const rows = await db.select().from(T).where(eq(T.ip, ip)).limit(1);
    const rec = rows[0];
    const fresh = rec ? now.getTime() - rec.updatedAt.getTime() <= STALE_MS : false;
    const fails = (fresh && rec ? rec.fails : 0) + 1;

    if (fails >= MAX_FAILS) {
      const lockedUntil = new Date(now.getTime() + COOLDOWN_MS);
      await db
        .insert(T)
        .values({ ip, fails: 0, lockedUntil, updatedAt: now })
        .onConflictDoUpdate({
          target: T.ip,
          set: { fails: 0, lockedUntil, updatedAt: now },
        });
      return { locked: true, retryAfterSec: Math.ceil(COOLDOWN_MS / 1000), remaining: 0 };
    }

    await db
      .insert(T)
      .values({ ip, fails, lockedUntil: null, updatedAt: now })
      .onConflictDoUpdate({
        target: T.ip,
        set: { fails, lockedUntil: null, updatedAt: now },
      });
    return { locked: false, retryAfterSec: 0, remaining: MAX_FAILS - fails };
  } catch {
    return OPEN; // fail-open
  }
}

/** Başarılı girişte IP'nin sayacını temizle. */
export async function clearLoginAttempts(ip: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    await db.delete(T).where(eq(T.ip, ip));
  } catch {
    // best-effort
  }
}
