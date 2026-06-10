/**
 * Misafir (hesapsız) checkout için sipariş sahiplik kontrolü.
 *
 * Sipariş oluşturulurken HMAC imzalı, HttpOnly bir cookie verilir; ödeme ve
 * sonuç sayfaları ile mock onay/iptal action'ları bu cookie'yi doğrular.
 * Böylece orderId'yi bilen/üreten başkası siparişi göremez (IDOR) veya
 * ödeme adımını tetikleyemez. Sadece sunucu tarafında kullanılır.
 */
import { cookies } from "next/headers";
import crypto from "node:crypto";

const COOKIE = "mai_order";

function secret(): string {
  // Dedicated değişken varsa onu, yoksa zaten zorunlu olan ADMIN_SESSION_SECRET'i
  // kullan. Hardcoded fallback YOK: secret yoksa imza forge edilebilir olurdu
  // (IDOR + ödeme sahiplik bypass), bu yüzden hard-fail.
  const s = process.env.ORDER_ACCESS_SECRET || process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error(
      "ORDER_ACCESS_SECRET veya ADMIN_SESSION_SECRET gerekli (en az 16 karakter).",
    );
  }
  return s;
}

function mac(orderId: string): string {
  return crypto.createHmac("sha256", secret()).update(orderId).digest("hex");
}

/** Sipariş oluşturulduğunda çağrılır (server action). Sahiplik cookie'sini yazar. */
export async function grantOrderAccess(orderId: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, `${orderId}.${mac(orderId)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 saat
  });
}

/** İstek sahibinin bu siparişe erişimi var mı (imzalı cookie eşleşiyor mu). */
export async function hasOrderAccess(orderId: string): Promise<boolean> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return false;
  const dot = raw.lastIndexOf(".");
  if (dot < 0) return false;
  const id = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  if (id !== orderId) return false;
  const expected = mac(orderId);
  if (sig.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}
