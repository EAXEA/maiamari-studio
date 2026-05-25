"use client";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Watermark } from "@/components/brand/watermark";

type Props = {
  images: string[];
  title: string;
};

/**
 * Ürün galerisi — ana görsel + thumb şeridi + tıklayınca lightbox.
 *
 * Tasarım notları:
 * - Thumb tıklama ana görseli değiştirir (state).
 * - Ana görsele tıklama tam ekran lightbox açar.
 * - Lightbox'ta watermark YOK (kullanıcı ürünü detayıyla incelesin).
 * - Klavye: ESC kapatır, ← → görseller arası gezer.
 * - body scroll lock lightbox açıkken.
 */
export function ProductGallery({ images, title }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  // Guard — boş images dizisi component'i savunmasız bırakır
  // (modulo NaN, src=undefined). Tüketici garanti etse de bileşen kendini korusun.
  if (!images.length) return null;

  const active = images[activeIdx] ?? images[0];

  const next = useCallback(
    () => setActiveIdx((i) => (i + 1) % images.length),
    [images.length],
  );
  const prev = useCallback(
    () => setActiveIdx((i) => (i - 1 + images.length) % images.length),
    [images.length],
  );

  useEffect(() => {
    if (!lightbox) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = orig;
      window.removeEventListener("keydown", onKey);
    };
  }, [lightbox, next, prev]);

  return (
    <div className="space-y-3">
      {/* Ana görsel — tıklayınca lightbox açar */}
      <button
        type="button"
        onClick={() => setLightbox(true)}
        aria-label={`${title} — büyük görüntüle`}
        className="group relative aspect-[4/5] w-full overflow-hidden bg-[color:var(--color-surface-2)] cursor-zoom-in"
      >
        <Image
          src={active}
          alt={title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 60vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
        />
        <Watermark position="bottom-right" opacity={0.45} scale={0.22} />
        {/* Zoom hint — sağ üst */}
        <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] tracking-[0.22em] uppercase bg-[color:var(--color-walnut-dark)]/85 text-[color:var(--color-background)] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <ZoomIcon />
          Büyüt
        </span>
      </button>

      {/* Thumb şeridi */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {images.map((img, idx) => {
            const isActive = idx === activeIdx;
            return (
              <button
                key={img + idx}
                type="button"
                onClick={() => setActiveIdx(idx)}
                aria-label={`${title} — ${idx + 1}. görsel`}
                aria-current={isActive ? "true" : "false"}
                className={`relative aspect-square overflow-hidden bg-[color:var(--color-surface-2)] transition-all duration-300 ${
                  isActive
                    ? "ring-2 ring-[color:var(--color-walnut-dark)] ring-offset-2 ring-offset-[color:var(--color-background)]"
                    : "ring-1 ring-[color:var(--color-hairline)] opacity-75 hover:opacity-100"
                }`}
              >
                <Image
                  src={img}
                  alt={`${title} – ${idx + 1}`}
                  fill
                  sizes="20vw"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${title} büyük görüntü`}
          className="fixed inset-0 z-50 bg-black/92 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 animate-[fadeIn_180ms_ease-out]"
          onClick={(e) => {
            if (e.target === e.currentTarget) setLightbox(false);
          }}
        >
          {/* Close */}
          <button
            type="button"
            onClick={() => setLightbox(false)}
            aria-label="Kapat"
            className="absolute top-4 right-4 sm:top-6 sm:right-6 w-11 h-11 flex items-center justify-center text-white/85 hover:text-white text-2xl"
          >
            ×
          </button>

          {/* Prev / Next */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                aria-label="Önceki görsel"
                className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-white/80 hover:text-white text-3xl"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="Sonraki görsel"
                className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-white/80 hover:text-white text-3xl"
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
                  src={active}
                  alt={title}
                  width={1200}
                  height={1200}
                  priority
                  sizes="100vw"
                  className="block max-w-full max-h-[72vh] w-auto h-auto select-none"
                  draggable={false}
                />
                <Watermark
                  position="bottom-right"
                  opacity={0.4}
                  scale={0.16}
                />
              </div>
            </figure>
          </div>

          {/* Sayaç */}
          {images.length > 1 && (
            <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-[11px] tracking-[0.25em] uppercase text-white/75 tabular-nums">
              {activeIdx + 1} / {images.length}
            </p>
          )}
        </div>
      )}
    </div>
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
