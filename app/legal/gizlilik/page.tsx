import { LegalShell } from "@/components/legal/legal-shell";
import { SELLER } from "@/lib/legal";

export const metadata = {
  title: "Gizlilik Sözleşmesi",
  description:
    "Maiamari gizlilik politikası. Hangi verilerin toplandığı, nasıl kullanıldığı, ödeme ve üçüncü taraf hizmetleri.",
  alternates: { canonical: "/legal/gizlilik" },
};

export default function GizlilikPage() {
  return (
    <LegalShell
      title="Gizlilik Sözleşmesi"
      lead="Maiamari olarak kişisel verilerinizin gizliliğine önem veriyoruz. Bu metin, sitemizi kullanırken hangi verilerin toplandığını ve nasıl işlendiğini açıklar."
    >
      <h2>Toplanan Veriler</h2>
      <p>
        Sitemizi kullanırken ve sipariş verirken aşağıdaki veriler işlenebilir:
      </p>
      <ul>
        <li>Kimlik ve iletişim bilgileri (ad, soyad, telefon, e-posta).</li>
        <li>Teslimat ve fatura adresi.</li>
        <li>Sipariş ve işlem geçmişi.</li>
        <li>
          Site kullanımına dair teknik veriler (çerezler aracılığıyla toplanan
          oturum ve kullanım bilgileri).
        </li>
      </ul>

      <h2>Verilerin Kullanım Amacı</h2>
      <ul>
        <li>Siparişlerin alınması, hazırlanması ve teslim edilmesi.</li>
        <li>Sipariş ve teslimat hakkında sizinle iletişim kurulması.</li>
        <li>Yasal yükümlülüklerin (fatura, muhasebe vb.) yerine getirilmesi.</li>
        <li>Site güvenliğinin ve hizmet kalitesinin sağlanması.</li>
      </ul>

      <h2>Ödeme ve Kredi Kartı Güvenliği</h2>
      <p>
        Ödemeler, <strong>iyzico</strong> ödeme altyapısı üzerinden alınır. Kredi
        veya banka kartı bilgileriniz Maiamari tarafından görülmez, işlenmez ve
        saklanmaz. Kart verileriniz yalnızca lisanslı ödeme kuruluşu iyzico
        tarafından, kendi güvenlik standartları çerçevesinde işlenir.
      </p>
      <p>
        Sitedeki tüm sayfalar ve ödeme adımları SSL sertifikası ile şifreli
        (HTTPS) olarak sunulur. Kart bilgileri şifreli bağlantı üzerinden
        doğrudan ödeme kuruluşuna iletilir; sitemizin sunucularında kart verisi
        tutulmaz.
      </p>

      <h2>E-posta Güvenliği</h2>
      <p>
        Müşteri hizmetlerine gönderdiğiniz e-postalarda kredi kartı numarası,
        şifre veya benzeri hassas bilgileri asla paylaşmayın. Maiamari sizden
        hiçbir zaman e-posta, telefon veya mesaj yoluyla kart bilgisi ya da
        şifre talep etmez. E-postalarda yer alan bilgilerin üçüncü şahıslara
        karşı güvenliği garanti edilemez; hassas işlemler yalnızca site
        üzerinden yapılmalıdır.
      </p>

      <h2>Üçüncü Taraf Hizmetleri</h2>
      <p>
        Hizmetin sunulabilmesi için verileriniz sınırlı şekilde aşağıdaki hizmet
        sağlayıcılarla paylaşılabilir:
      </p>
      <ul>
        <li>
          <strong>Ödeme:</strong> iyzico (ödeme işleminin gerçekleştirilmesi).
        </li>
        <li>
          <strong>Kargo:</strong> anlaşmalı kargo firması (teslimatın
          yapılabilmesi için ad ve adres bilgisi).
        </li>
        <li>
          <strong>Barındırma ve altyapı:</strong> sitenin, veritabanının ve
          e-posta bildirimlerinin çalıştığı bulut hizmet sağlayıcıları.
          Sunucuları yurt dışında (Avrupa Birliği ve Amerika Birleşik Devletleri)
          bulunmaktadır; ayrıntı için{" "}
          <a href="/legal/kvkk">KVKK Aydınlatma Metni</a> sayfasındaki yurt dışına
          aktarım bölümüne bakabilirsiniz.
        </li>
      </ul>
      <p>
        Bu sağlayıcılar verilerinizi yalnızca ilgili hizmeti sunmak amacıyla
        işler.
      </p>

      <h2>Üçüncü Taraf Bağlantılar</h2>
      <p>
        Sitemiz, kolaylık sağlamak amacıyla başka internet sitelerine (örneğin
        sosyal medya hesapları) bağlantılar içerebilir. Bu bağlantılar ilgili
        sitelerin desteklendiği anlamına gelmez; bağlantı verilen sitelerin
        içeriklerinden ve gizlilik uygulamalarından Maiamari sorumlu değildir.
        Ziyaret ettiğiniz her sitenin kendi gizlilik politikasını incelemenizi
        öneririz.
      </p>

      <h2>İstisnai Haller</h2>
      <p>
        Aşağıda sayılan sınırlı hallerde, kişisel verileriniz bu metnin
        kapsamı dışında yetkili mercilerle paylaşılabilir:
      </p>
      <ul>
        <li>
          Kanun, yönetmelik ve diğer mevzuatın getirdiği zorunluluklara uyulması.
        </li>
        <li>
          Yetkili idari veya adli makamlarca usulüne uygun yürütülen soruşturma
          ya da kovuşturma kapsamında bilgi talep edilmesi.
        </li>
        <li>
          Kullanıcıların hakları veya güvenliklerini korumak için bilgi
          verilmesinin zorunlu olması.
        </li>
      </ul>

      <h2>Çerezler</h2>
      <p>
        Sitemiz, temel işlevlerin çalışması ve kullanım deneyiminin
        iyileştirilmesi için çerezler kullanır. Tarayıcı ayarlarınızdan çerezleri
        yönetebilir veya silebilirsiniz; ancak bazı çerezlerin devre dışı
        bırakılması sitenin bazı bölümlerinin çalışmasını etkileyebilir.
      </p>

      <h2>Saklama Süresi</h2>
      <p>
        Kişisel verileriniz, işleme amacının gerektirdiği süre ve ilgili
        mevzuatta öngörülen yasal saklama süreleri boyunca saklanır; bu sürelerin
        sonunda silinir, yok edilir veya anonim hale getirilir.
      </p>

      <h2>Haklarınız ve İletişim</h2>
      <p>
        Kişisel verilerinizle ilgili 6698 sayılı Kişisel Verilerin Korunması
        Kanunu kapsamındaki haklarınızın ayrıntısı için{" "}
        <a href="/legal/kvkk">KVKK Aydınlatma Metni</a> sayfasına bakabilirsiniz.
        Her türlü talep ve sorunuz için{" "}
        <a href={`mailto:${SELLER.email}`}>{SELLER.email}</a> adresinden bize
        ulaşabilirsiniz.
      </p>
    </LegalShell>
  );
}
