"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

const easeOut = [0.22, 1, 0.36, 1] as const;

export type InterestHeroProps = {
  eyebrow?: string;
  preLine: string;
  topic: string;
  description?: string;
  image: string;
  imageAlt?: string;
  primary?: { href: string; label: string };
  secondary?: { href: string; label: string };
  /** Hero zemin tonu — image üzerinde ne kadar washed overlay olsun */
  tone?: "light" | "dark";
  /** Kompakt varyant — sayfa içi/finale yakın kullanım için daha az dikey alan */
  compact?: boolean;
};

/**
 * Soru-bazlı editorial hero.
 * "Are you interested in [topic]?" formatı:
 *   küçük üst satır + büyük serif blok + italic kapanış.
 */
export function InterestHero({
  eyebrow = "Bir baskı atölyesi · Ankara",
  preLine,
  topic,
  description,
  image,
  imageAlt = "",
  primary,
  secondary,
  tone = "dark",
  compact = false,
}: InterestHeroProps) {
  const overlay =
    tone === "dark"
      ? "bg-gradient-to-b from-black/30 via-black/35 to-black/50"
      : "bg-gradient-to-b from-white/30 via-white/15 to-white/55";
  const textColor = tone === "dark" ? "text-white" : "text-[color:var(--color-walnut-dark)]";
  const heightCls = compact
    ? "h-[58vh] min-h-[440px] max-h-[620px]"
    : "h-[88vh] min-h-[640px] max-h-[920px]";

  return (
    <section className={`relative w-full ${heightCls} overflow-hidden`}>
      {/* Background image — mobilde üst kısmı (tavan/spot ışığı) kesilsin diye object-position kayık */}
      <div className="absolute inset-0">
        <Image
          src={image}
          alt={imageAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className={`absolute inset-0 ${overlay}`} />
      </div>

      {/* Content */}
      <div
        className={`relative h-full container-wide flex flex-col justify-end ${
          compact ? "pb-10 lg:pb-14" : "pb-16 lg:pb-24"
        }`}
      >
        <div className={`max-w-4xl ${textColor}`}>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: easeOut }}
            className="eyebrow"
            style={tone === "dark" ? { color: "rgba(255,255,255,0.85)" } : undefined}
          >
            {eyebrow}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.05, delay: 0.15, ease: easeOut }}
            className="font-display mt-5"
          >
            <span className="block text-[clamp(2.5rem,5.5vw,5rem)] leading-[0.98] tracking-tight">
              {preLine}
            </span>
            <span className="block italic text-[clamp(3rem,7vw,6.5rem)] leading-[0.98] tracking-tight">
              {topic}
            </span>
          </motion.h1>

          {description && (
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.45, ease: easeOut }}
              className="mt-8 max-w-xl text-base lg:text-lg leading-relaxed"
              style={
                tone === "dark"
                  ? { color: "rgba(255,255,255,0.88)" }
                  : { color: "var(--color-muted)" }
              }
            >
              {description}
            </motion.p>
          )}

          {(primary || secondary) && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.6, ease: easeOut }}
              className="mt-10 flex flex-wrap gap-3"
            >
              {primary && (
                <Link
                  href={primary.href}
                  className="inline-flex h-12 px-7 items-center text-[12px] tracking-[0.22em] uppercase transition-colors duration-500 hover:bg-[color:var(--color-accent-pink)]"
                  style={{
                    background: "#FFFFFF",
                    color: "var(--color-walnut-dark)",
                  }}
                >
                  {primary.label}
                </Link>
              )}
              {secondary && (
                <Link
                  href={secondary.href}
                  className="inline-flex h-12 px-7 items-center text-[12px] tracking-[0.22em] uppercase border transition-colors duration-500"
                  style={{
                    borderColor:
                      tone === "dark" ? "rgba(255,255,255,0.7)" : "var(--color-walnut-dark)",
                    color: tone === "dark" ? "white" : "var(--color-walnut-dark)",
                  }}
                >
                  {secondary.label}
                </Link>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* A&C-style scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="hidden md:flex absolute bottom-8 right-10 lg:right-14 items-center gap-3"
        style={{ color: tone === "dark" ? "white" : "var(--color-walnut)" }}
      >
        <span className="text-[10px] uppercase tracking-[0.35em]">Keşfet</span>
        <motion.div
          className="w-10 h-px"
          style={{ background: "currentColor" }}
          animate={{ scaleX: [0.4, 1, 0.4], originX: 0 }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </section>
  );
}
