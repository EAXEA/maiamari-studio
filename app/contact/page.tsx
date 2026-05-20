import { getBusiness } from "@/lib/data";

export const metadata = { title: "İletişim" };

export default function ContactPage() {
  const biz = getBusiness();
  const whatsapp = biz.contact.whatsapp.replace(/\D/g, "");

  return (
    <div className="container-x py-16 lg:py-24">
      <header className="max-w-2xl">
        <p className="text-xs tracking-[0.3em] uppercase text-[color:var(--color-muted)]">
          İletişim
        </p>
        <h1 className="font-display text-4xl lg:text-6xl mt-4 leading-[1.05]">
          Atölyemize uğrayın.
        </h1>
      </header>

      <div className="mt-16 grid lg:grid-cols-2 gap-12 lg:gap-20">
        <div className="space-y-10">
          <section>
            <h2 className="font-display text-xl mb-3">Adres</h2>
            <address className="not-italic text-base leading-relaxed">
              {biz.address.full}
              <br />
              <span className="text-sm text-[color:var(--color-muted)]">
                Yakın metro: {biz.transit.nearestMetro}
              </span>
            </address>
          </section>

          <section>
            <h2 className="font-display text-xl mb-3">İletişim</h2>
            <dl className="grid grid-cols-[max-content_1fr] gap-x-8 gap-y-2 text-sm">
              <dt className="text-[color:var(--color-muted)] uppercase tracking-wider">
                Telefon
              </dt>
              <dd>
                <a
                  href={`tel:${biz.contact.phonePrimary.replace(/\s/g, "")}`}
                  className="underline underline-offset-4"
                >
                  {biz.contact.phonePrimary}
                </a>
              </dd>
              <dt className="text-[color:var(--color-muted)] uppercase tracking-wider">
                WhatsApp
              </dt>
              <dd>
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4"
                >
                  Mesaj gönder
                </a>
              </dd>
              <dt className="text-[color:var(--color-muted)] uppercase tracking-wider">
                Instagram
              </dt>
              <dd>
                <a
                  href={biz.contact.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4"
                >
                  @maiamari.studio
                </a>
              </dd>
              <dt className="text-[color:var(--color-muted)] uppercase tracking-wider">
                Çalışma
              </dt>
              <dd>Kapanış {biz.hours.closingTime}</dd>
            </dl>
          </section>

          <section>
            <h2 className="font-display text-xl mb-3">Atölye ziyareti</h2>
            <p className="text-sm leading-relaxed text-[color:var(--color-muted)] max-w-prose">
              Atölyemize randevulu ya da randevusuz uğrayabilirsiniz. Atölye,
              Küçükesat&apos;ta Bülbülderesi Caddesi&apos;nde, Kolej metro
              durağına yürüme mesafesindedir.
            </p>
          </section>
        </div>

        <div className="aspect-video lg:aspect-auto lg:min-h-[500px] w-full bg-[color:var(--color-surface-2)]">
          <iframe
            src={biz.googleMapsEmbed}
            className="w-full h-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Maiamari konum"
          />
        </div>
      </div>
    </div>
  );
}
