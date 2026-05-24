import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";

type Props = {
  kicker?: string;
  title: string;
  italicTail?: string;
  description?: string;
  image: string;
  imageAlt?: string;
  href: string;
  ctaLabel?: string;
  align?: "left" | "right";
  tone?: "dark" | "light";
};

/**
 * Editorial "Featured story" bandı.
 * Tam genişlik görsel, üstüne editorial tipografi ve "Read story" linki.
 */
export function FeatureBanner({
  kicker = "Story",
  title,
  italicTail,
  description,
  image,
  imageAlt = "",
  href,
  ctaLabel = "Hikayeyi oku",
  align = "left",
  tone = "dark",
}: Props) {
  const overlay =
    tone === "dark"
      ? "bg-gradient-to-r from-black/65 via-black/40 to-transparent"
      : "bg-gradient-to-r from-white/75 via-white/45 to-transparent";
  const textColor = tone === "dark" ? "text-white" : "text-[color:var(--color-walnut-dark)]";
  const eyebrowColor = tone === "dark" ? "rgba(255,255,255,0.78)" : "var(--color-muted)";

  return (
    <section className="relative w-full h-[70vh] min-h-[520px] max-h-[760px] overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src={image}
          alt={imageAlt}
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div
          className={`absolute inset-0 ${overlay}`}
          style={align === "right" ? { transform: "scaleX(-1)" } : undefined}
        />
      </div>

      <div className="relative h-full container-wide flex items-center">
        <Reveal
          className={`max-w-2xl ${textColor} ${align === "right" ? "ml-auto text-right" : ""}`}
        >
          <p className="eyebrow" style={{ color: eyebrowColor }}>
            {kicker}
          </p>
          <h2 className="font-display mt-4 leading-[0.98] text-[clamp(2.25rem,5vw,4.5rem)] tracking-tight">
            {title}
            {italicTail && (
              <>
                {" "}
                <span className="italic">{italicTail}</span>
              </>
            )}
          </h2>
          {description && (
            <p
              className="mt-6 max-w-xl text-base lg:text-lg leading-relaxed"
              style={
                tone === "dark"
                  ? { color: "rgba(255,255,255,0.88)" }
                  : { color: "var(--color-muted)" }
              }
            >
              {description}
            </p>
          )}
          <Link
            href={href}
            className="mt-8 inline-block text-sm editorial-link"
            style={{ borderColor: tone === "dark" ? "white" : "var(--color-walnut-dark)" }}
          >
            {ctaLabel} →
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
