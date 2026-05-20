import Image from "next/image";
import { getBusiness, getWorkshops } from "@/lib/data";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";

export const metadata = { title: "Atölyeler" };

// Workshop slug → görsel eşlemesi
const WORKSHOP_IMAGES: Record<string, { src: string; alt: string }> = {
  "suluboya-aylik-program": {
    src: "/images/atolye/watercolor-framed.jpg",
    alt: "Suluboya · zeytin dalı, Duygu Sinan tarafından çerçeveli bir çalışma",
  },
};

export default function WorkshopsPage() {
  const biz = getBusiness();
  const workshops = getWorkshops();
  const whatsapp = biz.contact.whatsapp.replace(/\D/g, "");

  return (
    <div className="container-x py-16 lg:py-24">
      <Reveal>
        <header className="max-w-3xl">
          <p
            className="text-xs tracking-[0.3em] uppercase"
            style={{ color: "var(--color-muted)" }}
          >
            Atölyeler
          </p>
          <h1
            className="font-display mt-4 leading-[0.95]"
            style={{ color: "var(--color-walnut-dark)" }}
          >
            <span className="block text-5xl md:text-7xl lg:text-8xl italic">
              Atölyenin
            </span>
            <span className="block text-5xl md:text-7xl lg:text-8xl">
              aylık programı
            </span>
          </h1>
          <p
            className="mt-8 max-w-2xl text-base lg:text-lg leading-relaxed"
            style={{ color: "var(--color-muted)" }}
          >
            Suluboya, çanta baskı ve linol baskı atölyelerimiz Maiamari
            atölyesinde küçük gruplar halinde düzenlenir. Kayıt için DM veya{" "}
            <a
              href={`tel:${biz.contact.phonePrimary.replace(/\s/g, "")}`}
              className="underline underline-offset-4"
            >
              {biz.contact.phonePrimary}
            </a>
            .
          </p>
        </header>
      </Reveal>

      <Stagger
        className="mt-16 grid lg:grid-cols-2 gap-6 lg:gap-8"
        delayChildren={0.15}
        staggerChildren={0.12}
      >
        {workshops.map((w) => {
          const [firstWord, ...restWords] = w.title.split(" ");
          const rest = restWords.join(" ");
          const img = WORKSHOP_IMAGES[w.slug];
          return (
            <StaggerItem
              key={w.slug}
              className="border border-[color:var(--color-border)] bg-[color:var(--color-surface)] overflow-hidden flex flex-col group hover:-translate-y-1 transition-transform duration-500"
            >
              {img && (
                <div className="relative w-full aspect-[4/3] bg-[color:var(--color-surface-2)] overflow-hidden">
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover atolye-tint transition-transform duration-[900ms] ease-out group-hover:scale-[1.03]"
                  />
                </div>
              )}
              <div className="p-10 lg:p-14 flex flex-col flex-1">
              <p
                className="text-[10px] tracking-[0.35em] uppercase"
                style={{ color: "var(--color-walnut)" }}
              >
                Eğitmen · {w.instructor}
              </p>

              <h2
                className="font-display mt-5 leading-[0.95]"
                style={{ color: "var(--color-walnut-dark)" }}
              >
                <span className="block text-4xl lg:text-5xl italic">
                  {firstWord}
                </span>
                {rest && (
                  <span className="block text-4xl lg:text-5xl mt-1">
                    {rest}
                  </span>
                )}
              </h2>

              <p
                className="mt-8 text-base leading-relaxed flex-1 max-w-md"
                style={{ color: "var(--color-muted)" }}
              >
                Kayıt için DM üzerinden veya{" "}
                <a
                  href={`tel:${biz.contact.phonePrimary.replace(/\s/g, "")}`}
                  className="underline underline-offset-4"
                >
                  {biz.contact.phonePrimary}
                </a>{" "}
                numarasını arayın.
              </p>

              <div className="mt-10 flex flex-wrap gap-3">
                <a
                  href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(
                    `Merhaba, "${w.title}" atölyesi için kayıt yaptırmak istiyorum.`,
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 px-6 items-center text-xs tracking-[0.22em] uppercase transition-opacity hover:opacity-90"
                  style={{
                    background: "var(--color-walnut-dark)",
                    color: "var(--color-background)",
                  }}
                >
                  WhatsApp ile kayıt
                </a>
                <a
                  href={biz.contact.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 px-6 items-center text-xs tracking-[0.22em] uppercase border transition-colors hover:bg-[color:var(--color-foreground)] hover:text-[color:var(--color-background)]"
                  style={{
                    borderColor: "var(--color-foreground)",
                    color: "var(--color-foreground)",
                  }}
                >
                  Instagram DM
                </a>
              </div>
              </div>
            </StaggerItem>
          );
        })}
      </Stagger>

      {/* Visit note */}
      <Reveal delay={0.3}>
        <div
          className="mt-24 p-10 lg:p-14 text-center"
          style={{ background: "var(--color-accent-pink)" }}
        >
          <p
            className="text-xs tracking-[0.35em] uppercase"
            style={{ color: "var(--color-walnut-dark)" }}
          >
            Bir sonraki seansa katılın
          </p>
          <h3
            className="font-display mt-3"
            style={{ color: "var(--color-walnut-dark)" }}
          >
            <span className="block text-3xl lg:text-5xl">
              Atölyemizde <span className="italic">yer açtık.</span>
            </span>
          </h3>
          <p
            className="mt-4 text-sm"
            style={{ color: "var(--color-walnut-dark)" }}
          >
            Yer kontenjanı sınırlıdır. Kayıt önceliği WhatsApp&apos;tan
            yapılır.
          </p>
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-12 px-8 items-center mt-6 text-xs tracking-[0.25em] uppercase"
            style={{
              background: "var(--color-walnut-dark)",
              color: "var(--color-background)",
            }}
          >
            WhatsApp&apos;tan yaz
          </a>
        </div>
      </Reveal>
    </div>
  );
}
