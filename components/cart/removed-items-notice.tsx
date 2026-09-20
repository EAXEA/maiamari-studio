"use client";

import { useCart } from "@/components/cart/cart-provider";
import { unavailableMessage } from "@/lib/checkout/purchasable";

/**
 * Sepet tazelenirken satılamadığı için düşen kalemleri bildirir.
 *
 * Sessizce elemek yanlış: müşteri uzun süredir sepetinde duran bir ürünü
 * kaybettiğini görmeli. Fiyat değişimi için bildirim YOK (kullanıcı kararı,
 * 20.09.2026): sepet mağazadaki fiyatı gösterirse yeterli.
 */
export function RemovedItemsNotice() {
  const { removed, dismissRemoved } = useCart();
  if (removed.length === 0) return null;

  return (
    <div
      role="status"
      className="mb-8 border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium">Sepetiniz güncellendi.</p>
          <p className="mt-1 text-sm leading-relaxed text-[color:var(--color-muted)]">
            Şu ürünler artık satın alınamadığı için sepetinizden çıkarıldı:
          </p>
          <ul className="mt-2 space-y-1 text-sm leading-relaxed">
            {removed.map((r) => (
              <li key={r.id}>
                <span className="font-medium">{r.title}</span>{" "}
                <span className="text-[color:var(--color-muted)]">
                  {unavailableMessage(r.reason)}.
                </span>
              </li>
            ))}
          </ul>
        </div>
        <button
          type="button"
          onClick={dismissRemoved}
          className="shrink-0 h-8 px-3 inline-flex items-center text-xs tracking-[0.2em] uppercase text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)] transition-colors"
        >
          Tamam
        </button>
      </div>
    </div>
  );
}
