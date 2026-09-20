/**
 * iyzico ödeme bildirimi (webhook) — İKİNCİ haber yolu.
 *
 * Alıcının tarayıcısından gelen callback'ten bağımsızdır: iyzico bu adrese
 * ödemeden 10-15 sn sonra sunucu-sunucu POST eder ve 2xx alana kadar 15 dk
 * arayla 3 kez dener. 18.09.2026'da callback'teki retrieve çağrısı ECONNRESET
 * ile düştüğü için 1.250 TL'lik bir ödeme işlenmeden kalmıştı; bu uç o
 * senaryoyu kendiliğinden kapatır.
 *
 * GÜVENLİK — webhook TETİKLEYİCİDİR, OTORİTE DEĞİL. İmzası doğrulanmış olsa
 * bile gövdedeki `status` alanına göre sipariş güncellenmez; yalnız `token`
 * alınır ve otorite zinciri (retrieve → imza → tutar) baştan çalıştırılır.
 * Sahte bir POST en fazla boş bir sorgu tetikler.
 *
 * CEVAP SÖZLEŞMESİ — tekrar denemeyi iyzico'ya yaptırıyoruz, kendi tekrar
 * deneme kodumuzu yazmıyoruz:
 *   kesin sonuç (paid / already-paid / not-paid / needs-attention) → 200
 *   geçici hata (retryable)                                       → 503
 *   imza geçersiz                                                 → 401
 * 401 de 2xx olmadığı için iyzico tekrar dener; imza formülümüz hatalıysa
 * bu logda üç kez görünür ve sessiz kalmaz.
 *
 * Cevap gövdesi sipariş bilgisi TAŞIMAZ.
 *
 * Panel ayarı: Ayarlar → Firma Ayarları → İşyeri Bildirimleri → URL.
 */
import { NextResponse } from "next/server";
import { settleCheckoutFormPayment } from "@/lib/checkout/settle-payment";
import { reconcilePendingOrder } from "@/lib/checkout/reconcile-payment";
import { dbFindOrderIdByConversationId } from "@/lib/db/orders";
import {
  paymentMode,
  verifyWebhookSignature,
  diagnoseWebhookSignature,
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

  // V3 başlığı hesapta açık DEĞİLSE iyzico eski `x-iyz-signature` başlığını
  // yollar (20.09.2026'da canlıda görüldü: gelen başlık `x-iyz-signature`,
  // bizimki yalnız v3'e bakıyordu, bu yüzden imza formülü HİÇ çalışmadı).
  // V3'ün açılması iyzico'dan talep edildi; o gelene kadar aşağıdaki
  // ipucu yolu devreye girer.
  const sigHeader = req.headers.get("x-iyz-signature-v3");
  const eskiSigHeader = req.headers.get("x-iyz-signature");

  if (!verifyWebhookSignature(sigHeader, body)) {
    // GEÇİCİ TEŞHİS (2026-09-20): ilk gerçek webhook 401 aldı. Loglanan tek
    // ayırt edici bilgi, denenen formül varyantlarından hangisinin eşleştiği.
    // Ne imza (ne de bir parçası), ne ham token, ne secret loglanır: beklenen
    // imzayı sızdırmak gövdeyi kontrol eden birine örnek toplatırdı.
    // Sebep anlaşılınca bu blok kaldırılacak.
    console.error("iyzico webhook: İMZA DOĞRULANAMADI", {
      iyziEventType: body.iyziEventType,
      paymentConversationId: body.paymentConversationId,
      status: body.status,
      tokenGeldiMi: Boolean(body.token),
      imzaBasligiGeldiMi: Boolean(sigHeader),
      eskiBaslikGeldiMi: Boolean(eskiSigHeader),
      gelenImzaUzunluk: String(sigHeader || eskiSigHeader || "").length,
      eslesenVaryant: diagnoseWebhookSignature(sigHeader || eskiSigHeader, body),
      gelenBaslikAdlari: [...req.headers.keys()].filter((k) =>
        k.startsWith("x-iyz"),
      ),
      govdeAlanlari: Object.keys(body),
    });

    // İMZASIZ YOL: gövdeye GÜVENİLMEZ, yalnız `paymentConversationId` bir
    // İPUCU olarak alınır. Gerçeği iyzico'ya KENDİ kimliğimizle sorarız ve
    // yanıtın imzasını doğrularız; yani otorite gövde değil, bizim sorgumuz.
    //
    // Saldırgan ne yapabilir: geçerli bir conversationId biliyorsa bizi
    // iyzico'ya bir sorgu yapmaya zorlar. Sonuç yine iyzico'nun imzalı
    // cevabıdır, yani "ödenmemiş" bir siparişi ödendi yaptıramaz.
    //
    // Bu yol imza sorunu çözülünce de zararsızdır: imza doğrulanırsa zaten
    // buraya hiç girilmez.
    const ipucu = body.paymentConversationId;
    if (ipucu) {
      const orderId = await dbFindOrderIdByConversationId(String(ipucu));
      if (orderId) {
        const sonuc = await reconcilePendingOrder(orderId);
        if (sonuc.paid) {
          console.log("iyzico webhook: imzasız ipucu ile uzlaştırıldı", {
            orderId,
          });
          return NextResponse.json({ ok: true });
        }
        if (!sonuc.reachable) {
          // iyzico'ya ulaşılamadı: 503 ile iyzico'nun tekrar denemesini iste.
          return NextResponse.json({ ok: false }, { status: 503 });
        }
      }
    }

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

  // source: "webhook" → siparişi failed YAPMAZ (alıcı aynı oturumda ikinci
  // kartı deneyebilir) ve retryable'da sessiz kalır (bkz. settle-payment.ts).
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
