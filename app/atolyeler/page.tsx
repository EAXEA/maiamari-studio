import fs from "node:fs";
import path from "node:path";
import Image from "next/image";
import { getWorkshops } from "@/lib/data";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { WhatsappCTA } from "@/components/inquiry/whatsapp-cta";
import { PhoneCTA } from "@/components/inquiry/phone-cta";
import { WORKSHOP_IMAGES } from "@/lib/workshop-images";
import { InstructorAvatar } from "@/components/instructor/instructor-avatar";

/**
 * Eğitmen adından lokal avatar yolu (varsa). public/images/instructors/<slug>.jpg
 * formatında dosya beklenir. Kullanıcı dosyayı koyduğunda otomatik render olur.
 */
function instructorAvatarPath(name: string): string | undefined {
  const slug = name
    .toLocaleLowerCase("tr-TR")
    .replace(/[ıİ]/g, "i")
    .replace(/[şŞ]/g, "s")
    .replace(/[çÇ]/g, "c")
    .replace(/[öÖ]/g, "o")
    .replace(/[üÜ]/g, "u")
    .replace(/[ğĞ]/g, "g")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const filePath = path.join(
    process.cwd(),
    "public",
    "images",
    "instructors",
    `${slug}.jpg`,
  );
  return fs.existsSync(filePath)
    ? `/images/instructors/${slug}.jpg`
    : undefined;
}

export const metadata = { title: "Atölyeler" };

export default async function AtolyelerPage() {
  const workshops = await getWorkshops();

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
            Suluboya, çanta baskı, el yapımı kâğıt ve linol baskı atölyelerimiz
            Maiamari atölyesinde küçük gruplar halinde düzenlenir. Bilgi ve
            kayıt için{" "}
            <PhoneCTA variant="inline" label="atölye telefonunu" /> arayın.
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
          const img = w.image
            ? { src: w.image, alt: w.imageAlt ?? "" }
            : WORKSHOP_IMAGES[w.slug];
          const isWorkshop = /workshop/i.test(w.title);
          return (
            <StaggerItem
              key={w.slug}
              className="border border-[color:var(--color-border)] bg-[color:var(--color-surface)] overflow-hidden group hover:-translate-y-1 transition-transform duration-500 flex items-stretch"
            >
              {img && (
                <div className="relative w-[38%] sm:w-[34%] md:w-[30%] aspect-square self-start sm:aspect-auto sm:self-stretch sm:min-h-[200px] lg:min-h-[240px] bg-[color:var(--color-surface-2)] overflow-hidden shrink-0">
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    sizes="(max-width: 640px) 40vw, (max-width: 1024px) 25vw, 18vw"
                    quality={88}
                    className="object-cover atolye-tint transition-transform duration-[900ms] ease-out group-hover:scale-[1.03]"
                  />
                </div>
              )}
              <div className="relative p-5 lg:p-7 flex flex-col flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[10px] lg:text-[11px] tracking-[0.3em] uppercase text-[color:var(--color-muted)]">
                    {isWorkshop ? "Workshop" : "Aylık · Küçük grup"}
                  </span>
                  <InstructorAvatar
                    name={w.instructor}
                    avatarSrc={instructorAvatarPath(w.instructor)}
                    size={36}
                  />
                </div>

                <h2
                  className="font-display mt-3 lg:mt-4 leading-[1.04]"
                  style={{ color: "var(--color-walnut-dark)" }}
                >
                  <span className="block text-xl sm:text-2xl lg:text-3xl italic">
                    {firstWord}
                  </span>
                  {rest && (
                    <span className="block text-xl sm:text-2xl lg:text-3xl mt-0.5">
                      {rest}
                    </span>
                  )}
                </h2>

                <p className="mt-3 lg:mt-4 text-[11px] tracking-[0.18em] uppercase text-[color:var(--color-muted)]">
                  Eğitmen ·{" "}
                  {w.instructorInstagramUrl ? (
                    <a
                      href={w.instructorInstagramUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-4 hover:text-[color:var(--color-foreground)]"
                    >
                      {w.instructor}
                    </a>
                  ) : (
                    w.instructor
                  )}
                </p>
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
            Yer kontenjanı sınırlıdır. Kayıt önceliği telefonla yapılır.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <PhoneCTA
              variant="bare"
              label="Telefon · Randevu al"
              className="inline-flex h-12 px-8 items-center text-xs tracking-[0.25em] uppercase"
              style={{
                background: "var(--color-walnut-dark)",
                color: "var(--color-background)",
              }}
            />
            <WhatsappCTA variant="button" context="atölye programı" path="/atolyeler" className="h-12" />
          </div>
        </div>
      </Reveal>
    </div>
  );
}
