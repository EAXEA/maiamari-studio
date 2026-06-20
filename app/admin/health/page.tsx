/**
 * MAIAMARI.STUDIO — Admin sistem durumu (health)
 * ----------------------------------------------
 * DB / Storage / E-posta / iyzico / build-runtime durumunu gösterir.
 * Salt-okunur probe'lar (lib/health.ts); secret DEĞER gösterilmez.
 * requireAdmin() + proxy.ts ile admin-only; force-dynamic ile her zaman canlı.
 */
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { runHealth, type ProbeState } from "@/lib/health";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sistem Durumu" };

const STATE: Record<ProbeState, { label: string; cls: string }> = {
  ok: { label: "Çalışıyor", cls: "bg-emerald-50 text-emerald-700 border-emerald-300" },
  warn: { label: "Dikkat", cls: "bg-amber-50 text-amber-700 border-amber-300" },
  down: { label: "Erişilemiyor", cls: "bg-red-50 text-red-700 border-red-300" },
  unconfigured: { label: "Yapılandırılmamış", cls: "bg-gray-50 text-gray-500 border-gray-300" },
};

export default async function HealthPage() {
  await requireAdmin();
  const { probes, meta, checkedAt } = await runHealth();

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl">Sistem Durumu</h1>
          <p className="text-sm text-[color:var(--color-muted)] mt-1">
            Son kontrol: {new Date(checkedAt).toLocaleString("tr-TR")}
          </p>
        </div>
        <Link
          href="/admin"
          className="text-sm underline underline-offset-2 text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
        >
          ← Panele dön
        </Link>
      </div>

      {/* Servis kartları */}
      <div className="grid sm:grid-cols-2 gap-4">
        {probes.map((p) => {
          const s = STATE[p.state];
          return (
            <div
              key={p.name}
              className="border border-[color:var(--color-hairline)] rounded-lg p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-medium">{p.name}</h2>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full border ${s.cls}`}
                >
                  {s.label}
                </span>
              </div>
              <p className="text-sm text-[color:var(--color-muted)] mt-2">
                {p.detail}
              </p>
              <div className="mt-2 flex items-center gap-3 text-xs text-[color:var(--color-muted)]">
                {p.latencyMs != null && <span>{p.latencyMs} ms</span>}
                {p.error && (
                  <code className="text-red-600 break-all">{p.error}</code>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Build / runtime */}
      <h2 className="font-display text-xl mt-10 mb-3">Build / Runtime</h2>
      <dl className="text-sm border border-[color:var(--color-hairline)] rounded-lg divide-y divide-[color:var(--color-hairline)]">
        {[
          ["Ortam (VERCEL_ENV)", meta.vercelEnv],
          ["NODE_ENV", meta.nodeEnv],
          ["Region", meta.region],
          ["Commit", meta.commit],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 px-4 py-2.5">
            <dt className="text-[color:var(--color-muted)]">{k}</dt>
            <dd className="font-mono">{v}</dd>
          </div>
        ))}
      </dl>

      {/* Env varlık matrisi (yalnız isim + var/yok; değer gösterilmez) */}
      <h2 className="font-display text-xl mt-10 mb-1">Ortam Değişkenleri</h2>
      <p className="text-xs text-[color:var(--color-muted)] mb-3">
        Yalnızca tanımlı olup olmadığı gösterilir. Değerler asla görüntülenmez.
      </p>
      <div className="flex flex-wrap gap-2">
        {meta.envPresence.map((e) => (
          <span
            key={e.name}
            className={`text-[11px] font-mono px-2 py-1 rounded border ${
              e.present
                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                : "bg-gray-50 text-gray-500 border-gray-300"
            }`}
          >
            {e.present ? "✓" : "✗"} {e.name}
          </span>
        ))}
      </div>
    </div>
  );
}
