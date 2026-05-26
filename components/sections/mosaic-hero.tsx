"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

const easeOut = [0.22, 1, 0.36, 1] as const;

type Cell = {
  href: string;
  image: string;
  imageAlt: string;
  eyebrow: string;
  title: string;
  titleItalic?: string;
  /** Görsel pozisyonu — bazı fotoğraflarda konu üst kısımda */
  objectPos?: string;
  /** "cover" (default, atölye foto) crop yapar; "contain" galeri eseri için pasapartu — kırpma yok. */
  fit?: "cover" | "contain";
  /** Eyebrow altında küçük müze etiketi (ör. "X3 Linolyum · Handmade Paper · 12 eser × 10 baskı"). */
  meta?: string;
};

type Props = {
  primary: Cell;
  topRight: Cell;
  bottomRight: Cell;
};

/**
 * Magazine cover stilinde mosaic hero — 3 hücre, 3 ayrı offer.
 * Sol büyük hücre (atölye/marka) col 1 row-span 2; sağ üst (galeri) ve
 * sağ alt (mağaza) col 2. Her hücre tek başına tıklanır, alt-sol köşede
 * kendi etiketi olur. Gradient overlay ile metin okunaklılığı sağlanır.
 */
export function MosaicHero({ primary, topRight, bottomRight }: Props) {
  return (
    <section className="relative w-full overflow-hidden h-[calc(100svh-64px)] lg:h-[78svh] lg:min-h-[560px] lg:max-h-[860px]">
      {/* Mobil: header (64px) sonrası kalan viewport'a 3 eşit hücre — header
          + hero ilk ekrana sığar, scroll'da hero biter. lg+: 2-kolon mozaik. */}
      <div className="grid h-full grid-cols-1 grid-rows-3 lg:grid-cols-[1fr_1.2fr] lg:grid-rows-2 gap-1.5 lg:gap-2 p-1.5 lg:p-2 bg-[#1a1a1a]">
        <MosaicCell
          {...primary}
          variant="primary"
          delay={0}
          className="order-2 lg:order-none lg:row-span-2"
        />
        <MosaicCell
          {...topRight}
          variant="secondary"
          delay={0.12}
          className="order-3 lg:order-none"
        />
        <MosaicCell
          {...bottomRight}
          variant="secondary"
          delay={0.24}
          className="order-1 lg:order-none"
        />
      </div>
    </section>
  );
}

function MosaicCell({
  href,
  image,
  imageAlt,
  eyebrow,
  title,
  titleItalic,
  objectPos = "center",
  fit = "cover",
  meta,
  variant,
  delay,
  className = "",
}: Cell & {
  variant: "primary" | "secondary";
  delay: number;
  className?: string;
}) {
  const isPrimary = variant === "primary";
  const isContain = fit === "contain";

  return (
    <motion.article
      initial={{ opacity: 0, scale: 1.02 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.1, delay, ease: easeOut }}
      className={`relative overflow-hidden bg-[#1a1a1a] group ${className}`}
    >
      <Image
        src={image}
        alt={imageAlt}
        fill
        priority={isPrimary}
        sizes={
          isPrimary
            ? "(max-width: 1024px) 100vw, 58vw"
            : "(max-width: 1024px) 100vw, 42vw"
        }
        className={`${
          isContain ? "object-contain p-6 lg:p-10" : "object-cover"
        } transition-transform duration-[1400ms] ease-out group-hover:scale-[1.04]`}
        style={{ objectPosition: objectPos }}
      />

      {/* Gradient overlay — alttan koyuya, sade ve okunaklı */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/75 via-black/35 to-transparent pointer-events-none" />

      {/* Etiket — alt-sol köşede editorial blok */}
      <div
        className={`absolute bottom-0 left-0 right-0 text-white pointer-events-none ${
          isPrimary ? "p-8 lg:p-12" : "p-6 lg:p-8"
        }`}
      >
        <p
          className={`tracking-[0.32em] uppercase ${
            isPrimary ? "text-[11px]" : "text-[10px]"
          }`}
          style={{ color: "rgba(255,255,255,0.78)" }}
        >
          {eyebrow}
        </p>
        {meta && (
          <p
            className="mt-1.5 text-[10px] tracking-[0.16em] uppercase font-mono"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            {meta}
          </p>
        )}
        {/* Heading hiyerarşi: anasayfa h1 primary cell'de, h2 secondary'lerde */}
        {isPrimary ? (
          <h1 className="font-display mt-3 leading-[0.98] tracking-tight text-[clamp(2.4rem,4.5vw,4.5rem)]">
            {title}
            {titleItalic && <span className="block italic">{titleItalic}</span>}
          </h1>
        ) : (
          <h2 className="font-display mt-3 leading-[0.98] tracking-tight text-[clamp(1.6rem,2.4vw,2.6rem)]">
            {title}
            {titleItalic && <span className="block italic">{titleItalic}</span>}
          </h2>
        )}
        <p
          className={`mt-4 tracking-[0.22em] uppercase ${
            isPrimary ? "text-[11px]" : "text-[10px]"
          }`}
          style={{ color: "rgba(255,255,255,0.85)" }}
        >
          Görüntüle →
        </p>
      </div>

      {/* Tam hücreyi tıklanır yapan absolute link */}
      <Link
        href={href}
        aria-label={`${eyebrow} · ${title} ${titleItalic ?? ""}`.trim()}
        className="absolute inset-0 z-10"
      />
    </motion.article>
  );
}
