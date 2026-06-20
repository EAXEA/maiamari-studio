/**
 * MAIAMARI.STUDIO — Servis sağlık probe'ları (server-only)
 * --------------------------------------------------------
 * /admin/health sayfası bunları kullanır. Tüm probe'lar:
 *   - SALT-OKUNUR ve hafif (gerçek e-posta/ sipariş üretmez),
 *   - timeout'lu (asılı bir bağımlılık admin panelini kilitlemesin),
 *   - SECRET DEĞER DÖNDÜRMEZ (yalnız yapılandırma/erişim durumu, host, mod).
 *
 * Not: Bu sürümde DB sonucundan "içerik db'den mi fallback'ten mi geliyor"
 * çıkarımı YAPILMAZ; yalnız DB'nin yapılandırma + erişilebilirlik durumu raporlanır.
 */
import { sql } from "drizzle-orm";
import { createClient } from "@supabase/supabase-js";
import { getDb, isDbConfigured } from "./db/client";
import { isStorageConfigured } from "./admin/storage";
import { isIyzicoConfigured } from "./payment/iyzico";

export type ProbeState = "ok" | "warn" | "down" | "unconfigured";

export type Probe = {
  /** Kart başlığı. */
  name: string;
  state: ProbeState;
  /** Gerekli env/secret tanımlı mı. */
  configured: boolean;
  /** Erişim probe'u yapıldıysa süre (ms), yoksa null. */
  latencyMs: number | null;
  /** İnsan-okur açıklama (secret içermez). */
  detail: string;
  /** Hata kodu/mesajı (secret içermez). */
  error?: string;
};

export type RuntimeMeta = {
  nodeEnv: string;
  vercelEnv: string;
  region: string;
  commit: string;
  /** Env varlık matrisi — yalnız isim + var/yok (DEĞER yok). */
  envPresence: { name: string; present: boolean }[];
};

export type HealthReport = {
  probes: Probe[];
  meta: RuntimeMeta;
  checkedAt: string;
};

const TIMEOUT_MS = 4000;

/** Verilen söze bir timeout yarışı ekler; aşılırsa reject olur. */
function withTimeout<T>(p: Promise<T>, ms = TIMEOUT_MS): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`timeout >${ms}ms`)), ms),
    ),
  ]);
}

/** Bir env değeri "gerçekten" var mı (boş ve `<...>` şablon değil). */
function present(v: string | undefined): boolean {
  return !!v && !v.startsWith("<");
}

function errText(err: unknown): string {
  const e = err as { code?: string; message?: string };
  return e?.code || e?.message || String(err);
}

// ---------------------------------------------------------------
// Veritabanı — yapılandırma + canlı erişim (select 1)
// ---------------------------------------------------------------
export async function checkDatabase(): Promise<Probe> {
  const name = "Veritabanı";
  if (!isDbConfigured()) {
    return {
      name,
      state: "unconfigured",
      configured: false,
      latencyMs: null,
      detail: "DATABASE_URL tanımlı değil — içerik JSON/snapshot'tan servis edilir.",
    };
  }
  const db = getDb();
  if (!db) {
    // Build fazında getDb() bilinçle null döner; runtime'da olmaz.
    return {
      name,
      state: "warn",
      configured: true,
      latencyMs: null,
      detail: "DB istemcisi şu an kapalı (build fazı beklenen davranış).",
    };
  }
  const t0 = Date.now();
  try {
    await withTimeout(db.execute(sql`select 1`));
    return {
      name,
      state: "ok",
      configured: true,
      latencyMs: Date.now() - t0,
      detail: "Erişilebilir (select 1).",
    };
  } catch (err) {
    return {
      name,
      state: "down",
      configured: true,
      latencyMs: Date.now() - t0,
      detail: "Bağlantı/sorgu başarısız — içerik okumaları JSON/snapshot fallback'e düşer.",
      error: errText(err),
    };
  }
}

// ---------------------------------------------------------------
// Supabase Storage — yapılandırma + hafif bucket erişimi
// ---------------------------------------------------------------
export async function checkStorage(): Promise<Probe> {
  const name = "Depolama (Storage)";
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "product-images";
  if (!isStorageConfigured()) {
    return {
      name,
      state: "unconfigured",
      configured: false,
      latencyMs: null,
      detail: "SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL yok — görsel yükleme kapalı.",
    };
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const t0 = Date.now();
  try {
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const res = await withTimeout(
      client.storage.from(bucket).list("", { limit: 1 }),
    );
    if (res.error) {
      return {
        name,
        state: "down",
        configured: true,
        latencyMs: Date.now() - t0,
        detail: `Bucket '${bucket}' listelenemedi.`,
        error: res.error.message,
      };
    }
    return {
      name,
      state: "ok",
      configured: true,
      latencyMs: Date.now() - t0,
      detail: `Bucket '${bucket}' erişilebilir.`,
    };
  } catch (err) {
    return {
      name,
      state: "down",
      configured: true,
      latencyMs: Date.now() - t0,
      detail: `Bucket '${bucket}' erişimi başarısız.`,
      error: errText(err),
    };
  }
}

// ---------------------------------------------------------------
// E-posta (Resend) — yalnız yapılandırma (canlı gönderim YOK)
// ---------------------------------------------------------------
export function checkEmail(): Probe {
  const name = "E-posta (Resend)";
  const hasKey = present(process.env.RESEND_API_KEY);
  const from = process.env.ORDER_EMAIL_FROM || "Maiamari <onboarding@resend.dev>";
  const customerCopy = process.env.ORDER_EMAIL_CUSTOMER === "1";
  return {
    name,
    state: hasKey ? "ok" : "unconfigured",
    configured: hasKey,
    latencyMs: null,
    detail: hasKey
      ? `Gönderen: ${from}${customerCopy ? " · müşteri kopyası açık" : " · müşteri kopyası kapalı"}`
      : "RESEND_API_KEY yok — sipariş e-postaları gönderilmez.",
  };
}

// ---------------------------------------------------------------
// Ödeme (iyzico) — yapılandırma + mod (sandbox/prod) + checkout flag'i
// ---------------------------------------------------------------
export function checkPayment(): Probe {
  const name = "Ödeme (iyzico)";
  const configured = isIyzicoConfigured();
  const base = process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com";
  const isSandbox = /sandbox/i.test(base);
  const checkoutEnabled = process.env.NEXT_PUBLIC_CHECKOUT_ENABLED === "1";
  return {
    name,
    // Anahtar var ama sandbox → warn (henüz canlı değil); anahtar yok → mock modu.
    state: configured ? (isSandbox ? "warn" : "ok") : "unconfigured",
    configured,
    latencyMs: null,
    detail: `Mod: ${configured ? "iyzico" : "mock"} · ${isSandbox ? "SANDBOX" : "PROD"} · checkout ${checkoutEnabled ? "AÇIK" : "KAPALI"}`,
  };
}

// ---------------------------------------------------------------
// Build / runtime meta
// ---------------------------------------------------------------
const TRACKED_ENV = [
  "DATABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_STORAGE_BUCKET",
  "ADMIN_PASSWORD_HASH",
  "ADMIN_SESSION_SECRET",
  "IYZICO_API_KEY",
  "IYZICO_SECRET_KEY",
  "IYZICO_BASE_URL",
  "RESEND_API_KEY",
  "ORDER_EMAIL_FROM",
  "ORDER_EMAIL_CUSTOMER",
  "SITE_URL",
  "NEXT_PUBLIC_CHECKOUT_ENABLED",
];

export function getRuntimeMeta(): RuntimeMeta {
  return {
    nodeEnv: process.env.NODE_ENV || "—",
    vercelEnv: process.env.VERCEL_ENV || "local",
    region: process.env.VERCEL_REGION || "—",
    commit: (process.env.VERCEL_GIT_COMMIT_SHA || "").slice(0, 7) || "—",
    envPresence: TRACKED_ENV.map((n) => ({
      name: n,
      present: present(process.env[n]),
    })),
  };
}

// ---------------------------------------------------------------
// Toplu rapor — probe'lar kendi içinde hata yakalar; allSettled gerekmez.
// ---------------------------------------------------------------
export async function runHealth(): Promise<HealthReport> {
  const [db, storage] = await Promise.all([checkDatabase(), checkStorage()]);
  return {
    probes: [db, storage, checkEmail(), checkPayment()],
    meta: getRuntimeMeta(),
    checkedAt: new Date().toISOString(),
  };
}
