import Image from "next/image";
import { getJournalPosts } from "@/lib/data";
import { Reveal } from "@/components/motion/reveal";

export const metadata = { title: "Günce" };

function yearMonth(iso: string): { year: string; month: string } {
  const d = new Date(iso + "T00:00:00");
  return {
    year: d.getFullYear().toString(),
    month: d.toLocaleDateString("tr-TR", { month: "long" }).toUpperCase(),
  };
}

export default function JournalPage() {
  const posts = getJournalPosts(); // newest first

  if (posts.length === 0) {
    return (
      <div className="container-x py-24 lg:py-32 text-center max-w-xl mx-auto">
        <p className="text-xs tracking-[0.3em] uppercase text-[color:var(--color-muted)]">
          Günce
        </p>
        <h1 className="font-display text-4xl lg:text-5xl mt-4">
          Yakında yayında.
        </h1>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <section className="container-x pt-16 lg:pt-24">
        <Reveal>
          <p className="text-xs tracking-[0.3em] uppercase text-[color:var(--color-muted)]">
            Günce · Kronoloji
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
            Atölyenin gündemi, katıldığımız etkinlikler ve dönüşüm
            hikayemizden kısa kayıtlar. En yeniden eskiye doğru.
            <span className="hidden md:inline">
              {" "}Karta gelin, açılır.
            </span>
          </p>
        </Reveal>
      </section>

      {/* Timeline */}
      <section className="container-x mt-12 lg:mt-16 pb-16 lg:pb-24">
        <div className="relative">
          {/* Vertical axis */}
          <div
            className="absolute top-2 bottom-2 w-px hidden md:block left-1/2 -translate-x-1/2"
            style={{ background: "var(--color-hairline)" }}
            aria-hidden
          />
          <div
            className="absolute top-2 bottom-2 w-px md:hidden left-3"
            style={{ background: "var(--color-hairline)" }}
            aria-hidden
          />

          <ol className="space-y-12 lg:space-y-20">
            {posts.map((post, i) => {
              const { year, month } = yearMonth(post.date);
              const isRight = i % 2 === 0;
              const gallery = post.gallery && post.gallery.length > 0
                ? post.gallery
                : (post.image ? [post.image] : []);
              const extraGallery = gallery.slice(1); // cover hariç ek görseller

              return (
                <Reveal key={post.slug} delay={i * 0.05}>
                  <li className="relative md:grid md:grid-cols-2 md:gap-12 lg:gap-16 items-start pl-10 md:pl-0">
                    {/* Mobile node */}
                    <div className="absolute md:hidden left-0 top-1 flex flex-col items-center gap-2">
                      <span
                        className="block w-3 h-3 rounded-full"
                        style={{ background: "var(--color-walnut-dark)" }}
                      />
                    </div>

                    {/* Date column (desktop alternating) */}
                    <div
                      className={`hidden md:flex flex-col ${
                        isRight ? "md:order-1 md:items-end md:text-right md:pr-12" : "md:order-2 md:items-start md:pl-12"
                      }`}
                    >
                      <div className="sticky top-24">
                        <p
                          className="font-display italic text-5xl lg:text-6xl leading-none"
                          style={{ color: "var(--color-walnut-dark)" }}
                        >
                          {year}
                        </p>
                        <p className="mt-2 text-xs tracking-[0.3em] uppercase text-[color:var(--color-muted)]">
                          {month}
                        </p>
                        {post.dateLabel && (
                          <p className="mt-3 text-sm text-[color:var(--color-muted)]">
                            {post.dateLabel}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Center node (desktop) */}
                    <div
                      className="hidden md:block absolute left-1/2 -translate-x-1/2 top-3 w-3 h-3 rounded-full z-10"
                      style={{ background: "var(--color-walnut-dark)" }}
                      aria-hidden
                    />

                    {/* CARD — mobilde dikey stack (foto üst, metin alt); desktop'ta
                        timeline kenarında yan-yana. v1.18'e kadar mobil de flex-row
                        idi; foto hücresi 38%×stretch yapısı dar+uzun olup object-cover
                        ile aşırı zoom-in yapıyordu (mobile audit v1.19). */}
                    <article
                      className={`group bg-[color:var(--color-surface)] border border-[color:var(--color-border)] overflow-hidden transition-all duration-500 ease-out md:hover:shadow-lg md:hover:-translate-y-1 flex flex-col ${
                        isRight
                          ? "md:order-2 md:ml-10 md:flex-row"
                          : "md:order-1 md:mr-10 md:flex-row-reverse"
                      }`}
                    >
                      {/* Cover — mobil: tam-en, aspect-[16/9] landscape banner.
                          Desktop: timeline tarafında sticky thumbnail (max-h sabit). */}
                      {post.image && (
                        <div className="relative w-full md:w-[42%] aspect-[16/9] md:aspect-auto md:self-start md:min-h-[300px] md:max-h-[420px] md:sticky md:top-24 bg-[color:var(--color-surface-2)] overflow-hidden shrink-0">
                          <Image
                            src={post.image}
                            alt={post.imageAlt || post.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 28vw, 22vw"
                            quality={90}
                            className="object-cover atolye-tint transition-transform duration-[900ms] ease-out group-hover:scale-[1.03]"
                          />
                        </div>
                      )}

                      {/* Mini meta — always visible */}
                      <div className="p-5 sm:p-6 lg:p-8 flex-1 min-w-0">
                        <p className="text-[10px] tracking-[0.35em] uppercase text-[color:var(--color-walnut)]">
                          {post.category ?? "Atölyeden"}
                          {post.dateLabel && (
                            <span className="md:hidden">
                              {" · "}{post.dateLabel}
                            </span>
                          )}
                        </p>
                        <h2
                          className="font-display mt-3 text-2xl lg:text-3xl leading-snug"
                          style={{ color: "var(--color-walnut-dark)" }}
                        >
                          <span className="italic">{post.title}</span>
                        </h2>
                        <p className="mt-4 text-sm lg:text-base leading-relaxed text-[color:var(--color-muted)]">
                          {post.excerpt}
                        </p>

                        {/* EXPAND-ON-HOVER block (desktop) — mobile always open */}
                        <div className="max-md:mt-5 md:max-h-0 md:opacity-0 md:overflow-hidden md:group-hover:max-h-[1200px] md:group-hover:opacity-100 md:transition-all md:duration-500 md:ease-out">
                          <div className="md:pt-5">
                            {post.location && (
                              <p className="text-sm text-[color:var(--color-muted)] mb-4">
                                {post.locationUrl ? (
                                  <a
                                    href={post.locationUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="underline underline-offset-4 hover:text-[color:var(--color-foreground)]"
                                  >
                                    {post.location} ↗
                                  </a>
                                ) : (
                                  post.location
                                )}
                              </p>
                            )}

                            {post.body && (
                              <div className="text-sm lg:text-[15px] leading-relaxed text-[color:var(--color-foreground)] whitespace-pre-line max-w-prose">
                                {post.body}
                              </div>
                            )}

                            {/* Gallery thumbnails */}
                            {extraGallery.length > 0 && (
                              <div className="mt-6 grid grid-cols-4 gap-1.5">
                                {extraGallery.map((src, idx) => (
                                  <div
                                    key={src + idx}
                                    className="relative aspect-square bg-[color:var(--color-surface-2)] overflow-hidden border border-[color:var(--color-hairline)]"
                                  >
                                    <Image
                                      src={src}
                                      alt={`${post.title} — görsel ${idx + 2}`}
                                      fill
                                      sizes="(max-width: 768px) 22vw, 160px"
                                      quality={82}
                                      className="object-cover hover:scale-105 transition-transform duration-500"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}

                            {post.instagramUrl && (
                              <a
                                href={post.instagramUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-6 inline-flex h-10 px-5 items-center text-[11px] tracking-[0.22em] uppercase border"
                                style={{ borderColor: "var(--color-foreground)" }}
                              >
                                Instagram&apos;da gör →
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  </li>
                </Reveal>
              );
            })}
          </ol>
        </div>
      </section>
    </>
  );
}
