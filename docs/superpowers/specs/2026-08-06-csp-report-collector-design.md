# CSP ihlal raporu toplayıcı

**Tarih:** 2026-08-06
**Durum:** onaylandı, uygulanıyor

## Sorun

CSP v2.3 (PR #6, `52a1b82`) canlıda ve `Content-Security-Policy-Report-Only`
başlığı gönderiliyor. Ancak başlıkta `report-uri` / `report-to` yok. Report-only
modun tek amacı ihlalleri toplamaktır; toplayacak bir uç nokta olmadığı için
ihlaller yalnız ziyaretçinin tarayıcı konsoluna yazılıyor ve hiçbir yere
ulaşmıyor. Politika bu haliyle zararsız ama işlevsiz: enforce'a geçme kararını
dayandıracak veri birikmiyor.

## Amaç

Enforce'a geçmeden önce hangi direktiflerin gerçek sayfalarda ihlal ürettiğini
görmek. Kalıcı izleme altyapısı kurmak DEĞİL.

## Kapsam dışı

Bilinçli olarak yapılmayacaklar:

- DB tablosu (`csp_reports`) ve kalıcı saklama
- Admin arayüzü / `/admin/health` entegrasyonu
- Oran sınırlama, uyarı, bildirim
- Üçüncü taraf toplayıcı (report-uri.com, Sentry) — projenin KVKK duruşu
  gereği harici veri işleyici eklenmiyor

## Toplama stratejisi

"Ucu aç, ziyaretçi raporu birikmesini bekle" YAPILMAYACAK. İki nedenle:

1. Vercel'in runtime log saklama süresi plana göre kısa olabilir.
2. Ziyaretçi kaynaklı raporların büyük kısmı tarayıcı eklentisi gürültüsüdür;
   bizim kodumuzla ilgisi yoktur.

Bunun yerine: uç canlıya alınır, siteyi Playwright ile kendimiz gezeriz,
`vercel logs` ile logu anında okuruz. Daha temiz sinyal, daha hızlı sonuç.

## Mimari

### `lib/security/csp-report.ts` — saf mantık

Route'tan ayrık, doğrudan birim testlenebilir. `resolve-callback-order.ts` ile
aynı desen: saf mantık HTTP/DB kabuğundan ayrı.

- `parseCspReport(contentType, rawBody)` → `CspViolation[]`
  - `application/csp-report` (eski `report-uri` biçimi, tek `csp-report` nesnesi)
  - `application/reports+json` (Reporting API, `type: "csp-violation"` dizisi)
  - Bozuk JSON / tanınmayan biçim → boş dizi (throw YOK)
- `isExtensionNoise(violation)` → `boolean`
  - `blocked-uri` şeması `chrome-extension:`, `moz-extension:`,
    `safari-web-extension:` ise `true`
- `formatViolation(violation)` → tek satır log stringi, `[csp]` önekli

### `app/api/csp-report/route.ts` — HTTP kabuğu

Yalnız `POST`. Uç herkese açık olmak zorundadır (tarayıcı gönderir, kimlik
doğrulanamaz), bu yüzden savunmacı:

- `content-length` 64KB üstündeyse gövde okunmadan `413`
- Gövde okuma + ayrıştırma try/catch içinde; hiçbir durumda exception fırlatmaz
- Her ihlal için bir log satırı, eklenti gürültüsü atlanır
- Her durumda `204 No Content`

DB'ye yazmadığı için kötüye kullanım yüzeyi yok; en kötü senaryo log gürültüsü.

### `next.config.ts` — başlıklar

CSP dizisine `report-uri /api/csp-report`. **Sadece bu.**

İlk tasarım `report-to csp` + `Reporting-Endpoints` başlığını da içeriyordu.
Ölçüm bunu çürüttü (2026-08-06, hem Playwright Chromium hem gerçek Chrome):
ikisi birlikteyken **hiç rapor gelmedi**. İki neden üst üste bindi:

1. `report-to` mevcutsa Chrome `report-uri`'yi yok sayar.
2. `report-to`'nun bağlandığı `Reporting-Endpoints` değeri MUTLAK URL olmalıdır;
   göreli `/api/csp-report` geçersiz sayılır.

Sonuç: çalışan mekanizma gölgelenmiş, yerine geçen ise geçersiz uca
bağlanmıştı. `report-to` kaldırılınca raporlar anında akmaya başladı.
`report-uri` kullanımdan kalkıyor ama çalışıyor; geçici teşhis için yeterli.

## Test

`tests/unit/csp-report.test.ts`, `test:unit` script'ine eklenir (bu adımın
atlanması bugün bir kez yakalandı — yeni test dosyası script'e girmezse CI'da
hiç koşmaz).

Kapsam: iki gövde biçimi, bozuk JSON, tanınmayan biçim, eklenti filtresi,
log satırı biçimi.

## Doğrulama

1. Lokal: kasıtlı ihlal tetikle, log satırını gör — **YAPILDI**, gerçek
   Chrome'da `img-src` ihlali uca ulaştı ve doğru loglandı
2. Canlı: deploy → sayfaları gez → `vercel logs` ile topla

### Playwright uyarısı

Playwright'ın başlattığı Chromium ihlalleri **tespit eder** (konsola yazar) ama
rapor POST'unu **göndermez** — arka plan ağ servisi devre dışı olduğu için.
Rapor teslimatının doğrulanması gerçek tarayıcı ister. Playwright yalnız
"ihlal var mı" sorusunu yanıtlar, "rapor ulaşıyor mu" sorusunu yanıtlamaz.

### Dev modu gürültüsü

`next dev` HMR'ı `eval` kullanır ve sürekli `script-src`/`eval` ihlali üretir.
Bu üretimde YOKTUR (prod build eval kullanmaz). Politikaya bu yüzden
`'unsafe-eval'` EKLENMEMELİ; karar yalnız canlı raporlara dayanmalıdır.

## Sonraki adım (bu spec'in dışında)

Toplanan ihlallere göre direktifleri daralt, sonra
`Content-Security-Policy-Report-Only` → `Content-Security-Policy` geçişi.
`report-uri` enforce modda da faydalı olduğu için kaldırılmayacak.
