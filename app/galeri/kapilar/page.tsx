import Link from "next/link";
import {
  getPortfolioBySeries,
  getSeriesBySlug,
  getBusiness,
} from "@/lib/data";
import { Reveal } from "@/components/motion/reveal";
import { InstagramInquiryButton } from "@/components/inquiry/instagram-inquiry-button";
import { WhatsappComingSoon } from "@/components/inquiry/whatsapp-coming-soon";
import { PhoneCTA } from "@/components/inquiry/phone-cta";
import { WorkPlate } from "@/components/portfolio/work-plate";
import { WorksMasonry } from "@/components/portfolio/works-masonry";

export const metadata = {
  title: "Kapılar · Galeri",
  description:
    "Sanatçı Duygu Sinan'ın atölyede elle çoğaltılmış Kapılar serisi — sayılı edisyon linol baskılar.",
};

export default function KapilarSerisiPage() {
  const works = getPortfolioBySeries("kapilar");
  const series = getSeriesBySlug("kapilar");
  const biz = getBusiness();

  const highlight = works[0];
  const rest = works.slice(1);

  const years = Array.from(
    new Set(works.map((w) => w.year).filter((y): y is number => !!y)),
  ).sort((a, b) => b - a);
  const filters = [
    { label: "Tümü", count: works.length, active: true },
    ...years.map((y) => ({
      label: y.toString(),
      count: works.filter((w) => w.year === y).length,
      active: false,
    })),
    { label: "Linol baskı", count: works.length, active: false },
    { label: "Sayılı edisyon", count: works.length, active: false },
  ];

  return (
    <>
      {/* Sayfa içi breadcrumb / seri başlığı */}
      <section className="container-x pt-10 lg:pt-14">
        <Reveal>
          <nav
            className="text-xs tracking-[0.22em] uppercase text-[color:var(--color-muted)]"
            aria-label="Breadcrumb"
          >
            <Link href="/galeri" className="hover:text-[color:var(--color-foreground)]">
              Galeri
            </Link>
            <span className="mx-2 opacity-50">/</span>
            <span className="text-[color:var(--color-foreground)]">Kapılar</span>
          </nav>
        </Reveal>
      </section>

      {/* 1. Header */}
      <section className="container-x py-12 lg:py-20">
        <Reveal>
          <p className="eyebrow">Seri · {series?.subtitle ?? "Linol baskı"}</p>
          <h1 className="font-display mt-5 leading-[0.98] max-w-4xl tracking-tight">
            <span className="block text-[clamp(2.5rem,5.5vw,5rem)]">
              Atölyede çoğaltılmış
            </span>
            <span className="block italic text-[clamp(3rem,7vw,6.5rem)]">
              Kapılar.
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
                &apos;ın{" "}
                <em className="text-[color:var(--color-foreground)] not-italic">
                  &quot;Kapılar&quot;
                </em>{" "}
                serisi — {series?.description}
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
                path="/galeri/kapilar"
                label="Instagram'dan bilgi al"
                className="inline-flex h-11 px-6 items-center text-[12px] tracking-[0.22em] uppercase border whitespace-nowrap"
                style={{ borderColor: "var(--color-foreground)" }}
              />
              <WhatsappComingSoon variant="button" />
            </div>
          </div>
        </Reveal>
      </section>

      {/* 2. Highlight — orijinal aspect, pasapartu kart */}
      {highlight && (
        <section className="container-x pb-16 lg:pb-24">
          <Reveal>
            <div className="grid lg:grid-cols-[1.4fr_1fr] gap-10 lg:gap-16 items-start">
              <WorkPlate
                work={highlight}
                priority
                spacing="loose"
                sizes="(max-width: 1024px) 100vw, 56vw"
              />
              <div className="lg:pt-8">
                <p className="eyebrow">Öne çıkan eser</p>
                <h2 className="font-display mt-4 text-3xl md:text-4xl lg:text-5xl leading-[1.05] tracking-tight">
                  <span className="italic">{highlight.title}</span>
                </h2>
                <dl className="mt-8 grid grid-cols-[max-content_1fr] gap-x-8 gap-y-2 text-sm">
                  <dt className="text-[color:var(--color-muted)]">Sanatçı</dt>
                  <dd>Duygu Sinan</dd>
                  <dt className="text-[color:var(--color-muted)]">Seri</dt>
                  <dd>Kapılar</dd>
                  <dt className="text-[color:var(--color-muted)]">Teknik</dt>
                  <dd>Linol baskı, elle çoğaltılmış</dd>
                  {highlight.year && (
                    <>
                      <dt className="text-[color:var(--color-muted)]">Yıl</dt>
                      <dd>{highlight.year}</dd>
                    </>
                  )}
                  <dt className="text-[color:var(--color-muted)]">Edisyon</dt>
                  <dd>Sayılı · DM üzerinden bilgi</dd>
                </dl>
                <p className="mt-8 text-base leading-relaxed text-[color:var(--color-muted)] max-w-prose">
                  {highlight.description}
                </p>
                <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm">
                  <PhoneCTA
                    variant="bare"
                    label="Telefonla bilgi al →"
                    className="editorial-link"
                  />
                  <InstagramInquiryButton
                    title={highlight.title}
                    path="/galeri/kapilar"
                    label="Instagram'dan bilgi al →"
                    className="editorial-link"
                  />
                  <WhatsappComingSoon variant="inline" />
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      )}

      {/* 3. Filters */}
      <section className="border-t border-b border-[color:var(--color-hairline)]">
        <div className="container-x py-6 flex items-center gap-3 overflow-x-auto no-scrollbar">
          <span className="eyebrow shrink-0 mr-2">Gözat</span>
          {filters.map((f) => (
            <button
              key={f.label}
              type="button"
              className="chip"
              data-active={f.active}
            >
              {f.label}
              <span className="ml-2 opacity-60">{f.count}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 4. Galeri kartları — her eser için özgün künye + foto */}
      <section className="container-x py-16 lg:py-24">
        <WorksMasonry
          works={rest}
          seriesName="Kapılar"
          inquiryPath="/galeri/kapilar"
        />
      </section>

      {/* Diğer seri → cross-link */}
      <section className="container-x pb-24 border-t border-[color:var(--color-hairline)] pt-14">
        <Reveal>
          <p className="eyebrow">Devamı</p>
          <Link
            href="/galeri/maskeler"
            className="mt-4 inline-block font-display text-3xl lg:text-5xl leading-[1.02] italic hover:opacity-70 transition-opacity"
          >
            Lord of … Maskeler serisine geç →
          </Link>
          <p className="mt-3 text-sm text-[color:var(--color-muted)] max-w-prose">
            Noh tiyatrosu maskelerinden ilham alan, Japon el yapımı kâğıt
            üzerine elle basılmış 2024 üretimi seri.
          </p>
        </Reveal>
      </section>
    </>
  );
}
