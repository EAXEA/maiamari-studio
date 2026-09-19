# iyzico ödeme bildirimi (webhook) — ikinci haber yolu

**Tarih:** 2026-09-19
**Durum:** onaylandı, uygulanmayı bekliyor

## Sorun

18.09.2026'da 1.250 TL'lik bir ödeme alındı, sipariş `pending` kaldı, satıcıya
ve alıcıya hiçbir bildirim gitmedi. Olay 18 saat boyunca fark edilmedi.

Kanıt — Vercel production logu, `dpl_4fKRc1246q9XrHXkatFh21hnxTyq`:

```
SEP 18 18:21:26.72  POST 303  /api/payment/iyzico/callback
Referer: https://api.iyzipay.com/   (iPhone Safari, fra1)
iyzico retrieve isteği başarısız: [TypeError: fetch failed]
  [cause]: Error: read ECONNRESET  errno: -104, syscall: 'read'
External APIs: POST api.iyzipay.com/payment/iyzipos/checkoutform/auth/ecom/detail
  → Timeout, 117ms
```

iyzico panelinde karşılığı: `conversationId e2af3778-…4d512`, paymentId
`4207393587`, 18.09.2026 18:21:10, ₺1.250,00, **Başarılı**. Sipariş
`MA-20260918-BC2F` (`df9a0a79-9f05-40c9-bfcb-2ae2239bef36`).

Aynı pencerede `initialize` çağrıları da ECONNRESET aldı (17:58:19, 18:19:48
×2, 18:19:53, 18:19:54). Alıcı ödeme sayfasını açamadığı için üç kez sipariş
oluşturdu; yalnız sonuncusu ödendi. Mükerrer tahsilat yok.

### Kök neden

Ödeme sonucu sisteme **tek bir yoldan** giriyor: alıcının tarayıcısının
`callbackUrl`'e yaptığı POST. Bu POST geldi, ama işlenmesi için gereken
server-to-server `retrieve` çağrısı ağ hatasıyla düştü ve kodda tekrar deneme
yok (`app/api/payment/iyzico/callback/route.ts:92` — `catch` → `back("/cart")`).
Tek kanal, tek deneme. Haber düşerse kalıcı olarak kaybolur.

E-posta bildirimi `pending → paid` geçişine bağlı olduğu için (`route.ts:140`)
mail de hiç tetiklenmedi. Resend'de arıza yoktu.

## Amaç

Ödeme alınmış bir siparişin fark edilmeden `pending` kalmasını imkânsız kılmak.

## Kapsam dışı

Bilinçli olarak yapılmayacaklar:

- **Kendi zamanlanmış uzlaştırma işimiz** (cron ile `pending` tarama). iyzico'nun
  kendi tekrar deneme mekanizması (15 dk arayla 3 deneme) aynı işi bedelsiz
  yapıyor; ikinci bir zamanlayıcı kurmak hareketli parça ve `IYZICO_SECRET_KEY`
  yayılımı demek. Gerekirse sonra eklenir.
- **Sipariş eşleştirme için şema değişikliği.** Webhook gövdesi `token` taşıdığı
  için callback ile aynı veriye sahip; siparişi bulmak için yeni kolon veya
  sorgu gerekmiyor. (Görünürlük için iki kolon eklenir, aşağıya bakınız.)
- **Admin panelinde uzlaştırma arayüzü** — "iyzico'ya tekrar sor" butonu gibi.
  Otomatik yollar tutarsa gereksiz. Panelde yalnız *görünürlük* olacak.
- `initialize` çökmesinin çözümü. iyzico erişilemezse alıcı ödeme sayfasını
  açamaz; bu dışsal ve çözülemez. Amaç, **para alınmışsa mutlaka yakalanması**.
- Alıcıya gönderilen mevcut sipariş onayı metninin değiştirilmesi.

## Tasarım

### İlke: webhook tetikleyicidir, otorite değil

Mevcut callback'in güvenlik felsefesi aynen korunur. İmzası doğrulanmış bir
webhook bile tek başına `paid` yazdırmaz. Otorite zinciri değişmez:

```
token → server-to-server retrieve → response signature doğrula →
basketId'den siparişi bul → tutar + para birimi çapraz kontrol →
paymentStatus SUCCESS ve sipariş pending ise paid
```

Webhook yalnızca bu zinciri **ikinci kez tetikleme** hakkı verir.

### `lib/checkout/settle-payment.ts` — ortak uzlaştırma

Callback route'unun gövdesindeki mantık buraya taşınır. Callback ve webhook
ikisi de bunu çağırır; iki ayrı ödeme mantığı bulunmaz.

```ts
type SettleOutcome =
  | { kind: "paid"; orderId: string; orderNo: string; firstTime: boolean }
  | { kind: "already-paid"; orderId: string }
  | { kind: "not-paid"; orderId: string }          // iyzico FAILURE — kesin
  | { kind: "retryable"; reason: string }          // ağ/altyapı — tekrar denenmeli
  | { kind: "needs-attention"; reason: string; detail: Record<string, unknown> };

export async function settleCheckoutFormPayment(
  token: string,
  opts: { source: "callback" | "webhook" },
  deps?: SettleDeps,
): Promise<SettleOutcome>;
```

`source` iki davranışı belirler; ikisi de "bu yol kendi kendine tekrar dener mi"
sorusundan türer:

| | `callback` | `webhook` |
|---|---|---|
| Siparişi `failed` işaretleyebilir | evet (bugünkü davranış) | **hayır** (gerekçe aşağıda) |
| `retryable` durumunda uyarı maili | **evet** — callback bir daha gelmez | hayır — iyzico 15 dk sonra tekrar dener |

`deps` yalnız test içindir: iyzico ve DB erişimi enjekte edilebilir tutulur,
üretimde varsayılan (`defaultSettleDeps`) kullanılır.

Davranış, bugünkü callback ile birebir aynı; tek fark sonucun dönüş değeri
olarak ifade edilmesi:

- Hızlı yol (`paymentTokenHash` eşleşmesi + sipariş zaten `paid`) → `already-paid`
- `retrieve` ağ hatası / `status !== "success"` → **`retryable`**
- Retrieve imzası doğrulanamadı → `needs-attention` (siparişe dokunulmaz)
- Yerel eşleşme `basketId` ile uyuşmuyor → `needs-attention`
- SUCCESS + tutar uyuşuyor + sipariş `pending` → `dbMarkOrderPaid` → `paid`
  (`firstTime: true` yalnız koşullu UPDATE gerçekten satır etkilediyse)
- SUCCESS + tutar uyuşmuyor → `needs-attention`
- SUCCESS + sipariş `pending` de `paid` de değil → `needs-attention`
- FAILURE → `source === "callback"` ise ve sipariş `pending` ise
  `dbMarkOrderFailed`; webhook'ta siparişe dokunulmaz → her iki halde `not-paid`

#### Neden webhook siparişi `failed` yapmamalı

iyzico'nun hosted ödeme sayfasında alıcı aynı oturumda birden çok kart
deneyebilir ve webhook `status` alanı `SUCCESS`/`FAILURE` dışında `INIT_THREEDS`
gibi ara değerler de taşır. Webhook'a `failed` yazma yetkisi verilirse şu zincir
kurulur: ilk denemede FAILURE bildirimi gelir → sipariş `failed` olur → alıcı
ikinci kartla **ödemeyi başarır** → SUCCESS bildirimi gelir → sipariş artık
`pending` olmadığı için `paid` yazılamaz → `needs-attention`. Yani çözmeye
çalıştığımız hatanın aynısını yeni bir kapıdan üretmiş oluruz.

Callback'te bu risk yok: callback yalnızca alıcı akışı bitirip siteye geri
döndüğünde gelir, yani o oturum kapanmıştır. Bu yüzden `failed` yazma yetkisi
orada kalır ve bugünkü davranış korunur.

Sonuç olarak uzlaştırma webhook yolunda **tek yönlüdür**: yalnız ödenmiş
siparişi kapatır, hiçbir zaman ödenmemiş ilan etmez.

`firstTime: true` olan tek çağrı sipariş e-postasını gönderir. Koşullu UPDATE
zaten tek kazanan bıraktığı için callback ile webhook yarışsa bile mükerrer
mail gitmez.

### `app/api/payment/iyzico/webhook/route.ts`

```
POST /api/payment/iyzico/webhook
```

1. Ham gövde okunur (imza doğrulaması ham metin üzerinden yapılmalı).
2. `X-IYZ-SIGNATURE-V3` doğrulanır. Geçersizse **401**, siparişe dokunulmaz,
   yüksek sesle loglanır.
3. `iyziEventType !== "CHECKOUT_FORM_AUTH"` ise 200 + no-op (abonelik, banka
   havalesi vb. bizi ilgilendirmiyor).
4. `token` ile `settleCheckoutFormPayment` çağrılır.
5. Sonuca göre HTTP kodu seçilir (aşağıdaki sözleşme).

Uç nokta `dynamic = "force-dynamic"`, GET'e 405.

### HTTP cevap sözleşmesi — tekrar denemeyi iyzico'ya yaptırmak

Bu tasarımın merkezi. iyzico 2xx alana kadar 15 dakika arayla 3 kez dener. Biz
kendi tekrar deneme kodumuzu yazmıyoruz; **cevap kodunu doğru seçerek** onun
mekanizmasını kullanıyoruz.

| Sonuç | HTTP | Gerekçe |
|---|---|---|
| `paid`, `already-paid`, `not-paid` | 200 | Kesin sonuç, tekrarın faydası yok |
| `retryable` | **503** | Geçici hata. 15 dk sonra ağ düzelmiş olur |
| `needs-attention` | 200 | Tekrar denemek düzeltmez; insan müdahalesi gerekir |
| İmza geçersiz | 401 | 2xx değil, iyzico tekrar dener → imza hatamız varsa logda üç kez görünür |
| `iyziEventType` ilgisiz | 200 | Bizi ilgilendirmiyor |

18.09 senaryosunun bu sözleşmeyle nasıl sonuçlanacağı: 18:21:26'da `retryable`
→ 503. 18:36 civarında iyzico tekrar dener, ağ düzelmiştir, `retrieve` başarılı
olur, sipariş `paid` olur, mailler gider. Hiç kimse olayı fark etmez.

### `lib/payment/iyzico.ts` — webhook imzası

```ts
export function verifyWebhookSignature(
  header: string | null,
  body: { iyziEventType?: string; iyziPaymentId?: string | number;
          token?: string; paymentConversationId?: string; status?: string },
): boolean;
```

Resmî HPP formülü — mevcut `verifySignature`'dan **farklı**, ayraçsız ve
`secretKey` hem anahtar hem dizgenin başında:

```
HMAC-SHA256(
  key   = secretKey,
  data  = secretKey + iyziEventType + iyziPaymentId + token
          + paymentConversationId + status
) → hex
```

Karşılaştırma mevcut desendeki gibi `crypto.timingSafeEqual` ile yapılır.
`cleanEnv("IYZICO_SECRET_KEY")` yoksa `false`.

### Şema — dikkat bayrağı

Sipariş durumu panelden takip edildiği için, dikkat gerektiren ödeme yalnız
e-postada kalmamalı; siparişin üstünde görünmeli. `orders` tablosuna iki kolon:

```ts
/** Ödeme doğrulanamadığında sebep (null = sorun yok). Panelde rozet olarak
 *  görünür, sipariş `paid` olunca temizlenir. */
paymentAttentionReason: text("payment_attention_reason"),
/** Bayrağın ne zaman konduğu — panelde "18 saattir bekliyor" bilgisi için. */
paymentAttentionAt: timestamp("payment_attention_at", { withTimezone: true }),
```

`status` alanına yeni bir değer **eklenmez**. Sipariş yaşam döngüsü
(`pending | paid | failed | cancelled` + kargo durumları) olduğu gibi kalır;
dikkat bayrağı ona dik, bağımsız bir işarettir. Böylece `ARCHIVED_STATUSES`,
arşiv filtreleri ve mevcut panel mantığı etkilenmez.

Migration `npm run db:generate` ile üretilir (`lib/db/migrations`), iki kolon da
nullable olduğu için mevcut satırlar etkilenmez.

**İkinci faydası:** bayrak, mükerrer uyarı e-postasını da bastırır. Uyarı
gönderilmeden önce aynı sebeple bayrak zaten konmuşsa mail tekrar gitmez.
Webhook'un üç denemesi tek uyarı üretir.

Yeni veri katmanı fonksiyonları (`lib/db/orders.ts`):

- `dbFlagOrderAttention(orderId, reason)` — bayrağı koyar; aynı sebeple zaten
  konmuşsa `false` döner (mail bastırma buna bakar)
- `dbClearOrderAttention(orderId)` — `dbMarkOrderPaid` başarılı olduğunda
  çağrılır; çözülen sorun panelde asılı kalmaz

### Admin panelinde görünürlük

- `app/admin/orders/page.tsx` — listede bayraklı siparişler işaretlenir
  (ör. "⚠ ödeme doğrulanamadı"), sıralamada öne alınır.
- `app/admin/orders/[id]/page.tsx` — detayda sebep ve bayrak zamanı açıkça
  yazılır, ne yapılması gerektiği tek cümleyle belirtilir.

Metinler `ux-copy` ölçütlerine uyar: em-dash kullanılmaz, teknik hata mesajı
değil ne olduğu ve ne yapılacağı yazılır.

### `lib/notify/order-email.ts` — dikkat gerektiren ödeme uyarısı

```ts
export async function notifyPaymentNeedsAttention(
  reason: string,
  detail: Record<string, unknown>,
): Promise<void>;
```

`ORDER_EMAIL_TO` adresine gider, mevcut `send()` yardımcısını kullanır,
best-effort (hatası yutulur). Konu satırına sipariş no konur ki Gmail aynı
olayın tekrarlarını tek başlık altında toplasın.

Ne zaman gönderilir:

- `needs-attention` her durumu (tutar uyuşmazlığı, imza hatası, durum
  uyumsuzluğu, eşleşme karışıklığı)
- Callback yolunda `retryable` (dünkü senaryo): "bir ödeme doğrulanamadı,
  iyzico tekrar deneyecek" tonunda. Webhook sonradan başarılı olursa normal
  sipariş maili de gelir.

Ne zaman gönderilmez: `initialize` hataları (alıcı ödeme sayfasını açamadı,
para hareketi yok), `not-paid`, başarılı akış.

Mükerrer uyarı, dikkat bayrağı sayesinde bastırılır: aynı sebeple bayrak zaten
konmuşsa mail tekrar gönderilmez. Webhook'un üç denemesi tek uyarı üretir.

### `iyzicoPost` — okuma çağrılarında tekrar deneme

`retrieve` salt okuma olduğu için tekrarı güvenli: ağ hatasında 1 kez, ~400 ms
sonra yeniden denenir. `initialize` her çağrıda yeni ödeme oturumu ürettiği
için tekrarlanmaz. Bu, webhook'un beklemesine gerek kalmadan anlık kopmaların
çoğunu yutar.

## Güvenlik

- Ham `token` DB'ye ve loga **yazılmaz**; mevcut kural korunur.
- Webhook gövdesi imza doğrulanmadan hiçbir iş için kullanılmaz.
- Sahte webhook en fazla bir `retrieve` sorgusu tetikler; sipariş durumu
  yalnız iyzico'nun imzalı yanıtı + tutar kontrolü ile değişir.
- Uç nokta CSP/güvenlik başlıklarından etkilenmez (API route).
- `IYZICO_SECRET_KEY` hiçbir yeni sisteme kopyalanmaz.

## Test

Birim (`tests/unit/`, `node:test`, sentetik secret — mevcut desen):

- `iyzico-webhook-signature.test.ts` — geçerli imza kabul; tahrif edilmiş her
  alan (eventType, paymentId, token, conversationId, status) red; eksik başlık
  red; secret yokken red; uzunluk farkında `timingSafeEqual` patlamaz.
- `settle-payment.test.ts` — `SettleOutcome` dallarının doğru üretilmesi.
  iyzico ve DB erişimi enjekte edilebilir tutulur ki test ağ ve DB'siz koşsun.
  Ayrıca: `source: "webhook"` iken FAILURE yanıtının siparişe **dokunmadığı**
  (bir önceki bölümdeki çoklu kart senaryosu) açıkça test edilir.

Uçtan uca (canlıya almadan önce):

- Sandbox ortamında gerçek bir Checkout Form ödemesi yapılır, webhook'un
  geldiği ve siparişi kapattığı **görülerek** doğrulanır. Varsayımla
  ilerlenmez. Sandbox webhook desteği yoksa, canlıda düşük tutarlı (₺15 —
  daha önce yapılmış) kontrollü bir test ödemesi yapılır.
- `retryable` yolu: `IYZICO_BASE_URL` geçersiz bir adrese çevrilerek 503
  döndüğü ve iyzico'nun tekrar denediği gözlenir.

Panel görünürlüğü: bayraklı bir siparişin listede ve detayda göründüğü,
`paid` olduğunda bayrağın kaybolduğu `browser-verify` ile doğrulanır. Gerçekten
açılıp görülmeden tamamlandı sayılmaz.

Yeni birim testler `package.json`'daki `test:unit` listesine eklenir (dosyalar
tek tek sayılıyor, otomatik keşif yok).

Mevcut `tests/unit/iyzico-signature.test.ts` ve `resolve-callback-order.test.ts`
yeşil kalmalı; callback'in dış davranışı değişmiyor.

## Devreye alma sırası

Sıra önemli. Webhook URL'i, uç nokta canlıda çalışmadan **önce** tanımlanırsa
iyzico var olmayan bir adrese bildirim gönderir.

1. Kod yazılır, birim testler geçer, PR açılır.
2. Canlıya alınır. `https://www.maiamari.art/api/payment/iyzico/webhook`
   erişilebilir olur (imzasız POST'a 401 dönmesiyle doğrulanır).
3. iyzico panelinde tanımlanır: Ayarlar → Firma Ayarları → İşyeri Bildirimleri
   → URL alanı (şu an boş). Ajan girebilir, ancak **kaydetmeden önce yazacağı
   değeri gösterip onay alır** — canlı ödeme altyapısı ayarı, sessizce
   değiştirilmez.
4. Kontrollü test ödemesi yapılır, webhook'un geldiği logdan doğrulanır.
5. Bekleyen üç sipariş temizlenir: `MA-20260918-BC2F` → `paid` +
   `payment_id 4207393587`; `MA-20260918-A0E2` ve `MA-20260918-3AA6` →
   `cancelled`. Her biri için yazılacak değer önce gösterilir, onay alınır.
   Alıcıya bilgilendirme ayrı iş olarak ele alınır.

## Riskler

| Risk | Azaltma |
|---|---|
| Webhook, sipariş durumunu değiştirebilen açık uç nokta | Otorite verilmiyor; imza + retrieve + tutar kontrolü zinciri aynen korunuyor |
| İmza formülü yanlış uygulanır, tüm webhook'lar sessizce reddedilir | 401 → iyzico tekrar dener, logda üç kez görünür; ayrıca uçtan uca test zorunlu |
| "Çözdük" sanıp doğrulamadan geçmek | Devreye alma adımı 4 zorunlu; gözle görülmeden tamamlandı sayılmaz |
| Mükerrer e-posta | `dbMarkOrderPaid` koşullu UPDATE'i tek kazanan bırakır; sipariş maili yalnız `firstTime` |
| Uyarı maili gürültüsü | Yalnız para hareketi olabilecek durumlarda; konu satırında sipariş no |
| Canlı ödeme akışına dokunma / regresyon | Callback'in dış davranışı değişmiyor, gövdesi taşınıyor; mevcut testler yeşil kalmalı |
| Webhook'un başarısız/ara denemeleri siparişi erkenden kapatır | `source: "webhook"` — webhook yalnız ödenmişi kapatır, ödenmemiş ilan edemez |
| `payment/detail` ile `conversationId` sorgusu bu tasarımda kullanılmıyor | Gerekmiyor: webhook `token` taşıyor. İleride uzlaştırma eklenirse yol açık |

### Kalan, çözülmeyen risk

iyzico API'sine erişim uzun süre kopuk kalırsa alıcı ödeme sayfasını açamaz
(18.09'daki `initialize` hataları). Bu tasarım bunu çözmez. Çözdüğü şey:
**para alınmışsa artık kaybolamaz.** Sorun "tahsilat yapıldı, kimsenin haberi
yok" olmaktan çıkıp "geçici olarak satın alınamıyor" seviyesine iner.

## Kaynaklar

- iyzico Webhook: https://docs.iyzico.com/ek-servisler/webhook
- CF Sorgulama: https://docs.iyzico.com/odeme-metotlari/odeme-formu/cf-entegrasyonu/cf-sorgulama
- Ödeme Sorgulama: https://docs.iyzico.com/odeme-metotlari/non-3ds/non-3ds-entegrasyonu/odeme-sorgulama
