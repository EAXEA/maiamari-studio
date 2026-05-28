import Image from "next/image";
import Link from "next/link";

type Props = {
  image: string;
  imageAlt: string;
  /** Müze etiketi metrikleri (Seri · Eser · Atölye gibi). */
  metrics: { label: string; value: string | number }[];
};

/**
 * Anasayfa hero — "üretim izi" merkezli full-bleed editorial hero.
 * Tam ekran arka plan: atölye masası yakın çekim. Üzerinde sol-alta heavy
 * gradient + beyaz tipografi (eyebrow + italic Cormorant manifesto + meta +
 * CTA). Carousel/slayt yok; tek odaklı sergi vitrini.
 */
export function ProductionHero({ image, imageAlt, metrics }: Props) {
  return (
    <section
      className="relative w-full overflow-hidden bg-[#141414]"
      aria-label="Atölye · Üretim izi"
    >
      {/* Arka plan görsel */}
      <div className="absolute inset-0">
        <Image
          src={image}
          alt={imageAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        {/* Sol-alt heavy gradient → sağ-üst transparent. */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to top right, rgba(10,8,6,0.94) 0%, rgba(10,8,6,0.60) 40%, rgba(10,8,6,0.12) 70%, rgba(10,8,6,0) 100%)",
          }}
        />
      </div>

      {/* Sağ-üst minimal badge */}
      <div className="absolute top-6 right-6 lg:top-10 lg:right-12 z-10">
        <span className="text-[10px] tracking-[0.32em] uppercase text-white/85 bg-white/10 backdrop-blur-sm px-3 py-1.5 border border-white/20">
          Bugün · Atölyede
        </span>
      </div>

      {/* Editorial blok — flow tabanlı: içerik yukarıdan akar, min-h ile en az
          viewport-h. İçerik daha uzunsa section büyür, scroll edilebilir; her
          ekranda buton görünür kalır. */}
      <div className="relative z-10 container-x flex flex-col justify-end min-h-[calc(100svh-64px)] min-h-[600px] pt-24 pb-12 lg:pt-32 lg:pb-16">
        <div className="max-w-2xl text-white">
          <p
            className="text-[11px] tracking-[0.32em] uppercase"
            style={{ color: "rgba(255,255,255,0.78)" }}
          >
            Atölye · Üretim izi
          </p>
          <h1 className="font-display italic mt-4 lg:mt-5 leading-[0.95] tracking-tight text-[clamp(2.3rem,5vw,4.6rem)]">
            Baskı burada hâlâ elle yapılıyor.
          </h1>
          <p
            className="mt-4 lg:mt-6 text-sm lg:text-base leading-relaxed max-w-md"
            style={{ color: "rgba(255,255,255,0.85)" }}
          >
            Linol, suluboya, çanta baskı, el yapımı kâğıt. Atölyenin kendi
            malzemesi, kendi presi, kendi izi. Sergi vitrini değil, üretim
            masası.
          </p>

          <dl
            className="mt-6 lg:mt-8 grid grid-cols-3 gap-x-8 max-w-sm border-t pt-4"
            style={{ borderColor: "rgba(255,255,255,0.22)" }}
          >
            {metrics.map((m) => (
              <div key={m.label}>
                <dt
                  className="text-[10px] tracking-[0.22em] uppercase"
                  style={{ color: "rgba(255,255,255,0.65)" }}
                >
                  {m.label}
                </dt>
                <dd className="mt-1.5 font-display italic text-2xl lg:text-3xl leading-none tracking-tight text-white">
                  {m.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-7 lg:mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/atolyeler"
              className="inline-flex h-12 px-7 items-center text-[12px] tracking-[0.22em] uppercase hover:opacity-90 transition-opacity"
              style={{ background: "#ffffff", color: "#1f1612" }}
            >
              Atölye programı →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
