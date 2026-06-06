import Image from "next/image";
import { getBusiness } from "@/lib/data";
import { WhatsappCTA } from "@/components/inquiry/whatsapp-cta";
import { PhoneCTA } from "@/components/inquiry/phone-cta";
import { TransitInfo } from "@/components/transit/transit-info";

export const metadata = { title: "İletişim" };

export default function ContactPage() {
  const biz = getBusiness();

  return (
    <div>
      {/* Storefront banner — atölyenin sokağa açılan yüzü, doğal renk (filtresiz).
          Mobil 4/3 (storefront foto crop'u dürüst), tablet 16/9, desktop 21/9. */}
      <section className="relative w-full aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/9] max-h-[520px] overflow-hidden bg-[color:var(--color-surface-2)]">
        <Image
          src="/images/atolye/storefront-day-level.jpg"
          alt="Maiamari atölyesi — sokağa açılan vitrin ve tabela"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(120% 80% at 50% 10%, transparent 40%, rgba(0,0,0,0.18) 100%)",
          }}
        />
        <figcaption className="absolute bottom-4 lg:bottom-6 left-6 lg:left-10 text-[10px] tracking-[0.32em] uppercase text-white drop-shadow-md">
          Bülbülderesi Cd. · Küçükesat
        </figcaption>
      </section>

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
            </address>
            <div className="mt-4">
              <TransitInfo transit={biz.transit} />
            </div>
          </section>

          <section>
            <h2 className="font-display text-xl mb-3">İletişim</h2>
            <dl className="grid grid-cols-[max-content_1fr] gap-x-8 gap-y-3 text-sm">
              <dt className="text-[color:var(--color-muted)] uppercase tracking-wider">
                Telefon
              </dt>
              <dd>
                <a
                  href={`tel:${biz.contact.phonePrimary.replace(/\s/g, "")}`}
                  className="inline-flex h-10 px-4 items-center justify-center text-[12px] tracking-[0.18em] uppercase w-fit"
                  style={{
                    background: "var(--color-walnut-dark)",
                    color: "var(--color-background)",
                  }}
                  aria-label={`Atölyeyi telefonla ara: ${biz.contact.phonePrimary}`}
                >
                  {biz.contact.phonePrimary}
                </a>
              </dd>
              <dt className="text-[color:var(--color-muted)] uppercase tracking-wider">
                WhatsApp
              </dt>
              <dd>
                <WhatsappCTA variant="inline" context="atölye randevusu" path="/contact" />
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
              {biz.contact.email && (
                <>
                  <dt className="text-[color:var(--color-muted)] uppercase tracking-wider">
                    E-posta
                  </dt>
                  <dd>
                    <a
                      href={`mailto:${biz.contact.email}`}
                      className="underline underline-offset-4"
                    >
                      {biz.contact.email}
                    </a>
                  </dd>
                </>
              )}
            </dl>
          </section>

          <section>
            <h2 className="font-display text-xl mb-3">Atölye ziyareti · randevu</h2>
            <p className="text-sm leading-relaxed text-[color:var(--color-muted)] max-w-prose">
              Atölyemizi ziyaret etmeden önce telefonla kısa bir randevu
              almanızı rica ediyoruz. Böylece sizi bekliyor olur,
              ilgilendiğiniz baskı, malzeme ya da atölye programı için yeterli
              zaman ayırırız. Randevular en geç bir gün öncesinden alınır.
            </p>
            <ul className="mt-5 space-y-1.5 text-sm text-[color:var(--color-muted)] max-w-prose">
              <li>· Eser, edisyon ve fiyat bilgisi</li>
              <li>· Atölye programı ve aylık ders rezervasyonu</li>
              <li>· Malzeme ve sipariş için ön görüşme</li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <PhoneCTA variant="button" label="Telefon · Randevu al" />
              <WhatsappCTA variant="button" context="atölye randevusu" path="/contact" />
            </div>
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
    </div>
  );
}
