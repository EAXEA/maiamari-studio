import Image from "next/image";
import { getBusiness } from "@/lib/data";

export const metadata = { title: "Hakkımızda" };

export default function AboutPage() {
  const biz = getBusiness();
  return (
    <article className="container-x py-16 lg:py-24">
      <header className="max-w-3xl">
        <p className="text-xs tracking-[0.3em] uppercase text-[color:var(--color-muted)]">
          Hakkımızda
        </p>
        <h1 className="font-display text-4xl lg:text-6xl mt-4 leading-[1.05]">
          Bir atölye, bir galeri, bir kâğıt fabrikası.
        </h1>
      </header>

      <div className="mt-16 grid lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-20 items-start">
        <div className="flex flex-col gap-6">
          <div className="relative aspect-square bg-[color:var(--color-surface)] flex items-center justify-center">
            <Image
              src="/brand/maimari-logo.png"
              alt="Maiamari logo"
              width={260}
              height={260}
              className="opacity-95"
            />
          </div>
          <div className="relative aspect-[4/5] bg-[color:var(--color-surface-2)]">
            <Image
              src="/images/shopier/38261472/img_00.jpeg"
              alt="Atölyeden bir kare — Gold linol boyası"
              fill
              sizes="(max-width: 1024px) 90vw, 40vw"
              className="object-cover"
            />
          </div>
        </div>
        <div className="space-y-6 text-base leading-relaxed max-w-prose">
          <p>
            Maiamari, Ankara&apos;nın Küçükesat semtinde, Bülbülderesi
            Caddesi&apos;nde bulunan bir baskı atölyesi ve galeridir. Atölyenin
            kurucusu <strong>Duygu Sinan</strong>, baskı tekniklerine kendini
            adamış bir sanatçı ve eğitmen olarak; linol baskı, taş baskı, kâğıt
            yapımı ve baskı atölyeleri etrafında küçük ama derinlikli bir
            program yürütüyor.
          </p>
          <p>
            Atölyenin envanteri; özgün linol baskıları, atölyede el yapımı
            üretilen kâğıtları, amber cam kavanozda sunulan baskı boyalarını,
            kauçuk merdaneleri ve oyma aletlerini kapsar. Tüm ürünler aynı
            atölyede üretilir; mağazadan çıkan her parça, bir dökümün, bir
            kalıbın ya da bir elin izini taşır.
          </p>
          <p>
            Düzenli atölye programlarımızla suluboya, çanta baskı ve linol baskı
            tekniklerini paylaşırız. Atölye ziyaretlerine açığız —
            Küçükesat&apos;tan, Kolej metrosundan yürüme mesafesinde
            bulabilirsiniz.
          </p>

          <dl className="mt-12 border-t border-[color:var(--color-border)] pt-8 grid grid-cols-[max-content_1fr] gap-x-10 gap-y-2 text-sm">
            <dt className="text-[color:var(--color-muted)] uppercase tracking-wider">
              Adres
            </dt>
            <dd>{biz.address.full}</dd>
            <dt className="text-[color:var(--color-muted)] uppercase tracking-wider">
              Telefon
            </dt>
            <dd>{biz.contact.phonePrimary}</dd>
            <dt className="text-[color:var(--color-muted)] uppercase tracking-wider">
              Instagram
            </dt>
            <dd>
              <a href={biz.contact.instagram} target="_blank" rel="noreferrer">
                @maiamari.studio
              </a>
            </dd>
          </dl>
        </div>
      </div>
    </article>
  );
}
