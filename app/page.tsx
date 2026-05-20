import Link from "next/link";
import {
  getAllProducts,
  getCategories,
  getProductsByCategory,
  getBusiness,
  getWorkshops,
  getPortfolio,
} from "@/lib/data";
import { ProductCard } from "@/components/product/product-card";
import { InterestHero } from "@/components/sections/interest-hero";
import {
  HorizontalRail,
  RailTile,
} from "@/components/sections/horizontal-rail";
import { FeatureBanner } from "@/components/sections/feature-banner";
import { DiscoverGrid, type DiscoverItem } from "@/components/sections/discover-grid";
import { Reveal } from "@/components/motion/reveal";

export default function HomePage() {
  const all = getAllProducts();
  const inStock = all.filter((p) => p.status !== "out_of_stock");
  const materials = inStock
    .filter((p) =>
      ["linol-boyalari", "linolyum", "merdaneler", "aletler"].includes(
        p.categorySlug,
      ),
    )
    .slice(0, 8);
  const paper = inStock
    .filter((p) => p.categorySlug === "el-yapimi-kagitlar")
    .slice(0, 8);
  const cats = getCategories();
  const biz = getBusiness();
  const workshops = getWorkshops();
  const portfolio = getPortfolio();
  const whatsapp = biz.contact.whatsapp.replace(/\D/g, "");

  // Tema ile keşfet — sabit 4 tema
  const themes: DiscoverItem[] = [
    {
      label: "Linol Baskı",
      meta: "Atölyenin ana mecrası",
      image: "/images/portfolio/print_01.jpg",
      href: "/shop/linol-baskilari",
    },
    {
      label: "Suluboya",
      meta: "Aylık program",
      image: "/images/portfolio/print_03.jpg",
      href: "/workshops",
    },
    {
      label: "Çanta Baskı",
      meta: "Tek günlük atölye",
      image: "/images/portfolio/print_07.jpg",
      href: "/shop/cantalar",
    },
    {
      label: "El Yapımı Kâğıt",
      meta: "Doğal liften",
      image: "/images/portfolio/print_04.jpg",
      href: "/shop/el-yapimi-kagitlar",
    },
  ];

  // Tüm koleksiyonlar — her kategori için bir cover bul
  const collections: DiscoverItem[] = cats.map((c) => {
    const cover =
      getProductsByCategory(c.slug)[0]?.coverImage ??
      "/images/portfolio/print_01.jpg";
    return {
      label: c.name,
      meta: c.nameEn,
      image: cover,
      href: `/shop/${c.slug}`,
    };
  });

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
        image="/images/atolye/studio-interior-wide.jpg"
        imageAlt="Maiamari atölyesi — Küçükesat, Ankara"
        primary={{ href: "/galeri", label: "Evet, keşfet" }}
        secondary={{ href: "/workshops", label: "Atölye programı" }}
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
          4. Discover by Theme
         ============================================================ */}
      <DiscoverGrid
        eyebrow="Tema ile keşfet"
        title="Atölyenin"
        italicTail="mecraları"
        description="Linol baskıdan suluboyaya, el yapımı kâğıttan çanta baskıya — Maiamari'nin etrafında dönen disiplinler. Her birinin kendi atölye programı, kendi malzemesi."
        items={themes}
        aspect="portrait"
        cols={4}
      />

      {/* ============================================================
          5. Workshops rail
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
                  Küçük gruplarla linol baskı, suluboya ve çanta baskı atölyeleri.
                  Maiamari mekânında, atölyenin kendi ekipmanlarıyla.
                </p>
              </div>
              <Link href="/workshops" className="hidden md:inline text-sm editorial-link">
                Tüm program →
              </Link>
            </div>
          </Reveal>

          <div className="grid sm:grid-cols-2 gap-5 lg:gap-7">
            {workshops.map((w) => (
              <div
                key={w.slug}
                className="bg-[color:var(--color-background)] p-7 lg:p-9 flex flex-col group hover:-translate-y-1 transition-transform duration-500"
              >
                <p className="eyebrow">{w.instructor}</p>
                <h3 className="font-display text-2xl lg:text-3xl mt-3 leading-snug">
                  {w.title}
                </h3>
                {w.schedule && (
                  <p className="mt-3 text-sm text-[color:var(--color-muted)]">
                    {w.schedule}
                  </p>
                )}
                <a
                  href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(
                    `Merhaba, "${w.title}" atölyesi için kayıt yaptırmak istiyorum.`,
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-7 inline-flex h-10 px-5 items-center self-start border text-[11px] tracking-[0.2em] uppercase hover:bg-[color:var(--color-foreground)] hover:text-[color:var(--color-background)] transition-colors"
                  style={{ borderColor: "var(--color-foreground)" }}
                >
                  WhatsApp ile kayıt
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          6. Featured story — El yapımı kâğıt (sağ-aligned)
         ============================================================ */}
      <FeatureBanner
        kicker="Hikaye · Kâğıt"
        title="Atölyenin altındaki"
        italicTail="kâğıt fabrikası."
        description="Pamuk, keten ve dut liflerini suya çözüyoruz. Sonra elekten geçirip baskıya hazır kâğıdı tek tek döküyoruz."
        image="/images/atolye/window-and-press.jpg"
        imageAlt="Atölye penceresinden — baskı presi ve sokak"
        href="/about"
        ctaLabel="Hikayeyi oku"
        align="right"
        tone="dark"
      />

      {/* ============================================================
          7. Materials rail — Atölyenin envanteri
         ============================================================ */}
      <HorizontalRail
        eyebrow="Atölye envanteri"
        title={
          <>
            Baskı <span className="italic">malzemeleri</span>
          </>
        }
        ctaHref="/shop"
        ctaLabel="Tüm mağaza"
      >
        {materials.map((p) => (
          <div key={p.id} className="w-[260px]">
            <ProductCard product={p} />
          </div>
        ))}
      </HorizontalRail>

      {/* ============================================================
          8. Paper rail
         ============================================================ */}
      {paper.length > 0 && (
        <HorizontalRail
          eyebrow="El yapımı kâğıt"
          title={
            <>
              Doğal liften, <span className="italic">tek tek dökülen</span>
            </>
          }
          ctaHref="/shop/el-yapimi-kagitlar"
          ctaLabel="Tüm kâğıtlar"
          bg="bg-[color:var(--color-surface)]"
        >
          {paper.map((p) => (
            <div key={p.id} className="w-[260px]">
              <ProductCard product={p} />
            </div>
          ))}
        </HorizontalRail>
      )}

      {/* ============================================================
          9. Discover — Tüm koleksiyonlar
         ============================================================ */}
      <DiscoverGrid
        eyebrow="Koleksiyonlar"
        title="Atölyeden"
        italicTail="çıkanlar"
        items={collections}
        aspect="square"
        cols={4}
      />

      {/* ============================================================
          10. Visit — Atölyeyi gez
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
              <dt className="text-[color:var(--color-muted)]">Metro</dt>
              <dd>{biz.transit.nearestMetro}</dd>
              <dt className="text-[color:var(--color-muted)]">Instagram</dt>
              <dd>
                <a href={biz.contact.instagram} target="_blank" rel="noreferrer">
                  @maiamari.studio
                </a>
              </dd>
            </dl>
            <div className="mt-10 flex flex-wrap gap-3">
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 px-6 items-center text-[12px] tracking-[0.22em] uppercase"
                style={{
                  background: "var(--color-walnut-dark)",
                  color: "var(--color-background)",
                }}
              >
                WhatsApp ile yaz
              </a>
              <Link
                href="/contact"
                className="inline-flex h-11 px-6 items-center text-[12px] tracking-[0.22em] uppercase border"
                style={{ borderColor: "var(--color-walnut-dark)" }}
              >
                İletişim
              </Link>
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
