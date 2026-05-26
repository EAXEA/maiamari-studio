import Image from "next/image";
import Link from "next/link";
import { getBusiness, getPortfolio, getSeries } from "@/lib/data";
import { Reveal } from "@/components/motion/reveal";
import { PhoneCTA } from "@/components/inquiry/phone-cta";
import { TransitInfo } from "@/components/transit/transit-info";

export const metadata = { title: "Hakkımızda" };

const VALUES = [
  { name: "Özen", desc: "Her baskıda, her malzemede, her atölyede." },
  { name: "Yerellik", desc: "Üreticiyle ve zanaatla bağ kurmak." },
  { name: "Paylaşım", desc: "Bilgiyi saklamadan aktarmak." },
  { name: "Süreklilik", desc: "Tek seferlik değil, büyüyen bir ilişki kurmak." },
  { name: "Deneyim", desc: "Malzemeyi rafta değil, atölyede anlamlandırmak." },
];

export default function AboutPage() {
  const biz = getBusiness();
  const portfolio = getPortfolio();
  const series = getSeries();
  const totalPrints = portfolio.reduce((s, w) => s + (w.editionSize ?? 0), 0);
  const years = portfolio.map((w) => w.year).filter((y): y is number => !!y);
  const yearMin = years.length ? Math.min(...years) : null;
  const yearMax = years.length ? Math.max(...years) : null;
  const productionYears = yearMin && yearMax ? yearMax - yearMin + 1 : null;
  const uniquePapers = new Set(portfolio.map((w) => w.paper).filter(Boolean)).size;

  return (
    <article>
      {/* Header */}
      <section className="container-x pt-16 lg:pt-24">
        <Reveal>
          <p className="text-xs tracking-[0.3em] uppercase text-[color:var(--color-muted)]">
            Hakkımızda
          </p>
          <h1 className="font-display mt-5 leading-[0.98] tracking-tight max-w-4xl">
            <span className="block text-[clamp(2.2rem,4.5vw,4rem)]">
              Bir atölye, bir galeri,
            </span>
            <span className="block italic text-[clamp(2.8rem,6vw,5.5rem)]">
              bir kâğıt fabrikası.
            </span>
          </h1>
        </Reveal>
      </section>

      {/* Manifesto */}
      <section className="container-x py-20 lg:py-28">
        <Reveal>
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs tracking-[0.3em] uppercase text-[color:var(--color-muted)]">
              Manifesto
            </p>
            <p
              className="font-display italic mt-8 text-2xl md:text-3xl lg:text-4xl leading-[1.35] tracking-tight"
              style={{ color: "var(--color-walnut-dark)" }}
            >
              Baskı yalnızca bir sonuç değil, bir süreçtir. Oyulan çizgide
              sabır, mürekkepte emek, kâğıtta iz görürüz.
            </p>
            <p className="mt-10 text-base lg:text-lg leading-relaxed text-[color:var(--color-muted)] max-w-2xl mx-auto">
              Maiamari, atölyeyi üretimle, öğrenmeyi deneyimle, malzemeyi
              sanat pratiğiyle buluşturur. Elle çoğaltılan baskılar, doğal
              liflerden üretilen kâğıtlar ve linol baskı araçları aynı
              dünyanın parçalarıdır.
            </p>
          </div>
        </Reveal>
      </section>

      {/* Misyon + Vizyon */}
      <section className="border-t border-[color:var(--color-hairline)]">
        <div className="container-x py-20 lg:py-24 grid lg:grid-cols-2 gap-12 lg:gap-20">
          <Reveal>
            <p className="text-xs tracking-[0.3em] uppercase text-[color:var(--color-muted)]">
              Misyon
            </p>
            <h2
              className="font-display italic mt-5 text-3xl lg:text-4xl leading-snug"
              style={{ color: "var(--color-walnut-dark)" }}
            >
              Erişilebilir baskı.
            </h2>
            <p className="mt-6 text-base leading-relaxed text-[color:var(--color-foreground)] max-w-prose">
              Linol baskı başta olmak üzere baskı sanatlarını; atölye
              deneyimi, kaliteli malzeme, el yapımı kâğıt ve üretim odaklı
              işbirlikleriyle erişilebilir, öğretici ve ilham verici hale
              getirmek.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-xs tracking-[0.3em] uppercase text-[color:var(--color-muted)]">
              Vizyon
            </p>
            <h2
              className="font-display italic mt-5 text-3xl lg:text-4xl leading-snug"
              style={{ color: "var(--color-walnut-dark)" }}
            >
              Bir referans marka.
            </h2>
            <p className="mt-6 text-base leading-relaxed text-[color:var(--color-foreground)] max-w-prose">
              Türkiye&apos;de baskı sanatları denince akla gelen; atölye, mağaza,
              üretim ve yerel işbirliğini aynı çatı altında birleştiren öncü
              ve güvenilir marka olmak.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Değerler */}
      <section
        className="border-t border-[color:var(--color-hairline)]"
        style={{ background: "var(--color-surface)" }}
      >
        <div className="container-x py-20 lg:py-24">
          <Reveal>
            <div className="grid lg:grid-cols-[1fr_2fr] gap-10 lg:gap-16 items-start">
              <div>
                <p className="text-xs tracking-[0.3em] uppercase text-[color:var(--color-muted)]">
                  Değerler
                </p>
                <h2
                  className="font-display italic mt-5 text-3xl lg:text-4xl leading-snug"
                  style={{ color: "var(--color-walnut-dark)" }}
                >
                  Beş başlık.
                </h2>
              </div>
              <dl className="grid sm:grid-cols-2 gap-x-10 gap-y-7">
                {VALUES.map((v) => (
                  <div key={v.name}>
                    <dt
                      className="font-display italic text-2xl"
                      style={{ color: "var(--color-walnut-dark)" }}
                    >
                      {v.name}
                    </dt>
                    <dd className="mt-2 text-sm text-[color:var(--color-muted)] leading-relaxed">
                      {v.desc}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Atölye paragrafları */}
      <section>
        <div className="container-x py-20 lg:py-24 max-w-3xl mx-auto">
          <Reveal>
            <p className="text-xs tracking-[0.3em] uppercase text-[color:var(--color-muted)]">
              Atölye
            </p>
            <h2
              className="font-display mt-5 text-3xl lg:text-4xl leading-snug"
              style={{ color: "var(--color-walnut-dark)" }}
            >
              Küçükesat&apos;ta,{" "}
              <span className="italic">90/B&apos;de.</span>
            </h2>
            <div className="mt-8 space-y-5 text-base lg:text-[17px] leading-relaxed">
              <p>
                Maiamari, Ankara&apos;nın Küçükesat semtinde,
                Bülbülderesi Caddesi&apos;nde bulunan bir baskı atölyesi ve
                galeridir. Atölyenin kurucusu{" "}
                {biz.artist?.instagramUrl ? (
                  <a
                    href={biz.artist.instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-4 hover:opacity-70"
                  >
                    <strong className="font-normal">Duygu Sinan</strong>
                  </a>
                ) : (
                  <strong>Duygu Sinan</strong>
                )}
                , baskı tekniklerine kendini adamış bir sanatçı ve eğitmen
                olarak linol baskı, kâğıt yapımı ve atölye programları
                etrafında küçük ama derinlikli bir pratik yürütüyor.
                {biz.artist?.instagramUrl && (
                  <>
                    {" "}
                    Atölye gündelik hayatı ve iş günü vlogları sanatçının{" "}
                    <a
                      href={biz.artist.instagramUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-4 hover:opacity-70"
                    >
                      kişisel Instagram hesabında
                    </a>
                    .
                  </>
                )}
              </p>
              <p>
                Atölyenin envanteri; özgün linol baskıları, atölyede el
                yapımı üretilen kâğıtları, sanatçının elden diktiği kitap
                çantalarını, amber cam kavanozda sunulan baskı boyalarını,
                kauçuk merdaneleri ve oyma aletlerini kapsar. Bir kısmı
                atölyenin ve sanatçının kendi üretimidir (kâğıtlar,
                sanatçının elden diktiği çantalar);{" "}
                <em>
                  bir kısmı atölyenin günlük baskı pratiğinde denenmiş,
                  piyasadan özenle seçilmiş malzemelerdir.
                </em>
              </p>
              <p>
                Düzenli atölye programlarımızla suluboya, çanta baskı, linol
                baskı ve el yapımı kâğıt tekniklerini paylaşırız. Atölye
                ziyaretlerine açığız — Kolej metrosundan yürüme
                mesafesindeyiz.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Sayılarla — sanatçının baskı arşivinden derive edilmiş üretim metrikleri.
          NOT: Atölye Nisan 2025'te kuruldu. Bu sayılar sanatçı Duygu Sinan'ın
          2013'ten bu yana sürdürdüğü üretim arşivinin tamamını kapsar; hepsi
          atölyede üretilmiş değildir. */}
      <section className="border-t border-[color:var(--color-hairline)]" style={{ background: "var(--color-surface)" }}>
        <div className="container-x py-16 lg:py-20 max-w-6xl mx-auto">
          <Reveal>
            <p className="text-xs tracking-[0.3em] uppercase text-[color:var(--color-muted)]">
              Sayılarla · Sanatçının arşivi
            </p>
            <h2
              className="font-display mt-5 text-3xl lg:text-4xl leading-snug max-w-2xl"
              style={{ color: "var(--color-walnut-dark)" }}
            >
              Duygu Sinan&apos;ın bugüne dek{" "}
              <span className="italic">ürettikleri.</span>
            </h2>
          </Reveal>

          <Reveal delay={0.1}>
            <dl className="mt-10 lg:mt-14 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-10 lg:gap-y-12">
              <div>
                <dd
                  className="font-display italic tabular-nums leading-none text-[clamp(2.6rem,5vw,4rem)]"
                  style={{ color: "var(--color-walnut-dark)" }}
                >
                  {series.length}
                </dd>
                <dt className="mt-3 text-[11px] tracking-[0.22em] uppercase text-[color:var(--color-muted)]">
                  Seri
                </dt>
                <p className="mt-1 text-xs leading-relaxed text-[color:var(--color-muted)] max-w-[18ch]">
                  Galeri başlığı altında derlenmiş tematik grup.
                </p>
              </div>
              <div>
                <dd
                  className="font-display italic tabular-nums leading-none text-[clamp(2.6rem,5vw,4rem)]"
                  style={{ color: "var(--color-walnut-dark)" }}
                >
                  {portfolio.length}
                </dd>
                <dt className="mt-3 text-[11px] tracking-[0.22em] uppercase text-[color:var(--color-muted)]">
                  Benzersiz eser
                </dt>
                <p className="mt-1 text-xs leading-relaxed text-[color:var(--color-muted)] max-w-[18ch]">
                  Sanatçının tasarladığı özgün linol baskı kompozisyonu.
                </p>
              </div>
              <div>
                <dd
                  className="font-display italic tabular-nums leading-none text-[clamp(2.6rem,5vw,4rem)]"
                  style={{ color: "var(--color-walnut-dark)" }}
                >
                  {totalPrints || "—"}
                </dd>
                <dt className="mt-3 text-[11px] tracking-[0.22em] uppercase text-[color:var(--color-muted)]">
                  Sertifikalı baskı
                </dt>
                <p className="mt-1 text-xs leading-relaxed text-[color:var(--color-muted)] max-w-[18ch]">
                  Elle çoğaltılmış, özgünlük sertifikası taşıyan toplam baskı.
                </p>
              </div>
              <div>
                <dd
                  className="font-display italic tabular-nums leading-none text-[clamp(2.6rem,5vw,4rem)]"
                  style={{ color: "var(--color-walnut-dark)" }}
                >
                  {productionYears ?? "—"}
                </dd>
                <dt className="mt-3 text-[11px] tracking-[0.22em] uppercase text-[color:var(--color-muted)]">
                  Sanatçı üretim yılı
                </dt>
                <p className="mt-1 text-xs leading-relaxed text-[color:var(--color-muted)] max-w-[18ch]">
                  {yearMin && yearMax
                    ? `${yearMin}–${yearMax} aralığında kesintisiz üretim.`
                    : "—"}
                </p>
              </div>
              <div>
                <dd
                  className="font-display italic tabular-nums leading-none text-[clamp(2.6rem,5vw,4rem)]"
                  style={{ color: "var(--color-walnut-dark)" }}
                >
                  {uniquePapers || "—"}
                </dd>
                <dt className="mt-3 text-[11px] tracking-[0.22em] uppercase text-[color:var(--color-muted)]">
                  Kâğıt türü
                </dt>
                <p className="mt-1 text-xs leading-relaxed text-[color:var(--color-muted)] max-w-[18ch]">
                  Bristol, Handmade Paper, Durex Schoeller ve daha fazlası.
                </p>
              </div>
            </dl>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="mt-12 text-sm italic text-[color:var(--color-muted)] max-w-prose">
              Sayılar sanatçı{" "}
              <strong className="font-normal not-italic">Duygu Sinan</strong>
              &apos;ın kişisel baskı arşivinden derive edilmiştir; tüm
              eserlerin bu atölyede üretildiği anlamına gelmez. Atölye{" "}
              <strong className="font-normal not-italic">Nisan 2025</strong>&apos;te
              kurulmuştur — daha öncesinde sanatçı kendi atölyelerinde
              ve farklı mekânlarda üretmiştir. Her baskı için ayrı serial
              numarası ve özgünlük sertifikası vardır.{" "}
              <Link href="/galeri" className="not-italic editorial-link">
                Galeride hepsini gör →
              </Link>
            </p>
          </Reveal>
        </div>
      </section>

      {/* Mekân — atölye / vitrin / detay dizgisi (bento) */}
      <section className="border-t border-[color:var(--color-hairline)]">
        <div className="container-x py-20 lg:py-24 max-w-6xl mx-auto">
          <Reveal>
            <p className="text-xs tracking-[0.3em] uppercase text-[color:var(--color-muted)]">
              Mekân
            </p>
            <h2
              className="font-display mt-5 text-3xl lg:text-4xl leading-snug max-w-xl"
              style={{ color: "var(--color-walnut-dark)" }}
            >
              Atölyenin{" "}
              <span className="italic">gündelik kareleri.</span>
            </h2>
          </Reveal>

          {/* Bento grid: 1 büyük (2×2) + 3 küçük + 1 yatay (2×1) */}
          <Reveal delay={0.1}>
            <div className="mt-10 lg:mt-14 grid grid-cols-2 sm:grid-cols-3 gap-2 lg:gap-3 auto-rows-[180px] sm:auto-rows-[220px] lg:auto-rows-[260px]">
              <figure className="col-span-2 row-span-2 relative overflow-hidden bg-[color:var(--color-surface-2)]">
                <Image
                  src="/images/about/atolye-icerden.jpg"
                  alt="Atölyenin içinden vitrine bakış — sergi duvarı ve spot ışıkları"
                  fill
                  sizes="(max-width: 640px) 100vw, 66vw"
                  className="object-cover"
                />
              </figure>
              <figure className="relative overflow-hidden bg-[color:var(--color-surface-2)]">
                <Image
                  src="/images/about/vitrin-frontal.jpg"
                  alt="Maiamari vitrini · sokaktan görünüş"
                  fill
                  sizes="(max-width: 640px) 50vw, 33vw"
                  className="object-cover"
                />
              </figure>
              <figure className="relative overflow-hidden bg-[color:var(--color-surface-2)]">
                <Image
                  src="/images/about/pres-vitrin.jpg"
                  alt="Atölyeden vitrine bakış — baskı presi ön planda"
                  fill
                  sizes="(max-width: 640px) 50vw, 33vw"
                  className="object-cover"
                />
              </figure>
              <figure className="relative overflow-hidden bg-[color:var(--color-surface-2)]">
                <Image
                  src="/images/about/aletler-duvar.jpg"
                  alt="Atölye duvarında merdaneler ve oyma aletleri"
                  fill
                  sizes="(max-width: 640px) 50vw, 33vw"
                  className="object-cover"
                />
              </figure>
              <figure className="col-span-2 relative overflow-hidden bg-[color:var(--color-surface-2)]">
                <Image
                  src="/images/about/merdane-vitrin.jpg"
                  alt="Kavanozda merdaneler — arka planda pres ve sokak manzarası"
                  fill
                  sizes="(max-width: 640px) 100vw, 66vw"
                  className="object-cover"
                />
              </figure>
            </div>
          </Reveal>
        </div>
      </section>

      {/* İletişim & ziyaret */}
      <section
        className="border-t border-[color:var(--color-hairline)]"
        style={{ background: "var(--color-surface)" }}
      >
        <div className="container-x py-16 lg:py-20 max-w-4xl mx-auto">
          <Reveal>
            <p className="text-xs tracking-[0.3em] uppercase text-[color:var(--color-muted)]">
              Ziyaret &amp; iletişim
            </p>
            <div className="mt-8 grid md:grid-cols-3 gap-8 text-sm">
              <div>
                <p className="text-[11px] tracking-[0.28em] uppercase text-[color:var(--color-muted)]">
                  Adres
                </p>
                <address className="not-italic mt-3 leading-relaxed">
                  {biz.address.full}
                </address>
                <div className="mt-4">
                  <TransitInfo transit={biz.transit} />
                </div>
              </div>
              <div>
                <p className="text-[11px] tracking-[0.28em] uppercase text-[color:var(--color-muted)]">
                  Telefon
                </p>
                <p className="mt-3">
                  <PhoneCTA variant="inline" label="Telefon · randevu için arayın" />
                </p>
                <p className="mt-2 text-[color:var(--color-muted)]">
                  Atölye ziyareti telefon randevusu ile düzenlenir.
                </p>
              </div>
              <div>
                <p className="text-[11px] tracking-[0.28em] uppercase text-[color:var(--color-muted)]">
                  Sosyal
                </p>
                <p className="mt-3">
                  <a
                    href={biz.contact.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-4"
                  >
                    @maiamari.studio
                  </a>
                </p>
                <p className="mt-2">
                  <Link href="/atolyeler" className="editorial-link">
                    Atölye programı →
                  </Link>
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </article>
  );
}
