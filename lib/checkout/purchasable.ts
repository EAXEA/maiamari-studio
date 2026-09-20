/**
 * Bir ürünün satın alınabilirlik kuralı — TEK KAYNAK.
 *
 * Hem `startCheckout` (siparişi oluştururken kalemleri eler) hem de sepet
 * tazeleme (`refreshCartItems`) bunu kullanır. İkisi ayrışırsa müşteri sepette
 * duran bir ürünü ödemede sessizce kaybeder; bu yüzden kural burada durur.
 */

export type PurchasableRow = {
  isPublished: boolean;
  forSale: boolean;
  status: string | null;
  priceTry: unknown;
};

/** Neden satılamıyor — müşteriye gösterilecek metni bu belirler. */
export type UnavailableReason = "sold_out" | "unavailable";

/**
 * Satın alınabiliyorsa `null`, alınamıyorsa sebebi döner.
 * Kayıt bulunamadıysa (silinmiş ürün) "unavailable".
 */
export function purchaseBlockReason(
  row: PurchasableRow | null | undefined,
): UnavailableReason | null {
  if (!row) return "unavailable";
  if (row.status === "out_of_stock") return "sold_out";
  if (!row.isPublished || !row.forSale) return "unavailable";
  const price = Number(row.priceTry);
  if (!(price > 0)) return "unavailable";
  return null;
}

export function unavailableMessage(reason: UnavailableReason): string {
  return reason === "sold_out" ? "tükendi" : "artık satışta değil";
}
