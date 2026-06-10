/**
 * MAIAMARI.STUDIO — Admin sipariş detayı
 * Alıcı bilgileri, kalemler, ödeme ve durum güncelleme.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { dbGetOrder } from "@/lib/db/orders";
import { formatTRY } from "@/lib/format";
import {
  orderStatusLabel,
  orderBadgeStyle,
  nextFulfillmentStatus,
} from "@/lib/order-status";
import { setOrderStatus } from "../actions";

export const dynamic = "force-dynamic";

function fmtDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const data = await dbGetOrder(id);
  if (!data) notFound();
  const { order, items } = data;

  const next = nextFulfillmentStatus(order.status);
  const cancellable = ["paid", "shipped", "pending"].includes(order.status);

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/orders"
        className="text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
      >
        Siparişler
      </Link>

      <div className="flex items-center gap-3 mt-3 mb-1">
        <h1 className="font-display text-3xl font-mono tabular-nums">
          {order.orderNo}
        </h1>
        <span
          className="text-[11px] tracking-wider uppercase px-2 py-0.5 rounded"
          style={orderBadgeStyle(order.status)}
        >
          {orderStatusLabel(order.status)}
        </span>
      </div>
      <p className="text-sm text-[color:var(--color-muted)] mb-8">
        {fmtDate(order.createdAt)}
        {order.paymentProvider === "mock" ? " · TEST ödeme (sandbox)" : ""}
      </p>

      {/* Durum güncelleme */}
      {(next || cancellable) && (
        <div className="flex flex-wrap gap-3 mb-8">
          {next && (
            <form action={setOrderStatus.bind(null, order.id, next.to)}>
              <button
                type="submit"
                className="h-10 px-4 text-xs tracking-[0.15em] uppercase hover:opacity-90"
                style={{
                  background: "var(--color-walnut-dark)",
                  color: "var(--color-background)",
                }}
              >
                {next.label}
              </button>
            </form>
          )}
          {order.status === "paid" && (
            <form action={setOrderStatus.bind(null, order.id, "delivered")}>
              <button
                type="submit"
                className="h-10 px-4 text-xs tracking-[0.15em] uppercase border border-[color:var(--color-border)] hover:bg-[color:var(--color-surface-2)]"
              >
                Teslim edildi · arşivle
              </button>
            </form>
          )}
          {cancellable && (
            <form action={setOrderStatus.bind(null, order.id, "cancelled")}>
              <button
                type="submit"
                className="h-10 px-4 text-xs tracking-[0.15em] uppercase border border-[color:var(--color-border)] hover:bg-[color:var(--color-surface-2)]"
              >
                İptal edildi işaretle
              </button>
            </form>
          )}
        </div>
      )}

      {/* Alıcı */}
      <section className="border border-[color:var(--color-hairline)] rounded-lg p-5 mb-6">
        <h2 className="text-[11px] tracking-[0.2em] uppercase text-[color:var(--color-muted)] mb-3">
          Alıcı
        </h2>
        <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-1.5 text-sm">
          <dt className="text-[color:var(--color-muted)]">Ad</dt>
          <dd>{order.buyerName}</dd>
          <dt className="text-[color:var(--color-muted)]">E-posta</dt>
          <dd>
            <a
              href={`mailto:${order.buyerEmail}`}
              className="underline underline-offset-2"
            >
              {order.buyerEmail}
            </a>
          </dd>
          <dt className="text-[color:var(--color-muted)]">Telefon</dt>
          <dd>{order.buyerPhone}</dd>
          <dt className="text-[color:var(--color-muted)]">Adres</dt>
          <dd className="whitespace-pre-line">
            {order.addressLine}
            {order.city ? `\n${order.city}` : ""}
          </dd>
        </dl>
      </section>

      {/* Kalemler */}
      <section className="border border-[color:var(--color-hairline)] rounded-lg overflow-hidden mb-6">
        <ul className="divide-y divide-[color:var(--color-hairline)]">
          {items.map((it) => (
            <li
              key={it.id}
              className="flex items-center justify-between gap-4 px-5 py-3 text-sm"
            >
              <span className="min-w-0">
                <Link
                  href={`/urun/${it.slug}`}
                  target="_blank"
                  className="hover:underline"
                >
                  {it.title}
                </Link>
                <span className="text-[color:var(--color-muted)]">
                  {" "}
                  {formatTRY(Number(it.unitPriceTry))} × {it.qty}
                </span>
              </span>
              <span className="tabular-nums shrink-0">
                {formatTRY(Number(it.lineTotalTry))}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between px-5 py-3 border-t border-[color:var(--color-hairline)] bg-[color:var(--color-surface)]">
          <span className="text-sm uppercase tracking-wider">Toplam</span>
          <span className="font-medium tabular-nums">
            {formatTRY(Number(order.totalTry))}
          </span>
        </div>
      </section>

      {/* Ödeme */}
      <section className="text-xs text-[color:var(--color-muted)]">
        Ödeme: {order.paymentProvider || "—"}
        {order.paymentId ? ` · ${order.paymentId}` : ""}
      </section>
    </div>
  );
}
