"use client";

import { useEffect, useRef } from "react";
import { useCart } from "@/components/cart/cart-provider";

/**
 * Başarılı sipariş sonuç sayfasında sepeti bir kez temizler.
 * DİKKAT: `ready` beklenir — iyzico dönüşü TAM sayfa yüklemedir, provider
 * yeniden mount olur; çocuk effect'i önce koştuğu için ready'siz clear()
 * localStorage yüklemesi tarafından EZİLİYORDU (sepet dolu kalıyordu).
 */
export function ClearCartOnSuccess() {
  const { clear, ready } = useCart();
  const done = useRef(false);
  useEffect(() => {
    if (!ready || done.current) return;
    done.current = true;
    clear();
  }, [ready, clear]);
  return null;
}
