/**
 * Sipariş veri katmanı — checkout akışı buraya yazar, sonuç/sipariş sayfaları
 * buradan okur. Fiyatlar sipariş anında DB'den hesaplanıp burada dondurulur.
 */
import { getDb } from "./client";
import { orders, orderItems, type OrderRow, type OrderItemRow } from "./schema";
import { and, eq, desc, inArray, notInArray, count } from "drizzle-orm";
import { ARCHIVED_STATUSES } from "@/lib/order-status";

export type NewOrderInput = {
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  addressLine: string;
  city: string;
  totalTry: number;
  paymentProvider: string;
  conversationId: string;
  items: {
    productId: string;
    slug: string;
    title: string;
    unitPriceTry: number;
    qty: number;
  }[];
};

export type OrderWithItems = { order: OrderRow; items: OrderItemRow[] };

/** İnsan-okur sipariş no: MA-YYYYMMDD-XXXX (XXXX = uuid başı, büyük harf). */
function makeOrderNo(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate(),
  ).padStart(2, "0")}`;
  const rand = crypto.randomUUID().slice(0, 4).toUpperCase();
  return `MA-${ymd}-${rand}`;
}

/** Yeni sipariş + kalemleri oluşturur (status pending). Order id döner. */
export async function dbCreateOrder(
  input: NewOrderInput,
): Promise<{ id: string; orderNo: string } | null> {
  const db = getDb();
  if (!db) return null;

  const id = crypto.randomUUID();
  const orderNo = makeOrderNo();

  await db.insert(orders).values({
    id,
    orderNo,
    status: "pending",
    buyerName: input.buyerName,
    buyerEmail: input.buyerEmail,
    buyerPhone: input.buyerPhone,
    addressLine: input.addressLine,
    city: input.city,
    totalTry: input.totalTry.toFixed(2),
    currency: "TRY",
    paymentProvider: input.paymentProvider,
    conversationId: input.conversationId,
  });

  if (input.items.length > 0) {
    await db.insert(orderItems).values(
      input.items.map((it) => ({
        id: crypto.randomUUID(),
        orderId: id,
        productId: it.productId,
        slug: it.slug,
        title: it.title,
        unitPriceTry: it.unitPriceTry.toFixed(2),
        qty: it.qty,
        lineTotalTry: (it.unitPriceTry * it.qty).toFixed(2),
      })),
    );
  }

  return { id, orderNo };
}

export async function dbGetOrder(id: string): Promise<OrderWithItems | null> {
  const db = getDb();
  if (!db) return null;
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) return null;
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, id));
  return { order, items };
}

/**
 * Callback'te ham token'ı işlemeden önceki ucuz yerel kontrol: token'ın
 * sha256 hash'i initialize sırasında kaydettiğimiz `paymentTokenHash` ile
 * eşleşiyor mu. Eşleşmezse çağıran iyzico'ya HİÇ gitmeden reddedebilir.
 */
export async function dbFindOrderByTokenHash(
  tokenHash: string,
): Promise<OrderWithItems | null> {
  const db = getDb();
  if (!db) return null;
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.paymentTokenHash, tokenHash))
    .limit(1);
  if (!order) return null;
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));
  return { order, items };
}

/**
 * CUTOVER UYUMLULUĞU (2026-07): bu hash-tabanlı eşleştirme deploy edilmeden
 * ÖNCE initialize edilmiş siparişlerde `paymentTokenHash` YOK, yalnız eski
 * ham `paymentToken` kolonu dolu. Bu fonksiyon YALNIZ `dbFindOrderByTokenHash`
 * sonuçsuz kalınca, ve YALNIZ `pending` siparişler arasında ham token'ı
 * arar — geçiş dönemindeki yarım kalmış ödemeler callback'i kaybetmesin diye.
 * Kalıcı yol DEĞİLDİR: bulunan sipariş için ham token hiçbir yere YENİDEN
 * yazılmaz/loglanmaz; asıl otorite (imza+tutar doğrulaması) değişmez.
 */
export async function dbFindPendingOrderByLegacyToken(
  token: string,
): Promise<OrderWithItems | null> {
  const db = getDb();
  if (!db) return null;
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.paymentToken, token), eq(orders.status, "pending")))
    .limit(1);
  if (!order) return null;
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));
  return { order, items };
}

/**
 * Ödeme başarılı: status=paid + ödeme referansları. Yalnız `pending` siparişi
 * günceller (koşullu UPDATE) → eşzamanlı/tekrarlanan callback'te ikinci çağrı
 * false döner ve çağıran bildirimi atlar (çifte e-posta koruması).
 */
export async function dbMarkOrderPaid(
  id: string,
  ref: { paymentProvider?: string; paymentId?: string },
): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  const updated = await db
    .update(orders)
    .set({
      status: "paid",
      paymentProvider: ref.paymentProvider,
      paymentId: ref.paymentId,
      updatedAt: new Date(),
    })
    .where(and(eq(orders.id, id), eq(orders.status, "pending")))
    .returning({ id: orders.id });
  return updated.length > 0;
}

/**
 * Initialize'da üretilen CF sonucunu siparişe iliştirir: ham token DEĞİL,
 * yalnız sha256 hash'i + üretim zamanı (teşhis). Hosted ödeme sayfası URL'i
 * BİLİNÇLİ olarak saklanmaz — okuyucusu yok, canlı ödeme oturumu linkini
 * boşuna tutmayız (bkz. schema.ts paymentPageUrl yorumu).
 *
 * Callback siparişi bu hash'e göre bulmayı DENER; bulamazsa iyzico'ya sorup
 * basketId ile eşleştirir (bkz. route.ts) — yani hash, doğruluğun değil
 * yalnız hızlı yolun anahtarıdır. Aynı sipariş yeniden initialize edilirse
 * son hash yazılır ve öncekinin hızlı yolu kaybolur; o durumda callback
 * otomatik olarak iyzico-otoriter yola düşer, ödeme kaybolmaz.
 */
export async function dbSetOrderPaymentInit(
  id: string,
  init: { tokenHash: string },
): Promise<void> {
  const db = getDb();
  if (!db) return;
  const now = new Date();
  await db
    .update(orders)
    .set({
      paymentTokenHash: init.tokenHash,
      paymentTokenIssuedAt: now,
      updatedAt: now,
    })
    .where(eq(orders.id, id));
}

/** Ödeme başarısız / iptal. Yalnız `pending` siparişi günceller — geç gelen
 *  FAILURE callback'i paid olmuş siparişi ezemesin. */
export async function dbMarkOrderFailed(
  id: string,
  status: "failed" | "cancelled" = "failed",
): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(orders.id, id), eq(orders.status, "pending")));
}

/** Admin: aktif siparişler (arşiv durumları hariç; işlem bekleyen küçük küme). */
export async function dbGetActiveOrders(): Promise<OrderRow[]> {
  const db = getDb();
  if (!db) return [];
  return db
    .select()
    .from(orders)
    .where(notInArray(orders.status, [...ARCHIVED_STATUSES]))
    .orderBy(desc(orders.createdAt));
}

/**
 * Admin: arşiv siparişleri sayfalı (en yeni önce) + toplam sayı.
 * Arşiv sınırsız büyür; tek seferde tamamını belleğe çekmemek için limit/offset.
 */
export async function dbGetArchivedOrders(
  limit: number,
  offset: number,
): Promise<{ rows: OrderRow[]; total: number }> {
  const db = getDb();
  if (!db) return { rows: [], total: 0 };
  const where = inArray(orders.status, [...ARCHIVED_STATUSES]);
  const [rows, totals] = await Promise.all([
    db
      .select()
      .from(orders)
      .where(where)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ value: count() }).from(orders).where(where),
  ]);
  return { rows, total: totals[0]?.value ?? 0 };
}

/** Admin: sipariş durumunu günceller (kargo/teslim yaşam döngüsü). */
export async function dbSetOrderStatus(
  id: string,
  status: string,
): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(eq(orders.id, id));
}
