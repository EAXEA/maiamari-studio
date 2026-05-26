import type { ProductTutorial } from "@/lib/product-tutorials";

/**
 * Ürün detay sayfasında "Nasıl kullanılır" Instagram reel embed kartı.
 * 9:16 oranlı iframe + altta künye (sanatçı IG link). JS gerektirmez.
 */
export function ProductTutorialReel({ tutorial }: { tutorial: ProductTutorial }) {
  return (
    <figure className="border border-[color:var(--color-border)] bg-[color:var(--color-surface)] overflow-hidden">
      <div className="relative w-full bg-black" style={{ aspectRatio: "9 / 16" }}>
        <iframe
          src={`https://www.instagram.com/reel/${tutorial.reelId}/embed/`}
          loading="lazy"
          allow="encrypted-media"
          allowFullScreen
          scrolling="no"
          className="absolute inset-0 w-full h-full border-0"
          title={`${tutorial.title} — Instagram reel`}
        />
      </div>
      <figcaption className="px-5 py-4 flex items-baseline justify-between gap-4 flex-wrap text-[11px] tracking-[0.18em] uppercase text-[color:var(--color-muted)]">
        <span>
          Video ·{" "}
          <a
            href={tutorial.creditUrl}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 hover:text-[color:var(--color-foreground)]"
          >
            {tutorial.creditName}
          </a>
        </span>
        <a
          href={tutorial.url}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-4 hover:text-[color:var(--color-foreground)]"
        >
          Instagram&apos;da aç →
        </a>
      </figcaption>
    </figure>
  );
}
