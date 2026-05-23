import Image from "next/image";
import Link from "next/link";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";

export const metadata = {
  title: "El Yapımı Kâğıt · Hikaye",
  description:
    "Atölyenin altındaki kâğıt fabrikası — Maiamari'de el yapımı kâğıdın 12 adımlık üretim süreci. Altındağ Belediyesi Kültür & Sanatevi için Duygu Sinan tarafından hazırlanan görsel kılavuz.",
};

const STEPS = [
  { src: "/images/journal/kagit-kilavuzu/adim-01-02.jpg", label: "1 · 2 — Parçalama, suda bekletme" },
  { src: "/images/journal/kagit-kilavuzu/adim-03-04.jpg", label: "3 · 4 — Blender, tekneye" },
  { src: "/images/journal/kagit-kilavuzu/adim-05-06.jpg", label: "5 · 6 — Eleğe alma, suyu süzme" },
  { src: "/images/journal/kagit-kilavuzu/adim-07-08.jpg", label: "7 · 8 — Beze indirme, su alma" },
  { src: "/images/journal/kagit-kilavuzu/adim-09-10.jpg", label: "9 · 10 — Beze yapışma, asarak kurutma" },
  { src: "/images/journal/kagit-kilavuzu/adim-11-12.jpg", label: "11 · 12 — Bezden ayırma, pres" },
];

export default function KagitPage() {
  return (
    <article>
      {/* Header */}
      <section className="container-x pt-16 lg:pt-24">
        <Reveal>
          <p className="text-xs tracking-[0.3em] uppercase text-[color:var(--color-muted)]">
            Hikaye · Kâğıt
          </p>
          <h1 className="font-display mt-5 leading-[0.98] max-w-4xl tracking-tight">
            <span className="block text-[clamp(2.2rem,4.5vw,4rem)]">
              Atölyenin altındaki
            </span>
            <span className="block italic text-[clamp(2.8rem,6vw,5.5rem)]">
              kâğıt fabrikası.
            </span>
          </h1>
          <p className="mt-8 max-w-2xl text-base lg:text-lg leading-relaxed text-[color:var(--color-muted)]">
            Pamuk, keten ve dut liflerini suya çözüyoruz. Sonra elekten
            geçirip baskıya hazır kâğıdı tek tek döküyoruz. Atölyemizdeki
            sürecin görsel kılavuzu — 12 adım.
          </p>
        </Reveal>
      </section>

      {/* Önsöz: kitapçık metni + kapak görseli */}
      <section className="container-x py-20 lg:py-28">
        <Reveal>
          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-12 lg:gap-20 items-start max-w-6xl mx-auto">
            <div className="space-y-5 text-base lg:text-[17px] leading-relaxed">
              <p>
                Bugünkü bildiğimiz haline gelene kadar kâğıdın uzun bir
                serüveni var. 2. yüzyılda Çinliler tarafından kenevir
                lifleri ve dut kabuğunun suda karıştırılarak hamur haline
                getirilmesiyle icat edilen kâğıdın yapımı uzun bir
                süreçti.
              </p>
              <p>
                Günümüzde kâğıt gereksiniminin büyük çoğunluğu
                fabrikalarda üretilen kâğıtlardan karşılanıyor. Ticari
                kâğıt üretimi, su kütlelerimizi kirleten sert kimyasallar
                ve büyük miktarlarda su kullanır. Üretilen kâğıtların
                büyük çoğunluğunu gazete, kâğıt havlu ve tek kullanımlık
                ambalajlar oluşturmaktadır.
              </p>
              <p>
                Kısıtlı kaynaklarımızın bilinçli kullanımı için biz de
                mümkün olduğu kadar tek kullanımlık kâğıt ürünlerden
                kaçınmalı, kullandığımız ürünleri geri dönüşüme
                sokmalıyız. <em>Maiamari'de el yapımı kâğıt üretimi de
                bu anlayışla yapılır — atık kâğıtları yeniden işliyoruz.</em>
              </p>
            </div>
            <div className="relative aspect-[3/4] bg-[color:var(--color-surface-2)] overflow-hidden border border-[color:var(--color-hairline)]">
              <Image
                src="/images/journal/kagit-kilavuzu/kapak.jpg"
                alt="El Yapımı Kâğıt kılavuzu — kapak. Sanatçı Duygu Sinan tarafından hazırlanmıştır."
                fill
                sizes="(max-width: 1024px) 90vw, 35vw"
                className="object-cover"
              />
            </div>
          </div>
        </Reveal>
      </section>

      {/* 12 Adım — illüstrasyonlar grid */}
      <section
        className="border-t border-[color:var(--color-hairline)]"
        style={{ background: "var(--color-surface)" }}
      >
        <div className="container-x py-20 lg:py-24">
          <Reveal>
            <div className="max-w-3xl">
              <p className="text-xs tracking-[0.3em] uppercase text-[color:var(--color-muted)]">
                Süreç
              </p>
              <h2
                className="font-display italic mt-5 text-3xl lg:text-5xl leading-tight tracking-tight"
                style={{ color: "var(--color-walnut-dark)" }}
              >
                On iki adım, bir kâğıt.
              </h2>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-[color:var(--color-muted)]">
                Sanatçı Duygu Sinan'ın hazırladığı görsel kılavuzdan;
                atölyemizdeki üretim sürecinin altı sayfası.
              </p>
            </div>
          </Reveal>

          <Stagger
            className="mt-14 lg:mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-7"
            staggerChildren={0.08}
          >
            {STEPS.map((s) => (
              <StaggerItem key={s.src}>
                <figure>
                  <div className="relative aspect-[3/4] bg-[color:var(--color-background)] overflow-hidden border border-[color:var(--color-hairline)]">
                    <Image
                      src={s.src}
                      alt={s.label}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 30vw"
                      className="object-contain"
                    />
                  </div>
                  <figcaption className="mt-3 text-xs tracking-[0.2em] uppercase text-[color:var(--color-muted)]">
                    {s.label}
                  </figcaption>
                </figure>
              </StaggerItem>
            ))}
          </Stagger>

          <Reveal delay={0.2}>
            <p className="mt-12 text-xs tracking-[0.25em] uppercase text-[color:var(--color-muted)] text-center">
              Görseller ve kılavuz — Sanatçı Duygu Sinan
            </p>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="container-x py-20 lg:py-24 text-center max-w-2xl mx-auto">
        <Reveal>
          <p className="text-xs tracking-[0.3em] uppercase text-[color:var(--color-muted)]">
            Atölyede
          </p>
          <h2
            className="font-display italic mt-5 text-3xl lg:text-4xl leading-snug"
            style={{ color: "var(--color-walnut-dark)" }}
          >
            Kendi kâğıdınızı dökün.
          </h2>
          <p className="mt-6 text-base text-[color:var(--color-muted)] leading-relaxed">
            El yapımı kâğıt workshop'umuz Maiamari atölyesinde küçük
            gruplarla yapılır.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link
              href="/atolyeler"
              className="inline-flex h-11 px-6 items-center text-[12px] tracking-[0.22em] uppercase"
              style={{
                background: "var(--color-walnut-dark)",
                color: "var(--color-background)",
              }}
            >
              Atölye programı
            </Link>
            <Link
              href="/shop/el-yapimi-kagitlar"
              className="inline-flex h-11 px-6 items-center text-[12px] tracking-[0.22em] uppercase border"
              style={{ borderColor: "var(--color-walnut-dark)" }}
            >
              El yapımı kâğıtlar
            </Link>
          </div>
        </Reveal>
      </section>
    </article>
  );
}
