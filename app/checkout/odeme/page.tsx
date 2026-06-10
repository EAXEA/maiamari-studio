import { redirect } from "next/navigation";
import { dbGetOrder } from "@/lib/db/orders";
import { paymentMode } from "@/lib/payment/iyzico";
import { hasOrderAccess } from "@/lib/checkout/order-access";
import { confirmMockPayment, cancelMockPayment } from "../actions";
import { formatTRY } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ödeme", robots: { index: false } };

export default async function OdemePage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderId } = await searchParams;
  if (!orderId) redirect("/cart");
  // Sahiplik: yalnız siparişi oluşturan tarayıcı görebilir (IDOR koruması).
  if (!(await hasOrderAccess(orderId))) redirect("/cart");

  const data = await dbGetOrder(orderId);
  if (!data) redirect("/cart");

  const { order, items } = data;
  if (order.status !== "pending") {
    redirect(`/checkout/sonuc?order=${order.id}`);
  }

  const mode = paymentMode();
  const confirm = confirmMockPayment.bind(null, order.id);
  const cancel = cancelMockPayment.bind(null, order.id);

  return (
    <div className="container-x py-12 lg:py-16 max-w-2xl mx-auto">
      <p className="text-xs tracking-[0.3em] uppercase text-[color:var(--color-muted)]">
        Ödeme · {order.orderNo}
      </p>
      <h1 className="font-display text-3xl lg:text-4xl mt-3">
        Ödemeyi tamamlayın
      </h1>

      {/* Sipariş özeti */}
      <div className="mt-8 border border-[color:var(--color-border)]">
        <ul className="divide-y divide-[color:var(--color-hairline)]">
          {items.map((it) => (
            <li key={it.id} className="flex justify-between gap-4 px-5 py-3 text-sm">
              <span className="min-w-0">
                {it.title}
                <span className="text-[color:var(--color-muted)]">
                  {" "}
                  × {it.qty}
                </span>
              </span>
              <span className="tabular-nums shrink-0">
                {formatTRY(Number(it.lineTotalTry))}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between items-baseline px-5 py-4 border-t border-[color:var(--color-hairline)]">
          <span className="text-sm uppercase tracking-wider">Toplam</span>
          <span className="font-display text-2xl font-medium tabular-nums">
            {formatTRY(Number(order.totalTry))}
          </span>
        </div>
      </div>

      {/* Ödeme adımı */}
      {mode === "mock" ? (
        <div
          className="mt-8 p-6 border"
          style={{
            borderColor: "var(--color-accent-pink)",
            background: "var(--color-surface)",
          }}
        >
          <p className="text-[11px] tracking-[0.22em] uppercase font-medium text-[color:var(--color-walnut-dark)]">
            Sandbox · Test ödeme
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-muted)]">
            iyzico anahtarları bağlanınca burada gerçek iyzico Checkout Form
            (kart girişi, 3D Secure) iframe olarak görünecek ve kart verisi bizde
            saklanmayacak. Şimdilik akışı görmek için ödemeyi test edebilirsiniz.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <form action={confirm} className="flex-1">
              <button
                type="submit"
                className="w-full h-12 text-xs tracking-[0.2em] uppercase hover:opacity-90"
                style={{
                  background: "var(--color-walnut-dark)",
                  color: "var(--color-background)",
                }}
              >
                Ödemeyi tamamla (test)
              </button>
            </form>
            <form action={cancel} className="sm:w-auto">
              <button
                type="submit"
                className="w-full h-12 px-6 text-xs tracking-[0.2em] uppercase border transition-colors hover:bg-[color:var(--color-foreground)] hover:text-[color:var(--color-background)]"
                style={{
                  borderColor: "var(--color-foreground)",
                  color: "var(--color-foreground)",
                }}
              >
                İptal et
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="mt-8 p-6 border border-[color:var(--color-border)] text-sm text-[color:var(--color-muted)]">
          iyzico Checkout Form burada yüklenecek.
        </div>
      )}
    </div>
  );
}
