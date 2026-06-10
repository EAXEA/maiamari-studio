import { redirect } from "next/navigation";
import Link from "next/link";
import { dbGetOrder } from "@/lib/db/orders";
import { hasOrderAccess } from "@/lib/checkout/order-access";
import { formatTRY } from "@/lib/format";
import { ClearCartOnSuccess } from "@/components/cart/clear-cart-on-success";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sipariş sonucu", robots: { index: false } };

export default async function SonucPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderId } = await searchParams;
  if (!orderId) redirect("/");
  // Sahiplik: yalnız siparişi oluşturan tarayıcı alıcı bilgilerini görebilir.
  if (!(await hasOrderAccess(orderId))) redirect("/");

  const data = await dbGetOrder(orderId);
  if (!data) redirect("/");

  const { order, items } = data;
  const paid = order.status === "paid";

  return (
    <div className="container-x py-16 lg:py-24 max-w-2xl mx-auto text-center">
      {paid && <ClearCartOnSuccess />}

      {paid ? (
        <>
          <div
            className="mx-auto w-14 h-14 rounded-full inline-flex items-center justify-center"
            style={{ background: "var(--color-mint)" }}
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-walnut-dark)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h1 className="font-display text-3xl lg:text-4xl mt-6">
            Siparişiniz alındı.
          </h1>
          <p className="mt-3 text-[color:var(--color-muted)]">
            Sipariş numaranız{" "}
            <strong className="font-medium text-[color:var(--color-foreground)]">
              {order.orderNo}
            </strong>
            . Teşekkür ederiz, {order.buyerName.split(" ")[0]}.
          </p>
        </>
      ) : (
        <>
          <h1 className="font-display text-3xl lg:text-4xl">
            Ödeme tamamlanmadı.
          </h1>
          <p className="mt-3 text-[color:var(--color-muted)]">
            {order.status === "cancelled"
              ? "Ödeme iptal edildi."
              : "Ödeme sırasında bir sorun oluştu."}{" "}
            Sepetiniz korunuyor, tekrar deneyebilirsiniz.
          </p>
        </>
      )}

      {/* Sipariş özeti */}
      <div className="mt-10 text-left border border-[color:var(--color-border)]">
        <ul className="divide-y divide-[color:var(--color-hairline)]">
          {items.map((it) => (
            <li
              key={it.id}
              className="flex justify-between gap-4 px-5 py-3 text-sm"
            >
              <span className="min-w-0">
                {it.title}
                <span className="text-[color:var(--color-muted)]"> × {it.qty}</span>
              </span>
              <span className="tabular-nums shrink-0">
                {formatTRY(Number(it.lineTotalTry))}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between items-baseline px-5 py-4 border-t border-[color:var(--color-hairline)]">
          <span className="text-sm uppercase tracking-wider">Toplam</span>
          <span className="font-display text-xl font-medium tabular-nums">
            {formatTRY(Number(order.totalTry))}
          </span>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap gap-3 justify-center">
        {paid ? (
          <Link
            href="/shop"
            className="inline-flex h-11 px-6 items-center text-xs tracking-[0.2em] uppercase hover:opacity-90"
            style={{
              background: "var(--color-walnut-dark)",
              color: "var(--color-background)",
            }}
          >
            Mağazaya dön
          </Link>
        ) : (
          <Link
            href="/cart"
            className="inline-flex h-11 px-6 items-center text-xs tracking-[0.2em] uppercase hover:opacity-90"
            style={{
              background: "var(--color-walnut-dark)",
              color: "var(--color-background)",
            }}
          >
            Sepete dön
          </Link>
        )}
      </div>
    </div>
  );
}
