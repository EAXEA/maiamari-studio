"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/cart-provider";
import { CHECKOUT_ENABLED } from "@/lib/checkout/flags";

export function CartButton() {
  const { count, ready } = useCart();
  // Checkout kapalıyken (iyzico öncesi) sepet ikonu görünmez.
  if (!CHECKOUT_ENABLED) return null;
  const showBadge = ready && count > 0;

  return (
    <Link
      href="/cart"
      className="relative inline-flex items-center hover:opacity-60 shrink-0"
      aria-label={showBadge ? `Sepet, ${count} ürün` : "Sepet"}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        aria-hidden
      >
        <path d="M3 6h2l2.4 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.5L21 9H6" />
        <circle cx="10" cy="21" r="1.2" />
        <circle cx="17" cy="21" r="1.2" />
      </svg>
      {showBadge && (
        <span
          className="absolute -top-2 -right-2 min-w-[16px] h-4 px-1 inline-flex items-center justify-center text-[10px] font-medium rounded-full tabular-nums leading-none"
          style={{
            background: "var(--color-walnut-dark)",
            color: "var(--color-background)",
          }}
        >
          {count}
        </span>
      )}
    </Link>
  );
}
