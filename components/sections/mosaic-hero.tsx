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
    <section
      className="relative w-full overflow-hidden"
      style={{ height: "78svh", minHeight: 560, maxHeight: 860 }}
    >
      <div className="grid h-full grid-cols-1 lg:grid-cols-[1.4fr_1fr] grid-rows-[1.4fr_1fr] lg:grid-rows-2 gap-1.5 lg:gap-2 p-1.5 lg:p-2 bg-[color:var(--color-walnut-dark)]">
        <MosaicCell
          {...primary}
          variant="primary"
          delay={0}
          className="lg:row-span-2"
        />
        <MosaicCell {...topRight} variant="secondary" delay={0.12} />
        <MosaicCell {...bottomRight} variant="secondary" delay={0.24} />
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
      className={`relative overflow-hidden bg-[color:var(--color-walnut-dark)] group ${className}`}
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
