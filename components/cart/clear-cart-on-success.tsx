"use client";

import { useEffect, useRef } from "react";
import { useCart } from "@/components/cart/cart-provider";

/** Başarılı sipariş sonuç sayfasında sepeti bir kez temizler. */
export function ClearCartOnSuccess() {
  const { clear } = useCart();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    clear();
  }, [clear]);
  return null;
}
