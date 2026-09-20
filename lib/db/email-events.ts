/**
 * MAIAMARI.STUDIO — E-posta gönderim kaydı (server-only)
 * -------------------------------------------------------
 * NEDEN VAR: sipariş mailleri best-effort gönderiliyor ve hatası yutuluyor
 * (lib/notify/order-email.ts). Bir mail düştüğünde geriye iz kalmıyordu;
 * Vercel logu da kısa ömürlü. Bu tablo /admin/health'in "e-posta gönderimi"
 * kartını besler, yani bir gönderim düştüğünde panelde görünür.
 *
 * Yazma HER ZAMAN best-effort: log düşerse mail akışı da sipariş akışı da
 * etkilenmez. Bu yüzden tüm fonksiyonlar hata yutar.
 */
import { desc, gte } from "drizzle-orm";
import { getDb } from "./client";
import { emailEvents, type EmailEventRow } from "./schema";

export type EmailKind = "order_seller" | "order_customer" | "payment_attention";

/** Hata metninin saklanacak azami uzunluğu; sağlayıcı bazen HTML döndürüyor. */
const MAX_ERROR = 300;

/**
 * Alıcı adresini maskeler: `fatmazehrauygun42@gmail.com` → `f***@gmail.com`.
 * Açık adres zaten sipariş kaydında var; burada ikinci kopyasını tutmuyoruz.
 * Adres değilse (boş, "@" yok) olduğu gibi değil, sabit bir işaret döner.
 */
export function maskEmail(input: string): string {
  const v = (input || "").trim();
  const at = v.lastIndexOf("@");
  if (at <= 0 || at === v.length - 1) return v ? "***" : "";
  const local = v.slice(0, at);
  const domain = v.slice(at + 1);
  return `${local[0]}***@${domain}`;
}

/** Bir gönderim denemesini kaydeder. Hata yutulur (best-effort). */
export async function dbLogEmailEvent(input: {
  kind: EmailKind;
  orderNo?: string;
  recipient?: string;
  ok: boolean;
  httpStatus?: number | null;
  providerId?: string;
  error?: string;
}): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    await db.insert(emailEvents).values({
      id: crypto.randomUUID(),
      kind: input.kind,
      orderNo: input.orderNo ?? "",
      recipientMasked: maskEmail(input.recipient ?? ""),
      ok: input.ok,
      httpStatus: input.httpStatus ?? null,
      providerId: input.providerId ?? "",
      error: (input.error ?? "").slice(0, MAX_ERROR),
    });
  } catch {
    // Sessiz: gönderim kaydı tutulamadı diye mail akışı bozulmamalı.
  }
}

/** Sağlık kartı için son N kayıt (en yeni önce). Hata durumunda boş dizi. */
export async function dbRecentEmailEvents(limit = 20): Promise<EmailEventRow[]> {
  const db = getDb();
  if (!db) return [];
  try {
    return await db
      .select()
      .from(emailEvents)
      .orderBy(desc(emailEvents.createdAt))
      .limit(limit);
  } catch {
    return [];
  }
}

/** Son `hours` saatteki kayıtlar (en yeni önce). Hata durumunda boş dizi. */
export async function dbEmailEventsSince(hours = 24): Promise<EmailEventRow[]> {
  const db = getDb();
  if (!db) return [];
  try {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    return await db
      .select()
      .from(emailEvents)
      .where(gte(emailEvents.createdAt, since))
      .orderBy(desc(emailEvents.createdAt));
  } catch {
    return [];
  }
}
