"use server";

import { redirect } from "next/navigation";
import { dbGetRowById } from "@/lib/db/products";
import {
  dbCreateOrder,
  dbGetOrder,
  dbMarkOrderPaid,
  dbMarkOrderFailed,
} from "@/lib/db/orders";
import { notifyNewOrder } from "@/lib/notify/order-email";
import { paymentMode } from "@/lib/payment/iyzico";
import { CHECKOUT_ENABLED } from "@/lib/checkout/flags";
import { grantOrderAccess, hasOrderAccess } from "@/lib/checkout/order-access";

export type CheckoutBuyer = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
};

export type CheckoutInput = {
  buyer: CheckoutBuyer;
  items: { id: string; qty: number }[];
};

export type CheckoutResult =
  | { ok: true; payUrl: string }
  | { ok: false; error: string };

/**
 * Sepeti siparişe çevirir. Fiyatlar DB'den YENİDEN hesaplanır (istemci
 * fiyatına güvenilmez), sipariş `pending` oluşturulur, ödeme adımına yönlendirir.
 */
export async function startCheckout(
  input: CheckoutInput,
): Promise<CheckoutResult> {
  if (!CHECKOUT_ENABLED) {
    return { ok: false, error: "Online ödeme şu an kapalı." };
  }
  const b = input?.buyer;
  if (
    !b?.name?.trim() ||
    !b?.email?.trim() ||
    !b?.phone?.trim() ||
    !b?.address?.trim() ||
    !b?.city?.trim()
  ) {
    return { ok: false, error: "Lütfen tüm alanları doldurun." };
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(b.email.trim())) {
    return { ok: false, error: "Geçerli bir e-posta adresi girin." };
  }
  if (!Array.isArray(input.items) || input.items.length === 0) {
    return { ok: false, error: "Sepetiniz boş." };
  }

  // Fiyatları DB'den otoriter al (materyal + galeri eseri; istemci fiyatına
  // güvenme). dbGetRowById kind filtresi uygulamaz → satılık eser de geçer;
  // yayında + forSale + fiyatı>0 olmayan kalemler elenir.
  const orderItems = [];
  for (const it of input.items) {
    const row = await dbGetRowById(it.id);
    if (!row || !row.isPublished || !row.forSale || row.status === "out_of_stock")
      continue;
    const price = Number(row.priceTry);
    if (!(price > 0)) continue;
    const qty = Math.max(1, Math.min(99, Math.floor(Number(it.qty) || 1)));
    orderItems.push({
      productId: row.id,
      slug: row.slug,
      title: row.title,
      unitPriceTry: price,
      qty,
    });
  }
  if (orderItems.length === 0) {
    return { ok: false, error: "Sepetinizdeki ürünler şu an satın alınamıyor." };
  }

  const total = orderItems.reduce((s, i) => s + i.unitPriceTry * i.qty, 0);
  const conversationId = crypto.randomUUID();
  const mode = paymentMode();

  const created = await dbCreateOrder({
    buyerName: b.name.trim(),
    buyerEmail: b.email.trim(),
    buyerPhone: b.phone.trim(),
    addressLine: b.address.trim(),
    city: b.city.trim(),
    totalTry: total,
    paymentProvider: mode,
    conversationId,
    items: orderItems,
  });
  if (!created) {
    return { ok: false, error: "Sipariş oluşturulamadı. Lütfen tekrar deneyin." };
  }

  // Sahiplik kanıtı: bu siparişe yalnız oluşturan tarayıcı erişebilsin
  // (IDOR + mock ödeme tetikleme koruması).
  await grantOrderAccess(created.id);

  // mock + iyzico modunda da aynı ödeme adımı sayfası (iyzico modunda iframe,
  // mock modunda test ödeme paneli render eder).
  return { ok: true, payUrl: `/checkout/odeme?order=${created.id}` };
}

/**
 * Mock (test) ödeme onayı → siparişi paid yapar, sonuç sayfasına gider.
 * GÜVENLİK: yalnız sandbox/mock modda ve yalnız siparişin sahibi (imzalı cookie)
 * çağırabilir. GERÇEK iyzico'da ödeme ASLA istemci tetikli action ile "paid"
 * yapılmaz; sadece iyzico callback/retrieve (response signature + tutar
 * doğrulamasıyla) status=paid yazar.
 */
export async function confirmMockPayment(orderId: string): Promise<void> {
  if (paymentMode() !== "mock") {
    throw new Error("Test ödeme yalnız sandbox modunda kullanılabilir.");
  }
  if (!(await hasOrderAccess(orderId))) redirect("/cart");
  await dbMarkOrderPaid(orderId, {
    paymentProvider: "mock",
    paymentId: `MOCK-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
  });
  // Sipariş bildirimi (Resend) — best-effort, akışı bozmaz. iyzico'da bu çağrı
  // callback/retrieve handler'ında (paid yazıldıktan sonra) yapılacak.
  try {
    const data = await dbGetOrder(orderId);
    if (data) await notifyNewOrder(data.order, data.items);
  } catch (e) {
    console.error("Sipariş bildirimi gönderilemedi:", e);
  }
  redirect(`/checkout/sonuc?order=${orderId}`);
}

/** Mock (test) ödeme iptali → siparişi cancelled yapar, sonuç sayfasına gider. */
export async function cancelMockPayment(orderId: string): Promise<void> {
  if (paymentMode() !== "mock") {
    throw new Error("Test ödeme yalnız sandbox modunda kullanılabilir.");
  }
  if (!(await hasOrderAccess(orderId))) redirect("/cart");
  await dbMarkOrderFailed(orderId, "cancelled");
  redirect(`/checkout/sonuc?order=${orderId}`);
}
