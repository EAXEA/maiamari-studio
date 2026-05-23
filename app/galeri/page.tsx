import Image from "next/image";
import Link from "next/link";
import { getPortfolio, getBusiness } from "@/lib/data";
import { Reveal } from "@/components/motion/reveal";
import { InstagramInquiryButton } from "@/components/inquiry/instagram-inquiry-button";
import { WhatsappComingSoon } from "@/components/inquiry/whatsapp-coming-soon";

export const metadata = {
  title: "Galeri",
  description:
    "Sanatçı Duygu Sinan'ın atölyede çoğaltılmış sayılı edisyon linol baskıları.",
};

export default function GaleriPage() {
  const works = getPortfolio();
  const biz = getBusiness();
  const phoneHref = `tel:${biz.contact.phonePrimary.replace(/\s/g, "")}`;

  // İlk eser → galeri highlight
  const highlight = works[0];
  const rest = works.slice(1);

  // Browse chip'leri — yıllar + teknik
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
      {/* ============================================================
          1. Soru-bazlı header
         ============================================================ */}
      <section className="container-x py-16 lg:py-24">
        <Reveal>
          <p className="eyebrow">Galeri · Kapılar · Duygu Sinan</p>
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
                &apos;ın <em className="text-[color:var(--color-foreground)] not-italic">&quot;Kapılar&quot;</em> serisi
                — atölyede elle bastığı, sayılı edisyondaki linol
                baskıları. Her bir tabaka atölyede tek tek üretilir;
                mürekkebin kâğıt üzerindeki izi ve her tabakanın çıkardığı
                küçük farklar koleksiyonun parçasıdır.
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
              <a
                href={phoneHref}
                className="inline-flex h-11 px-6 items-center text-[12px] tracking-[0.22em] uppercase"
                style={{
                  background: "var(--color-walnut-dark)",
                  color: "var(--color-background)",
                }}
              >
                Telefonla bilgi al
              </a>
              <InstagramInquiryButton
                label="Instagram'dan bilgi al"
                className="inline-flex h-11 px-6 items-center text-[12px] tracking-[0.22em] uppercase border whitespace-nowrap"
                style={{ borderColor: "var(--color-foreground)" }}
              />
              <WhatsappComingSoon variant="button" />
            </div>
          </div>
        </Reveal>
      </section>

      {/* ============================================================
          2. Highlight — büyük tek baskı
         ============================================================ */}
      {highlight && (
        <section className="container-x pb-16 lg:pb-24">
          <Reveal>
            <div className="grid lg:grid-cols-[1.6fr_1fr] gap-8 lg:gap-14 items-start">
              <div className="relative aspect-[4/5] lg:aspect-[3/4] w-full overflow-hidden bg-[color:var(--color-surface-2)]">
                <Image
                  src={highlight.image}
                  alt={highlight.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover"
                />
              </div>
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
                  <a href={phoneHref} className="editorial-link">
                    Telefonla bilgi al →
                  </a>
                  <InstagramInquiryButton
                    title={highlight.title}
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

      {/* ============================================================
          3. Browse filters — chip rail
         ============================================================ */}
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

      {/* ============================================================
          4. Grid — A&C tile düzeni (asymmetric)
         ============================================================ */}
      <section className="container-x py-16 lg:py-24">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 md:gap-6 lg:gap-8 auto-rows-[180px] md:auto-rows-[230px] lg:auto-rows-[270px]">
          {rest.map((w, i) => {
            const big = i % 5 === 0;
            const wide = i % 5 === 3;
            const span = big
              ? "col-span-2 md:col-span-3 row-span-2"
              : wide
                ? "col-span-2 md:col-span-4 row-span-1"
                : "col-span-1 md:col-span-2 row-span-1";
            return (
              <figure
                key={w.id}
                className={`${span} relative group overflow-hidden bg-[color:var(--color-surface-2)]`}
              >
                <Image
                  src={w.image}
                  alt={w.title}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]"
                />
                <figcaption className="absolute inset-x-0 bottom-0 p-4 lg:p-5 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500 bg-gradient-to-t from-black/70 to-transparent">
                  <p
                    className="eyebrow"
                    style={{ color: "rgba(255,255,255,0.78)" }}
                  >
                    Duygu Sinan {w.year ? `· ${w.year}` : ""}
                  </p>
                  <h3 className="font-display text-white text-lg lg:text-xl mt-1 italic">
                    {w.title}
                  </h3>
                  <InstagramInquiryButton
                    title={w.title}
                    label="Instagram'dan bilgi al →"
                    className="mt-2 inline-block text-[11px] tracking-[0.15em] text-white/90 hover:text-white underline underline-offset-4"
                  />
                </figcaption>
              </figure>
            );
          })}
        </div>
      </section>

      {/* ============================================================
          5. Yakında satışta — koleksiyon teaser kartı
             (mağazadaki boş kategori "Yakında" promosyon kartı ile aynı tarz)
         ============================================================ */}
      <section className="container-x pb-24 border-t border-[color:var(--color-hairline)] pt-14">
        <Reveal>
          <div className="border border-[color:var(--color-border)] bg-[color:var(--color-surface)] grid lg:grid-cols-[1fr_1.2fr] gap-10 lg:gap-16 items-center p-10 lg:p-16">
            <div className="relative aspect-square w-full max-w-[460px] mx-auto lg:mx-0 overflow-hidden bg-[color:var(--color-surface-2)]">
              <Image
                src={highlight?.image || "/brand/maimari-logo.png"}
                alt=""
                fill
                sizes="(max-width: 1024px) 80vw, 40vw"
                className={highlight?.image ? "object-cover" : "object-contain p-14 opacity-95"}
              />
              <span className="absolute top-4 left-4 text-[10px] tracking-[0.35em] uppercase bg-[color:var(--color-walnut-dark)] text-[color:var(--color-background)] px-3 py-1.5">
                Yakında
              </span>
            </div>

            <div>
              <p className="eyebrow">Koleksiyon · Yakında</p>
              <h2 className="font-display mt-4 leading-[0.98] text-[clamp(2.5rem,5vw,4.5rem)] tracking-tight">
                <span className="block italic">Yakında.</span>
                <span className="block text-[0.55em] mt-3 tracking-tight">
                  galerideki eserler mağaza rafına geliyor.
                </span>
              </h2>
              <p className="mt-7 max-w-md text-base lg:text-lg leading-relaxed text-[color:var(--color-muted)]">
                Galerideki sayılı edisyon linol baskıların tamamı önümüzdeki
                haftalarda mağazada{" "}
                <Link
                  href="/shop/linol-baskilari"
                  className="underline underline-offset-4 hover:text-[color:var(--color-foreground)]"
                >
                  Linol Baskıları
                </Link>{" "}
                kategorisinde açılıyor. Şimdilik edisyon, boyut ve fiyat
                bilgisi için bize ulaşabilirsiniz.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="/shop/linol-baskilari"
                  className="inline-flex h-11 px-6 items-center text-[12px] tracking-[0.22em] uppercase"
                  style={{
                    background: "var(--color-walnut-dark)",
                    color: "var(--color-background)",
                  }}
                >
                  Mağazada gör
                </Link>
                <a
                  href={phoneHref}
                  className="inline-flex h-11 px-6 items-center text-[12px] tracking-[0.22em] uppercase border"
                  style={{ borderColor: "var(--color-walnut-dark)" }}
                >
                  Telefonla bilgi al
                </a>
                <InstagramInquiryButton
                  label="Instagram'dan bilgi al"
                  className="inline-flex h-11 px-6 items-center text-[12px] tracking-[0.22em] uppercase border whitespace-nowrap"
                  style={{ borderColor: "var(--color-walnut-dark)" }}
                />
                <WhatsappComingSoon variant="button" />
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
