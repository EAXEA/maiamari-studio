import Link from "next/link";
import { getBusiness } from "@/lib/data";
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
                yapımı üretilen kâğıtları, sanatçı dikimi kitap çantalarını,
                amber cam kavanozda sunulan baskı boyalarını, kauçuk
                merdaneleri ve oyma aletlerini kapsar. Bir kısmı atölyenin
                kendi üretimidir (kâğıtlar, sanatçı dikimi çantalar);{" "}
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
