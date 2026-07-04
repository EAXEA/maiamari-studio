/**
 * iyzico Checkout Form (CF) entegrasyonu + ödeme sağlayıcı modu.
 *
 * - `iyzico` : IYZICO_API_KEY + IYZICO_SECRET_KEY tanımlıysa → gerçek iyzico
 *   Checkout Form. Kart verisi bizde durmaz: initialize sonrası alıcı iyzico'nun
 *   hosted ödeme sayfasına (`paymentPageUrl`) yönlendirilir; iyzico sonucu
 *   `callbackUrl`'e POST eder, biz token'la retrieve edip imza + tutar
 *   doğrulayarak siparişi "paid" işaretleriz (app/api/payment/iyzico/callback).
 * - `mock`   : anahtar yoksa → yerel "sandbox/test ödeme" adımı. Tüm akış
 *   (sepet → checkout → ödeme → sonuç → sipariş kaydı) anahtarsız görülebilir.
 *
 * NEDEN SDK YOK: resmi `iyzipay` paketi resource'larını `fs.readdirSync` +
 * dinamik `require` ile yükler; Turbopack/Next bundle EDEMİYOR (build hatası).
 * Bu yüzden istekler doğrudan fetch ile, IYZWSv2 imzası elle atılır. Algoritma
 * resmi dokümandaki "Authentication v2" + SDK kaynak koduyla birebir:
 *   signature = hexHMAC_SHA256(secretKey, randomKey + uriPath + requestBody)
 *   Authorization: IYZWSv2 base64("apiKey:K&randomKey:R&signature:S")
 *   + "x-iyzi-rnd: R" header'ı. (Resend modülüyle aynı bağımlılıksız desen.)
 *
 * GÜVENLİK MODELİ (bkz. memory reference_iyzico_integration):
 * - callbackUrl'e gelen POST'a güvenilmez (yalnız token taşır, herkes POST'layabilir).
 *   Otorite: token ile server-to-server RETRIEVE → `paymentStatus==='SUCCESS'`
 *   + response signature (HMAC-SHA256, ':' ayraçlı, trailing-zero normalize)
 *   + sipariş tutarı/para birimi çapraz kontrolü.
 *
 * Sadece sunucu tarafında kullanılır (process.env + node:crypto okur).
 */
import crypto from "node:crypto";
import type { OrderRow, OrderItemRow } from "@/lib/db/schema";
import { cleanEnv } from "@/lib/env";

export type PaymentMode = "iyzico" | "mock";

export function isIyzicoConfigured(): boolean {
  return Boolean(cleanEnv("IYZICO_API_KEY") && cleanEnv("IYZICO_SECRET_KEY"));
}

export function paymentMode(): PaymentMode {
  return isIyzicoConfigured() ? "iyzico" : "mock";
}

/** Public site tabanı (callbackUrl için). Lokal/preview testte SITE_URL ile ezilir. */
export function siteBaseUrl(): string {
  return (cleanEnv("SITE_URL") || "https://www.maiamari.art").replace(/\/+$/, "");
}

// ---------------------------------------------------------------
// HTTP istemcisi — IYZWSv2 imzalı POST
// ---------------------------------------------------------------

const INITIALIZE_PATH = "/payment/iyzipos/checkoutform/initialize/auth/ecom";
const RETRIEVE_PATH = "/payment/iyzipos/checkoutform/auth/ecom/detail";

async function iyzicoPost<T>(
  path: string,
  payload: Record<string, unknown>,
): Promise<T> {
  const apiKey = cleanEnv("IYZICO_API_KEY")!;
  const secretKey = cleanEnv("IYZICO_SECRET_KEY")!;
  const base = (
    cleanEnv("IYZICO_BASE_URL") || "https://sandbox-api.iyzipay.com"
  ).replace(/\/+$/, "");

  // İmzalanan gövde ile gönderilen gövde BAYT BAYT aynı olmalı → tek stringify.
  const body = JSON.stringify(payload);
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
}

// ---------------------------------------------------------------
// Response signature doğrulama
// ---------------------------------------------------------------

/**
 * İmza için tutar normalizasyonu: ondalık sondaki sıfırlar atılır
 * ("50.00"→"50", "10.50"→"10.5", "10.510"→"10.51"). iyzico bu normalize
 * edilmiş halleri imzalar; normalizasyonu biz yaparız.
 */
export function normalizePriceForSignature(
  v: string | number | undefined | null,
): string {
  if (v == null) return "";
  const s = String(v);
  if (!s.includes(".")) return s;
  return s.replace(/0+$/, "").replace(/\.$/, "");
}

function verifySignature(
  params: Array<string | number | undefined | null>,
  signature: string | undefined,
): boolean {
  const secret = cleanEnv("IYZICO_SECRET_KEY");
  if (!secret || !signature) return false;
  const data = params.map((p) => (p == null ? "" : String(p))).join(":");
  const expected = crypto
    .createHmac("sha256", secret)
    .update(data, "utf8")
    .digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(String(signature), "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** CF Retrieve yanıt imzası — param sırası sabit (resmi dokümandan). */
export function verifyCfRetrieveSignature(r: CfRetrieveResult): boolean {
  return verifySignature(
    [
      r.paymentStatus,
      r.paymentId,
      r.currency,
      r.basketId,
      r.conversationId,
      normalizePriceForSignature(r.paidPrice),
      normalizePriceForSignature(r.price),
      r.token,
    ],
    r.signature,
  );
}

/** CF Initialize yanıt imzası: [conversationId, token]. */
export function verifyCfInitSignature(r: CfInitializeResult): boolean {
  return verifySignature([r.conversationId, r.token], r.signature);
}

// ---------------------------------------------------------------
// Initialize — hosted ödeme sayfası
// ---------------------------------------------------------------

export type CfInitializeResult = {
  status?: string;
  errorCode?: string;
  errorMessage?: string;
  conversationId?: string;
  token?: string;
  checkoutFormContent?: string;
  paymentPageUrl?: string;
  signature?: string;
};

export type CheckoutFormInit =
  | { ok: true; token: string; paymentPageUrl: string }
  | { ok: false; error: string };

/**
 * iyzico hosted ödeme sayfası (CPP) sipariş verisini tarayıcıda btoa() ile
 * encode ediyor; btoa Latin1 (0x00-0xFF) dışı karakterde InvalidCharacterError
 * fırlatır ve sayfa BOŞ kalır. Türkçe ş/Ş, ğ/Ğ, ı/İ Latin1'de YOK (ç/ö/ü var).
 * Bu yüzden iyzico'ya giden görüntü alanları (ad, adres, ürün adı, kategori)
 * Latin1-güvenli hale çevrilir; DB/site metinleri DEĞİŞMEZ. (Sandbox testinde
 * "cihan şenocak" + "Baskı Atölyesi" ile birebir yaşandı, 2026-07-04.)
 */
const TR_LATIN1_MAP: Record<string, string> = {
  ş: "s", Ş: "S", ğ: "g", Ğ: "G", ı: "i", İ: "I",
};
export function latin1Safe(s: string): string {
  const tr = s.replace(/[şŞğĞıİ]/g, (ch) => TR_LATIN1_MAP[ch]);
  let out = "";
  for (const ch of tr) {
    if ((ch.codePointAt(0) as number) <= 0xff) {
      out += ch;
      continue;
    }
    // Diğer Latin1-dışı karakterler: aksanı at (é→e gibi zaten Latin1 ama
    // ör. "ā"→"a"); hâlâ sığmıyorsa '?' (emoji vb.).
    const ascii = ch.normalize("NFD").replace(/[̀-ͯ]/g, "");
    out += ascii && (ascii.codePointAt(0) as number) <= 0xff ? ascii : "?";
  }
  return out;
}

/** "+90..." formuna normalize etmeye çalışır; tanınmayan formatı aynen geçirir. */
function normalizeGsm(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.length === 10) return `+90${d}`; // 5xxxxxxxxx
  if (d.length === 11 && d.startsWith("0")) return `+9${d}`; // 05xxxxxxxxx
  if (d.length === 12 && d.startsWith("90")) return `+${d}`;
  return phone.trim();
}

/** Taksit seçenekleri: IYZICO_INSTALLMENTS="1,2,3" (varsayılan tek çekim). */
function enabledInstallments(): number[] {
  const raw = cleanEnv("IYZICO_INSTALLMENTS");
  if (!raw) return [1];
  const list = raw
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= 12);
  return list.length ? list : [1];
}

/**
 * Sipariş için CF başlatır; alıcı `paymentPageUrl`'e yönlendirilir.
 * Hata fırlatmaz: ağ/validasyon hataları `{ ok:false }` döner (odeme sayfası
 * kullanıcıya nazik bir hata gösterir, sipariş pending kalır → tekrar denenir).
 */
export async function initializeCheckoutForm(
  order: OrderRow,
  items: OrderItemRow[],
  buyerIp: string,
): Promise<CheckoutFormInit> {
  const nameParts = latin1Safe(order.buyerName).trim().split(/\s+/);
  const surname = nameParts.length > 1 ? nameParts.pop()! : nameParts[0];
  const name = nameParts.join(" ") || surname;
  const total = String(order.totalTry);
  const address = latin1Safe(order.addressLine);
  const city = latin1Safe(order.city);
  const contactName = latin1Safe(order.buyerName);

  const payload = {
    locale: "tr",
    conversationId: order.conversationId ?? order.id,
    price: total, // basketItems toplamına eşit olmak ZORUNDA
    paidPrice: total, // şu an kargo/indirim yok → çekilen tutar = sepet toplamı
    currency: "TRY",
    basketId: order.id,
    paymentGroup: "PRODUCT",
    callbackUrl: `${siteBaseUrl()}/api/payment/iyzico/callback`,
    enabledInstallments: enabledInstallments(),
    buyer: {
      id: order.id,
      name,
      surname,
      gsmNumber: normalizeGsm(order.buyerPhone),
      email: order.buyerEmail,
      // TCKN checkout'ta toplanmıyor (alan CF için zorunlu; fatura süreci ayrı).
      identityNumber: "11111111111",
      registrationAddress: address,
      ip: buyerIp,
      city,
      country: "Turkey",
    },
    shippingAddress: {
      contactName,
      city,
      country: "Turkey",
      address,
    },
    billingAddress: {
      contactName,
      city,
      country: "Turkey",
      address,
    },
    basketItems: items.map((it) => ({
      id: it.productId ?? it.id,
      name: latin1Safe(it.title),
      category1: "Baski Atolyesi",
      itemType: "PHYSICAL",
      // iyzico sepet kalemi adetsizdir: satır toplamı (birim × adet) gönderilir.
      price: String(it.lineTotalTry),
    })),
  };

  let result: CfInitializeResult;
  try {
    result = await iyzicoPost<CfInitializeResult>(INITIALIZE_PATH, payload);
  } catch (e) {
    console.error("iyzico initialize isteği başarısız:", e);
    return { ok: false, error: "Ödeme sağlayıcısına ulaşılamadı." };
  }

  if (result.status !== "success" || !result.token || !result.paymentPageUrl) {
    console.error("iyzico initialize reddetti:", {
      errorCode: result.errorCode,
      errorMessage: result.errorMessage,
    });
    return {
      ok: false,
      error: result.errorMessage || "Ödeme başlatılamadı.",
    };
  }
  // İmza dönerse doğrula (defense-in-depth; bağlantı zaten TLS).
  if (result.signature && !verifyCfInitSignature(result)) {
    console.error("iyzico initialize imzası doğrulanamadı", {
      conversationId: result.conversationId,
    });
    return { ok: false, error: "Ödeme yanıtı doğrulanamadı." };
  }

  return {
    ok: true,
    token: result.token,
    paymentPageUrl: result.paymentPageUrl,
  };
}

// ---------------------------------------------------------------
// Retrieve — callback sonrası otorite kontrolü
// ---------------------------------------------------------------

export type CfRetrieveResult = {
  status?: string;
  errorCode?: string;
  errorMessage?: string;
  paymentStatus?: string;
  paymentId?: string | number;
  price?: string | number;
  paidPrice?: string | number;
  currency?: string;
  basketId?: string;
  conversationId?: string;
  token?: string;
  signature?: string;
};

/**
 * Token ile ödeme sonucunu iyzico'dan çeker. conversationId bilinçli
 * GÖNDERİLMEZ: yanıttaki basketId/tutar alanları initialize'daki ödeme
 * oturumuna aittir ve response signature ile imzalıdır; sipariş eşleştirmesi
 * basketId üzerinden yapılır.
 */
export async function retrieveCheckoutForm(
  token: string,
): Promise<CfRetrieveResult> {
  return iyzicoPost<CfRetrieveResult>(RETRIEVE_PATH, { locale: "tr", token });
}
