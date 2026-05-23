import Image from "next/image";
import Link from "next/link";
import {
  getBusiness,
  getWorkshops,
  getSeries,
  getPortfolioBySeries,
} from "@/lib/data";
import { InterestHero } from "@/components/sections/interest-hero";
import { FeatureBanner } from "@/components/sections/feature-banner";
import { Reveal } from "@/components/motion/reveal";
import { WORKSHOP_IMAGES } from "@/lib/workshop-images";
import { WhatsappComingSoon } from "@/components/inquiry/whatsapp-coming-soon";
import { PhoneCTA } from "@/components/inquiry/phone-cta";
import { TransitInfo } from "@/components/transit/transit-info";

export default function HomePage() {
  const biz = getBusiness();
  const workshops = getWorkshops();
  const series = getSeries();

  return (
    <>
      {/* ============================================================
          1. Hero — Soru-bazlı (A&C)
         ============================================================ */}
      <InterestHero
        eyebrow="Bir baskı atölyesi · Ankara"
        preLine="Şu an ilgileniyor musun?"
        topic="Linol baskı"
        description="Maiamari, sanatçı Duygu Sinan'ın atölyesi. Atölyede elle çoğaltılan baskılar, doğal liflerden el yapımı kâğıtlar ve baskı programları."
        image="/images/atolye/storefront.jpg"
        imageAlt="Maiamari atölyesi · Bülbülderesi Cd. vitrin görünümü"
        primary={{ href: "/galeri", label: "Evet, keşfet" }}
        secondary={{ href: "/atolyeler", label: "Atölye programı" }}
      />

      {/* ============================================================
          2. Galeride — sanatçının iki serisi (editoryal kartlar)
         ============================================================ */}
      <section className="container-x py-16 lg:py-24">
        <Reveal>
          <div className="flex items-end justify-between gap-6 mb-10 lg:mb-14">
            <div>
              <p className="eyebrow">Bugün · Galeride</p>
              <h2 className="font-display mt-3 text-3xl md:text-5xl leading-[1.02] tracking-tight max-w-2xl">
                Sanatçının iki{" "}
                <span className="italic">öne çıkan serisi.</span>
              </h2>
            </div>
            <Link
              href="/galeri"
              className="hidden md:inline text-sm editorial-link shrink-0"
            >
              Tüm galeri →
            </Link>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 lg:gap-10">
            {series.map((s, i) => {
              const works = getPortfolioBySeries(s.slug);
              const tone =
                s.slug === "maskeler"
                  ? { label: "II", year: s.year ?? 2024 }
                  : { label: "I", year: s.year ?? 2018 };
              return (
                <Link
                  key={s.slug}
                  href={`/galeri/${s.slug}`}
                  className="group block border border-[color:var(--color-border)] bg-[color:var(--color-surface)] overflow-hidden hover:-translate-y-1 transition-transform duration-500"
                  aria-label={`${s.title} serisine git`}
                >
                  <div className="relative aspect-[5/3] w-full overflow-hidden bg-[color:var(--color-surface-2)]">
                    {s.coverImage && (
                      <Image
                        src={s.coverImage}
                        alt={`${s.title} serisinden bir eser`}
                        fill
                        priority={i === 0}
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.03]"
                      />
                    )}
                    <div className="absolute inset-x-0 top-0 flex items-start justify-between p-5 lg:p-7 pointer-events-none">
                      <span
                        className="text-[10px] tracking-[0.32em] uppercase px-3 py-1.5"
                        style={{
                          background: "var(--color-walnut-dark)",
                          color: "var(--color-background)",
                        }}
                      >
                        Seri {tone.label}
                      </span>
                      <span className="font-display text-xs tracking-[0.25em] text-white drop-shadow-md">
                        {tone.year}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 lg:p-9">
                    <p className="eyebrow">{s.subtitle}</p>
                    <h3 className="font-display mt-3 text-2xl lg:text-4xl leading-[1.05] tracking-tight italic">
                      {s.title}
                    </h3>
                    <p className="mt-4 text-sm lg:text-base leading-relaxed text-[color:var(--color-muted)] max-w-prose">
                      {s.description}
                    </p>
                    <div className="mt-6 flex items-center justify-between text-xs tracking-[0.2em] uppercase text-[color:var(--color-muted)]">
                      <span>{works.length} eser</span>
                      <span className="text-[color:var(--color-foreground)] group-hover:translate-x-1 transition-transform">
                        Seriye gir →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <Reveal delay={0.2}>
            <div className="mt-10 md:hidden">
              <Link href="/galeri" className="inline-block text-sm editorial-link">
                Tüm galeri →
              </Link>
            </div>
          </Reveal>
        </Reveal>
      </section>

      {/* ============================================================
          3. Featured story — Kâğıt fabrikası (/kagit'e yönleniyor)
         ============================================================ */}
      <FeatureBanner
        kicker="Hikaye · Kâğıt"
        title="Atölyenin altındaki"
        italicTail="kâğıt fabrikası."
        description="Pamuk, keten ve dut liflerini suya çözüyoruz. Sonra elekten geçirip baskıya hazır kâğıdı tek tek döküyoruz."
        image="/images/atolye/window-and-press.jpg"
        imageAlt="Atölye penceresinden — baskı presi ve sokak"
        href="/kagit"
        ctaLabel="Hikayeyi oku"
        align="left"
        tone="dark"
      />

      {/* ============================================================
          4. Workshops — editoryal program bileti (foto yok, metin önde)
         ============================================================ */}
      <section
        className="py-16 lg:py-24"
        style={{ background: "var(--color-surface)" }}
      >
        <div className="container-x">
          <Reveal>
            <div className="grid lg:grid-cols-[1.1fr_1fr] gap-8 lg:gap-16 items-end mb-10 lg:mb-14">
              <div>
                <p className="eyebrow">Atölye Programı</p>
                <h2 className="font-display mt-3 text-3xl md:text-5xl leading-[1.02] tracking-tight">
                  Kalıbın <span className="italic">altına bakın.</span>
                </h2>
              </div>
              <p className="text-base leading-relaxed text-[color:var(--color-muted)] lg:text-right max-w-md lg:ml-auto">
                Küçük gruplarla linol baskı, suluboya, çanta baskı ve el yapımı
                kâğıt atölyeleri. Maiamari mekânında, atölyenin kendi
                ekipmanlarıyla.
              </p>
            </div>
          </Reveal>

          {/* Program bileti */}
          <Reveal delay={0.1}>
            <div
              className="bg-[color:var(--color-background)] border border-[color:var(--color-walnut-dark)]"
              style={{
                boxShadow:
                  "0 1px 2px rgba(60,40,28,0.06), 0 22px 48px -28px rgba(60,40,28,0.28)",
              }}
            >
              {/* Bilet başlığı */}
              <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-3 px-6 lg:px-10 py-5 lg:py-6 border-b border-dashed border-[color:var(--color-hairline)]">
                <div className="flex items-baseline gap-4">
                  <span className="text-[10px] tracking-[0.35em] uppercase text-[color:var(--color-muted)]">
                    Maiamari · Atölye Programı
                  </span>
                </div>
                <span className="text-[10px] tracking-[0.32em] uppercase text-[color:var(--color-muted)]">
                  Aylık · Küçük grup · Küçükesat
                </span>
              </div>

              {/* Atölye satırları */}
              <ol className="divide-y divide-[color:var(--color-hairline)]">
                {workshops.map((w) => {
                  const isWorkshop = /workshop/i.test(w.title);
                  const img = WORKSHOP_IMAGES[w.slug];
                  return (
                    <li
                      key={w.slug}
                      className="grid grid-cols-[auto_1fr_auto] items-center gap-x-4 lg:gap-x-6 px-5 lg:px-10 py-4 lg:py-5"
                    >
                      <div className="relative w-12 h-12 lg:w-14 lg:h-14 overflow-hidden bg-[color:var(--color-surface-2)] shrink-0">
                        {img && (
                          <Image
                            src={img.src}
                            alt=""
                            fill
                            sizes="56px"
                            className="object-cover atolye-tint"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-display text-lg lg:text-xl leading-tight truncate">
                          {w.title}
                        </h3>
                        <p className="mt-1 text-xs tracking-[0.18em] uppercase text-[color:var(--color-muted)] truncate">
                          {w.instructorInstagramUrl ? (
                            <a
                              href={w.instructorInstagramUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="underline underline-offset-4 hover:text-[color:var(--color-foreground)]"
                            >
                              {w.instructor}
                            </a>
                          ) : (
                            w.instructor
                          )}
                        </p>
                      </div>
                      <span className="text-[10px] lg:text-[11px] tracking-[0.22em] uppercase text-[color:var(--color-muted)] whitespace-nowrap">
                        {isWorkshop ? "Workshop" : "Aylık"}
                      </span>
                    </li>
                  );
                })}
              </ol>

              {/* Bilet ayağı — yırtık dikey, tek CTA */}
              <div className="border-t border-dashed border-[color:var(--color-hairline)] px-6 lg:px-10 py-6 lg:py-7 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <p className="text-sm text-[color:var(--color-muted)] max-w-md">
                  Kontenjan sınırlıdır. Kayıt ve bilgi için telefonla
                  randevu alınır.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/atolyeler"
                    className="inline-flex h-11 px-6 items-center text-[12px] tracking-[0.22em] uppercase border"
                    style={{ borderColor: "var(--color-walnut-dark)" }}
                  >
                    Tüm program
                  </Link>
                  <PhoneCTA variant="button" label="Telefon · Randevu al" />
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================================
          5. Featured story — Bir baskı nasıl doğar
         ============================================================ */}
      <FeatureBanner
        kicker="Hikaye · Atölyede"
        title="Bir baskı"
        italicTail="nasıl doğar?"
        description="Linol plakanın oyulmasından mürekkebin kâğıdı buluşmasına kadar her aşama atölyede tek elden geçer. Her tabakanın çıkardığı küçük farklar koleksiyonun parçasıdır."
        image="/images/atolye/press-and-brayers.jpg"
        imageAlt="Atölyenin baskı presi ve merdaneleri"
        href="/journal"
        ctaLabel="Hikayeyi oku"
        align="right"
        tone="dark"
      />

      {/* ============================================================
          6. Mağaza teaser — atölye envanteri davet kartı
             (linol baskıları "yakında" kartı tarzında, içerik mağaza)
         ============================================================ */}
      <section className="container-x py-16 lg:py-24">
        <Reveal>
          <div className="border border-[color:var(--color-border)] bg-[color:var(--color-surface)] grid lg:grid-cols-[1fr_1.2fr] gap-10 lg:gap-16 items-center p-10 lg:p-16">
            <div className="relative aspect-square w-full max-w-[460px] mx-auto lg:mx-0 overflow-hidden bg-[color:var(--color-surface-2)]">
              <Image
                src="/images/atolye/tools-grid.jpg"
                alt="Atölye envanteri — merdaneler ve oyma aletleri"
                fill
                sizes="(max-width: 1024px) 80vw, 40vw"
                className="object-cover atolye-tint"
              />
              <span
                className="absolute top-4 left-4 text-[10px] tracking-[0.35em] uppercase px-3 py-1.5"
                style={{
                  background: "var(--color-walnut-dark)",
                  color: "var(--color-background)",
                }}
              >
                Mağaza
              </span>
            </div>

            <div>
              <p className="eyebrow">Atölye envanteri</p>
              <h2 className="font-display mt-4 leading-[0.98] text-[clamp(2.3rem,4.8vw,4.2rem)] tracking-tight">
                <span className="block italic">Maiamari mağaza.</span>
                <span className="block text-[0.55em] mt-3 tracking-tight">
                  atölyenin envanteri raflarda.
                </span>
              </h2>
              <p className="mt-7 max-w-md text-base lg:text-lg leading-relaxed text-[color:var(--color-muted)]">
                Amber cam kavanozda baskı boyaları, kauçuk merdaneler, oyma
                aletleri, linolyum plakalar ve doğal liflerden el yapımı
                kâğıtlar. Tüm ürünler aynı atölyede üretilir; mağazadan
                çıkan her parça bir dökümün, bir kalıbın ya da bir elin
                izini taşır.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="/shop"
                  className="inline-flex h-11 px-6 items-center text-[12px] tracking-[0.22em] uppercase"
                  style={{
                    background: "var(--color-walnut-dark)",
                    color: "var(--color-background)",
                  }}
                >
                  Mağazaya göz at
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ============================================================
          7. Visit — atölyeyi gez
         ============================================================ */}
      <section className="py-20 lg:py-28 border-t border-[color:var(--color-hairline)]">
        <div className="container-x grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          <Reveal>
            <p className="eyebrow">Ziyaret</p>
            <h2 className="font-display mt-3 text-3xl md:text-5xl leading-[1.02] tracking-tight">
              Küçükesat&apos;ta bir{" "}
              <span className="italic">baskı atölyesi.</span>
            </h2>
            <address className="not-italic mt-8 text-base leading-relaxed max-w-md">
              {biz.address.full}
            </address>
            <dl className="mt-8 grid grid-cols-[max-content_1fr] gap-x-10 gap-y-2.5 text-sm">
              <dt className="text-[color:var(--color-muted)]">Telefon</dt>
              <dd>
                <PhoneCTA variant="link" label="Telefon · randevu için arayın" />
              </dd>
              <dt className="text-[color:var(--color-muted)]">Ulaşım</dt>
              <dd>
                <TransitInfo transit={biz.transit} size="sm" />
              </dd>
              <dt className="text-[color:var(--color-muted)]">Instagram</dt>
              <dd>
                <a href={biz.contact.instagram} target="_blank" rel="noreferrer">
                  @maiamari.studio
                </a>
              </dd>
            </dl>
            <p className="mt-6 text-sm leading-relaxed text-[color:var(--color-muted)] max-w-md">
              Atölyeye gelmeden önce telefonla kısa bir randevu almanızı
              öneririz — böylece atölyede olduğumuzdan emin olur, ilgilendiğiniz
              baskı ya da malzeme için size zaman ayırabiliriz.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <PhoneCTA variant="button" label="Telefon · Randevu al" />
              <Link
                href="/contact"
                className="inline-flex h-11 px-6 items-center text-[12px] tracking-[0.22em] uppercase border"
                style={{ borderColor: "var(--color-walnut-dark)" }}
              >
                İletişim
              </Link>
              <WhatsappComingSoon variant="button" />
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <div
              className="aspect-[5/4] w-full"
              style={{ background: "var(--color-surface-2)" }}
            >
              <iframe
                src={biz.googleMapsEmbed}
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Maiamari konum"
              />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
