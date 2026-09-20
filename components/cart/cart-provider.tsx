"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { refreshCartItems } from "@/app/cart/actions";
import type { UnavailableReason } from "@/lib/checkout/purchasable";

export type CartItem = {
  id: string;
  slug: string;
  title: string;
  priceTry: number;
  image: string;
  qty: number;
  /** Öğenin kanonik görüntüleme linki (materyal: /urun/slug, eser: /galeri/seri). */
  href: string;
};

/** Tazeleme sırasında sepetten düşen kalem — müşteriye gösterilir. */
export type RemovedCartItem = {
  id: string;
  title: string;
  reason: UnavailableReason;
};

type CartContextValue = {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  count: number;
  total: number;
  /** localStorage yüklendi mi (SSR/hydration güvenli sayaç için). */
  ready: boolean;
  /** Tazelemede satılamadığı için düşen kalemler (bildirim için). */
  removed: RemovedCartItem[];
  /** Bildirimi kapat. */
  dismissRemoved: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "maiamari_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [removed, setRemoved] = useState<RemovedCartItem[]>([]);
  const refreshed = useRef(false);

  // localStorage'tan yükle (yalnız client). set-state-in-effect kalıbı bilinçli.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      // bozuk veri → boş sepetle devam
    }
    setReady(true);
  }, []);

  // Değişiklikte kaydet.
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // kota / private mode → sessiz geç
    }
  }, [items, ready]);

  // Sepeti DB gerçeğiyle bir kez uzlaştır: fiyatlar sessizce güncellenir
  // (localStorage'a donmuş fiyat yanlış gösteriyordu), satılamayan kalemler
  // düşürülür ve müşteriye bildirilir. Oturum başına tek kez.
  useEffect(() => {
    if (!ready || refreshed.current) return;
    refreshed.current = true;
    if (items.length === 0) return;
    const snapshot = items.map((i) => ({ id: i.id, title: i.title }));
    let cancelled = false;
    void (async () => {
      try {
        const res = await refreshCartItems(snapshot);
        if (cancelled) return;
        if (res.current.length === 0 && res.removed.length === 0) return;
        const fresh = new Map(res.current.map((c) => [c.id, c]));
        const gone = new Set(res.removed.map((r) => r.id));
        setItems((prev) =>
          prev
            .filter((p) => !gone.has(p.id))
            .map((p) => {
              const f = fresh.get(p.id);
              return f ? { ...p, priceTry: f.priceTry, title: f.title } : p;
            }),
        );
        if (res.removed.length > 0) setRemoved(res.removed);
      } catch {
        // Tazeleme başarısızsa sepet olduğu gibi kalır.
      }
    })();
    return () => {
      cancelled = true;
    };
    // items kasten bağımlılık DEĞİL: tazeleme bir kez, ilk yüklemedeki
    // sepetle koşar; aksi halde kendi setItems'i sonsuz döngü yapar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const dismissRemoved = useCallback(() => setRemoved([]), []);

  const add = useCallback((item: Omit<CartItem, "qty">, qty = 1) => {
    setItems((prev) => {
      const i = prev.findIndex((p) => p.id === item.id);
      if (i >= 0) {
        const copy = [...prev];
        copy[i] = { ...copy[i], qty: copy[i].qty + qty };
        return copy;
      }
      return [...prev, { ...item, qty }];
    });
  }, []);

  const remove = useCallback(
    (id: string) => setItems((prev) => prev.filter((p) => p.id !== id)),
    [],
  );

  const setQty = useCallback((id: string, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((p) => p.id !== id)
        : prev.map((p) => (p.id === id ? { ...p, qty } : p)),
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);
  const total = useMemo(
    () => items.reduce((s, i) => s + i.priceTry * i.qty, 0),
    [items],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      add,
      remove,
      setQty,
      clear,
      count,
      total,
      ready,
      removed,
      dismissRemoved,
    }),
    [
      items,
      add,
      remove,
      setQty,
      clear,
      count,
      total,
      ready,
      removed,
      dismissRemoved,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
