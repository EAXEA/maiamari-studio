/**
 * Sipariş veri katmanı — checkout akışı buraya yazar, sonuç/sipariş sayfaları
 * buradan okur. Fiyatlar sipariş anında DB'den hesaplanıp burada dondurulur.
 */
import { getDb } from "./client";
import { orders, orderItems, type OrderRow, type OrderItemRow } from "./schema";
import { eq, desc, inArray, notInArray, count } from "drizzle-orm";
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

/** Ödeme başarılı: status=paid + ödeme referansları. */
export async function dbMarkOrderPaid(
  id: string,
  ref: { paymentProvider?: string; paymentId?: string; paymentToken?: string },
): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db
    .update(orders)
    .set({
      status: "paid",
      paymentProvider: ref.paymentProvider,
      paymentId: ref.paymentId,
      paymentToken: ref.paymentToken,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, id));
}

/**
 * Initialize'da üretilen CF token'ını siparişe iliştirir (takip/teşhis).
 * Aynı sipariş için yeniden initialize edilirse son token yazılır; ödeme
 * doğrulaması token eşitliğine değil retrieve imzası + basketId'ye dayanır.
 */
export async function dbSetOrderPaymentToken(
  id: string,
  token: string,
): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db
    .update(orders)
    .set({ paymentToken: token, updatedAt: new Date() })
    .where(eq(orders.id, id));
}

/** Ödeme başarısız / iptal. */
export async function dbMarkOrderFailed(
  id: string,
  status: "failed" | "cancelled" = "failed",
): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(eq(orders.id, id));
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
