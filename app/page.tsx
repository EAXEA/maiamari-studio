import Image from "next/image";
import Link from "next/link";
import {
  getBusiness,
  getWorkshops,
  getSeries,
  getPortfolioBySeries,
  getAllProducts,
} from "@/lib/data";
import { InterestHero } from "@/components/sections/interest-hero";
import { FeaturedSeriesHero } from "@/components/sections/featured-series-hero";
import { HomeDestinationCards } from "@/components/sections/home-destination-cards";
import { FeatureBanner } from "@/components/sections/feature-banner";
import { Reveal } from "@/components/motion/reveal";
import { WORKSHOP_IMAGES } from "@/lib/workshop-images";
import { WhatsappCTA } from "@/components/inquiry/whatsapp-cta";
import { PhoneCTA } from "@/components/inquiry/phone-cta";
import { TransitInfo } from "@/components/transit/transit-info";

export default function HomePage() {
  const biz = getBusiness();
  const workshops = getWorkshops();
  const series = getSeries();
  const products = getAllProducts();

  // Hero için en güncel seri (yıl desc); fallback "kapilar"
  const featuredSeries =
    series.slice().sort((a, b) => (b.year ?? 0) - (a.year ?? 0))[0] ?? series[0];
  const featuredWorks = getPortfolioBySeries(featuredSeries.slug);

  return (
    <>
      {/* ============================================================
          1. HERO — Single-card featured series (pasapartu vitrini)
             Sol pasapartu galeri eseri + sağ italic başlık + müze etiketi + CTA.
             Mobil: foto üst, metin alt (doğal akış).
         ============================================================ */}
      <FeaturedSeriesHero series={featuredSeries} works={featuredWorks} />

      {/* ============================================================
          1b. Destination cards — Atölyeler + Mağaza (hero altı)
              Hero galeri-led olduğundan diğer 2 destinasyon yan yana
              kart olarak hemen altına. Mobilde tek kolon stack.
         ============================================================ */}
      <HomeDestinationCards
        workshop={{
          href: "/atolyeler",
          image: "/images/atolye/linol-workshop.jpg",
          imageAlt: "Linol baskı atölyesi · oyulmuş kalıp ve taze baskı",
          eyebrow: "Atölyeler · Program",
          title: "Suluboya, linol,",
          titleItalic: "çanta ve kâğıt.",
          description:
            "Aylık programlar + tek seferlik atölyeler. Duygu Sinan ve Tolga İNALÖZ eğitmenliğinde.",
          meta: `${workshops.length} program`,
          cta: "Atölyelere bak",
        }}
        shop={{
          href: "/shop",
          image: "/images/atolye/tools-grid-hero.jpg",
          imageAlt:
            "Mağaza envanteri · merdaneler, oyma aletleri, kâğıtlar ve boyalar",
          eyebrow: "Mağaza · Envanter",
          title: "Boyalar, kâğıtlar,",
          titleItalic: "aletler, çantalar.",
          description:
            "Atölyenin kendi ürettiği el yapımı kâğıtlar + sanatçının elden diktiği çantalar + özenle seçilmiş baskı malzemeleri.",
          meta: `${products.length} ürün`,
          cta: "Mağazaya gir",
        }}
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
            {(["kapilar", "odak"] as const)
              .map((slug) => series.find((s) => s.slug === slug))
              .filter((s): s is NonNullable<typeof s> => !!s)
              .map((s, i) => {
              const works = getPortfolioBySeries(s.slug);
              const papers = Array.from(new Set(works.map((w) => w.paper).filter(Boolean)));
              const totalPrints = works.reduce((sum, w) => sum + (w.editionSize ?? 0), 0);
              const tone =
                i === 0
                  ? { label: "I", year: s.year ?? 2018 }
                  : { label: "II", year: s.year ?? 2022 };
              return (
                <Link
                  key={s.slug}
                  href={`/galeri/${s.slug}`}
                  className="group flex flex-col h-full bg-[color:var(--color-surface)] ring-1 ring-[color:var(--color-hairline)]
                             shadow-[0_1px_2px_rgba(60,40,28,0.05),0_18px_40px_-22px_rgba(60,40,28,0.20)]
                             hover:shadow-[0_2px_3px_rgba(60,40,28,0.06),0_28px_56px_-22px_rgba(60,40,28,0.28)]
                             hover:-translate-y-1 transition-all duration-500"
                  aria-label={`${s.title} serisine git`}
                >
                  {/* Pasapartu foto bölümü — /galeri landing kartlarıyla aynı dil */}
                  <div className="relative p-5 sm:p-7 lg:p-9">
                    <div className="relative aspect-[5/3] w-full overflow-hidden bg-[color:var(--color-surface-2)] ring-[0.5px] ring-[color:var(--color-hairline)]">
                      {s.coverImage && (
                        <Image
                          src={s.coverImage}
                          alt={`${s.title} serisinden bir eser`}
                          fill
                          priority={i === 0}
                          sizes="(max-width: 1024px) 100vw, 50vw"
                          className="object-contain p-3 lg:p-4 transition-transform duration-[900ms] ease-out group-hover:scale-[1.03]"
                        />
                      )}
                    </div>
                    <span
                      className="absolute top-8 left-8 lg:top-12 lg:left-12 text-[10px] tracking-[0.32em] uppercase px-3 py-1.5 z-10"
                      style={{
                        background: "var(--color-walnut-dark)",
                        color: "var(--color-background)",
                      }}
                    >
                      Seri {tone.label}
                    </span>
                  </div>
                  <div className="px-5 sm:px-7 lg:px-9 pb-7 lg:pb-9 flex-1 flex flex-col border-t border-dashed border-[color:var(--color-hairline)] pt-6">
                    <p className="eyebrow">{s.subtitle}</p>
                    <h3 className="font-display mt-3 text-2xl lg:text-4xl leading-[1.05] tracking-tight italic">
                      {s.title}
                    </h3>
                    <p className="mt-4 text-sm lg:text-base leading-relaxed text-[color:var(--color-muted)] max-w-prose">
                      {s.description}
                    </p>
                    <dl className="mt-auto pt-6 grid grid-cols-3 gap-3 text-[10px] tracking-[0.18em] uppercase text-[color:var(--color-muted)] border-t border-dashed border-[color:var(--color-hairline)]">
                      <div className="pt-4">
                        <dt>Eser</dt>
                        <dd className="mt-1 font-display italic text-xl normal-case tracking-tight text-[color:var(--color-foreground)]">
                          {works.length}
                        </dd>
                      </div>
                      <div className="pt-4">
                        <dt>Toplam baskı</dt>
                        <dd className="mt-1 font-display italic text-xl normal-case tracking-tight text-[color:var(--color-foreground)]">
                          {totalPrints || "—"}
                        </dd>
                      </div>
                      <div className="pt-4">
                        <dt>Kâğıt türü</dt>
                        <dd className="mt-1 font-display italic text-xl normal-case tracking-tight text-[color:var(--color-foreground)]">
                          {papers.length || "—"}
                        </dd>
                      </div>
                    </dl>
                    <div className="mt-5 text-xs tracking-[0.2em] uppercase">
                      <span className="text-[color:var(--color-foreground)] group-hover:translate-x-1 transition-transform inline-block">
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
          6. Mağaza envanteri detay — hero CTA sonrası detaylı kart
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
                kâğıtlar. Bir kısmı atölyenin ve sanatçının kendi üretimi
                (kâğıt, sanatçının elden diktiği çanta), bir kısmı atölyede
                denenmiş, piyasadan özenle seçilen malzemelerdir.
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
          6b. Hediyelik — kompakt sunum kartı
         ============================================================ */}
      <section className="container-x pb-16 lg:pb-24">
        <Reveal>
          <div className="border border-[color:var(--color-border)] bg-[color:var(--color-background)] grid md:grid-cols-[1.3fr_1fr] gap-6 md:gap-10 items-stretch overflow-hidden">
            <div className="p-8 lg:p-12 flex flex-col justify-center">
              <p className="eyebrow">Hediyelik</p>
              <h3 className="font-display mt-3 text-2xl lg:text-4xl leading-[1.1] tracking-tight">
                Atölye dokunuşlu{" "}
                <span className="italic">küçük bir hediye.</span>
              </h3>
              <p className="mt-5 text-sm lg:text-base leading-relaxed text-[color:var(--color-muted)] max-w-prose">
                Sanatçının elden tasarlayıp diktiği kanvas ve puffer kitap
                çantaları — sevdiklerinize atölyeden bir selam.
              </p>
              <div className="mt-7 text-sm">
                <Link href="/shop/cantalar" className="editorial-link">
                  Hediyelik çantalar →
                </Link>
              </div>
            </div>
            <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[280px] bg-[color:var(--color-surface-2)]">
              <Image
                src="/images/shopier/29182154/img_00.JPG"
                alt="Antrasit kanvas çanta — sanatçı tasarımı, hediyelik"
                fill
                sizes="(max-width: 768px) 100vw, 35vw"
                className="object-contain p-4"
              />
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
              <WhatsappCTA variant="button" context="Maiamari atölyesi" path="/" />
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

      {/* ============================================================
          8. Closing hero — soru-bazlı epilogue
             Sayfanın sonu, footer öncesi: ziyaretçiyi galeriye/atölyeye
             yönlendiren bir son söz. Compact varyant.
         ============================================================ */}
      <InterestHero
        compact
        eyebrow="Bir baskı atölyesi · Ankara"
        preLine="Şu an ilgileniyor musun?"
        topic="Linol baskı"
        description="Maiamari, sanatçı Duygu Sinan'ın atölyesi. Atölyede elle çoğaltılan baskılar, doğal liflerden el yapımı kâğıtlar ve baskı programları."
        image="/images/atolye/storefront.jpg"
        imageAlt="Maiamari atölyesi · Bülbülderesi Cd. vitrin görünümü"
        primary={{ href: "/galeri", label: "Evet, keşfet" }}
        secondary={{ href: "/atolyeler", label: "Atölye programı" }}
      />
    </>
  );
}
