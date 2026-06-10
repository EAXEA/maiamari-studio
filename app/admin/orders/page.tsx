/**
 * MAIAMARI.STUDIO — Admin sipariş listesi
 * Aktif siparişler (işlem bekleyen) üstte; tamamlanan/iptal/başarısız
 * siparişler altta "Arşiv" başlığında toplanır.
 */
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { isDbConfigured } from "@/lib/db/client";
import { dbGetAllOrders } from "@/lib/db/orders";
import type { OrderRow } from "@/lib/db/schema";
import { formatTRY } from "@/lib/format";
import {
  orderStatusLabel,
  orderBadgeStyle,
  isArchivedStatus,
} from "@/lib/order-status";

export const dynamic = "force-dynamic";

function fmtDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function OrderRowLink({ o }: { o: OrderRow }) {
  return (
    <Link
      href={`/admin/orders/${o.id}`}
      className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-[color:var(--color-surface)]"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm tabular-nums">{o.orderNo}</span>
          <span
            className="text-[10px] tracking-wider uppercase px-2 py-0.5 rounded"
            style={orderBadgeStyle(o.status)}
          >
            {orderStatusLabel(o.status)}
          </span>
        </div>
        <p className="text-xs text-[color:var(--color-muted)] mt-0.5 truncate">
          {o.buyerName || "İsimsiz"} · {fmtDate(o.createdAt)}
          {o.paymentProvider === "mock" ? " · TEST" : ""}
        </p>
      </div>
      <span className="text-sm font-medium tabular-nums shrink-0">
        {formatTRY(Number(o.totalTry))}
      </span>
    </Link>
  );
}

export default async function AdminOrdersPage() {
  await requireAdmin();
  const all = await dbGetAllOrders();
  const active = all.filter((o) => !isArchivedStatus(o.status));
  const archived = all.filter((o) => isArchivedStatus(o.status));

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-3xl mb-1">Siparişler</h1>
      <p className="text-sm text-[color:var(--color-muted)] mb-8">
        {active.length} aktif · {archived.length} arşivde. En yeni önce.
      </p>

      {!isDbConfigured() && (
        <p className="text-sm text-amber-700 border border-amber-300 bg-amber-50 rounded-md px-3 py-2 mb-6">
          Veritabanı bağlı değil. Sipariş yönetimi <code>DATABASE_URL</code>{" "}
          olmadan çalışmaz.
        </p>
      )}

      {/* Aktif siparişler — işlem bekleyenler */}
      <h2 className="text-[11px] tracking-[0.2em] uppercase text-[color:var(--color-muted)] mb-3">
        Aktif
      </h2>
      <div className="border border-[color:var(--color-hairline)] rounded-lg divide-y divide-[color:var(--color-hairline)]">
        {active.map((o) => (
          <OrderRowLink key={o.id} o={o} />
        ))}
        {active.length === 0 && (
          <p className="px-4 py-6 text-sm text-[color:var(--color-muted)] text-center">
            Aktif (işlem bekleyen) sipariş yok.
          </p>
        )}
      </div>

      {/* Arşiv — tamamlanan / iptal / başarısız */}
      {archived.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-xl mb-1">Arşiv</h2>
          <p className="text-xs text-[color:var(--color-muted)] mb-4">
            Teslim edilen, iptal ve başarısız siparişler.
          </p>
          <div className="border border-[color:var(--color-hairline)] rounded-lg divide-y divide-[color:var(--color-hairline)] opacity-80">
            {archived.map((o) => (
              <OrderRowLink key={o.id} o={o} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
