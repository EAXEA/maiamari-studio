import { LegalShell } from "@/components/legal/legal-shell";
import { SELLER, WITHDRAWAL_DAYS, REFUND_DAYS } from "@/lib/legal";

export const metadata = {
  title: "Teslimat ve İade Şartları",
  description:
    "Maiamari teslimat süreleri, kargo koşulları, cayma hakkı ve iade süreci.",
  alternates: { canonical: "/legal/iade" },
};

export default function IadePage() {
  return (
    <LegalShell
      title="Teslimat ve İade Şartları"
      lead="Siparişlerinizin hazırlanması, kargolanması ve iade süreçlerine ilişkin koşullar aşağıda açıklanmıştır."
    >
      <h2>Teslimat</h2>
      <ul>
        <li>
          Siparişler, ödeme onayını izleyen <strong>1-3 iş günü</strong> içinde
          hazırlanıp kargoya verilir. Yasal azami teslim süresi 30 gündür.
        </li>
        <li>
          Ürünler, ALICI&apos;nın sipariş sırasında bildirdiği adrese anlaşmalı
          kargo firması aracılığıyla gönderilir.
        </li>
        <li>
          Kargo ücreti, sipariş özetinde aksi belirtilmedikçe ALICI&apos;ya
          aittir ve sipariş sırasında ayrıca gösterilir.
        </li>
        <li>
          Teslimat sırasında kargo paketinde hasar fark edilirse, ürünü teslim
          almadan kargo görevlisine tutanak tutturulması ve durumun{" "}
          {SELLER.email} adresine bildirilmesi önerilir.
        </li>
      </ul>

      <h2>Cayma Hakkı</h2>
      <p>
        ALICI, ürünü teslim aldığı tarihten itibaren <strong>{WITHDRAWAL_DAYS} gün</strong>{" "}
        içinde herhangi bir gerekçe göstermeden sözleşmeden cayabilir. Cayma
        bildirimini {SELLER.email} adresine e-posta ile veya {SELLER.phone}{" "}
        numarasından iletebilirsiniz.
      </p>

      <h2>İade Koşulları</h2>
      <ul>
        <li>
          İade edilecek ürünün kullanılmamış, yeniden satılabilir durumda ve
          mümkünse orijinal ambalajıyla birlikte olması gerekir.
        </li>
        <li>
          Ürün, faturası ve varsa birlikte gönderilen hediye veya ek parçalarıyla
          eksiksiz iade edilir.
        </li>
        <li>
          Cayma hakkı kapsamındaki iadelerde iade kargo ücreti, sipariş özetinde
          aksi belirtilmedikçe ALICI&apos;ya aittir.
        </li>
      </ul>

      <h2>Bedel İadesi</h2>
      <p>
        SATICI, cayma bildiriminin kendisine ulaşmasından itibaren{" "}
        <strong>{REFUND_DAYS} gün</strong> içinde, ürün bedelini ALICI&apos;nın
        ödeme yaptığı yöntemle (kredi/banka kartına) iade eder. Kartlara yapılan
        iadelerin hesaba yansıma süresi ilgili bankaya bağlıdır.
      </p>

      <h2>Cayma Hakkının İstisnaları</h2>
      <p>
        Mesafeli Sözleşmeler Yönetmeliği&apos;nin 15. maddesi gereği; ALICI
        isteği veya kişisel ihtiyaçları doğrultusunda hazırlanan, kişiye özel ya
        da sipariş üzerine özel üretilen ürünlerde cayma hakkı kullanılamaz. Bu
        durum, ilgili ürünlerde sipariş öncesinde ürün sayfasında belirtilir.
      </p>

      <h2>Ayıplı veya Hatalı Ürün</h2>
      <p>
        Yanlış, eksik veya ayıplı ürün teslim edilmesi durumunda {SELLER.email}{" "}
        adresine başvurmanız yeterlidir. Bu hallerde değişim veya iade kargo
        masrafı SATICI&apos;ya aittir. ALICI, 6502 sayılı Kanun kapsamındaki
        seçimlik haklarını kullanabilir.
      </p>

      <h2>İletişim</h2>
      <p>
        Teslimat ve iade ile ilgili her konuda{" "}
        <a href={`mailto:${SELLER.email}`}>{SELLER.email}</a> adresinden veya{" "}
        <a href={SELLER.phoneHref}>{SELLER.phone}</a> numarasından bize
        ulaşabilirsiniz.
      </p>
    </LegalShell>
  );
}
