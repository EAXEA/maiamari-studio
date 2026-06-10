"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/components/cart/cart-provider";
import { formatTRY } from "@/lib/format";
import { CHECKOUT_ENABLED } from "@/lib/checkout/flags";

export default function CartPage() {
  const { items, setQty, remove, total, count, ready } = useCart();

  if (!CHECKOUT_ENABLED) {
    return (
      <div className="container-x py-24 lg:py-32 text-center max-w-xl mx-auto">
        <p className="text-xs tracking-[0.3em] uppercase text-[color:var(--color-muted)]">
          Sepet
        </p>
        <h1 className="font-display text-4xl lg:text-5xl mt-4">
          Online satın alma yakında.
        </h1>
        <p className="text-base text-[color:var(--color-muted)] mt-6 leading-relaxed">
          Güvenli ödeme çok yakında bu sayfada açılıyor.
        </p>
        <div className="mt-10">
          <Link
            href="/shop"
            className="inline-flex h-11 px-6 items-center text-xs tracking-[0.2em] uppercase hover:opacity-90"
            style={{
              background: "var(--color-walnut-dark)",
              color: "var(--color-background)",
            }}
          >
            Mağazaya git
          </Link>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="container-x py-24 text-center text-sm text-[color:var(--color-muted)]">
        Sepet yükleniyor...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-x py-24 lg:py-32 text-center max-w-xl mx-auto">
        <p className="text-xs tracking-[0.3em] uppercase text-[color:var(--color-muted)]">
          Sepet
        </p>
        <h1 className="font-display text-4xl lg:text-5xl mt-4">
          Sepetiniz şu an boş.
        </h1>
        <p className="text-base text-[color:var(--color-muted)] mt-6 leading-relaxed">
          Mağazadan beğendiğiniz parçaları sepete ekleyin, güvenli ödemeyle
          tamamlayın.
        </p>
        <div className="mt-10">
          <Link
            href="/shop"
            className="inline-flex h-11 px-6 items-center text-xs tracking-[0.2em] uppercase hover:opacity-90"
            style={{
              background: "var(--color-walnut-dark)",
              color: "var(--color-background)",
            }}
          >
            Mağazaya git
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-x py-12 lg:py-16">
      <header className="mb-10">
        <p className="text-xs tracking-[0.3em] uppercase text-[color:var(--color-muted)]">
          Sepet
        </p>
        <h1 className="font-display text-3xl lg:text-4xl mt-3">
          Sepetiniz ({count})
        </h1>
      </header>

      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-12 lg:gap-16 items-start">
        {/* Kalemler */}
        <ul className="divide-y divide-[color:var(--color-hairline)] border-y border-[color:var(--color-hairline)]">
          {items.map((it) => (
            <li key={it.id} className="py-5 flex gap-4 sm:gap-6">
              <Link
                href={it.href ?? `/urun/${it.slug}`}
                className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 bg-[color:var(--color-surface-2)] overflow-hidden"
              >
                {it.image && (
                  <Image
                    src={it.image}
                    alt={it.title}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                )}
              </Link>

              <div className="flex-1 min-w-0">
                <Link
                  href={it.href ?? `/urun/${it.slug}`}
                  className="font-display text-base sm:text-lg leading-snug hover:italic"
                  style={{ fontWeight: 500 }}
                >
                  {it.title}
                </Link>
                <p className="mt-1 text-sm tabular-nums text-[color:var(--color-muted)]">
                  {formatTRY(it.priceTry)}
                </p>

                <div className="mt-3 flex items-center gap-4">
                  {/* Adet */}
                  <div className="inline-flex items-center border border-[color:var(--color-border)]">
                    <button
                      type="button"
                      onClick={() => setQty(it.id, it.qty - 1)}
                      aria-label="Adedi azalt"
                      className="w-8 h-8 inline-flex items-center justify-center hover:bg-[color:var(--color-surface-2)]"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm tabular-nums">
                      {it.qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQty(it.id, it.qty + 1)}
                      aria-label="Adedi artır"
                      className="w-8 h-8 inline-flex items-center justify-center hover:bg-[color:var(--color-surface-2)]"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(it.id)}
                    className="text-xs tracking-wider uppercase text-[color:var(--color-muted)] hover:text-[color:var(--color-press)] transition-colors"
                  >
                    Kaldır
                  </button>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-sm font-medium tabular-nums">
                  {formatTRY(it.priceTry * it.qty)}
                </span>
              </div>
            </li>
          ))}
        </ul>

        {/* Özet */}
        <aside className="lg:sticky lg:top-28">
          <div className="border border-[color:var(--color-border)] p-6">
            <h2 className="font-display text-xl mb-5">Özet</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-[color:var(--color-muted)]">Ara toplam</dt>
                <dd className="tabular-nums">{formatTRY(total)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[color:var(--color-muted)]">Kargo</dt>
                <dd className="text-[color:var(--color-muted)]">
                  Ödeme adımında
                </dd>
              </div>
            </dl>
            <div className="mt-5 pt-5 border-t border-[color:var(--color-hairline)] flex justify-between items-baseline">
              <span className="text-sm uppercase tracking-wider">Toplam</span>
              <span className="font-display text-2xl font-medium tabular-nums">
                {formatTRY(total)}
              </span>
            </div>

            <Link
              href="/checkout"
              className="mt-6 w-full h-12 inline-flex items-center justify-center text-xs tracking-[0.2em] uppercase hover:opacity-90"
              style={{
                background: "var(--color-walnut-dark)",
                color: "var(--color-background)",
              }}
            >
              Ödemeye geç
            </Link>
            <Link
              href="/shop"
              className="mt-3 w-full inline-flex items-center justify-center text-xs tracking-[0.2em] uppercase text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)] py-2"
            >
              Alışverişe devam et
            </Link>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-[color:var(--color-muted)]">
            Ödemeler iyzico güvencesiyle alınır. Kart bilgileriniz bizde
            saklanmaz.
          </p>
        </aside>
      </div>
    </div>
  );
}
