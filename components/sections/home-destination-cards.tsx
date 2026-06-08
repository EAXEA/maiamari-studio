import Image from "next/image";
import Link from "next/link";

type Destination = {
  href: string;
  image: string;
  imageAlt: string;
  eyebrow: string;
  title: string;
  titleItalic?: string;
  description: string;
  meta?: string;
  cta: string;
  /** "cover" (default, atölye foto) crop yapar; "contain" galeri eseri için pasapartu — kırpma yok. */
  fit?: "cover" | "contain";
};

type Props = {
  workshop: Destination;
  shop: Destination;
};

/**
 * Anasayfa ikincil destinasyon kartları — hero altında yan yana 2 kart.
 * Atölyeler + Mağaza. Site dilinde pasapartu foto + editorial meta + CTA.
 * Mobil: tek kolon stack.
 */
export function HomeDestinationCards({ workshop, shop }: Props) {
  return (
    <section
      className="container-x py-16 lg:py-24 border-t border-[color:var(--color-hairline)]"
      aria-label="Atölyeler ve Mağaza"
    >
      <div className="grid lg:grid-cols-2 gap-6 lg:gap-10">
        <DestinationCard {...workshop} />
        <DestinationCard {...shop} />
      </div>
    </section>
  );
}

function DestinationCard({
  href,
  image,
  imageAlt,
  eyebrow,
  title,
  titleItalic,
  description,
  meta,
  cta,
  fit = "cover",
}: Destination) {
  return (
    <Link
      href={href}
      className="group flex flex-col h-full bg-[color:var(--color-surface)] ring-1 ring-[color:var(--color-hairline)] shadow-[0_1px_2px_rgba(60,40,28,0.05),0_18px_40px_-22px_rgba(60,40,28,0.20)] hover:shadow-[0_2px_3px_rgba(60,40,28,0.06),0_28px_56px_-22px_rgba(60,40,28,0.28)] hover:-translate-y-1 transition-all duration-500"
      aria-label={`${eyebrow} · ${title} ${titleItalic ?? ""}`.trim()}
    >
      {/* Pasapartu foto */}
      <div className="relative p-5 sm:p-7 lg:p-9">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[color:var(--color-surface-2)] ring-[0.5px] ring-[color:var(--color-hairline)]">
          <Image
            src={image}
            alt={imageAlt}
            fill
            sizes="(max-width: 1024px) 92vw, 50vw"
            quality={85}
            className={`${fit === "contain" ? "object-contain p-3 lg:p-5" : "object-cover"} transition-transform duration-[1400ms] ease-out group-hover:scale-[1.04]`}
          />
        </div>
      </div>
      {/* Meta */}
      <div className="px-5 sm:px-7 lg:px-9 pb-7 lg:pb-9 flex-1 flex flex-col border-t border-dashed border-[color:var(--color-hairline)] pt-6">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="font-display mt-3 text-3xl lg:text-4xl leading-[1.05] tracking-tight">
          {title}
          {titleItalic && <span className="block italic">{titleItalic}</span>}
        </h2>
        <p className="mt-5 text-sm lg:text-base leading-relaxed text-[color:var(--color-muted)]">
          {description}
        </p>
        <div className="mt-auto pt-6 flex items-center justify-between text-xs tracking-[0.18em] uppercase text-[color:var(--color-muted)]">
          <span>{meta}</span>
          <span className="text-[color:var(--color-foreground)] group-hover:translate-x-1 transition-transform">
            {cta} →
          </span>
        </div>
      </div>
    </Link>
  );
}
