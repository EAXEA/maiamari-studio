"use server";

import { getDb } from "@/lib/db/client";
import { dbGetRowById } from "@/lib/db/products";
import {
  purchaseBlockReason,
  type UnavailableReason,
} from "@/lib/checkout/purchasable";

export type CartRefreshItem = {
  id: string;
  /** İstemcideki başlık — ürün DB'den silinmişse bildirimde bu kullanılır. */
  title: string;
};

export type CartRefreshResult = {
  /** Hâlâ satılan kalemlerin GÜNCEL fiyat ve başlıkları. */
  current: { id: string; priceTry: number; title: string; slug: string }[];
  /** Artık satılamayan, sepetten düşülecek kalemler. */
  removed: { id: string; title: string; reason: UnavailableReason }[];
};

/** Tek seferde tazelenecek kalem tavanı. */
const MAX_ITEMS = 100;

const NO_CHANGE: CartRefreshResult = { current: [], removed: [] };

/**
 * Sepetteki kalemleri DB gerçeğiyle uzlaştırır.
 *
 * Neden: `CartItem.priceTry` localStorage'a donuyor; ürün fiyatı değişince
 * müşteri sepette eski fiyatı görüyordu (ödeme zaten DB fiyatından yapılıyor,
 * sorun gösterimdeydi). Eleme kuralı `startCheckout` ile AYNI kaynaktan gelir
 * (`lib/checkout/purchasable`), yoksa sepette duran kalem ödemede sessizce
 * elenir.
 *
 * Emin olmadığında SEPETE DOKUNMAZ: DB kapalıysa ya da okuma patlarsa kalem
 * olduğu gibi kalır. Yanlış tarafa hata yapmak müşterinin sepetini boşaltır.
 */
export async function refreshCartItems(
  items: CartRefreshItem[],
): Promise<CartRefreshResult> {
  if (!Array.isArray(items) || items.length === 0) return NO_CHANGE;

  // DB yoksa dbGetRowById her ürün için null döner; bu "ürün silinmiş" gibi
  // okunup TÜM sepeti boşaltırdı. Böyle bir durumda hiç tazeleme yapma.
  if (!getDb()) return NO_CHANGE;

  const result: CartRefreshResult = { current: [], removed: [] };
  for (const it of items.slice(0, MAX_ITEMS)) {
    const id = typeof it?.id === "string" ? it.id : "";
    if (!id) continue;
    const fallbackTitle = typeof it?.title === "string" ? it.title : "Ürün";

    let row;
    try {
      row = await dbGetRowById(id);
    } catch (e) {
      console.error("Sepet tazeleme okunamadı:", e);
      continue;
    }

    if (!row) {
      result.removed.push({
        id,
        title: fallbackTitle,
        reason: "unavailable",
      });
      continue;
    }
    const reason = purchaseBlockReason(row);
    if (reason) {
      result.removed.push({ id, title: row.title || fallbackTitle, reason });
      continue;
    }
    result.current.push({
      id,
      priceTry: Number(row.priceTry),
      title: row.title,
      slug: row.slug,
    });
  }
  return result;
}
