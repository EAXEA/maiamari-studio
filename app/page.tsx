import Image from "next/image";
import Link from "next/link";
import { getBusiness, getWorkshops, getPortfolio } from "@/lib/data";
import { InterestHero } from "@/components/sections/interest-hero";
import {
  HorizontalRail,
  RailTile,
} from "@/components/sections/horizontal-rail";
import { FeatureBanner } from "@/components/sections/feature-banner";
import { Reveal } from "@/components/motion/reveal";
import { WORKSHOP_IMAGES } from "@/lib/workshop-images";
import { WhatsappComingSoon } from "@/components/inquiry/whatsapp-coming-soon";
import { TransitInfo } from "@/components/transit/transit-info";

export default function HomePage() {
  const biz = getBusiness();
  const workshops = getWorkshops();
  const portfolio = getPortfolio();
  const phoneHref = `tel:${biz.contact.phonePrimary.replace(/\s/g, "")}`;

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
          2. Today — Sanatçının baskıları rail
         ============================================================ */}
      <HorizontalRail
        eyebrow="Bugün · Atölyeden"
        title={
          <>
            Sanatçının <span className="italic">öne çıkanları</span>
          </>
        }
        ctaHref="/galeri"
        ctaLabel="Tüm galeri"
      >
        {portfolio.map((w) => (
          <RailTile
            key={w.id}
            href="/galeri"
            image={w.image}
            imageAlt={w.title}
            caption={`Duygu Sinan · ${w.year ?? ""}`}
            title={w.title}
            meta="Linol baskı · Sayılı edisyon"
            width={300}
            aspect="portrait"
          />
        ))}
      </HorizontalRail>

      {/* ============================================================
          3. Featured story — Bir baskı nasıl doğar
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
        align="left"
        tone="dark"
      />

      {/* ============================================================
          4. Workshops — atölye programı (görselli kartlar)
         ============================================================ */}
      <section
        className="py-16 lg:py-24"
        style={{ background: "var(--color-surface)" }}
      >
        <div className="container-x">
          <Reveal>
            <div className="flex items-end justify-between gap-6 mb-10 lg:mb-14">
              <div>
                <p className="eyebrow">Atölye Programı</p>
                <h2 className="font-display mt-3 text-3xl md:text-5xl leading-[1.02] tracking-tight">
                  Kalıbın <span className="italic">altına bakın.</span>
                </h2>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-[color:var(--color-muted)]">
                  Küçük gruplarla linol baskı, suluboya, çanta baskı ve
                  el yapımı kâğıt atölyeleri. Maiamari mekânında, atölyenin
                  kendi ekipmanlarıyla.
                </p>
              </div>
              <Link
                href="/atolyeler"
                className="hidden md:inline text-sm editorial-link shrink-0"
              >
                Tüm program →
              </Link>
            </div>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {workshops.map((w) => {
              const img = WORKSHOP_IMAGES[w.slug];
              return (
                <article
                  key={w.slug}
                  className="bg-[color:var(--color-background)] border border-[color:var(--color-border)] overflow-hidden flex flex-col group hover:-translate-y-1 transition-transform duration-500"
                >
                  {img && (
                    <div className="relative w-full aspect-[4/3] bg-[color:var(--color-surface-2)] overflow-hidden">
                      <Image
                        src={img.src}
                        alt={img.alt}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover atolye-tint transition-transform duration-[900ms] ease-out group-hover:scale-[1.03]"
                      />
                    </div>
                  )}
                  <div className="p-6 lg:p-7 flex flex-col flex-1">
                    <p className="eyebrow">
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
                    <h3 className="font-display text-xl lg:text-2xl mt-2 leading-snug">
                      {w.title}
                    </h3>
                    <a
                      href={phoneHref}
                      className="mt-5 inline-flex h-10 px-5 items-center self-start border text-[11px] tracking-[0.2em] uppercase hover:bg-[color:var(--color-foreground)] hover:text-[color:var(--color-background)] transition-colors"
                      style={{ borderColor: "var(--color-foreground)" }}
                    >
                      Telefonla bilgi al
                    </a>
                  </div>
                </article>
              );
            })}
          </div>

          <Reveal delay={0.2}>
            <div className="mt-10 md:hidden">
              <Link
                href="/atolyeler"
                className="inline-block text-sm editorial-link"
              >
                Tüm program →
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================================
          5. Featured story — Kâğıt fabrikası (/kagit'e yönleniyor)
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
                <Link
                  href="/shop/linol-baskilari"
                  className="inline-flex h-11 px-6 items-center text-[12px] tracking-[0.22em] uppercase border"
                  style={{ borderColor: "var(--color-walnut-dark)" }}
                >
                  Linol Baskıları · Yakında
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
                <a href={`tel:${biz.contact.phonePrimary.replace(/\s/g, "")}`}>
                  {biz.contact.phonePrimary}
                </a>
              </dd>
              <dt className="text-[color:var(--color-muted)]">Çalışma</dt>
              <dd>Kapanış {biz.hours.closingTime}</dd>
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
            <div className="mt-10 flex flex-wrap gap-3">
              <a
                href={phoneHref}
                className="inline-flex h-11 px-6 items-center text-[12px] tracking-[0.22em] uppercase"
                style={{
                  background: "var(--color-walnut-dark)",
                  color: "var(--color-background)",
                }}
              >
                Telefonla ara
              </a>
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
