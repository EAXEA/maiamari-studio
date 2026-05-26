"use client";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { PortfolioWork } from "@/lib/types";
import { Reveal } from "@/components/motion/reveal";
import { InstagramInquiryButton } from "@/components/inquiry/instagram-inquiry-button";
// NOTE: Galeri görselleri arşivde baked-in watermark ile geliyor
// (Masaüstü\duygu arşiv\images_watermarked\). CSS overlay watermark
// kaldırıldı — çift watermark gerekmez.

type Props = {
  works: PortfolioWork[];
  /** "Lord of … Maskeler" / "Kapılar" — künyede Seri satırı */
  seriesName: string;
  /** Instagram inquiry için sayfa yolu */
  inquiryPath: string;
  /** Tüm eserlerde ortak kâğıt notu (varsa) */
  paperNote?: string;
};

/**
 * Galeri serisi sayfası için her eseri büyük detay kartında listeler.
 * Her satır: foto + künye + açıklama. CTA'lar (Telefon/Instagram)
 * eser kartlarında tekrar etmek yerine foto tıklanınca açılan
 * lightbox'ta yer alır — sayfa temiz, eserin kendisi öne çıkar.
 *
 * Lightbox: ESC kapat, ←/→ gezin, click-outside kapat, body scroll lock.
 * Watermark hem kartta hem lightbox'ta görünür (sahiplik koruması).
 */
export function WorksDetailList({
  works,
  seriesName,
  inquiryPath,
  paperNote,
}: Props) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const open = activeIdx !== null;
  const active = open ? works[activeIdx] : null;

  const close = useCallback(() => setActiveIdx(null), []);
  const next = useCallback(
    () =>
      setActiveIdx((i) =>
        i === null ? null : (i + 1) % works.length,
      ),
    [works.length],
  );
  const prev = useCallback(
    () =>
      setActiveIdx((i) =>
        i === null ? null : (i - 1 + works.length) % works.length,
      ),
    [works.length],
  );

  useEffect(() => {
    if (!open) return;
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = origOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close, next, prev]);

  return (
    <>
      <div className="divide-y divide-[color:var(--color-hairline)]">
        {works.map((work, idx) => (
          <Reveal key={work.id}>
            <article className="py-14 lg:py-20 first:pt-0">
              <div className="grid lg:grid-cols-[1.4fr_1fr] gap-10 lg:gap-16 items-start">
                {/* Foto — tıklayınca lightbox */}
                <figure
                  className="bg-[color:var(--color-surface)] p-5 sm:p-7 lg:p-9 ring-1 ring-[color:var(--color-hairline)]
                             shadow-[0_1px_2px_rgba(60,40,28,0.05),0_18px_40px_-22px_rgba(60,40,28,0.20)]"
                >
                  {/* Statik kart — hover scale/cursor değişimi yok, eser sabit duruyor */}
                  <div className="relative ring-[0.5px] ring-[color:var(--color-hairline)] overflow-hidden bg-[color:var(--color-surface-2)]">
                    <Image
                      src={work.image}
                      alt={work.title}
                      width={work.width ?? 1200}
                      height={work.height ?? 1200}
                      priority={idx === 0}
                      sizes="(max-width: 1024px) 100vw, 56vw"
                      className="block w-full h-auto select-none"
                      draggable={false}
                    />
                  </div>
                </figure>

                {/* Künye — sade, CTA yok (lightbox'ta) */}
                <div className="lg:pt-6">
                  <p className="eyebrow tabular-nums">
                    Eser {String(idx + 1).padStart(2, "0")}
                  </p>
                  <h2 className="font-display mt-4 text-3xl md:text-4xl lg:text-5xl leading-[1.05] tracking-tight">
                    <span className="italic">{work.title}</span>
                  </h2>
                  <dl className="mt-8 grid grid-cols-[max-content_1fr] gap-x-8 gap-y-2 text-sm">
                    <dt className="text-[color:var(--color-muted)]">Sanatçı</dt>
                    <dd>{work.artist ?? "Duygu Sinan"}</dd>
                    <dt className="text-[color:var(--color-muted)]">Seri</dt>
                    <dd>{seriesName}</dd>
                    <dt className="text-[color:var(--color-muted)]">Teknik</dt>
                    <dd>{work.technique ?? "Linol baskı, elle çoğaltılmış"}</dd>
                    {(work.paper ?? paperNote) && (
                      <>
                        <dt className="text-[color:var(--color-muted)]">Kâğıt</dt>
                        <dd>{work.paper ?? paperNote}</dd>
                      </>
                    )}
                    {work.dimensions && (
                      <>
                        <dt className="text-[color:var(--color-muted)]">Boyut</dt>
                        <dd className="leading-relaxed">{work.dimensions}</dd>
                      </>
                    )}
                    {work.year && (
                      <>
                        <dt className="text-[color:var(--color-muted)]">Yıl</dt>
                        <dd>{work.year}</dd>
                      </>
                    )}
                    <dt className="text-[color:var(--color-muted)]">Edisyon</dt>
                    <dd>
                      {work.editionSize
                        ? `${work.editionSize} adetlik sayılı edisyon · fiyat DM'den`
                        : "Sayılı · DM üzerinden bilgi"}
                    </dd>
                    {work.firstSerial && (
                      <>
                        <dt className="text-[color:var(--color-muted)]">Serial</dt>
                        <dd className="font-mono text-xs tabular-nums tracking-tight">
                          {work.firstSerial}
                        </dd>
                      </>
                    )}
                    <dt className="text-[color:var(--color-muted)]">Filigran</dt>
                    <dd className="text-[color:var(--color-muted)] text-xs leading-relaxed">
                      MAIAMARI © · yalnızca dijital gösterimde.
                      Teslim edilen fiziksel baskı filigransızdır.
                    </dd>
                  </dl>
                  {work.description && (
                    <p className="mt-8 text-base leading-relaxed text-[color:var(--color-muted)] max-w-prose">
                      {work.description}
                    </p>
                  )}
                  {/* Sade single-link: foto tıklanır + zoom — CTA çoğullamadan */}
                  <button
                    type="button"
                    onClick={() => setActiveIdx(idx)}
                    className="mt-7 inline-flex items-center gap-2 text-sm editorial-link"
                  >
                    <ZoomIcon />
                    Eseri görüntüle
                  </button>
                </div>
              </div>
            </article>
          </Reveal>
        ))}
      </div>

      {/* Lightbox */}
      {open && active && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${active.title} — büyük görüntü`}
          className="fixed inset-0 z-50 bg-black/92 backdrop-blur-sm flex flex-col items-center justify-center p-4 sm:p-6 animate-[fadeIn_180ms_ease-out]"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          {/* Close */}
          <button
            type="button"
            onClick={close}
            aria-label="Kapat"
            className="absolute top-4 right-4 sm:top-6 sm:right-6 w-11 h-11 flex items-center justify-center text-white/85 hover:text-white text-2xl z-10"
          >
            ×
          </button>

          {/* Prev / Next */}
          {works.length > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                aria-label="Önceki eser"
                className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-white/80 hover:text-white text-3xl z-10"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="Sonraki eser"
                className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-white/80 hover:text-white text-3xl z-10"
              >
                ›
              </button>
            </>
          )}

          {/* Görsel — serilerle aynı pasapartu çerçeve yapısı */}
          <div className="relative flex-1 w-full flex items-center justify-center pointer-events-none">
            <figure
              className="bg-[color:var(--color-surface)] p-5 sm:p-7 lg:p-9 ring-1 ring-[color:var(--color-hairline)]
                         shadow-[0_1px_2px_rgba(60,40,28,0.05),0_22px_60px_-22px_rgba(0,0,0,0.55)]"
            >
              <div className="relative ring-[0.5px] ring-[color:var(--color-hairline)] overflow-hidden bg-[color:var(--color-surface-2)]">
                <Image
                  src={active.image}
                  alt={active.title}
                  width={active.width ?? 1200}
                  height={active.height ?? 1200}
                  priority
                  sizes="100vw"
                  className="block max-w-full max-h-[68vh] w-auto h-auto select-none"
                  draggable={false}
                />
              </div>
            </figure>
          </div>

          {/* Alt info bar — künye özet + CTA'lar */}
          <div className="w-full max-w-[1400px] mt-5 px-2 sm:px-4 text-white pointer-events-auto">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <p
                  className="text-[10px] tracking-[0.32em] uppercase"
                  style={{ color: "rgba(255,255,255,0.7)" }}
                >
                  Eser {String(activeIdx + 1).padStart(2, "0")} ·{" "}
                  {seriesName}
                </p>
                <h3 className="font-display italic mt-2 text-xl lg:text-2xl leading-tight">
                  {active.title}
                </h3>
                <p
                  className="mt-2 text-xs lg:text-sm"
                  style={{ color: "rgba(255,255,255,0.75)" }}
                >
                  {active.technique ?? "Linol baskı, elle çoğaltılmış"}
                  {active.paper ? ` · ${active.paper}` : paperNote ? ` · ${paperNote}` : ""}
                  {active.year ? ` · ${active.year}` : ""}
                  {active.editionSize ? ` · ${active.editionSize} adetlik edisyon` : " · Sayılı edisyon"}
                </p>
                {active.dimensions && (
                  <p
                    className="mt-1 text-[11px] lg:text-xs"
                    style={{ color: "rgba(255,255,255,0.55)" }}
                  >
                    {active.dimensions}
                  </p>
                )}
                <p
                  className="mt-2 text-[10px] tracking-[0.18em] uppercase"
                  style={{ color: "rgba(255,255,255,0.45)" }}
                >
                  Filigran · MAIAMARI © · yalnızca dijital gösterimde
                </p>
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                <InstagramInquiryButton
                  title={active.title}
                  path={inquiryPath}
                  label="Instagram'dan bilgi al →"
                  className="text-white/90 hover:text-white underline underline-offset-4"
                />
                <a
                  href={`https://wa.me/905065889277?text=${encodeURIComponent(
                    `Merhaba, "${active.title}" eseri hakkında bilgi almak istiyorum.\nhttps://www.maiamari.art${inquiryPath}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-white/90 hover:text-white underline underline-offset-4"
                >
                  WhatsApp&apos;tan yaz →
                </a>
              </div>
            </div>
            {works.length > 1 && (
              <p
                className="mt-3 text-center text-[10px] tracking-[0.25em] uppercase tabular-nums"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                {activeIdx + 1} / {works.length}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ZoomIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 11 11"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      aria-hidden="true"
    >
      <circle cx="4.5" cy="4.5" r="3.2" />
      <line x1="7" y1="7" x2="10" y2="10" />
      <line x1="3" y1="4.5" x2="6" y2="4.5" />
      <line x1="4.5" y1="3" x2="4.5" y2="6" />
    </svg>
  );
}
