/**
 * Callback'te "hangi yerel sipariş eşleşti" kararının saf mantığı — DB
 * çağrılarından ayrılmış, birim testte doğrudan çağrılabilir.
 *
 * Öncelik HER ZAMAN hash eşleşmesidir. Legacy (ham `paymentToken` kolonu)
 * eşleşmesi YALNIZ hash eşleşmesi yokken, cutover geçişindeki yarım kalmış
 * ödemeleri kaybetmemek için bir sonraki denemedir (bkz.
 * lib/db/orders.ts dbFindPendingOrderByLegacyToken).
 *
 * DÖNÜŞ null İSE BU BİR RET DEĞİLDİR: yalnız "hızlı yol bulunamadı" demektir.
 * Çağıran (route.ts) bu durumda iyzico'ya sorup basketId ile eşleştirir.
 * Ödeme doğruluğu bu fonksiyona DEĞİL, retrieve imzası + tutar kontrolüne
 * dayanır.
 */
import type { OrderWithItems } from "@/lib/db/orders";

export function resolveCallbackOrder(
  byHash: OrderWithItems | null,
  byLegacyToken: OrderWithItems | null,
): OrderWithItems | null {
  return byHash ?? byLegacyToken;
}
