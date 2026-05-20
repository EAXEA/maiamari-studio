import { getBusiness, getWorkshops } from "@/lib/data";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";

export const metadata = { title: "Atölyeler" };

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
            Suluboya, çanta baskı ve linol baskı atölyelerimiz Maimari
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
        className="mt-16 grid lg:grid-cols-2 gap-6"
        delayChildren={0.15}
        staggerChildren={0.12}
      >
        {workshops.map((w) => (
          <StaggerItem
            key={w.slug}
            className="border p-8 lg:p-12 flex flex-col group hover:-translate-y-1 transition-transform duration-500"
          >
            <div
              className="-m-8 lg:-m-12 mb-0 p-8 lg:p-12"
              style={{
                background: "var(--color-surface)",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              <p
                className="text-[10px] tracking-[0.35em] uppercase"
                style={{ color: "var(--color-walnut)" }}
              >
                {w.instructor}
              </p>
              <h2
                className="font-display mt-4 leading-[0.95]"
                style={{ color: "var(--color-walnut-dark)" }}
              >
                <span className="block text-3xl lg:text-5xl italic">
                  {w.title.split(" ").slice(0, 1).join(" ")}
                </span>
                <span className="block text-3xl lg:text-5xl">
                  {w.title.split(" ").slice(1).join(" ")}
                </span>
              </h2>
            </div>

            <dl className="mt-8 grid grid-cols-[max-content_1fr] gap-x-8 gap-y-3 text-sm">
              <dt
                className="uppercase tracking-[0.2em] text-xs"
                style={{ color: "var(--color-muted)" }}
              >
                Eğitmen
              </dt>
              <dd>{w.instructor}</dd>
              {w.schedule && (
                <>
                  <dt
                    className="uppercase tracking-[0.2em] text-xs"
                    style={{ color: "var(--color-muted)" }}
                  >
                    Program
                  </dt>
                  <dd>{w.schedule}</dd>
                </>
              )}
              {w.date && (
                <>
                  <dt
                    className="uppercase tracking-[0.2em] text-xs"
                    style={{ color: "var(--color-muted)" }}
                  >
                    Tarih
                  </dt>
                  <dd>{w.date}</dd>
                </>
              )}
            </dl>

            <p
              className="mt-6 text-sm leading-relaxed flex-1"
              style={{ color: "var(--color-muted)" }}
            >
              Kayıt için DM üzerinden veya {biz.contact.phonePrimary}{" "}
              numarasını arayın.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(
                  `Merhaba, "${w.title}" atölyesi için kayıt yaptırmak istiyorum.`,
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 px-6 items-center text-xs tracking-[0.2em] uppercase transition-opacity hover:opacity-90"
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
                className="inline-flex h-11 px-6 items-center text-xs tracking-[0.2em] uppercase border transition-colors hover:bg-[color:var(--color-foreground)] hover:text-[color:var(--color-background)]"
                style={{
                  borderColor: "var(--color-foreground)",
                  color: "var(--color-foreground)",
                }}
              >
                Instagram DM
              </a>
            </div>
          </StaggerItem>
        ))}
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
