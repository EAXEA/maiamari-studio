import { LegalShell } from "@/components/legal/legal-shell";
import { SELLER, WITHDRAWAL_DAYS, REFUND_DAYS } from "@/lib/legal";

export const metadata = {
  title: "Mesafeli Satış Sözleşmesi",
  description:
    "Maiamari mesafeli satış sözleşmesi. Tarafların hak ve yükümlülükleri, ödeme, teslimat ve cayma hakkı koşulları.",
  alternates: { canonical: "/legal/mesafeli-satis" },
};

export default function MesafeliSatisPage() {
  return (
    <LegalShell
      title="Mesafeli Satış Sözleşmesi"
      lead="İşbu sözleşme, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca, aşağıda bilgileri yer alan SATICI ile ALICI arasında, ALICI tarafından elektronik ortamda verilen sipariş kapsamında düzenlenmiştir."
    >
      <h2>1. Taraflar</h2>
      <h3>Satıcı</h3>
      <dl>
        <dt>Ünvan</dt>
        <dd>
          {SELLER.legalName} ({SELLER.tradeName}, {SELLER.formType})
        </dd>
        <dt>Adres</dt>
        <dd>{SELLER.address}</dd>
        <dt>Telefon</dt>
        <dd>{SELLER.phone}</dd>
        <dt>E-posta</dt>
        <dd>{SELLER.email}</dd>
        <dt>Vergi dairesi</dt>
        <dd>{SELLER.taxOffice}</dd>
        <dt>Vergi / T.C. no</dt>
        <dd>{SELLER.taxNumber}</dd>
      </dl>
      <p>
        <strong>Alıcı:</strong> Sipariş sırasında bildirilen ad, soyad, teslimat
        ve fatura adresi, telefon ve e-posta bilgilerine sahip kişidir. ALICI
        bilgileri sipariş kaydında saklanır.
      </p>

      <h2>2. Konu</h2>
      <p>
        İşbu sözleşmenin konusu, ALICI&apos;nın {SELLER.website} alan adlı internet
        sitesinden elektronik ortamda sipariş verdiği, aşağıda nitelikleri ve
        satış fiyatı belirtilen ürünün satışı ve teslimi ile ilgili olarak,
        tarafların hak ve yükümlülüklerinin belirlenmesidir.
      </p>

      <h2>3. Sözleşme Konusu Ürün ve Ödeme Bilgileri</h2>
      <p>
        Ürünün türü, miktarı, adedi, satış bedeli ve ödeme şekli, sipariş
        anında ALICI tarafından onaylanan sipariş özetinde yer alır. Tüm
        fiyatlar Türk Lirası cinsinden ve KDV dahildir. Listelenen fiyatlar
        güncelleme tarihine kadar geçerlidir.
      </p>
      <p>
        Ödeme, kredi kartı veya banka kartı ile{" "}
        <strong>iyzico</strong> ödeme altyapısı üzerinden güvenli şekilde alınır.
        Kart bilgileri SATICI tarafından görülmez ve saklanmaz; ödeme işlemi
        doğrudan iyzico üzerinden gerçekleşir.
      </p>

      <h2>4. Teslimat</h2>
      <p>
        Ürün, ALICI&apos;nın sipariş sırasında bildirdiği adrese kargo ile
        teslim edilir. Sipariş, ödeme onayını izleyen 1-3 iş günü içinde kargoya
        verilir; yasal azami teslim süresi 30 gündür. Kargo ücreti, sipariş
        özetinde aksi belirtilmedikçe ALICI&apos;ya aittir. Teslimat ve iade
        koşullarının ayrıntısı{" "}
        <a href="/legal/iade">Teslimat ve İade Şartları</a> sayfasındadır.
      </p>

      <h2>5. Cayma Hakkı</h2>
      <p>
        ALICI, ürünü teslim aldığı tarihten itibaren {WITHDRAWAL_DAYS} gün içinde
        hiçbir gerekçe göstermeksizin ve cezai şart ödemeksizin sözleşmeden cayma
        hakkına sahiptir. Cayma bildirimi {SELLER.email} adresine e-posta ile
        veya {SELLER.phone} numarasından iletilebilir.
      </p>
      <p>
        Cayma hakkının kullanılması halinde ürün, faturası ve varsa hediye
        ürünleriyle birlikte eksiksiz olarak iade edilir. SATICI, cayma
        bildiriminin ulaşmasından itibaren {REFUND_DAYS} gün içinde ürün bedelini
        ALICI&apos;ya ödeme yaptığı yöntemle iade eder.
      </p>
      <h3>Cayma hakkının istisnaları</h3>
      <p>
        Mesafeli Sözleşmeler Yönetmeliği&apos;nin 15. maddesi uyarınca; ALICI
        isteği veya açıkça onun kişisel ihtiyaçları doğrultusunda hazırlanan,
        kişiye özel veya sipariş üzerine özel üretilen ürünlerde cayma hakkı
        kullanılamaz. Bu kapsamdaki ürünlerde durum, sipariş öncesinde ürün
        sayfasında ayrıca belirtilir.
      </p>

      <h2>6. Genel Hükümler</h2>
      <ul>
        <li>
          ALICI, sözleşme konusu ürünün temel nitelikleri, satış fiyatı ve ödeme
          şekli ile teslimata ilişkin bilgileri okuyup bilgi sahibi olduğunu ve
          elektronik ortamda gerekli teyidi verdiğini kabul eder.
        </li>
        <li>
          Teslim edilen ürünün ayıplı olması durumunda ALICI, 6502 sayılı Kanun
          kapsamındaki seçimlik haklarını kullanabilir.
        </li>
        <li>
          Mücbir sebep hallerinde tarafların edimlerini yerine getirmemesi
          sözleşmeye aykırılık sayılmaz.
        </li>
      </ul>

      <h2>7. Uyuşmazlıkların Çözümü</h2>
      <p>
        İşbu sözleşmeden doğabilecek uyuşmazlıklarda, Ticaret Bakanlığı&apos;nca
        her yıl ilan edilen parasal sınırlar dahilinde ALICI&apos;nın yerleşim
        yerindeki veya alışverişin yapıldığı yerdeki Tüketici Hakem Heyetleri ile
        Tüketici Mahkemeleri yetkilidir.
      </p>

      <h2>8. Yürürlük</h2>
      <p>
        ALICI tarafından elektronik ortamda onaylanan işbu sözleşme, siparişin
        SATICI tarafından kabul edilmesiyle yürürlüğe girer. Sözleşmenin bir
        nüshası ALICI&apos;nın e-posta adresine iletilir.
      </p>
    </LegalShell>
  );
}
