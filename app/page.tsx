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
import { ProductionHero } from "@/components/sections/production-hero";
import { HomeDestinationCards } from "@/components/sections/home-destination-cards";
import { FeatureBanner } from "@/components/sections/feature-banner";
import { Reveal } from "@/components/motion/reveal";
import { WORKSHOP_IMAGES } from "@/lib/workshop-images";
import { WhatsappCTA } from "@/components/inquiry/whatsapp-cta";
import { PhoneCTA } from "@/components/inquiry/phone-cta";
import { TransitInfo } from "@/components/transit/transit-info";

export default async function HomePage() {
  const biz = getBusiness();
  const workshops = getWorkshops();
  const series = await getSeries();
  const products = await getAllProducts();

  // Hero altındaki müze etiketi metrikleri — tüm portfolyo, benzersiz eserler
  const portfolioWorks = (
    await Promise.all(series.map((s) => getPortfolioBySeries(s.slug)))
  ).flat();
  const totalWorks = new Set(portfolioWorks.map((w) => w.slug ?? w.title))
    .size;

  // Galeri kartı için Kapılar serisi kapağı
  const featuredSeries =
    series.find((s) => s.slug === "kapilar") ?? series[0];
  const featuredWorks = await getPortfolioBySeries(featuredSeries.slug);
  const galleryCover =
    featuredSeries.coverImage ?? featuredWorks[0]?.image ?? "";

  // Galeri kartı metni — /galeri ile aynı uyarlanır mantık: tek sanatçıda
  // kurucu-önde, çok sanatçıda atölye sanatçıları. Seri adları sabit değil,
  // gerçek serilerden türetilir (eski "Maskeler" gibi yanlış ad kalmaz).
  const multiArtist =
    new Set(series.map((s) => s.artistSlug ?? "duygu-sinan")).size > 1;
  const topSeriesNames = series.slice(0, 3).map((s) => s.title).join(", ");
  const galleryEyebrow = multiArtist
    ? "Galeri · Duygu Sinan ve atölye sanatçıları"
    : "Galeri · Duygu Sinan";
  const galleryDescription = multiArtist
    ? `${topSeriesNames} ve diğer seriler. Duygu Sinan ve Maiamari atölyesi sanatçılarının elle çoğaltılmış linol baskı koleksiyonu.`
    : `${topSeriesNames} ve diğer seriler. Duygu Sinan'ın atölye galerisinde sergilenen linol baskı koleksiyonu.`;

  return (
    <>
      {/* ============================================================
          1. HERO — Üretim izi (full-bleed, tek odaklı)
             Arka plan: atölye masası yakın çekim (pres + merdaneler).
             Sol-alt: eyebrow + italic manifesto + müze etiketi + CTA.
         ============================================================ */}
      <ProductionHero
        image="/images/atolye/atolye-uretim-hero.jpg"
        imageAlt="Atölyenin içi — iki duvar dolusu çerçeveli linol baskı, dipte vitrin ışığı, ortadaki masada çalışan Duygu Sinan"
        metrics={[
          { label: "Seri", value: series.length },
          { label: "Eser", value: totalWorks },
          { label: "Atölye", value: workshops.length },
        ]}
      />

      {/* ============================================================
          1b. Destination cards — Atölyeler + Mağaza
         ============================================================ */}
      <HomeDestinationCards
        workshop={{
          href: "/galeri",
          image: galleryCover,
          imageAlt: `${featuredSeries.title} serisinden bir eser`,
          eyebrow: galleryEyebrow,
          title: multiArtist ? "Atölyenin" : "Sanatçının",
          titleItalic: "öne çıkan serileri.",
          description: galleryDescription,
          meta: `${series.length} seri · ${totalWorks} eser`,
          cta: "Galeriye gir",
          fit: "contain",
        }}
        shop={{
          href: "/shop",
          image: "/images/atolye/tools-grid.jpg",
          imageAlt:
            "Mağaza envanteri · tel ızgarada kauçuk merdaneler ve oyma aletleri",
          eyebrow: "Mağaza · Envanter",
          title: "Boyalar, kâğıtlar,",
          titleItalic: "aletler, çantalar.",
          description:
            "Atölyenin kendi ürettiği el yapımı kâğıtlar, sanatçının elden diktiği çantalar, özenle seçilmiş baskı malzemeleri.",
          meta: `${products.length} ürün`,
          cta: "Mağazaya gir",
        }}
      />

      {/* ============================================================
          2. Featured story — Kâğıt fabrikası (/kagit'e yönleniyor)
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
        image="/images/atolye/press-proof.jpg"
        imageAlt="Atölyenin kırmızı baskı presi — bir sonraki tabaka için hazır"
        href="/journal"
        ctaLabel="Hikayeyi oku"
        align="left"
        tone="dark"
      />

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
                çantaları. Sevdiklerinize atölyeden bir selam.
              </p>
              <div className="mt-7 text-sm">
                <Link href="/shop/cantalar" className="editorial-link">
                  Hediyelik çantalar →
                </Link>
              </div>
            </div>
            <div
              className="relative aspect-[4/3] md:aspect-auto md:min-h-[280px]"
              style={{ backgroundColor: "#faf7f2" }}
            >
              <Image
                src="/images/shop/uc-renk-kanvas-canta-v3.jpg"
                alt="Üç renk kanvas çanta. Antrasit, Haki ve Hardal. Sanatçı tasarımı, hediyelik."
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
              öneririz. Böylece atölyede olduğumuzdan emin olur, ilgilendiğiniz
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
