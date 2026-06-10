"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/cart-provider";
import { CHECKOUT_ENABLED } from "@/lib/checkout/flags";

type Props = {
  id: string;
  slug: string;
  title: string;
  priceTry: number;
  image: string;
  outOfStock?: boolean;
  /** Kanonik görüntüleme linki. Varsayılan ürün sayfası; eserlerde galeri yolu. */
  href?: string;
};

/**
 * Sepete ekleme aksiyonu (ürün sayfası + galeri eseri). Shopier/WhatsApp
 * sipariş CTA'larının yerine geçer: "Sepete ekle" + "Hemen al" (checkout'a gider).
 */
export function AddToCart({
  id,
  slug,
  title,
  priceTry,
  image,
  outOfStock,
  href,
}: Props) {
  const { add } = useCart();
  const router = useRouter();
  const [added, setAdded] = useState(false);

  if (outOfStock) {
    return (
      <p className="mt-6 text-sm uppercase tracking-widest text-[color:var(--color-press)]">
        Şu an stokta yok
      </p>
    );
  }

  // iyzico hazır olana kadar checkout kapalı: satın alma gizli, "yakında".
  if (!CHECKOUT_ENABLED) {
    return (
      <p className="mt-6 text-sm" style={{ color: "var(--color-muted)" }}>
        Online ödeme yakında.
      </p>
    );
  }

  const item = { id, slug, title, priceTry, image, href: href ?? `/urun/${slug}` };

  return (
    <div className="mt-8">
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => {
            add(item);
            setAdded(true);
            window.setTimeout(() => setAdded(false), 1800);
          }}
          className="flex-1 h-12 text-xs tracking-[0.2em] uppercase transition-opacity hover:opacity-90 active:opacity-80"
          style={{
            background: "var(--color-walnut-dark)",
            color: "var(--color-background)",
          }}
        >
          {added ? "Sepete eklendi" : "Sepete ekle"}
        </button>
        <button
          type="button"
          onClick={() => {
            add(item);
            router.push("/checkout");
          }}
          className="h-12 px-6 inline-flex items-center text-xs tracking-[0.2em] uppercase border transition-colors hover:bg-[color:var(--color-foreground)] hover:text-[color:var(--color-background)]"
          style={{
            borderColor: "var(--color-foreground)",
            color: "var(--color-foreground)",
          }}
        >
          Hemen al
        </button>
      </div>
      <p className="mt-3 text-xs" style={{ color: "var(--color-muted)" }}>
        Güvenli ödeme. Siparişiniz özenle paketlenip kargoyla gönderilir.
      </p>
    </div>
  );
}
