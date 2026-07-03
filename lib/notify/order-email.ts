/**
 * Sipariş e-posta bildirimi (Resend). Sipariş "paid" olunca çağrılır:
 *  - SATICI'ya "yeni sipariş" bildirimi (her zaman).
 *  - ALICI'ya sipariş onayı (opsiyonel; markalı FROM = doğrulanmış alan ister).
 *
 * Bağımlılık yok — doğrudan Resend REST API. `RESEND_API_KEY` yoksa sessizce
 * atlar. Hatalar yutulur (e-posta gönderilemese de sipariş akışı bozulmaz).
 * Sadece sunucu tarafında kullanılır.
 *
 * .env.local:
 *   RESEND_API_KEY="re_..."                       (zorunlu — yoksa bildirim yok)
 *   ORDER_EMAIL_FROM="Maiamari <onboarding@resend.dev>"  (test); prod: alanı
 *      Resend'de doğrulayıp "Maiamari <siparis@maiamari.art>" yap
 *   ORDER_EMAIL_TO="info@maiamari.art"              (satıcıya bildirim adresi)
 *   ORDER_EMAIL_CUSTOMER="1"                        (1 ise müşteriye de onay yolla)
 */
import type { OrderRow, OrderItemRow } from "@/lib/db/schema";
import { SELLER } from "@/lib/legal";
import { cleanEnv } from "@/lib/env";

// Maildeki "Panelde aç" linkinin tabanı. Lokal testte SITE_URL=http://localhost:3000
// koyunca link localhost'a gider; prod'da (Vercel) SITE_URL boşsa canlıya gider.
// Fonksiyon: modül-scope okuma build anında donardı; çağrı anında okunmalı.
function baseUrl(): string {
  return cleanEnv("SITE_URL") || "https://www.maiamari.art";
}
const RESEND_ENDPOINT = "https://api.resend.com/emails";

function tl(v: string | number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(Number(v));
}

function itemsTable(items: OrderItemRow[]): string {
  const rows = items
    .map(
      (it) =>
        `<tr><td style="padding:6px 0;border-bottom:1px solid #eee">${escapeHtml(
          it.title,
        )} <span style="color:#888">× ${it.qty}</span></td><td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right">${tl(
          it.lineTotalTry,
        )}</td></tr>`,
    )
    .join("");
  return `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function send(payload: {
  from: string;
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: payload.from,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
        ...(payload.replyTo ? { reply_to: payload.replyTo } : {}),
      }),
    });
    if (!res.ok) {
      console.error("Resend e-posta hatası:", res.status, await res.text());
    }
  } catch (e) {
    console.error("Resend e-posta gönderilemedi:", e);
  }
}

/** Sipariş "paid" olunca bildirim(ler)i gönderir. Best-effort, akışı bozmaz. */
export async function notifyNewOrder(
  order: OrderRow,
  items: OrderItemRow[],
): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;

  const from = process.env.ORDER_EMAIL_FROM || "Maiamari <onboarding@resend.dev>";
  const ownerTo = process.env.ORDER_EMAIL_TO || SELLER.email;
  const total = tl(order.totalTry);
  const adminUrl = `${baseUrl()}/admin/orders/${order.id}`;

  // 1) SATICI bildirimi
  await send({
    from,
    to: ownerTo,
    replyTo: order.buyerEmail || undefined,
    subject: `Yeni sipariş · ${order.orderNo} · ${total}`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
        <h2 style="font-weight:600">Yeni sipariş geldi</h2>
        <p><strong>${order.orderNo}</strong> · ${total}</p>
        ${itemsTable(items)}
        <h3 style="margin-top:20px;font-size:14px;color:#666">Alıcı</h3>
        <p style="font-size:14px;line-height:1.6">
          ${escapeHtml(order.buyerName)}<br>
          ${escapeHtml(order.buyerEmail)} · ${escapeHtml(order.buyerPhone)}<br>
          ${escapeHtml(order.addressLine)}${order.city ? ", " + escapeHtml(order.city) : ""}
        </p>
        <p style="margin-top:20px">
          <a href="${adminUrl}" style="background:#2B1E12;color:#fff;padding:10px 18px;text-decoration:none;font-size:13px;border-radius:4px">Panelde aç</a>
        </p>
      </div>`,
  });

  // 2) ALICI onayı (opsiyonel; markalı FROM doğrulanmış alan ister)
  if (process.env.ORDER_EMAIL_CUSTOMER === "1" && order.buyerEmail) {
    await send({
      from,
      to: order.buyerEmail,
      subject: `Siparişiniz alındı · ${order.orderNo}`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
          <h2 style="font-weight:600">Teşekkür ederiz, ${escapeHtml(
            order.buyerName.split(" ")[0],
          )}.</h2>
          <p>Siparişiniz alındı. Sipariş numaranız <strong>${order.orderNo}</strong>.</p>
          ${itemsTable(items)}
          <p style="text-align:right;font-weight:600;margin-top:8px">Toplam ${total}</p>
          <p style="font-size:13px;color:#888;margin-top:20px">Maiamari Baskı Atölyesi · ${baseUrl()}</p>
        </div>`,
    });
  }
}
