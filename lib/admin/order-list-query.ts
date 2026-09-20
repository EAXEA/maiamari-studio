/**
 * Admin sipariş listesinin URL parametrelerini okur: sekme, sayfa, sıralama.
 * Saf fonksiyon, testlidir (client-safe).
 *
 * NEDEN AYRI: sayfalama ile sıralama birlikte yanlış kurulursa hata sinsi olur
 * (kayıt atlanır ya da iki sayfada birden görünür). Kuralı burada tek yerde
 * tutup test ediyoruz.
 */

export const ORDERS_PAGE_SIZE = 25;

export type OrdersTab = "aktif" | "arsiv";
export type OrdersSort = "tarih" | "tutar";
export type OrdersDir = "asc" | "desc";

export type OrdersQuery = {
  tab: OrdersTab;
  page: number;
  sort: OrdersSort;
  dir: OrdersDir;
  /** SQL offset — sayfa numarasından türer. */
  offset: number;
};

type RawParams = {
  tab?: string;
  page?: string;
  sirala?: string;
  yon?: string;
};

/**
 * Varsayılan: aktif sekme, 1. sayfa, tarihe göre AZALAN (en yeni önce).
 * Tanınmayan veya bozuk değerler sessizce varsayılana döner; panelde 400
 * göstermenin anlamı yok.
 */
export function parseOrdersQuery(raw: RawParams): OrdersQuery {
  const tab: OrdersTab = raw.tab === "arsiv" ? "arsiv" : "aktif";
  const sort: OrdersSort = raw.sirala === "tutar" ? "tutar" : "tarih";
  const dir: OrdersDir = raw.yon === "asc" ? "asc" : "desc";
  const n = Number.parseInt(raw.page ?? "1", 10);
  const page = Number.isFinite(n) && n > 0 ? n : 1;
  return { tab, page, sort, dir, offset: (page - 1) * ORDERS_PAGE_SIZE };
}

/** Verilen değişikliklerle yeni bir sorgu dizgisi kurar (linkler için). */
export function ordersHref(
  q: OrdersQuery,
  patch: Partial<Pick<OrdersQuery, "tab" | "page" | "sort" | "dir">> = {},
): string {
  const next = { ...q, ...patch };
  const p = new URLSearchParams();
  if (next.tab !== "aktif") p.set("tab", next.tab);
  if (next.sort !== "tarih") p.set("sirala", next.sort);
  if (next.dir !== "desc") p.set("yon", next.dir);
  if (next.page > 1) p.set("page", String(next.page));
  const qs = p.toString();
  return qs ? `/admin/orders?${qs}` : "/admin/orders";
}

/**
 * Bir sütun başlığına tıklanınca ne olmalı: aynı sütunsa yön değişir, farklı
 * sütunsa o sütuna azalan sırada geçilir. Sıralama değişince sayfa 1'e döner,
 * yoksa kullanıcı 3. sayfada bambaşka bir kümenin ortasına düşer.
 */
export function toggleSortPatch(
  q: OrdersQuery,
  sort: OrdersSort,
): Partial<Pick<OrdersQuery, "tab" | "page" | "sort" | "dir">> {
  if (q.sort === sort) {
    return { dir: q.dir === "desc" ? "asc" : "desc", page: 1 };
  }
  return { sort, dir: "desc", page: 1 };
}

/** Toplam kayıt sayısından sayfa sayısı (en az 1). */
export function pageCount(total: number): number {
  return Math.max(1, Math.ceil(total / ORDERS_PAGE_SIZE));
}
