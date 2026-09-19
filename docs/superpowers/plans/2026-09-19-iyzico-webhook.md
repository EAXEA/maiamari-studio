# iyzico ödeme bildirimi (webhook) — Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ödeme alınmış bir siparişin fark edilmeden `pending` kalmasını imkânsız kılmak: iyzico'nun webhook bildirimi ikinci haber yolu olarak devreye alınır.

**Architecture:** Callback route'undaki ödeme uzlaştırma mantığı `lib/checkout/settle-payment.ts`'e taşınır; callback ve yeni webhook uç noktası aynı fonksiyonu çağırır. Webhook otorite değil tetikleyicidir: imzası doğrulansa bile sipariş yalnız iyzico'dan alınan imzalı `retrieve` yanıtı ve tutar kontrolüyle `paid` olur. Geçici hatada uç nokta 503 döner, böylece tekrar denemeyi iyzico'nun kendi mekanizması (15 dk arayla 3 deneme) yapar; kendi zamanlayıcımızı kurmayız.

**Tech Stack:** Next.js App Router (route handlers), Drizzle ORM + Postgres (Supabase), `node:test` + `tsx` birim testleri, Resend REST API, Playwright (e2e).

**Spec:** `docs/superpowers/specs/2026-09-19-iyzico-webhook-design.md`

## Global Constraints

- Ham iyzico `token` DB'ye veya loga **asla** yazılmaz; yalnız `sha256` hash'i tutulur.
- `orders.status` alanına yeni bir değer eklenmez. Yaşam döngüsü `pending | paid | failed | cancelled` + kargo durumları olarak kalır.
- Mevcut callback'in dış davranışı değişmez; yalnız gövdesi ortak fonksiyona taşınır.
- Mevcut testler (`tests/unit/iyzico-signature.test.ts`, `tests/unit/resolve-callback-order.test.ts`) yeşil kalmalı.
- Yeni test dosyaları `package.json` → `scripts.test:unit` listesine elle eklenir (otomatik keşif yok).
- Kullanıcıya görünen metinlerde em-dash (`—`) kullanılmaz.
- `master` dalına doğrudan commit yok; tüm iş `feat/iyzico-webhook` dalında.
- Push, PR ve deploy yapılmaz. iyzico panelinde ayar değiştirilmez. Veritabanındaki sipariş kayıtları değiştirilmez.
- PowerShell 5.1 ortamı: dosya yazarken BOM'dan kaçın, git komutlarında `&&` kullanma.

---

### Task 0: Çalışma dalı

**Files:**
- Modify: (yok, yalnız git durumu)

**Interfaces:**
- Consumes: (yok)
- Produces: `feat/iyzico-webhook` dalı, üzerinde spec ve plan commit'li

- [ ] **Step 1: Dalı aç**

```bash
git -C C:/Projects/maiamari-studio checkout -b feat/iyzico-webhook
```

- [ ] **Step 2: Spec ve planı commit et**

```bash
git -C C:/Projects/maiamari-studio add docs/superpowers/specs/2026-09-19-iyzico-webhook-design.md docs/superpowers/plans/2026-09-19-iyzico-webhook.md
git -C C:/Projects/maiamari-studio commit -m "docs(odeme): iyzico webhook tasarimi ve uygulama plani

18.09'da alinan 1.250 TL'lik odeme, callback'teki retrieve cagrisi
ECONNRESET ile dustugu icin islenemedi ve siparis pending kaldi.
Webhook ikinci haber yolu olarak devreye alinacak.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 1: Webhook imza doğrulama

Bağımsız, saf fonksiyon. Diğer her şeyin güvenlik temeli.

**Files:**
- Modify: `lib/payment/iyzico.ts` (mevcut imza yardımcılarının yanına)
- Test: `tests/unit/iyzico-webhook-signature.test.ts`
- Modify: `package.json` (`scripts.test:unit`)

**Interfaces:**
- Consumes: `cleanEnv` (`@/lib/env`), `crypto` (node)
- Produces:
  - `export type IyzicoWebhookBody = { iyziEventType?: string; iyziPaymentId?: string | number; token?: string; paymentConversationId?: string; status?: string; merchantId?: string; iyziReferenceCode?: string; iyziEventTime?: number }`
  - `export function verifyWebhookSignature(header: string | null | undefined, body: IyzicoWebhookBody): boolean`

- [ ] **Step 1: Write the failing test**

`tests/unit/iyzico-webhook-signature.test.ts`:

```ts
/**
 * iyzico webhook (HPP) imza doğrulaması — birim testleri.
 * Koşum: `npm run test:unit`. Ağ/DB yok; sentetik secret kullanılır.
 *
 * Resmî HPP formülü (docs.iyzico.com/ek-servisler/webhook):
 *   HMAC-SHA256(key=secretKey,
 *     data = secretKey + iyziEventType + iyziPaymentId + token
 *            + paymentConversationId + status) → hex
 * Mevcut CF retrieve imzasından FARKLI: ayraç yok, secretKey dizgenin başında.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  verifyWebhookSignature,
  type IyzicoWebhookBody,
} from "../../lib/payment/iyzico";

const TEST_SECRET = "test-secret-key-0123456789";

function makeBody(): IyzicoWebhookBody {
  return {
    iyziEventType: "CHECKOUT_FORM_AUTH",
    iyziPaymentId: 4207393587,
    token: "cf-token-abc123",
    paymentConversationId: "conv-uuid-1",
    status: "SUCCESS",
  };
}

function sign(b: IyzicoWebhookBody): string {
  const data =
    TEST_SECRET +
    String(b.iyziEventType ?? "") +
    String(b.iyziPaymentId ?? "") +
    String(b.token ?? "") +
    String(b.paymentConversationId ?? "") +
    String(b.status ?? "");
  return crypto
    .createHmac("sha256", TEST_SECRET)
    .update(data, "utf8")
    .digest("hex");
}

test("gecerli imza kabul edilir", () => {
  process.env.IYZICO_SECRET_KEY = TEST_SECRET;
  const b = makeBody();
  assert.equal(verifyWebhookSignature(sign(b), b), true);
});

test("her alanin tahrifi imzayi bozar", () => {
  process.env.IYZICO_SECRET_KEY = TEST_SECRET;
  const b = makeBody();
  const good = sign(b);
  const tampered: IyzicoWebhookBody[] = [
    { ...b, iyziEventType: "BKM_AUTH" },
    { ...b, iyziPaymentId: 4207393588 },
    { ...b, token: "cf-token-abc124" },
    { ...b, paymentConversationId: "conv-uuid-2" },
    { ...b, status: "FAILURE" },
  ];
  for (const t of tampered) {
    assert.equal(verifyWebhookSignature(good, t), false);
  }
});

test("eksik veya bos baslik reddedilir", () => {
  process.env.IYZICO_SECRET_KEY = TEST_SECRET;
  const b = makeBody();
  assert.equal(verifyWebhookSignature(null, b), false);
  assert.equal(verifyWebhookSignature(undefined, b), false);
  assert.equal(verifyWebhookSignature("", b), false);
});

test("farkli uzunluktaki imza patlamadan reddedilir", () => {
  process.env.IYZICO_SECRET_KEY = TEST_SECRET;
  const b = makeBody();
  assert.equal(verifyWebhookSignature("kisa", b), false);
  assert.equal(verifyWebhookSignature(sign(b) + "00", b), false);
});

test("secret yoksa reddedilir", () => {
  const b = makeBody();
  const good = sign(b);
  delete process.env.IYZICO_SECRET_KEY;
  assert.equal(verifyWebhookSignature(good, b), false);
  process.env.IYZICO_SECRET_KEY = TEST_SECRET;
});

test("eksik alanlar bos dizge sayilir, patlamaz", () => {
  process.env.IYZICO_SECRET_KEY = TEST_SECRET;
  const partial: IyzicoWebhookBody = { iyziEventType: "CHECKOUT_FORM_AUTH" };
  assert.equal(verifyWebhookSignature(sign(partial), partial), true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/unit/iyzico-webhook-signature.test.ts`
Expected: FAIL — `verifyWebhookSignature` dışa aktarılmamış.

- [ ] **Step 3: Write minimal implementation**

`lib/payment/iyzico.ts` içinde, `verifyCfInitSignature`'dan hemen sonra:

```ts
/** iyzico webhook (HPP) gövdesi — imzaya giren alanlar + taşıdığı diğer veri. */
export type IyzicoWebhookBody = {
  iyziEventType?: string;
  iyziPaymentId?: string | number;
  token?: string;
  paymentConversationId?: string;
  status?: string;
  merchantId?: string;
  iyziReferenceCode?: string;
  iyziEventTime?: number;
};

/**
 * Webhook imzası (X-IYZ-SIGNATURE-V3, HPP formatı). Mevcut CF retrieve
 * imzasından FARKLIDIR: ayraç yoktur ve secretKey hem HMAC anahtarı hem de
 * imzalanan dizginin başıdır (resmî doküman böyle tanımlıyor).
 *
 *   HMAC-SHA256(secretKey, secretKey + iyziEventType + iyziPaymentId
 *               + token + paymentConversationId + status) → hex
 *
 * Bu fonksiyon bir KAPIDIR: false dönerse gövdenin hiçbir alanı kullanılmaz.
 */
export function verifyWebhookSignature(
  header: string | null | undefined,
  body: IyzicoWebhookBody,
): boolean {
  const secret = cleanEnv("IYZICO_SECRET_KEY");
  if (!secret || !header) return false;
  const data =
    secret +
    String(body.iyziEventType ?? "") +
    String(body.iyziPaymentId ?? "") +
    String(body.token ?? "") +
    String(body.paymentConversationId ?? "") +
    String(body.status ?? "");
  const expected = crypto
    .createHmac("sha256", secret)
    .update(data, "utf8")
    .digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(String(header), "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/unit/iyzico-webhook-signature.test.ts`
Expected: PASS, 6 test.

- [ ] **Step 5: Test'i koşum listesine ekle**

`package.json` → `scripts.test:unit` dizgesinin sonuna
` tests/unit/iyzico-webhook-signature.test.ts` eklenir.

Run: `npm run test:unit`
Expected: tümü PASS.

- [ ] **Step 6: Commit**

```bash
git -C C:/Projects/maiamari-studio add lib/payment/iyzico.ts tests/unit/iyzico-webhook-signature.test.ts package.json
git -C C:/Projects/maiamari-studio commit -m "feat(odeme): iyzico webhook imza dogrulamasi

HPP formati: HMAC-SHA256(secretKey, secretKey + eventType + paymentId
+ token + conversationId + status). Mevcut CF retrieve imzasindan farkli.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: Dikkat bayrağı — şema, migration, veri katmanı

**Files:**
- Modify: `lib/db/schema.ts` (`orders` tablosu, `conversationId` alanından sonra)
- Modify: `lib/db/orders.ts` (yeni iki fonksiyon)
- Create: `lib/db/migrations/<drizzle üretir>.sql`

**Interfaces:**
- Consumes: `orders` tablosu, `getDb`, drizzle `eq`/`and`/`isNull`/`ne`/`or`
- Produces:
  - `orders.paymentAttentionReason: string | null`, `orders.paymentAttentionAt: Date | null`
  - `export async function dbFlagOrderAttention(id: string, reason: string): Promise<boolean>`
  - `export async function dbClearOrderAttention(id: string): Promise<void>`

- [ ] **Step 1: Şemaya iki kolon ekle**

`lib/db/schema.ts`, `orders` tablosunda `conversationId` satırından sonra:

```ts
  /**
   * Ödeme doğrulanamadığında sebep (null = sorun yok). Panelde uyarı olarak
   * görünür; sipariş `paid` olunca temizlenir. `status` alanına DOKUNMAZ —
   * sipariş yaşam döngüsüne dik, bağımsız bir işarettir.
   */
  paymentAttentionReason: text("payment_attention_reason"),
  /** Bayrağın ne zaman konduğu (panelde "ne kadardır bekliyor" bilgisi). */
  paymentAttentionAt: timestamp("payment_attention_at", { withTimezone: true }),
```

- [ ] **Step 2: Migration üret**

Run: `npm run db:generate`
Expected: `lib/db/migrations/` altında iki `ADD COLUMN` içeren yeni bir `.sql`.
Üretilen dosya okunur ve yalnız bu iki kolonu eklediği doğrulanır; başka tabloya
dokunuyorsa DURULUR ve kullanıcıya sorulur.

**Not:** `db:push` / migration uygulama bu planın kapsamında DEĞİL. Canlı
veritabanına yazma ayrı onay gerektirir.

- [ ] **Step 3: Veri katmanı fonksiyonlarını yaz**

`lib/db/orders.ts`, `dbMarkOrderFailed`'dan sonra. Dosyanın üst importuna
`isNull`, `ne`, `or` eklenir (`drizzle-orm`).

```ts
/**
 * Ödeme doğrulanamadı bayrağını koyar. AYNI sebeple bayrak zaten konmuşsa
 * `false` döner — çağıran bunu uyarı e-postasını bastırmak için kullanır
 * (iyzico webhook'u 3 kez denediğinde tek uyarı gitsin).
 *
 * Koşullu UPDATE: yalnız bayrak boşken veya sebep farklıyken yazar, böylece
 * "zaten var mı" kontrolü ile yazma arasında yarış oluşmaz.
 */
export async function dbFlagOrderAttention(
  id: string,
  reason: string,
): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  const updated = await db
    .update(orders)
    .set({
      paymentAttentionReason: reason,
      paymentAttentionAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(orders.id, id),
        or(
          isNull(orders.paymentAttentionReason),
          ne(orders.paymentAttentionReason, reason),
        ),
      ),
    )
    .returning({ id: orders.id });
  return updated.length > 0;
}

/** Bayrağı kaldırır (sorun çözüldü). `dbMarkOrderPaid` başarılı olunca çağrılır. */
export async function dbClearOrderAttention(id: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db
    .update(orders)
    .set({
      paymentAttentionReason: null,
      paymentAttentionAt: null,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, id));
}
```

- [ ] **Step 4: Derleme kontrolü**

Run: `npx tsc --noEmit`
Expected: hata yok. (Tam `npm run build` Task 8'de.)

- [ ] **Step 5: Commit**

```bash
git -C C:/Projects/maiamari-studio add lib/db/schema.ts lib/db/orders.ts lib/db/migrations
git -C C:/Projects/maiamari-studio commit -m "feat(siparis): odeme dikkat bayragi kolonlari

payment_attention_reason + payment_attention_at. status alanina
dokunulmaz; bayrak siparis yasam dongusune dik bagimsiz bir isaret.
Ayni sebeple tekrar bayraklamada false doner (mukerrer uyari mailini
bastirmak icin).

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Dikkat gerektiren ödeme uyarısı (e-posta)

**Files:**
- Modify: `lib/notify/order-email.ts`

**Interfaces:**
- Consumes: mevcut `send()`, `baseUrl()`, `escapeHtml()`, `SELLER` (`@/lib/legal`)
- Produces: `export async function notifyPaymentNeedsAttention(input: { orderId?: string; orderNo?: string; reason: string; detail: Record<string, unknown> }): Promise<void>`

- [ ] **Step 1: Fonksiyonu yaz**

`lib/notify/order-email.ts` sonuna:

```ts
/**
 * Para hareketi olmuş olabilecek ama işlenemeyen ödeme için satıcı uyarısı.
 * Best-effort: gönderilemese de ödeme akışı etkilenmez.
 *
 * Mükerrerlik, çağıran tarafta dikkat bayrağıyla bastırılır (bkz.
 * lib/db/orders.ts dbFlagOrderAttention); bu fonksiyon çağrıldığı her
 * seferde gönderir.
 */
export async function notifyPaymentNeedsAttention(input: {
  orderId?: string;
  orderNo?: string;
  reason: string;
  detail: Record<string, unknown>;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;

  const from = process.env.ORDER_EMAIL_FROM || "Maiamari <onboarding@resend.dev>";
  const ownerTo = process.env.ORDER_EMAIL_TO || SELLER.email;
  const label = input.orderNo ? `· ${input.orderNo}` : "· sipariş eşleşmedi";
  const adminUrl = input.orderId
    ? `${baseUrl()}/admin/orders/${input.orderId}`
    : `${baseUrl()}/admin/orders`;

  const rows = Object.entries(input.detail)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#888">${escapeHtml(
          k,
        )}</td><td style="padding:4px 0;font-family:monospace">${escapeHtml(
          String(v),
        )}</td></tr>`,
    )
    .join("");

  await send({
    from,
    to: ownerTo,
    subject: `Ödeme kontrol gerekiyor ${label}`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
        <h2 style="font-weight:600">Bir ödeme doğrulanamadı</h2>
        <p style="line-height:1.6">${escapeHtml(input.reason)}</p>
        <p style="font-size:13px;color:#666;line-height:1.6">
          Para çekilmiş olabilir. iyzico panelinden işlemi kontrol edin,
          ödeme başarılıysa siparişi panelden kapatın.
        </p>
        <table style="font-size:13px;border-collapse:collapse;margin-top:12px">${rows}</table>
        <p style="margin-top:20px">
          <a href="${adminUrl}" style="background:#2B1E12;color:#fff;padding:10px 18px;text-decoration:none;font-size:13px;border-radius:4px">Panelde aç</a>
        </p>
      </div>`,
  });
}
```

- [ ] **Step 2: Derleme kontrolü**

Run: `npx tsc --noEmit`
Expected: hata yok.

- [ ] **Step 3: Commit**

```bash
git -C C:/Projects/maiamari-studio add lib/notify/order-email.ts
git -C C:/Projects/maiamari-studio commit -m "feat(bildirim): odeme dogrulanamadi uyari maili

Para hareketi olmus olabilecek ama islenememis odemede saticiya gider.
Best-effort; mukerrerlik cagiran tarafta dikkat bayragiyla bastirilir.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Ortak uzlaştırma — `settle-payment.ts`

Planın kalbi. Callback route'unun gövdesi buraya taşınır, davranış birebir korunur.

**Files:**
- Create: `lib/checkout/settle-payment.ts`
- Modify: `app/api/payment/iyzico/callback/route.ts` (gövde boşaltılır, settle çağrılır)
- Test: `tests/unit/settle-payment.test.ts`
- Modify: `package.json` (`scripts.test:unit`)

**Interfaces:**
- Consumes: Task 1'in `CfRetrieveResult`; Task 2'nin `dbFlagOrderAttention`/`dbClearOrderAttention`; Task 3'ün `notifyPaymentNeedsAttention`; mevcut `dbGetOrder`, `dbFindOrderByTokenHash`, `dbFindPendingOrderByLegacyToken`, `dbMarkOrderPaid`, `dbMarkOrderFailed`, `notifyNewOrder`, `retrieveCheckoutForm`, `verifyCfRetrieveSignature`, `hashCallbackToken`, `resolveCallbackOrder`
- Produces:
  - `export type SettleOutcome` (aşağıdaki beş dal)
  - `export type SettleDeps`
  - `export const defaultSettleDeps: SettleDeps`
  - `export async function settleCheckoutFormPayment(token: string, opts: { source: "callback" | "webhook" }, deps?: SettleDeps): Promise<SettleOutcome>`

- [ ] **Step 1: Write the failing test**

`tests/unit/settle-payment.test.ts`:

```ts
/**
 * Ortak ödeme uzlaştırma — birim testleri.
 * Koşum: `npm run test:unit`. Ağ/DB yok: tüm bağımlılıklar enjekte edilir.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  settleCheckoutFormPayment,
  type SettleDeps,
} from "../../lib/checkout/settle-payment";
import type { OrderWithItems } from "../../lib/db/orders";
import type { CfRetrieveResult } from "../../lib/payment/iyzico";

type Calls = {
  markPaid: string[];
  markFailed: string[];
  flagged: Array<{ id: string; reason: string }>;
  cleared: string[];
  notifiedNewOrder: string[];
  notifiedAttention: string[];
};

function makeOrder(over: Partial<OrderWithItems["order"]> = {}): OrderWithItems {
  return {
    order: {
      id: "order-1",
      orderNo: "MA-20260919-TEST",
      status: "pending",
      totalTry: "1250.00",
      currency: "TRY",
      paymentAttentionReason: null,
      paymentAttentionAt: null,
      ...over,
    } as OrderWithItems["order"],
    items: [],
  };
}

function makeDeps(
  over: Partial<SettleDeps> = {},
): { deps: SettleDeps; calls: Calls } {
  const calls: Calls = {
    markPaid: [],
    markFailed: [],
    flagged: [],
    cleared: [],
    notifiedNewOrder: [],
    notifiedAttention: [],
  };
  const order = makeOrder();
  const deps: SettleDeps = {
    hashToken: (t) => `hash(${t})`,
    findByTokenHash: async () => order,
    findPendingByLegacyToken: async () => null,
    retrieve: async () => ({
      status: "success",
      paymentStatus: "SUCCESS",
      paymentId: "4207393587",
      basketId: "order-1",
      paidPrice: "1250.00",
      currency: "TRY",
    }),
    verifyRetrieveSignature: () => true,
    getOrder: async () => order,
    markPaid: async (id) => {
      calls.markPaid.push(id);
      return true;
    },
    markFailed: async (id) => {
      calls.markFailed.push(id);
    },
    flagAttention: async (id, reason) => {
      calls.flagged.push({ id, reason });
      return true;
    },
    clearAttention: async (id) => {
      calls.cleared.push(id);
    },
    notifyNewOrder: async (o) => {
      calls.notifiedNewOrder.push(o.id);
    },
    notifyAttention: async (i) => {
      calls.notifiedAttention.push(i.reason);
    },
    ...over,
  };
  return { deps, calls };
}

test("basarili odeme siparisi paid yapar ve mail gonderir", async () => {
  const { deps, calls } = makeDeps();
  const out = await settleCheckoutFormPayment("tok", { source: "callback" }, deps);
  assert.equal(out.kind, "paid");
  assert.deepEqual(calls.markPaid, ["order-1"]);
  assert.deepEqual(calls.notifiedNewOrder, ["order-1"]);
  assert.deepEqual(calls.cleared, ["order-1"]);
});

test("zaten paid ise iyzico'ya hic gidilmez", async () => {
  let retrieved = false;
  const paid = makeOrder({ status: "paid" });
  const { deps } = makeDeps({
    findByTokenHash: async () => paid,
    getOrder: async () => paid,
    retrieve: async () => {
      retrieved = true;
      return {};
    },
  });
  const out = await settleCheckoutFormPayment("tok", { source: "webhook" }, deps);
  assert.equal(out.kind, "already-paid");
  assert.equal(retrieved, false);
});

test("retrieve ag hatasi retryable doner, siparise dokunmaz", async () => {
  const { deps, calls } = makeDeps({
    retrieve: async () => {
      throw new TypeError("fetch failed");
    },
  });
  const out = await settleCheckoutFormPayment("tok", { source: "webhook" }, deps);
  assert.equal(out.kind, "retryable");
  assert.deepEqual(calls.markPaid, []);
  assert.deepEqual(calls.markFailed, []);
});

test("callback yolunda retryable uyari maili gonderir, webhook yolunda gondermez", async () => {
  const fail = { retrieve: async () => { throw new TypeError("fetch failed"); } };
  const cb = makeDeps(fail);
  await settleCheckoutFormPayment("tok", { source: "callback" }, cb.deps);
  assert.equal(cb.calls.notifiedAttention.length, 1);

  const wh = makeDeps(fail);
  await settleCheckoutFormPayment("tok", { source: "webhook" }, wh.deps);
  assert.equal(wh.calls.notifiedAttention.length, 0);
});

test("retrieve imzasi tutmazsa siparise dokunulmaz", async () => {
  const { deps, calls } = makeDeps({ verifyRetrieveSignature: () => false });
  const out = await settleCheckoutFormPayment("tok", { source: "callback" }, deps);
  assert.equal(out.kind, "needs-attention");
  assert.deepEqual(calls.markPaid, []);
  assert.equal(calls.notifiedAttention.length, 1);
});

test("tutar uyusmazsa paid yazilmaz, bayrak konur", async () => {
  const { deps, calls } = makeDeps({
    retrieve: async () => ({
      status: "success",
      paymentStatus: "SUCCESS",
      paymentId: "1",
      basketId: "order-1",
      paidPrice: "1.00",
      currency: "TRY",
    }),
  });
  const out = await settleCheckoutFormPayment("tok", { source: "callback" }, deps);
  assert.equal(out.kind, "needs-attention");
  assert.deepEqual(calls.markPaid, []);
  assert.equal(calls.flagged.length, 1);
});

test("yerel eslesme basketId ile uyusmazsa reddedilir", async () => {
  const { deps, calls } = makeDeps({
    retrieve: async () => ({
      status: "success",
      paymentStatus: "SUCCESS",
      paymentId: "1",
      basketId: "baska-order",
      paidPrice: "1250.00",
      currency: "TRY",
    }),
  });
  const out = await settleCheckoutFormPayment("tok", { source: "callback" }, deps);
  assert.equal(out.kind, "needs-attention");
  assert.deepEqual(calls.markPaid, []);
});

test("FAILURE: callback siparisi failed yapar", async () => {
  const { deps, calls } = makeDeps({
    retrieve: async () => ({
      status: "success",
      paymentStatus: "FAILURE",
      basketId: "order-1",
    }),
  });
  const out = await settleCheckoutFormPayment("tok", { source: "callback" }, deps);
  assert.equal(out.kind, "not-paid");
  assert.deepEqual(calls.markFailed, ["order-1"]);
});

test("FAILURE: webhook siparise DOKUNMAZ (coklu kart denemesi)", async () => {
  const { deps, calls } = makeDeps({
    retrieve: async () => ({
      status: "success",
      paymentStatus: "FAILURE",
      basketId: "order-1",
    }),
  });
  const out = await settleCheckoutFormPayment("tok", { source: "webhook" }, deps);
  assert.equal(out.kind, "not-paid");
  assert.deepEqual(calls.markFailed, []);
});

test("bayrak zaten varsa uyari maili tekrar gitmez", async () => {
  const { deps, calls } = makeDeps({
    verifyRetrieveSignature: () => false,
    flagAttention: async () => false,
  });
  await settleCheckoutFormPayment("tok", { source: "callback" }, deps);
  assert.equal(calls.notifiedAttention.length, 0);
});

test("markPaid false donerse (yaris) mail gonderilmez", async () => {
  const { deps, calls } = makeDeps({ markPaid: async () => false });
  const out = await settleCheckoutFormPayment("tok", { source: "callback" }, deps);
  assert.equal(out.kind, "paid");
  assert.equal(out.kind === "paid" && out.firstTime, false);
  assert.deepEqual(calls.notifiedNewOrder, []);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/unit/settle-payment.test.ts`
Expected: FAIL — `lib/checkout/settle-payment.ts` yok.

- [ ] **Step 3: Write the implementation**

`lib/checkout/settle-payment.ts`:

```ts
/**
 * iyzico Checkout Form ödemesinin uzlaştırılması — callback ve webhook
 * uçlarının ORTAK mantığı. İki ayrı ödeme mantığı bulunmaz.
 *
 * Otorite zinciri (değişmedi, callback'ten taşındı):
 *   token → server-to-server RETRIEVE → response signature doğrula →
 *   basketId'den siparişi bul → tutar/para birimi çapraz kontrol →
 *   paymentStatus SUCCESS ve sipariş pending ise paid.
 *
 * `source` yalnız iki şeyi belirler, ikisi de "bu yol kendi kendine tekrar
 * dener mi" sorusundan türer:
 *   - callback: siparişi `failed` işaretleyebilir; `retryable` durumunda
 *     uyarı maili atar (callback bir daha gelmez).
 *   - webhook: siparişi ASLA `failed` yapmaz (alıcı aynı oturumda ikinci
 *     kartla ödeyebilir, erken kapatırsak SUCCESS'i işleyemeyiz);
 *     `retryable` durumunda sessiz kalır, çünkü iyzico 15 dk sonra tekrar
 *     dener (çağıran 503 döner).
 *
 * `deps` yalnız TEST içindir; üretimde `defaultSettleDeps` kullanılır.
 */
import {
  dbGetOrder,
  dbFindOrderByTokenHash,
  dbFindPendingOrderByLegacyToken,
  dbMarkOrderPaid,
  dbMarkOrderFailed,
  dbFlagOrderAttention,
  dbClearOrderAttention,
  type OrderWithItems,
} from "@/lib/db/orders";
import { notifyNewOrder, notifyPaymentNeedsAttention } from "@/lib/notify/order-email";
import {
  retrieveCheckoutForm,
  verifyCfRetrieveSignature,
  hashCallbackToken,
  type CfRetrieveResult,
} from "@/lib/payment/iyzico";
import { resolveCallbackOrder } from "@/lib/checkout/resolve-callback-order";
import type { OrderRow, OrderItemRow } from "@/lib/db/schema";

export type SettleOutcome =
  | { kind: "paid"; orderId: string; orderNo: string; firstTime: boolean }
  | { kind: "already-paid"; orderId: string }
  | { kind: "not-paid"; orderId: string }
  | { kind: "retryable"; reason: string }
  | {
      kind: "needs-attention";
      reason: string;
      detail: Record<string, unknown>;
      orderId?: string;
    };

export type SettleDeps = {
  hashToken: (token: string) => string;
  findByTokenHash: (hash: string) => Promise<OrderWithItems | null>;
  findPendingByLegacyToken: (token: string) => Promise<OrderWithItems | null>;
  retrieve: (token: string) => Promise<CfRetrieveResult>;
  verifyRetrieveSignature: (r: CfRetrieveResult) => boolean;
  getOrder: (id: string) => Promise<OrderWithItems | null>;
  markPaid: (
    id: string,
    ref: { paymentProvider?: string; paymentId?: string },
  ) => Promise<boolean>;
  markFailed: (id: string, status?: "failed" | "cancelled") => Promise<void>;
  flagAttention: (id: string, reason: string) => Promise<boolean>;
  clearAttention: (id: string) => Promise<void>;
  notifyNewOrder: (order: OrderRow, items: OrderItemRow[]) => Promise<void>;
  notifyAttention: (input: {
    orderId?: string;
    orderNo?: string;
    reason: string;
    detail: Record<string, unknown>;
  }) => Promise<void>;
};

export const defaultSettleDeps: SettleDeps = {
  hashToken: hashCallbackToken,
  findByTokenHash: dbFindOrderByTokenHash,
  findPendingByLegacyToken: dbFindPendingOrderByLegacyToken,
  retrieve: retrieveCheckoutForm,
  verifyRetrieveSignature: verifyCfRetrieveSignature,
  getOrder: dbGetOrder,
  markPaid: dbMarkOrderPaid,
  markFailed: dbMarkOrderFailed,
  flagAttention: dbFlagOrderAttention,
  clearAttention: dbClearOrderAttention,
  notifyNewOrder,
  notifyAttention: notifyPaymentNeedsAttention,
};

/** Bayrak + (bastırılmamışsa) uyarı maili. Hatası akışı bozmaz. */
async function raiseAttention(
  deps: SettleDeps,
  input: {
    orderId?: string;
    orderNo?: string;
    reason: string;
    detail: Record<string, unknown>;
  },
): Promise<void> {
  try {
    let shouldNotify = true;
    if (input.orderId) {
      shouldNotify = await deps.flagAttention(input.orderId, input.reason);
    }
    if (shouldNotify) await deps.notifyAttention(input);
  } catch (e) {
    console.error("Ödeme uyarısı gönderilemedi:", e);
  }
}

export async function settleCheckoutFormPayment(
  token: string,
  opts: { source: "callback" | "webhook" },
  deps: SettleDeps = defaultSettleDeps,
): Promise<SettleOutcome> {
  const isCallback = opts.source === "callback";
  const tokenHash = deps.hashToken(token);

  // Hızlı yol araması. Öncelik hash'te; bulunamazsa CUTOVER FALLBACK olarak
  // yalnız `pending` siparişlerde eski ham `paymentToken` denenir. İkisi de
  // boş dönebilir — bu bir RET SEBEBİ DEĞİLDİR, aşağıda iyzico'ya sorulur.
  const byHash = await deps.findByTokenHash(tokenHash);
  const byLegacyToken = byHash
    ? null
    : await deps.findPendingByLegacyToken(token);
  const local = resolveCallbackOrder(byHash, byLegacyToken);

  // Kestirme: zaten ödenmiş — idempotent replay, iyzico'ya gitmeye gerek yok.
  if (local && local.order.status === "paid") {
    return { kind: "already-paid", orderId: local.order.id };
  }

  let result: CfRetrieveResult;
  try {
    result = await deps.retrieve(token);
  } catch (e) {
    console.error("iyzico retrieve isteği başarısız:", e);
    const reason = "iyzico'ya bağlanılamadı, ödeme sonucu doğrulanamadı.";
    if (isCallback) {
      await raiseAttention(deps, {
        orderId: local?.order.id,
        orderNo: local?.order.orderNo,
        reason,
        detail: { hata: String(e) },
      });
    }
    return { kind: "retryable", reason };
  }

  if (result.status !== "success") {
    console.error("iyzico retrieve reddetti:", result.errorMessage);
    const reason = "iyzico sorguyu reddetti, ödeme sonucu doğrulanamadı.";
    if (isCallback) {
      await raiseAttention(deps, {
        orderId: local?.order.id,
        orderNo: local?.order.orderNo,
        reason,
        detail: { errorCode: result.errorCode, errorMessage: result.errorMessage },
      });
    }
    return { kind: "retryable", reason };
  }

  if (!deps.verifyRetrieveSignature(result)) {
    // İmza tutmuyorsa yanıtın bütünlüğüne güvenilemez — siparişe DOKUNMA.
    console.error("iyzico retrieve imzası DOĞRULANAMADI", {
      basketId: result.basketId,
      conversationId: result.conversationId,
    });
    const reason = "iyzico yanıtının imzası doğrulanamadı, siparişe dokunulmadı.";
    await raiseAttention(deps, {
      orderId: local?.order.id,
      orderNo: local?.order.orderNo,
      reason,
      detail: { basketId: result.basketId, conversationId: result.conversationId },
    });
    return {
      kind: "needs-attention",
      reason,
      detail: { basketId: result.basketId },
      orderId: local?.order.id,
    };
  }

  const orderId = String(result.basketId ?? "");

  // Çapraz kontrol: yerelde bir eşleşme bulduysak, iyzico'nun döndüğü basketId
  // ile aynı siparişi göstermeli. Uyuşmuyorsa eşleştirme karışıklığı var.
  if (local && local.order.id !== orderId) {
    console.error("iyzico: yerel eşleşme basketId ile uyuşmuyor — reddedildi", {
      localOrderId: local.order.id,
      basketId: orderId,
    });
    const reason = "Ödeme başka bir siparişle eşleşti, siparişe dokunulmadı.";
    await raiseAttention(deps, {
      orderId: local.order.id,
      orderNo: local.order.orderNo,
      reason,
      detail: { yerelSiparis: local.order.id, iyzicoBasketId: orderId },
    });
    return {
      kind: "needs-attention",
      reason,
      detail: { localOrderId: local.order.id, basketId: orderId },
      orderId: local.order.id,
    };
  }

  // Otoriter satırı retrieve SONRASI taze oku (ağ çağrısı sırasında durum
  // değişmiş olabilir).
  const data = orderId ? await deps.getOrder(orderId) : null;
  if (!data) {
    const reason = "Ödeme alındı ama eşleşen sipariş bulunamadı.";
    await raiseAttention(deps, {
      reason,
      detail: { basketId: orderId, paymentId: result.paymentId },
    });
    return { kind: "needs-attention", reason, detail: { basketId: orderId } };
  }
  const { order } = data;

  const success = result.paymentStatus === "SUCCESS";
  const amountOk =
    Number(result.paidPrice) === Number(order.totalTry) &&
    (result.currency ?? "TRY") === "TRY";

  if (success && amountOk) {
    if (order.status === "pending") {
      // Koşullu UPDATE: eşzamanlı çifte istekte yalnız biri true alır →
      // e-posta bildirimi tek sefer gider (para tarafı zaten idempotent).
      const updated = await deps.markPaid(order.id, {
        paymentProvider: "iyzico",
        paymentId: result.paymentId ? String(result.paymentId) : undefined,
      });
      if (updated) {
        await deps.clearAttention(order.id);
        try {
          const fresh = await deps.getOrder(order.id);
          if (fresh) await deps.notifyNewOrder(fresh.order, fresh.items);
        } catch (e) {
          console.error("Sipariş bildirimi gönderilemedi:", e);
        }
      }
      return {
        kind: "paid",
        orderId: order.id,
        orderNo: order.orderNo,
        firstTime: updated,
      };
    }
    if (order.status === "paid") {
      return { kind: "already-paid", orderId: order.id };
    }
    // Para çekilmiş ama sipariş paid de pending de değil (örn. admin iptal
    // etti). paid YAZMA; iade/manuel inceleme gerekir.
    const reason = `Ödeme başarılı ama sipariş durumu "${order.status}". Paid yazılmadı.`;
    console.error("iyzico: ödeme başarılı ama sipariş durumu uyumsuz", {
      orderId: order.id,
      orderNo: order.orderNo,
      status: order.status,
      paymentId: result.paymentId,
    });
    await raiseAttention(deps, {
      orderId: order.id,
      orderNo: order.orderNo,
      reason,
      detail: { durum: order.status, paymentId: result.paymentId },
    });
    return {
      kind: "needs-attention",
      reason,
      detail: { status: order.status },
      orderId: order.id,
    };
  }

  if (success && !amountOk) {
    // Ödeme alınmış ama tutar/para birimi uyuşmuyor: paid YAZMA.
    const reason = "Ödeme alındı ama tutar siparişle uyuşmuyor. Paid yazılmadı.";
    console.error("iyzico tutar UYUŞMAZLIĞI — manuel inceleme gerekli", {
      orderId: order.id,
      orderNo: order.orderNo,
      expected: order.totalTry,
      paidPrice: result.paidPrice,
      currency: result.currency,
      paymentId: result.paymentId,
    });
    await raiseAttention(deps, {
      orderId: order.id,
      orderNo: order.orderNo,
      reason,
      detail: {
        beklenen: order.totalTry,
        cekilen: result.paidPrice,
        paraBirimi: result.currency,
        paymentId: result.paymentId,
      },
    });
    return {
      kind: "needs-attention",
      reason,
      detail: { expected: order.totalTry, paidPrice: result.paidPrice },
      orderId: order.id,
    };
  }

  // Ödeme başarısız. Yalnız callback siparişi kapatabilir; webhook ara
  // durumları da bildirdiği için siparişe DOKUNMAZ.
  if (isCallback && order.status === "pending") {
    await deps.markFailed(order.id, "failed");
  }
  return { kind: "not-paid", orderId: order.id };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/unit/settle-payment.test.ts`
Expected: PASS, 11 test.

**Olası engel:** `settle-payment.ts`, `defaultSettleDeps` için `lib/db/orders`'ı
import eder; o da `lib/db/client.ts` üzerinden `postgres` paketini yükler. Test
gerçek bir bağlantı açmaz (`getDb()` tembel çalışır ve hiç çağrılmaz), ama modül
yükleme yan etkisi test koşumunu bozarsa çözüm: `defaultSettleDeps`'i
`lib/checkout/settle-payment-deps.ts`'e ayırıp `settle-payment.ts`'te yalnız
tip importları bırakmak. Testler `deps` enjekte ettiği için bu ayrım davranışı
değiştirmez. Bu yola ancak test gerçekten kırılırsa başvurulur.

- [ ] **Step 5: Callback route'u ortak fonksiyona bağla**

`app/api/payment/iyzico/callback/route.ts` — dosya başındaki uzun açıklama
bloğunun son paragrafı güncellenir (mantığın artık `settle-payment.ts`'te
olduğu yazılır), importlar sadeleşir ve `POST` gövdesi şu hale gelir:

```ts
export async function POST(req: Request) {
  if (paymentMode() !== "iyzico") return back("/cart");

  let token = "";
  try {
    const form = await req.formData();
    token = String(form.get("token") ?? "").trim();
  } catch {
    /* gövde form değilse token boş kalır */
  }
  if (!token) return back("/cart");

  const outcome = await settleCheckoutFormPayment(token, { source: "callback" });

  switch (outcome.kind) {
    case "paid":
    case "already-paid":
      return back(`/checkout/sonuc?order=${outcome.orderId}`);
    case "not-paid":
      return back(`/checkout/sonuc?order=${outcome.orderId}`);
    case "needs-attention":
      return outcome.orderId
        ? back(`/checkout/sonuc?order=${outcome.orderId}`)
        : back("/cart");
    case "retryable":
      return back("/cart");
  }
}
```

Kullanılmayan importlar (`dbGetOrder`, `dbMarkOrderPaid`, `notifyNewOrder`,
`retrieveCheckoutForm`, `verifyCfRetrieveSignature`, `hashCallbackToken`,
`resolveCallbackOrder` vb.) kaldırılır; `paymentMode` ve `siteBaseUrl` kalır.

**Davranış eşdeğerliği kontrolü** (koda bakarak doğrula, atlanmaz):
`retryable` → eskiden de `/cart`. `needs-attention` (imza/eşleşme) → eskiden
`/cart`; sipariş biliniyorsa artık sonuç sayfasına gider, bu alıcı için daha
doğru ve ödeme tarafını etkilemez. Diğer dallar birebir aynı.

- [ ] **Step 6: Tüm testleri koş**

`package.json` → `scripts.test:unit` sonuna ` tests/unit/settle-payment.test.ts`
eklenir.

Run: `npm run test:unit`
Expected: tümü PASS (mevcut `resolve-callback-order` ve `iyzico-signature` dahil).

Run: `npx tsc --noEmit`
Expected: hata yok.

- [ ] **Step 7: Commit**

```bash
git -C C:/Projects/maiamari-studio add lib/checkout/settle-payment.ts app/api/payment/iyzico/callback/route.ts tests/unit/settle-payment.test.ts package.json
git -C C:/Projects/maiamari-studio commit -m "refactor(odeme): uzlastirma mantigini ortak fonksiyona tasi

Callback route'unun govdesi lib/checkout/settle-payment.ts'e tasindi.
Otorite zinciri degismedi. source alani, yolun kendi kendine tekrar
deneyip denemedigine gore iki davranisi belirler: failed yazma yetkisi
ve retryable durumunda uyari maili.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: Webhook uç noktası

**Files:**
- Create: `app/api/payment/iyzico/webhook/route.ts`

**Interfaces:**
- Consumes: Task 1'in `verifyWebhookSignature` + `IyzicoWebhookBody`; Task 4'ün `settleCheckoutFormPayment`
- Produces: `POST /api/payment/iyzico/webhook`

- [ ] **Step 1: Uç noktayı yaz**

```ts
/**
 * iyzico ödeme bildirimi (webhook) — İKİNCİ haber yolu.
 *
 * Alıcının tarayıcısından gelen callback'ten bağımsızdır: iyzico bu adrese
 * ödemeden 10-15 sn sonra sunucu-sunucu POST eder ve 2xx alana kadar 15 dk
 * arayla 3 kez dener. 18.09.2026'da callback'teki retrieve çağrısı
 * ECONNRESET ile düştüğü için 1.250 TL'lik bir ödeme işlenmeden kalmıştı;
 * bu uç o senaryoyu kendiliğinden kapatır.
 *
 * GÜVENLİK — webhook TETİKLEYİCİDİR, OTORİTE DEĞİL. İmzası doğrulanmış olsa
 * bile gövdedeki `status` alanına göre sipariş güncellenmez; yalnız `token`
 * alınır ve otorite zinciri (retrieve → imza → tutar) baştan çalıştırılır.
 * Sahte bir POST en fazla boş bir sorgu tetikler.
 *
 * CEVAP SÖZLEŞMESİ — tekrar denemeyi iyzico'ya yaptırıyoruz:
 *   kesin sonuç (paid/already-paid/not-paid/needs-attention) → 200
 *   geçici hata (retryable)                                  → 503, tekrar gelsin
 *   imza geçersiz                                            → 401
 * Cevap gövdesi sipariş bilgisi TAŞIMAZ.
 */
import { NextResponse } from "next/server";
import { settleCheckoutFormPayment } from "@/lib/checkout/settle-payment";
import {
  paymentMode,
  verifyWebhookSignature,
  type IyzicoWebhookBody,
} from "@/lib/payment/iyzico";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (paymentMode() !== "iyzico") {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const raw = await req.text();
  let body: IyzicoWebhookBody;
  try {
    body = JSON.parse(raw) as IyzicoWebhookBody;
  } catch {
    console.error("iyzico webhook: gövde JSON değil");
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!verifyWebhookSignature(req.headers.get("x-iyz-signature-v3"), body)) {
    console.error("iyzico webhook: İMZA DOĞRULANAMADI", {
      iyziEventType: body.iyziEventType,
      paymentConversationId: body.paymentConversationId,
    });
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  // Checkout Form dışındaki olaylar (banka havalesi, BKM, abonelik) bizi
  // ilgilendirmiyor. 200 dön ki iyzico tekrar denemesin.
  if (body.iyziEventType !== "CHECKOUT_FORM_AUTH") {
    return NextResponse.json({ ok: true });
  }

  const token = String(body.token ?? "").trim();
  if (!token) {
    console.error("iyzico webhook: CHECKOUT_FORM_AUTH ama token yok", {
      paymentConversationId: body.paymentConversationId,
    });
    return NextResponse.json({ ok: true });
  }

  const outcome = await settleCheckoutFormPayment(token, { source: "webhook" });

  if (outcome.kind === "retryable") {
    console.error("iyzico webhook: geçici hata, tekrar bekleniyor", {
      reason: outcome.reason,
      paymentConversationId: body.paymentConversationId,
    });
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  if (outcome.kind === "needs-attention") {
    console.error("iyzico webhook: manuel inceleme gerekli", {
      reason: outcome.reason,
      orderId: outcome.orderId,
    });
  }

  return NextResponse.json({ ok: true });
}

/** iyzico her zaman POST kullanır. */
export async function GET() {
  return NextResponse.json({ ok: false }, { status: 405 });
}
```

- [ ] **Step 2: Derleme ve testler**

Run: `npx tsc --noEmit`
Expected: hata yok.

Run: `npm run test:unit`
Expected: tümü PASS.

- [ ] **Step 3: Yerelde 401 ve 405 davranışını gör**

Terminal 1: `npm run dev`
Terminal 2:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/payment/iyzico/webhook -H "Content-Type: application/json" -d '{"iyziEventType":"CHECKOUT_FORM_AUTH","token":"x"}'
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/payment/iyzico/webhook
```

Expected: imzasız POST → `401`; GET → `405`.
(`.env.local`'de iyzico anahtarları yoksa `paymentMode()` `mock` döner ve
POST `404` verir. O durumda anahtarların tanımlı olduğu doğrulanır.)

- [ ] **Step 4: Commit**

```bash
git -C C:/Projects/maiamari-studio add app/api/payment/iyzico/webhook/route.ts
git -C C:/Projects/maiamari-studio commit -m "feat(odeme): iyzico webhook uc noktasi

Tarayicidan bagimsiz ikinci haber yolu. Webhook tetikleyicidir, otorite
degil: imza dogrulansa bile govdedeki status'e gore siparis guncellenmez,
yalniz token alinip otorite zinciri bastan calistirilir.

Cevap sozlesmesi tekrar denemeyi iyzico'ya yaptirir: gecici hatada 503.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: `retrieve` çağrısında tekrar deneme

**Files:**
- Modify: `lib/payment/iyzico.ts` (`iyzicoPost` ve `retrieveCheckoutForm`)

**Interfaces:**
- Consumes: mevcut `iyzicoPost`
- Produces: davranış değişikliği, yeni dışa aktarım yok

- [ ] **Step 1: `iyzicoPost`'a opsiyonel tekrar parametresi ekle**

`iyzicoPost` imzası `(path, payload, opts?: { retries?: number })` olur. İmza
üretimi her denemede YENİDEN yapılır (`randomKey` zamana bağlı). Gövdedeki
`fetch` çağrısı şu döngüye alınır:

```ts
  // Ağ hatasında tekrar deneme. YALNIZ okuma çağrıları için kullanılır
  // (retrieve); initialize her çağrıda yeni ödeme oturumu ürettiği için
  // tekrarlanmaz. HTTP hata kodları tekrarlanmaz — yalnız fetch'in kendisi
  // düşerse (ECONNRESET/timeout) yeniden denenir.
  const attempts = 1 + Math.max(0, opts?.retries ?? 0);
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    // İmza her denemede YENİDEN üretilir: randomKey zamana bağlıdır ve
    // iyzico aynı randomKey'i tekrar kabul etmeyebilir.
    const randomKey = `${Date.now()}${Math.floor(Math.random() * 1e9)}`;
    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(randomKey + path + body, "utf8")
      .digest("hex");
    const authorization =
      "IYZWSv2 " +
      Buffer.from(
        `apiKey:${apiKey}&randomKey:${randomKey}&signature:${signature}`,
        "utf8",
      ).toString("base64");
    try {
      const res = await fetch(`${base}${path}`, {
        method: "POST",
        headers: {
          Authorization: authorization,
          "x-iyzi-rnd": randomKey,
          "Content-Type": "application/json",
        },
        body,
        cache: "no-store",
        // Asılı kalan iyzico isteği Vercel fonksiyonunu kilitlemesin.
        signal: AbortSignal.timeout(10_000),
      });
      // iyzico hata durumlarını da 200 + {status:"failure"} gövdesiyle döner;
      // HTTP hatası yalnız ağ/altyapı sorunudur.
      if (!res.ok) {
        throw new Error(`iyzico HTTP ${res.status}`);
      }
      return (await res.json()) as T;
    } catch (e) {
      lastError = e;
      if (i < attempts - 1) {
        console.error(`iyzico isteği düştü, tekrar deneniyor (${i + 1}):`, e);
        await new Promise((r) => setTimeout(r, 400));
      }
    }
  }
  throw lastError;
```

`body` (tek `stringify`) döngünün DIŞINDA kalır: imzalanan ile gönderilen gövde
bayt bayt aynı olmak zorundadır. `apiKey`, `secretKey`, `base` okumaları da
dışarıda kalır.

- [ ] **Step 2: `retrieveCheckoutForm`'u tekrar denemeli yap**

```ts
export async function retrieveCheckoutForm(
  token: string,
): Promise<CfRetrieveResult> {
  // Salt okuma olduğu için tekrarı güvenli: anlık kopmaları (18.09'daki
  // ECONNRESET) yutar. initialize BİLİNÇLİ olarak tekrarlanmaz.
  return iyzicoPost<CfRetrieveResult>(
    RETRIEVE_PATH,
    { locale: "tr", token },
    { retries: 1 },
  );
}
```

`initializeCheckoutForm` içindeki `iyzicoPost` çağrısı DEĞİŞTİRİLMEZ.

- [ ] **Step 3: Testler ve derleme**

Run: `npm run test:unit`
Expected: tümü PASS (imza testleri `iyzicoPost`'a dokunmaz ama regresyon kontrolü).

Run: `npx tsc --noEmit`
Expected: hata yok.

- [ ] **Step 4: Commit**

```bash
git -C C:/Projects/maiamari-studio add lib/payment/iyzico.ts
git -C C:/Projects/maiamari-studio commit -m "feat(odeme): retrieve cagrisinda tek tekrar denemesi

Salt okuma oldugu icin tekrari guvenli; anlik ECONNRESET kopmalarini
yutar. initialize bilincli olarak tekrarlanmaz (her cagri yeni odeme
oturumu uretir).

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 7: Admin panelinde görünürlük

**Files:**
- Modify: `app/admin/orders/page.tsx` (liste satırı)
- Modify: `app/admin/orders/[id]/page.tsx` (detay)

**Interfaces:**
- Consumes: Task 2'nin `order.paymentAttentionReason`, `order.paymentAttentionAt`
- Produces: (UI)

- [ ] **Step 1: Liste satırında uyarı rozeti**

`app/admin/orders/page.tsx` → `OrderRowLink` içinde, durum rozetinin yanına:

```tsx
          {o.paymentAttentionReason && (
            <span
              className="text-[10px] tracking-wider uppercase px-2 py-0.5 rounded"
              style={{ background: "#FDE8E8", color: "#8A1C1C" }}
              title={o.paymentAttentionReason}
            >
              Ödeme kontrol
            </span>
          )}
```

- [ ] **Step 2: Aktif listede bayraklıları öne al**

`AdminOrdersPage` içinde, `active` kullanılmadan önce:

```tsx
  // Ödeme kontrolü bekleyenler üstte: para hareketi olmuş olabilir.
  const activeSorted = [...active].sort((a, b) => {
    const af = a.paymentAttentionReason ? 0 : 1;
    const bf = b.paymentAttentionReason ? 0 : 1;
    return af - bf;
  });
```

Listeyi render eden yerde `active` yerine `activeSorted` kullanılır.
`{active.length} aktif` metni olduğu gibi kalır (sayı değişmiyor).

- [ ] **Step 3: Detay sayfasında uyarı kutusu**

`app/admin/orders/[id]/page.tsx` → sipariş başlığı ile durum güncelleme
bloğunun arasına:

```tsx
      {order.paymentAttentionReason && (
        <div
          className="border px-4 py-3 mb-8 text-sm"
          style={{ borderColor: "#E8A0A0", background: "#FDF3F3" }}
        >
          <p className="font-medium" style={{ color: "#8A1C1C" }}>
            Bu siparişin ödemesi doğrulanamadı
          </p>
          <p className="mt-1 text-[color:var(--color-muted)]">
            {order.paymentAttentionReason}
          </p>
          <p className="mt-2 text-[color:var(--color-muted)]">
            iyzico panelinden işlemi kontrol edin. Ödeme başarılıysa siparişi
            buradan kapatın, değilse iptal edin.
            {order.paymentAttentionAt
              ? ` Bu uyarı ${fmtDate(order.paymentAttentionAt)} tarihinde kondu.`
              : ""}
          </p>
        </div>
      )}
```

Metinlerde em-dash yok, teknik hata dizgisi gösterilmiyor; ne olduğu ve ne
yapılacağı yazılı.

- [ ] **Step 4: Derleme ve lint**

Run: `npx tsc --noEmit`
Expected: hata yok.

Run: `npm run lint`
Expected: temiz.

- [ ] **Step 5: Commit**

```bash
git -C C:/Projects/maiamari-studio add app/admin/orders/page.tsx "app/admin/orders/[id]/page.tsx"
git -C C:/Projects/maiamari-studio commit -m "feat(admin): odeme dikkat bayragini panelde goster

Listede rozet ve bayrakli siparisler ustte; detayda ne oldugunu ve ne
yapilmasi gerektigini anlatan uyari kutusu.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 8: Doğrulama

**Files:** (yok, yalnız koşum)

**Interfaces:**
- Consumes: Task 1-7
- Produces: bitti sayılma kanıtı

- [ ] **Step 1: Tüm birim testler**

Run: `npm run test:unit`
Expected: tümü PASS, hiçbiri atlanmamış.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: temiz.

- [ ] **Step 3: Üretim derlemesi**

Run: `npm run build`
Expected: başarılı. Çıktıda `/api/payment/iyzico/webhook` rotası görünmeli.

- [ ] **Step 4: Panel görünürlüğünü tarayıcıda gör**

`browser-verify` skill'i ile: `npm run dev`, admin girişi, `/admin/orders`.
Bayraklı bir sipariş görünmediği için doğrulama, geçici olarak bir siparişin
`paymentAttentionReason` alanını **yerel geliştirme veritabanında** doldurarak
yapılır. Canlı veritabanına yazılmaz.

Görülecekler: listede "Ödeme kontrol" rozeti, satırın üste gelmesi, detay
sayfasında uyarı kutusu ve metnin okunabilirliği.

**Not:** Yerel DB canlıyla aynıysa (tek `DATABASE_URL`) bu adım ATLANIR ve
kullanıcıya sorulur. Canlı sipariş kayıtlarına bu planda dokunulmaz.

- [ ] **Step 5: Güvenlik gözden geçirmesi**

`code-review-checklist` skill'i ile, özellikle: webhook imza doğrulamasının
kapı olarak çalışması, `retryable`/503 sözleşmesinin sonsuz döngü üretmemesi,
cevap gövdelerinin sipariş bilgisi sızdırmaması, ham token'ın hiçbir log
satırına girmemesi.

- [ ] **Step 6: Özet**

Kullanıcıya rapor: ne yapıldı, hangi komutlar hangi çıktıyı verdi, dalda kaç
commit var. Sonraki adımlar (PR, deploy, iyzico panel ayarı, bekleyen üç
sipariş) ayrı onay gerektirir; bu planda yapılmaz.

---

## Sonraki adımlar (bu planın DIŞINDA, ayrı onayla)

1. PR açma ve `master`'a alma.
2. Canlıya deploy.
3. iyzico panelinde İşyeri Bildirimleri URL'ini tanımlama (değer gösterilip
   onay alınarak).
4. Kontrollü test ödemesiyle uçtan uca doğrulama.
5. Bekleyen üç siparişin temizlenmesi (`MA-20260918-BC2F` → `paid` +
   `payment_id 4207393587`; diğer ikisi → `cancelled`).
6. Migration'ın canlı veritabanına uygulanması.
