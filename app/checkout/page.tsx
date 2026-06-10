"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/components/cart/cart-provider";
import { formatTRY } from "@/lib/format";
import { CHECKOUT_ENABLED } from "@/lib/checkout/flags";
import { startCheckout } from "./actions";

const FIELDS = [
  { name: "name", label: "Ad Soyad", type: "text", autoComplete: "name" },
  { name: "email", label: "E-posta", type: "email", autoComplete: "email" },
  { name: "phone", label: "Telefon", type: "tel", autoComplete: "tel" },
  { name: "city", label: "Şehir", type: "text", autoComplete: "address-level2" },
] as const;

export default function CheckoutPage() {
  const { items, total, ready } = useCart();
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!CHECKOUT_ENABLED) {
    return (
      <div className="container-x py-24 lg:py-32 text-center max-w-xl mx-auto">
        <h1 className="font-display text-3xl lg:text-4xl">
          Online ödeme yakında.
        </h1>
        <p className="mt-4 text-[color:var(--color-muted)]">
          Güvenli ödeme çok yakında açılıyor.
        </p>
        <Link
          href="/shop"
          className="mt-8 inline-flex h-11 px-6 items-center text-xs tracking-[0.2em] uppercase"
          style={{
            background: "var(--color-walnut-dark)",
            color: "var(--color-background)",
          }}
        >
          Mağazaya git
        </Link>
      </div>
    );
  }

  if (ready && items.length === 0) {
    return (
      <div className="container-x py-24 lg:py-32 text-center max-w-xl mx-auto">
        <h1 className="font-display text-3xl lg:text-4xl">Sepetiniz boş.</h1>
        <p className="mt-4 text-[color:var(--color-muted)]">
          Ödeme adımına geçmek için önce sepete ürün ekleyin.
        </p>
        <Link
          href="/shop"
          className="mt-8 inline-flex h-11 px-6 items-center text-xs tracking-[0.2em] uppercase"
          style={{
            background: "var(--color-walnut-dark)",
            color: "var(--color-background)",
          }}
        >
          Mağazaya git
        </Link>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await startCheckout({
      buyer: form,
      items: items.map((i) => ({ id: i.id, qty: i.qty })),
    });
    if (res.ok) {
      router.push(res.payUrl);
    } else {
      setError(res.error);
      setLoading(false);
    }
  }

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="container-x py-12 lg:py-16">
      <header className="mb-10">
        <Link
          href="/cart"
          className="text-[11px] tracking-[0.22em] uppercase text-[color:var(--color-muted)] hover:opacity-70"
        >
          Sepete dön
        </Link>
        <h1 className="font-display text-3xl lg:text-4xl mt-4">Ödeme</h1>
      </header>

      <form
        onSubmit={onSubmit}
        className="grid lg:grid-cols-[1.4fr_1fr] gap-12 lg:gap-16 items-start"
      >
        {/* Teslimat / iletişim */}
        <div>
          <h2 className="font-display text-xl mb-5">Teslimat bilgileri</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {FIELDS.map((f) => (
              <label key={f.name} className="block">
                <span className="block text-[11px] tracking-[0.2em] uppercase text-[color:var(--color-muted)] mb-1.5">
                  {f.label}
                </span>
                <input
                  type={f.type}
                  required
                  autoComplete={f.autoComplete}
                  value={form[f.name as keyof typeof form]}
                  onChange={(e) => set(f.name, e.target.value)}
                  className="w-full h-11 px-3 bg-[color:var(--color-surface)] border border-[color:var(--color-border)] text-sm outline-none focus:border-[color:var(--color-walnut-dark)]"
                />
              </label>
            ))}
            <label className="block sm:col-span-2">
              <span className="block text-[11px] tracking-[0.2em] uppercase text-[color:var(--color-muted)] mb-1.5">
                Adres
              </span>
              <textarea
                required
                autoComplete="street-address"
                rows={3}
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                className="w-full px-3 py-2 bg-[color:var(--color-surface)] border border-[color:var(--color-border)] text-sm outline-none focus:border-[color:var(--color-walnut-dark)] resize-none"
              />
            </label>
          </div>

          {error && (
            <p className="mt-4 text-sm text-[color:var(--color-press)]">{error}</p>
          )}
        </div>

        {/* Özet + öde */}
        <aside className="lg:sticky lg:top-28">
          <div className="border border-[color:var(--color-border)] p-6">
            <h2 className="font-display text-xl mb-5">Siparişiniz</h2>
            <ul className="space-y-3 text-sm">
              {items.map((it) => (
                <li key={it.id} className="flex justify-between gap-4">
                  <span className="min-w-0">
                    <span className="line-clamp-2">{it.title}</span>
                    <span className="text-[color:var(--color-muted)]">
                      {" "}
                      × {it.qty}
                    </span>
                  </span>
                  <span className="tabular-nums shrink-0">
                    {formatTRY(it.priceTry * it.qty)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-5 pt-5 border-t border-[color:var(--color-hairline)] flex justify-between items-baseline">
              <span className="text-sm uppercase tracking-wider">Toplam</span>
              <span className="font-display text-2xl font-medium tabular-nums">
                {formatTRY(total)}
              </span>
            </div>

            <button
              type="submit"
              disabled={loading || !ready}
              className="mt-6 w-full h-12 inline-flex items-center justify-center text-xs tracking-[0.2em] uppercase hover:opacity-90 disabled:opacity-60"
              style={{
                background: "var(--color-walnut-dark)",
                color: "var(--color-background)",
              }}
            >
              {loading ? "Yönlendiriliyor..." : "Ödemeye geç"}
            </button>
            <p className="mt-4 text-xs leading-relaxed text-[color:var(--color-muted)]">
              Ödemeler iyzico güvencesiyle alınır. Kart bilgileriniz bizde
              saklanmaz.
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
