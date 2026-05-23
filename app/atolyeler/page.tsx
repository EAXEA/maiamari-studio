import fs from "node:fs";
import path from "node:path";
import Image from "next/image";
import { getBusiness, getWorkshops } from "@/lib/data";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { WhatsappComingSoon } from "@/components/inquiry/whatsapp-coming-soon";
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

export default function AtolyelerPage() {
  const biz = getBusiness();
  const workshops = getWorkshops();
  const phoneHref = `tel:${biz.contact.phonePrimary.replace(/\s/g, "")}`;

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
            <a href={phoneHref} className="underline underline-offset-4">
              {biz.contact.phonePrimary}
            </a>{" "}
            numarasını arayın.
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
              className="border border-[color:var(--color-border)] bg-[color:var(--color-surface)] overflow-hidden group hover:-translate-y-1 transition-transform duration-500 md:flex md:items-stretch"
            >
              {img && (
                <div className="relative w-full aspect-[4/5] md:w-[40%] md:aspect-auto md:self-stretch md:min-h-[260px] md:max-h-[340px] bg-[color:var(--color-surface-2)] overflow-hidden shrink-0">
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 22vw"
                    quality={88}
                    className="object-cover atolye-tint transition-transform duration-[900ms] ease-out group-hover:scale-[1.03]"
                  />
                </div>
              )}
              <div className="relative p-6 lg:p-7 flex flex-col flex-1 min-w-0">
                {/* Eğitmen mini avatar — yuvarlak, tıklanmaz */}
                <div className="absolute top-5 right-5 z-10">
                  <InstructorAvatar
                    name={w.instructor}
                    avatarSrc={instructorAvatarPath(w.instructor)}
                    size={44}
                  />
                </div>

                <p
                  className="text-[10px] tracking-[0.35em] uppercase pr-14"
                  style={{ color: "var(--color-walnut)" }}
                >
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

                <h2
                  className="font-display mt-3 leading-[1.02]"
                  style={{ color: "var(--color-walnut-dark)" }}
                >
                  <span className="block text-2xl lg:text-3xl italic">
                    {firstWord}
                  </span>
                  {rest && (
                    <span className="block text-2xl lg:text-3xl mt-0.5">
                      {rest}
                    </span>
                  )}
                </h2>

                <div className="mt-auto pt-6 flex flex-wrap gap-2">
                  <a
                    href={phoneHref}
                    className="inline-flex h-9 px-4 items-center text-[10px] tracking-[0.2em] uppercase transition-opacity hover:opacity-90"
                    style={{
                      background: "var(--color-walnut-dark)",
                      color: "var(--color-background)",
                    }}
                  >
                    Telefonla bilgi al
                  </a>
                  <a
                    href={biz.contact.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 px-4 items-center text-[10px] tracking-[0.2em] uppercase border transition-colors hover:bg-[color:var(--color-foreground)] hover:text-[color:var(--color-background)]"
                    style={{
                      borderColor: "var(--color-foreground)",
                      color: "var(--color-foreground)",
                    }}
                  >
                    Instagram DM
                  </a>
                  <WhatsappComingSoon
                    variant="button"
                    className="h-9 px-4 text-[10px] tracking-[0.2em]"
                  />
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
            Yer kontenjanı sınırlıdır. Kayıt önceliği telefonla yapılır.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href={phoneHref}
              className="inline-flex h-12 px-8 items-center text-xs tracking-[0.25em] uppercase"
              style={{
                background: "var(--color-walnut-dark)",
                color: "var(--color-background)",
              }}
            >
              Telefonla ara · {biz.contact.phonePrimary}
            </a>
            <WhatsappComingSoon variant="button" className="h-12" />
          </div>
        </div>
      </Reveal>
    </div>
  );
}
