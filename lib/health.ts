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
import { cleanEnv } from "./env";

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

export type KeepaliveStatus = {
  state: ProbeState;
  /** Son keep-alive çalışmasının başlangıcı (ISO) veya null. */
  lastRunAt: string | null;
  lastRunOk: boolean | null;
  /** GitHub workflow durumu (active / disabled_inactivity / ...). */
  workflowState: string | null;
  lastCommitAt: string | null;
  /** Kalan pencereler (ms); negatif = aşıldı, null = hesaplanamadı. */
  sbRemainingMs: number | null;
  ghRemainingMs: number | null;
  detail: string;
  error?: string;
};

export type HealthReport = {
  probes: Probe[];
  keepalive: KeepaliveStatus;
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
  const bucket = cleanEnv("SUPABASE_STORAGE_BUCKET") || "product-images";
  if (!isStorageConfigured()) {
    return {
      name,
      state: "unconfigured",
      configured: false,
      latencyMs: null,
      detail: "SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL yok — görsel yükleme kapalı.",
    };
  }
  const url = cleanEnv("NEXT_PUBLIC_SUPABASE_URL")!;
  const key = cleanEnv("SUPABASE_SERVICE_ROLE_KEY")!;
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
// Keep-alive sayaçları — Supabase pause (7 gün) + GitHub cron (60 gün)
// Kaynak: GitHub public API (repo public → token/secret GEREKMEZ).
// Sayaçlar son BAŞARILI keep-alive çalışmasına göre "garanti taban"dır;
// başka her DB aktivitesi (bu sayfanın select 1'i dahil) Supabase saatini
// ayrıca sıfırlar, yani gerçek kalan süre gösterilenden az olamaz.
// ---------------------------------------------------------------
const KEEPALIVE_WORKFLOW = "supabase-keepalive.yml";
const SB_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const GH_WINDOW_MS = 60 * 24 * 60 * 60 * 1000;

function ghRepo(): string {
  const owner = process.env.VERCEL_GIT_REPO_OWNER;
  const slug = process.env.VERCEL_GIT_REPO_SLUG;
  return owner && slug ? `${owner}/${slug}` : "EAXEA/maiamari-studio";
}

async function ghJson<T>(path: string): Promise<T> {
  const res = await withTimeout(
    fetch(`https://api.github.com/repos/${ghRepo()}${path}`, {
      headers: {
        Accept: "application/vnd.github+json",
        // GitHub, User-Agent'sız istekleri reddeder.
        "User-Agent": "maiamari-health",
      },
      // Anonim limit 60 istek/saat — her panel yenilemesinde GitHub'ı dövme.
      next: { revalidate: 300 },
    }),
  );
  if (!res.ok) throw new Error(`GitHub API ${res.status} (${path})`);
  return res.json() as Promise<T>;
}

export async function checkKeepalive(): Promise<KeepaliveStatus> {
  try {
    const [wf, runs, commits] = await Promise.all([
      ghJson<{ state?: string }>(`/actions/workflows/${KEEPALIVE_WORKFLOW}`),
      ghJson<{
        workflow_runs?: { conclusion: string | null; run_started_at: string }[];
      }>(`/actions/workflows/${KEEPALIVE_WORKFLOW}/runs?per_page=1`),
      ghJson<{ commit?: { committer?: { date?: string } } }[]>(
        "/commits?per_page=1",
      ),
    ]);
    const run = runs.workflow_runs?.[0] ?? null;
    const lastRunAt = run?.run_started_at ?? null;
    const lastRunOk = run ? run.conclusion === "success" : null;
    const workflowState = wf.state ?? null;
    const lastCommitAt = commits[0]?.commit?.committer?.date ?? null;

    const elapsed = lastRunAt ? Date.now() - Date.parse(lastRunAt) : null;
    // Başarısız run pencereyi sıfırlamaz — sayaç yalnız başarılı run'a dayanır.
    const anchor = lastRunOk && elapsed != null ? elapsed : null;
    const sbRemainingMs = anchor != null ? SB_WINDOW_MS - anchor : null;
    const ghRemainingMs = anchor != null ? GH_WINDOW_MS - anchor : null;

    let state: ProbeState = "ok";
    let detail = "Günlük cron çalışıyor; iki pencere de güvende.";
    if (workflowState !== "active") {
      state = "down";
      detail = `Workflow devre dışı (state: ${workflowState ?? "bilinmiyor"}) — Actions sekmesinden etkinleştir.`;
    } else if (!run) {
      state = "warn";
      detail = "Henüz hiç çalışma kaydı yok.";
    } else if (!lastRunOk) {
      state = "down";
      detail = "Son keep-alive çalışması BAŞARISIZ — Actions log'una bak.";
    } else if (anchor != null && anchor > 5 * 24 * 60 * 60 * 1000) {
      state = "down";
      detail = "Son başarılı çalışma 5 günden eski — Supabase pause penceresi daralıyor.";
    } else if (anchor != null && anchor > 2 * 24 * 60 * 60 * 1000) {
      state = "warn";
      detail = "Günlük cron aksıyor görünüyor (son başarılı çalışma >2 gün önce).";
    }

    return {
      state,
      lastRunAt,
      lastRunOk,
      workflowState,
      lastCommitAt,
      sbRemainingMs,
      ghRemainingMs,
      detail,
    };
  } catch (err) {
    return {
      state: "warn",
      lastRunAt: null,
      lastRunOk: null,
      workflowState: null,
      lastCommitAt: null,
      sbRemainingMs: null,
      ghRemainingMs: null,
      detail:
        "GitHub API'ye ulaşılamadı — sayaçlar hesaplanamadı (servislerin kendisi etkilenmez).",
      error: errText(err),
    };
  }
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
  const [db, storage, keepalive] = await Promise.all([
    checkDatabase(),
    checkStorage(),
    checkKeepalive(),
  ]);
  return {
    probes: [db, storage, checkEmail(), checkPayment()],
    keepalive,
    meta: getRuntimeMeta(),
    checkedAt: new Date().toISOString(),
  };
}
