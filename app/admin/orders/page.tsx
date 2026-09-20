/**
 * MAIAMARI.STUDIO — Admin sipariş listesi
 * İki sekme: Aktif (işlem bekleyen) ve Arşiv (teslim/iptal/iade/başarısız).
 * Her sekme kendi içinde sayfalı (25) ve sıralanabilir (tarih / tutar).
 * Sıralama ve sayfalama SQL'de yapılır; sayfa içi sıralama 2. sayfada yanlış
 * sonuç verirdi.
 */
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { isDbConfigured } from "@/lib/db/client";
import { dbGetOrdersPage } from "@/lib/db/orders";
import type { OrderRow } from "@/lib/db/schema";
import { formatTRY } from "@/lib/format";
import { orderStatusLabel, orderBadgeStyle } from "@/lib/order-status";
import {
  ORDERS_PAGE_SIZE,
  pageCount,
  parseOrdersQuery,
  ordersHref,
  toggleSortPatch,
  type OrdersQuery,
  type OrdersSort,
} from "@/lib/admin/order-list-query";

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
          {o.paymentAttentionReason && (
            <span
              className="text-[10px] tracking-wider uppercase px-2 py-0.5 rounded"
              style={{ background: "#FDE8E8", color: "#8A1C1C" }}
              title={o.paymentAttentionReason}
            >
              Ödeme kontrolü
            </span>
          )}
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

/** Sıralama düğmesi: seçiliyse yönü ok ile gösterir, tıklayınca ters çevirir. */
function SortButton({
  q,
  sort,
  label,
}: {
  q: OrdersQuery;
  sort: OrdersSort;
  label: string;
}) {
  const active = q.sort === sort;
  const ok = active ? (q.dir === "desc" ? "↓" : "↑") : "";
  return (
    <Link
      href={ordersHref(q, toggleSortPatch(q, sort))}
      aria-label={
        active
          ? `${label} sıralaması, şu an ${
              q.dir === "desc" ? "azalan" : "artan"
            }; tıklayınca ters çevirir`
          : `${label} sırasına geç`
      }
      className={`h-8 px-3 inline-flex items-center gap-1 text-xs rounded border hover:bg-[color:var(--color-surface-2)] ${
        active
          ? "border-[color:var(--color-walnut-dark)]"
          : "border-[color:var(--color-border)] text-[color:var(--color-muted)]"
      }`}
    >
      {label} {ok}
    </Link>
  );
}

function TabLink({
  q,
  tab,
  label,
  count,
}: {
  q: OrdersQuery;
  tab: "aktif" | "arsiv";
  label: string;
  count: number;
}) {
  const active = q.tab === tab;
  return (
    <Link
      href={ordersHref(q, { tab, page: 1 })}
      aria-current={active ? "page" : undefined}
      className={`px-1 pb-2 -mb-px border-b-2 text-sm ${
        active
          ? "border-[color:var(--color-walnut-dark)] font-medium"
          : "border-transparent text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
      }`}
    >
      {label}
      <span className="ml-1.5 text-xs tabular-nums">({count})</span>
    </Link>
  );
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    page?: string;
    sirala?: string;
    yon?: string;
  }>;
}) {
  await requireAdmin();
  const q = parseOrdersQuery(await searchParams);

  // Açık sekmenin kayıtları + diğer sekmenin toplamı (sekme sayacı için).
  const [sayfa, diger] = await Promise.all([
    dbGetOrdersPage({
      archived: q.tab === "arsiv",
      limit: ORDERS_PAGE_SIZE,
      offset: q.offset,
      sort: q.sort,
      dir: q.dir,
    }),
    dbGetOrdersPage({
      archived: q.tab !== "arsiv",
      limit: 1,
      offset: 0,
      sort: "tarih",
      dir: "desc",
    }),
  ]);

  const toplamSayfa = pageCount(sayfa.total);
  const aktifSayi = q.tab === "aktif" ? sayfa.total : diger.total;
  const arsivSayi = q.tab === "arsiv" ? sayfa.total : diger.total;
  const dikkatSayi = sayfa.rows.filter((o) => o.paymentAttentionReason).length;

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-3xl mb-1">Siparişler</h1>
      <p className="text-sm text-[color:var(--color-muted)] mb-6">
        {aktifSayi} aktif · {arsivSayi} arşivde.
        {dikkatSayi > 0
          ? ` Bu sayfada ${dikkatSayi} siparişin ödemesi kontrol bekliyor.`
          : ""}
      </p>

      {!isDbConfigured() && (
        <p className="text-sm text-amber-700 border border-amber-300 bg-amber-50 rounded-md px-3 py-2 mb-6">
          Veritabanı bağlı değil. Sipariş yönetimi <code>DATABASE_URL</code>{" "}
          olmadan çalışmaz.
        </p>
      )}

      {/* Sekmeler */}
      <nav
        aria-label="Sipariş listesi sekmeleri"
        className="flex items-center gap-5 border-b border-[color:var(--color-hairline)] mb-4"
      >
        <TabLink q={q} tab="aktif" label="Aktif" count={aktifSayi} />
        <TabLink q={q} tab="arsiv" label="Arşiv" count={arsivSayi} />
      </nav>

      {/* Sıralama */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-[color:var(--color-muted)]">Sırala:</span>
        <SortButton q={q} sort="tarih" label="Tarih" />
        <SortButton q={q} sort="tutar" label="Tutar" />
      </div>

      <div className="border border-[color:var(--color-hairline)] rounded-lg divide-y divide-[color:var(--color-hairline)]">
        {sayfa.rows.map((o) => (
          <OrderRowLink key={o.id} o={o} />
        ))}
        {sayfa.rows.length === 0 && (
          <p className="px-4 py-6 text-sm text-[color:var(--color-muted)] text-center">
            {q.tab === "aktif"
              ? "Aktif (işlem bekleyen) sipariş yok."
              : "Arşivde kayıt yok."}
          </p>
        )}
      </div>

      {toplamSayfa > 1 && (
        <nav
          aria-label="Sayfalar"
          className="mt-4 flex items-center justify-between text-sm"
        >
          {q.page > 1 ? (
            <Link
              href={ordersHref(q, { page: q.page - 1 })}
              className="underline underline-offset-4 hover:opacity-70"
            >
              ← Önceki
            </Link>
          ) : (
            <span />
          )}
          <span className="text-xs text-[color:var(--color-muted)] tabular-nums">
            Sayfa {q.page} / {toplamSayfa} · {sayfa.total} kayıt
          </span>
          {q.page < toplamSayfa ? (
            <Link
              href={ordersHref(q, { page: q.page + 1 })}
              className="underline underline-offset-4 hover:opacity-70"
            >
              Sonraki →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
