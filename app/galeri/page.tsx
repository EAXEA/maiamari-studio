import Image from "next/image";
import Link from "next/link";
import {
  getSeries,
  getPortfolioBySeries,
  getBusiness,
} from "@/lib/data";
import { Reveal } from "@/components/motion/reveal";
import { InstagramInquiryButton } from "@/components/inquiry/instagram-inquiry-button";
import { WhatsappComingSoon } from "@/components/inquiry/whatsapp-coming-soon";
import { PhoneCTA } from "@/components/inquiry/phone-cta";

export const metadata = {
  title: "Galeri",
  description:
    "Sanatçı Duygu Sinan'ın atölyede elle çoğaltılmış sayılı edisyon linol baskıları — Kapılar ve Lord of … Maskeler serileri.",
  alternates: { canonical: "/galeri" },
};

export default function GaleriLandingPage() {
  const series = getSeries();
  const biz = getBusiness();

  return (
    <>
      {/* 1. Hero — sanatçı + iki seri tanıtımı */}
      <section className="container-x pt-14 lg:pt-20 pb-12 lg:pb-16">
        <Reveal>
          <p className="eyebrow">Galeri · Duygu Sinan</p>
          <h1 className="font-display mt-5 leading-[0.98] max-w-4xl tracking-tight">
            <span className="block text-[clamp(2.5rem,5.5vw,5rem)]">
              Atölyede çoğaltılmış
            </span>
            <span className="block italic text-[clamp(3rem,7vw,6.5rem)]">
              linol baskılar.
            </span>
          </h1>
          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-20 mt-10 items-start">
            <div className="max-w-prose">
              <p className="text-base lg:text-lg leading-relaxed text-[color:var(--color-muted)]">
                Sanatçı{" "}
                {biz.artist?.instagramUrl ? (
                  <a
                    href={biz.artist.instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-4 text-[color:var(--color-foreground)] hover:text-[color:var(--color-walnut)]"
                  >
                    Duygu Sinan
                  </a>
                ) : (
                  <strong className="font-normal text-[color:var(--color-foreground)]">
                    Duygu Sinan
                  </strong>
                )}
                &apos;ın atölyede elle bastığı, sayılı edisyondaki iki seri.
                Her bir tabaka atölyede tek tek üretilir; mürekkebin kâğıt
                üzerindeki izi ve her tabakanın çıkardığı küçük farklar
                koleksiyonun parçasıdır.
              </p>
              {biz.artist?.instagramUrl && (
                <p
                  className="mt-4 text-sm italic"
                  style={{ color: "var(--color-walnut)" }}
                >
                  Sanatçının atölye gündelik hayatı ve iş günü vlogları için{" "}
                  <a
                    href={biz.artist.instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-4 not-italic hover:text-[color:var(--color-foreground)]"
                  >
                    @{biz.artist.instagramHandle}
                  </a>
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <PhoneCTA variant="button" label="Telefonla bilgi al" />
              <InstagramInquiryButton
                path="/galeri"
                label="Instagram'dan bilgi al"
                className="inline-flex h-11 px-6 items-center text-[12px] tracking-[0.22em] uppercase border whitespace-nowrap"
                style={{ borderColor: "var(--color-foreground)" }}
              />
              <WhatsappComingSoon variant="button" />
            </div>
          </div>
        </Reveal>
      </section>

      {/* 2. İki seri kartı */}
      <section className="container-x pb-16 lg:pb-24">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-10">
          {series.map((s) => {
            const works = getPortfolioBySeries(s.slug);
            const count = works.length;
            const href = `/galeri/${s.slug}`;
            return (
              <Reveal key={s.slug}>
                <Link
                  href={href}
                  className="group block border border-[color:var(--color-border)] bg-[color:var(--color-surface)] overflow-hidden hover:-translate-y-1 transition-transform duration-500"
                  aria-label={`${s.title} serisine git`}
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-[color:var(--color-surface-2)]">
                    {s.coverImage && (
                      <Image
                        src={s.coverImage}
                        alt={`${s.title} serisinden bir eser`}
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.03]"
                      />
                    )}
                    <span className="absolute top-4 left-4 text-[10px] tracking-[0.32em] uppercase bg-[color:var(--color-walnut-dark)] text-[color:var(--color-background)] px-3 py-1.5">
                      Seri
                    </span>
                  </div>
                  <div className="p-7 lg:p-9">
                    <p className="eyebrow">{s.subtitle}</p>
                    <h2 className="font-display mt-3 text-3xl lg:text-4xl leading-[1.05] tracking-tight italic">
                      {s.title}
                    </h2>
                    <p className="mt-5 text-sm lg:text-base leading-relaxed text-[color:var(--color-muted)]">
                      {s.description}
                    </p>
                    <div className="mt-6 flex items-center justify-between text-xs tracking-[0.18em] uppercase text-[color:var(--color-muted)]">
                      <span>{count} eser</span>
                      <span className="text-[color:var(--color-foreground)] group-hover:translate-x-1 transition-transform">
                        Seriye gir →
                      </span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* 3. Edisyon bilgisi — telefon ile soruluyor */}
      <section className="container-x pb-24 border-t border-[color:var(--color-hairline)] pt-14">
        <Reveal>
          <div className="max-w-2xl">
            <p className="eyebrow">Eserler hakkında</p>
            <h2 className="font-display mt-4 leading-[0.98] text-[clamp(1.8rem,3.5vw,2.6rem)] tracking-tight">
              <span className="italic">Edisyon, boyut ve fiyat</span>{" "}
              bilgisi için bize ulaşın.
            </h2>
            <p className="mt-6 text-base leading-relaxed text-[color:var(--color-muted)]">
              Her baskı atölyede tek tek elle çoğaltılır. Eser detayları için
              telefon ya da Instagram&apos;dan iletişime geçebilirsiniz.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <PhoneCTA variant="button" label="Telefonla bilgi al" />
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
