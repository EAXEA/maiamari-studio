import { LegalShell } from "@/components/legal/legal-shell";
import { SELLER } from "@/lib/legal";

export const metadata = {
  title: "KVKK Aydınlatma Metni",
  description:
    "6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında Maiamari aydınlatma metni: veri sorumlusu, işleme amaçları, aktarım ve ilgili kişi hakları.",
  alternates: { canonical: "/legal/kvkk" },
};

export default function KvkkPage() {
  return (
    <LegalShell
      title="KVKK Aydınlatma Metni"
      lead="6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında, veri sorumlusu sıfatıyla kişisel verilerinizin işlenmesine ilişkin sizi bilgilendirmek isteriz."
    >
      <h2>Veri Sorumlusu</h2>
      <dl>
        <dt>Veri sorumlusu</dt>
        <dd>
          {SELLER.legalName} ({SELLER.tradeName}, {SELLER.formType})
        </dd>
        <dt>Adres</dt>
        <dd>{SELLER.address}</dd>
        <dt>E-posta</dt>
        <dd>{SELLER.email}</dd>
        <dt>Telefon</dt>
        <dd>{SELLER.phone}</dd>
      </dl>

      <h2>İşlenen Kişisel Veriler</h2>
      <ul>
        <li>Kimlik bilgileri: ad, soyad.</li>
        <li>İletişim bilgileri: telefon, e-posta, teslimat ve fatura adresi.</li>
        <li>Müşteri işlem bilgileri: sipariş, teslimat ve iade kayıtları.</li>
        <li>
          İşlem güvenliği bilgileri: site kullanımına dair teknik kayıtlar ve
          çerez verileri.
        </li>
      </ul>
      <p>
        Ödeme sırasında kredi/banka kartı bilgileriniz veri sorumlusu tarafından
        işlenmez; bu veriler yalnızca ödeme kuruluşu iyzico tarafından işlenir.
      </p>

      <h2>İşleme Amaçları</h2>
      <ul>
        <li>Sipariş sürecinin yürütülmesi, ürünün hazırlanması ve teslimi.</li>
        <li>Sizinle sipariş ve teslimat konusunda iletişim kurulması.</li>
        <li>Faturalandırma ve mali/hukuki yükümlülüklerin yerine getirilmesi.</li>
        <li>Talep, şikayet ve iade süreçlerinin yönetilmesi.</li>
        <li>Bilgi güvenliği ve hizmet sürekliliğinin sağlanması.</li>
      </ul>

      <h2>İşlemenin Hukuki Sebebi</h2>
      <p>
        Kişisel verileriniz, KVKK&apos;nın 5. maddesinde belirtilen; bir
        sözleşmenin kurulması veya ifası için veri işlemenin gerekli olması, veri
        sorumlusunun hukuki yükümlülüğünü yerine getirebilmesi ve meşru menfaat
        hukuki sebeplerine dayanılarak işlenir.
      </p>

      <h2>Kişisel Verilerin Aktarılması</h2>
      <p>
        Verileriniz, yukarıdaki amaçlarla sınırlı olmak üzere KVKK&apos;nın 8. ve
        9. maddeleri çerçevesinde; ödeme kuruluşu (iyzico), anlaşmalı kargo
        firması ve barındırma/altyapı hizmet sağlayıcıları ile; yasal yükümlülük
        halinde yetkili kamu kurum ve kuruluşlarıyla paylaşılabilir.
      </p>

      <h2>Veri Toplama Yöntemi</h2>
      <p>
        Kişisel verileriniz, {SELLER.website} sitesi üzerinden elektronik ortamda,
        sipariş ve iletişim formları ile çerezler aracılığıyla toplanır.
      </p>

      <h2>İlgili Kişinin Hakları</h2>
      <p>KVKK&apos;nın 11. maddesi uyarınca her zaman şu haklara sahipsiniz:</p>
      <ul>
        <li>Kişisel verinizin işlenip işlenmediğini öğrenme.</li>
        <li>İşlenmişse buna ilişkin bilgi talep etme.</li>
        <li>İşleme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme.</li>
        <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme.</li>
        <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme.</li>
        <li>
          Kanundaki şartlar çerçevesinde silinmesini veya yok edilmesini isteme.
        </li>
        <li>
          Düzeltme, silme ve yok etme işlemlerinin aktarıldığı üçüncü kişilere
          bildirilmesini isteme.
        </li>
        <li>
          Münhasıran otomatik sistemlerle analiz sonucu aleyhinize bir sonuç
          çıkmasına itiraz etme.
        </li>
        <li>
          Hukuka aykırı işleme sebebiyle zarara uğramanız halinde zararın
          giderilmesini talep etme.
        </li>
      </ul>

      <h2>Başvuru</h2>
      <p>
        Yukarıdaki haklarınıza ilişkin taleplerinizi{" "}
        <a href={`mailto:${SELLER.email}`}>{SELLER.email}</a> adresine e-posta ile
        veya {SELLER.address} adresine yazılı olarak iletebilirsiniz. Başvurunuz
        en geç 30 gün içinde sonuçlandırılır.
      </p>
    </LegalShell>
  );
}
