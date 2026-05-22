import Image from "next/image";
import { getJournalPosts } from "@/lib/data";
import { Reveal } from "@/components/motion/reveal";

export const metadata = { title: "Günce" };

function formatDateTR(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function JournalPage() {
  const posts = getJournalPosts();
  const [featured, ...rest] = posts;

  if (!featured) {
    return (
      <div className="container-x py-24 lg:py-32 text-center max-w-xl mx-auto">
        <p className="text-xs tracking-[0.3em] uppercase text-[color:var(--color-muted)]">
          Günce
        </p>
        <h1 className="font-display text-4xl lg:text-5xl mt-4">
          Yakında yayında.
        </h1>
        <p className="text-base text-[color:var(--color-muted)] mt-6 leading-relaxed">
          Atölyeden notlar, baskı süreçleri ve yaklaşan etkinlikler kısa süre
          içinde burada.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <section className="container-x pt-16 lg:pt-24">
        <Reveal>
          <p className="text-xs tracking-[0.3em] uppercase text-[color:var(--color-muted)]">
            Günce
          </p>
          <h1 className="font-display mt-5 leading-[0.98] max-w-4xl tracking-tight">
            <span className="block text-[clamp(2.5rem,5.5vw,5rem)]">
              Atölyeden
            </span>
            <span className="block italic text-[clamp(3rem,7vw,6.5rem)]">
              notlar &amp; etkinlikler.
            </span>
          </h1>
          <p className="mt-8 max-w-2xl text-base lg:text-lg leading-relaxed text-[color:var(--color-muted)]">
            Atölyenin gündemi, katıldığımız etkinlikler ve baskı süreçlerinden
            kısa kayıtlar.
          </p>
        </Reveal>
      </section>

      {/* Featured post */}
      <section className="container-x mt-16 lg:mt-24 pb-16 lg:pb-20">
        <Reveal>
          <article className="grid lg:grid-cols-[1.4fr_1fr] gap-8 lg:gap-16 items-start">
            {featured.image && (
              <div className="relative aspect-[4/5] lg:aspect-[5/6] w-full overflow-hidden bg-[color:var(--color-surface-2)]">
                <Image
                  src={featured.image}
                  alt={featured.imageAlt || featured.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 58vw"
                  className="object-cover atolye-tint"
                />
              </div>
            )}
            <div className="lg:pt-6">
              <p className="text-[10px] tracking-[0.35em] uppercase text-[color:var(--color-walnut)]">
                {featured.category ?? "Atölyeden"} ·{" "}
                {formatDateTR(featured.date)}
              </p>
              <h2 className="font-display mt-5 text-3xl md:text-4xl lg:text-5xl leading-[1.05] tracking-tight">
                <span className="italic">{featured.title}</span>
              </h2>
              {featured.location && (
                <p className="mt-4 text-sm tracking-wide text-[color:var(--color-muted)]">
                  {featured.locationUrl ? (
                    <a
                      href={featured.locationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-4 hover:text-[color:var(--color-foreground)]"
                    >
                      {featured.location} ↗
                    </a>
                  ) : (
                    featured.location
                  )}
                </p>
              )}
              <p className="mt-8 text-base lg:text-lg leading-relaxed text-[color:var(--color-foreground)] max-w-prose">
                {featured.body ?? featured.excerpt}
              </p>
              {featured.instagramUrl && (
                <a
                  href={featured.instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-10 inline-flex h-11 px-6 items-center text-[12px] tracking-[0.22em] uppercase border"
                  style={{ borderColor: "var(--color-foreground)" }}
                >
                  Instagram'da gör →
                </a>
              )}
            </div>
          </article>
        </Reveal>
      </section>

      {/* Rest of the posts */}
      {rest.length > 0 && (
        <section className="container-x py-16 lg:py-20 border-t border-[color:var(--color-hairline)]">
          <p className="eyebrow mb-10">Diğer kayıtlar</p>
          <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12">
            {rest.map((p) => (
              <li key={p.slug} className="group">
                {p.image && (
                  <div className="relative aspect-[5/4] w-full overflow-hidden bg-[color:var(--color-surface-2)]">
                    <Image
                      src={p.image}
                      alt={p.imageAlt || p.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover atolye-tint transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]"
                    />
                  </div>
                )}
                <p className="mt-4 text-[10px] tracking-[0.32em] uppercase text-[color:var(--color-muted)]">
                  {p.category ?? "Atölyeden"} · {formatDateTR(p.date)}
                </p>
                <h3 className="font-display mt-2 text-xl lg:text-2xl leading-snug">
                  {p.title}
                </h3>
                <p className="mt-3 text-sm text-[color:var(--color-muted)] leading-relaxed">
                  {p.excerpt}
                </p>
                {p.instagramUrl && (
                  <a
                    href={p.instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-block text-sm editorial-link"
                  >
                    Instagram'da gör →
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
