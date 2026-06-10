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

      <h2>2. Tanımlar</h2>
      <p>İşbu sözleşmede geçen;</p>
      <ul>
        <li>
          <strong>Kanun:</strong> 6502 sayılı Tüketicinin Korunması Hakkında
          Kanun&apos;u,
        </li>
        <li>
          <strong>Yönetmelik:</strong> Mesafeli Sözleşmeler Yönetmeliği&apos;ni
          (RG: 27.11.2014/29188),
        </li>
        <li>
          <strong>Site:</strong> {SELLER.website} alan adlı internet sitesini,
        </li>
        <li>
          <strong>Ürün:</strong> Alışverişe konu olan ve Site&apos;de satışa
          sunulan eser veya malı,
        </li>
        <li>
          <strong>Satıcı ve Alıcı:</strong> Madde 1&apos;de bilgileri yer alan
          tarafları,
        </li>
      </ul>
      <p>ifade eder.</p>

      <h2>3. Konu</h2>
      <p>
        İşbu sözleşmenin konusu, ALICI&apos;nın {SELLER.website} alan adlı internet
        sitesinden elektronik ortamda sipariş verdiği, nitelikleri ve satış
        fiyatı sipariş özetinde belirtilen ürünün satışı ve teslimi ile ilgili
        olarak, Kanun ve Yönetmelik hükümleri gereğince tarafların hak ve
        yükümlülüklerinin belirlenmesidir.
      </p>

      <h2>4. Sözleşme Konusu Ürün ve Ödeme Bilgileri</h2>
      <p>
        Ürünün türü, miktarı, adedi, satış bedeli ve ödeme şekli, sipariş
        anında ALICI tarafından onaylanan sipariş özetinde yer alır. Tüm
        fiyatlar Türk Lirası cinsinden ve KDV dahildir. Listelenen ve Site&apos;de
        ilan edilen fiyatlar, güncelleme yapılana ve değiştirilene kadar
        geçerlidir.
      </p>
      <p>
        Ödeme, kredi kartı veya banka kartı ile{" "}
        <strong>iyzico</strong> ödeme altyapısı üzerinden güvenli şekilde alınır.
        Kart bilgileri SATICI tarafından görülmez ve saklanmaz; ödeme işlemi
        doğrudan iyzico üzerinden gerçekleşir.
      </p>

      <h2>5. Fatura</h2>
      <p>
        Fatura, sipariş sırasında bildirilen fatura bilgileriyle düzenlenir ve
        ALICI&apos;nın e-posta adresine elektronik ortamda gönderilir.
      </p>

      <h2>6. Teslimat</h2>
      <p>
        Ürün, ALICI&apos;nın sipariş sırasında bildirdiği adrese kargo ile
        teslim edilir. Sipariş, ödeme onayını izleyen 1-3 iş günü içinde kargoya
        verilir; yasal azami teslim süresi 30 gündür. Bu süre içinde teslimat
        yapılmaması halinde ALICI sözleşmeyi feshedebilir. Kargo ücreti, sipariş
        özetinde aksi belirtilmedikçe ALICI&apos;ya aittir. Teslimat ve iade
        koşullarının ayrıntısı{" "}
        <a href="/legal/iade">Teslimat ve İade Şartları</a> sayfasındadır.
      </p>
      <p>
        ALICI, sözleşme konusu ürünü teslim almadan önce muayene eder. Kargo
        esnasında hasar gören bir kutu <strong>teslim alınmaz</strong>; kutu,
        teslimatı yapan kargo görevlisine hasarlı kutu teslim tutanağı
        düzenlettirilerek iade edilir. Teslim alınan ürünün hasarsız ve sağlam
        olduğu kabul edilir.
      </p>

      <h2>7. Cayma Hakkı</h2>
      <p>
        ALICI, ürünü teslim aldığı tarihten itibaren {WITHDRAWAL_DAYS} gün içinde
        hiçbir gerekçe göstermeksizin ve cezai şart ödemeksizin sözleşmeden cayma
        hakkına sahiptir. Cayma bildirimi, {SELLER.email} adresine e-posta ile
        yazılı olarak iletilir.
      </p>
      <p>
        Cayma hakkının kullanılması halinde ürün, faturası ve varsa hediye
        ürünleriyle birlikte eksiksiz olarak iade edilir. İade edilecek ürünün{" "}
        <strong>zarar görmemiş olması</strong> ve ALICI&apos;ya{" "}
        <strong>ulaştığı haliyle</strong>, aynı özen ve düzenle paketlenerek
        gönderilmesi gerekmektedir. ALICI&apos;nın kusurundan kaynaklanan bir
        nedenle ürünün değerinde azalma olursa veya iade imkansız hale gelirse,
        ALICI kusuru oranında SATICI&apos;nın zararını tazmin etmekle
        yükümlüdür.
      </p>
      <p>
        SATICI, cayma bildiriminin ulaşmasından itibaren {REFUND_DAYS} gün içinde
        ürün bedelini ALICI&apos;ya ödeme yaptığı yöntemle iade eder. Kartlara
        yapılan iadelerin hesaba yansıma süresi ilgili bankaya bağlıdır.
      </p>
      <h3>Değişim</h3>
      <p>
        Mağazada değişim seçeneği bulunmamaktadır. Eserler ve ürünler sınırlı
        sayıda, elde üretildiği için birebir değişim yapılamaz; cayma hakkı
        kapsamında yalnızca iade ve bedel iadesi mümkündür. Ayıplı ürünlere
        ilişkin Kanun&apos;dan doğan haklar saklıdır.
      </p>
      <h3>Cayma hakkının istisnaları</h3>
      <p>
        Mesafeli Sözleşmeler Yönetmeliği&apos;nin 15. maddesi uyarınca; ALICI
        isteği veya açıkça onun kişisel ihtiyaçları doğrultusunda hazırlanan,
        kişiye özel veya sipariş üzerine özel üretilen ürünlerde cayma hakkı
        kullanılamaz. Bu kapsamdaki ürünlerde durum, sipariş öncesinde ürün
        sayfasında ayrıca belirtilir.
      </p>

      <h2>8. Genel Hükümler</h2>
      <ul>
        <li>
          ALICI, sözleşme konusu ürünün temel nitelikleri, satış fiyatı ve ödeme
          şekli ile teslimata ilişkin bilgileri okuyup bilgi sahibi olduğunu ve
          elektronik ortamda gerekli teyidi verdiğini kabul eder.
        </li>
        <li>
          SATICI, sözleşme konusu ürünü eksiksiz, siparişte belirtilen
          niteliklere uygun ve ayıpsız olarak teslim etmekle yükümlüdür.
        </li>
        <li>
          Sözleşme konusu ürünün tesliminin imkansızlaşması halinde SATICI, bu
          durumu öğrendiği tarihten itibaren 3 gün içinde ALICI&apos;ya yazılı
          olarak bildirir ve tahsil edilen bedeli 14 gün içinde iade eder.
        </li>
        <li>
          Ürün bedelinin herhangi bir nedenle ödenmemesi veya banka kayıtlarında
          iptal edilmesi halinde, SATICI ürünü teslim yükümlülüğünden kurtulmuş
          kabul edilir.
        </li>
        <li>
          Ürünün tesliminden sonra ALICI&apos;ya ait kredi kartının yetkisiz
          kişilerce haksız kullanılması nedeniyle ürün bedelinin SATICI&apos;ya
          ödenmemesi halinde ALICI, ürünü 3 gün içinde SATICI&apos;ya iade eder;
          bu halde kargo gideri SATICI&apos;ya aittir.
        </li>
        <li>
          Mücbir sebepler veya nakliyeyi engelleyen olağanüstü durumlar
          nedeniyle ürün süresinde teslim edilemezse SATICI, ALICI&apos;yı
          bilgilendirir. Bu halde ALICI siparişi iptal etme veya teslimatın
          engelleyici durumun ortadan kalkmasına kadar ertelenmesini talep etme
          haklarından birini kullanabilir. İptal halinde ödenen tutar 14 gün
          içinde iade edilir.
        </li>
        <li>
          Teslim edilen ürünün ayıplı olması durumunda ALICI, Kanun
          kapsamındaki seçimlik haklarını kullanabilir.
        </li>
        <li>
          ALICI, sipariş sırasında verdiği bilgilerin doğru olduğunu kabul ve
          taahhüt eder; bu bilgilerin hatalı olmasından doğan zararlardan ALICI
          sorumludur.
        </li>
      </ul>

      <h2>9. Temerrüt Hali</h2>
      <p>
        ALICI&apos;nın ödeme işlemlerini kredi kartı ile yaptığı durumda temerrüde
        düşmesi halinde, kart sahibi bankası ile arasındaki kredi kartı
        sözleşmesi çerçevesinde faiz ödeyeceğini ve bankaya karşı sorumlu
        olacağını kabul eder. ALICI, borcun gecikmeli ifasından dolayı
        SATICI&apos;nın uğradığı zarar ve ziyanı ödemeyi kabul eder.
      </p>

      <h2>10. Uyuşmazlıkların Çözümü</h2>
      <p>
        İşbu sözleşmeden doğabilecek uyuşmazlıklarda, Ticaret Bakanlığı&apos;nca
        her yıl ilan edilen parasal sınırlar dahilinde ALICI&apos;nın yerleşim
        yerindeki veya alışverişin yapıldığı yerdeki Tüketici Hakem Heyetleri ile
        Tüketici Mahkemeleri yetkilidir.
      </p>

      <h2>11. Yürürlük</h2>
      <p>
        ALICI, Site üzerinden verdiği siparişe ait ödemeyi gerçekleştirdiğinde
        işbu sözleşmenin tüm şartlarını kabul etmiş sayılır. Sözleşme, siparişin
        SATICI tarafından kabul edilmesiyle yürürlüğe girer ve bir nüshası
        ALICI&apos;nın e-posta adresine iletilir.
      </p>
    </LegalShell>
  );
}
