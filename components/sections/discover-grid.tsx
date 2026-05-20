import Image from "next/image";
import Link from "next/link";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";

export type DiscoverItem = {
  label: string;
  meta?: string;
  image: string;
  href: string;
};

type Props = {
  eyebrow: string;
  title: string;
  italicTail?: string;
  description?: string;
  items: DiscoverItem[];
  /** Görsel oranı */
  aspect?: "portrait" | "square" | "landscape";
  /** Sütun sayısı (lg breakpoint) */
  cols?: 2 | 3 | 4;
  bg?: string;
};

/**
 * Google Arts & Culture "Browse by theme/artist/medium" stili kâşif grid.
 */
export function DiscoverGrid({
  eyebrow,
  title,
  italicTail,
  description,
  items,
  aspect = "portrait",
  cols = 4,
  bg,
}: Props) {
  const aspectClass =
    aspect === "portrait"
      ? "ratio-portrait"
      : aspect === "landscape"
        ? "ratio-landscape"
        : "ratio-square";

  const gridCols =
    cols === 2
      ? "grid-cols-1 md:grid-cols-2"
      : cols === 3
        ? "grid-cols-2 md:grid-cols-3"
        : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";

  return (
    <section className={`py-16 lg:py-24 ${bg ?? ""}`}>
      <div className="container-x">
        <Reveal>
          <div className="grid lg:grid-cols-[1fr_1.4fr] gap-8 lg:gap-16 items-end mb-12 lg:mb-16">
            <div>
              <p className="eyebrow">{eyebrow}</p>
              <h2 className="font-display mt-3 text-3xl md:text-5xl lg:text-6xl leading-[1.02] tracking-tight">
                {title}
                {italicTail && (
                  <>
                    {" "}
                    <span className="italic">{italicTail}</span>
                  </>
                )}
              </h2>
            </div>
            {description && (
              <p className="text-base lg:text-lg leading-relaxed max-w-prose text-[color:var(--color-muted)]">
                {description}
              </p>
            )}
          </div>
        </Reveal>

        <Stagger
          className={`grid ${gridCols} gap-x-5 gap-y-10 lg:gap-x-7 lg:gap-y-14`}
          staggerChildren={0.06}
        >
          {items.map((item) => (
            <StaggerItem key={item.href + item.label}>
              <Link href={item.href} className="group block">
                <div className={`relative w-full ${aspectClass} overflow-hidden bg-[color:var(--color-surface-2)]`}>
                  <Image
                    src={item.image}
                    alt={item.label}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.05]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
                <div className="mt-4">
                  <h3 className="font-display text-xl lg:text-2xl leading-snug group-hover:italic transition-all duration-500">
                    {item.label}
                  </h3>
                  {item.meta && (
                    <p
                      className="mt-1 text-[12px] tracking-widest uppercase"
                      style={{ color: "var(--color-muted)" }}
                    >
                      {item.meta}
                    </p>
                  )}
                </div>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
