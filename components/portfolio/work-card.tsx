import Image from "next/image";
import type { PortfolioWork } from "@/lib/types";
import { InstagramInquiryButton } from "@/components/inquiry/instagram-inquiry-button";
import { PhoneCTA } from "@/components/inquiry/phone-cta";
import { Watermark } from "@/components/brand/watermark";

type Props = {
  work: PortfolioWork;
  /** "Kapılar" / "Lord of … Maskeler" — seri display adı */
  seriesName: string;
  /** Hangi galeri yolundan açıldı (IG mesajı için): "/galeri/kapilar" */
  inquiryPath: string;
  /** Foto orijinal aspect'inde, hangi sizes değeri verilsin */
  sizes?: string;
  priority?: boolean;
};

/**
 * Her eserin kendi kartı — "öne çıkan eser" mantığında ama daha küçük.
 * Foto pasapartu zeminde orijinal aspect; alt blokta metadata (Sanatçı/
 * Yıl/Edisyon) + inline "Bilgi al" linkleri. Boyut kart genişliğiyle
 * sınırlandığı için web sürümünde rastgele büyük görünmez.
 */
export function WorkCard({
  work,
  seriesName,
  inquiryPath,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  priority,
}: Props) {
  const w = work.width ?? 1200;
  const h = work.height ?? 1200;

  return (
    <article
      className="group flex flex-col bg-[color:var(--color-paper,var(--color-surface))]
                 ring-1 ring-[color:var(--color-hairline)]
                 shadow-[0_1px_2px_rgba(60,40,28,0.05),0_18px_40px_-22px_rgba(60,40,28,0.20)]
                 hover:shadow-[0_2px_3px_rgba(60,40,28,0.06),0_28px_56px_-22px_rgba(60,40,28,0.28)]
                 transition-shadow duration-500"
    >
      {/* Pasapartu foto */}
      <div className="p-4 sm:p-5 lg:p-7 pb-3 sm:pb-4 lg:pb-5">
        <div className="relative ring-[0.5px] ring-[color:var(--color-hairline)] overflow-hidden bg-[color:var(--color-surface-2)]">
          <Image
            src={work.image}
            alt={work.title}
            width={w}
            height={h}
            priority={priority}
            sizes={sizes}
            className="block w-full h-auto select-none"
            draggable={false}
          />
          {/* Eser sahipliği — hafif watermark, eser fotoğrafını boğmasın */}
          <Watermark
            position="bottom-right"
            opacity={0.32}
            scale={0.22}
          />
        </div>
      </div>

      {/* Künye + CTA */}
      <div className="px-5 sm:px-6 lg:px-8 pb-6 lg:pb-8 border-t border-dashed border-[color:var(--color-hairline)] pt-5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-lg lg:text-xl leading-snug italic">
            {work.title}
          </h3>
          {work.year && (
            <span className="text-[10px] tracking-[0.28em] uppercase text-[color:var(--color-muted)] tabular-nums">
              {work.year}
            </span>
          )}
        </div>
        <dl className="mt-3 grid grid-cols-[max-content_1fr] gap-x-5 gap-y-1 text-xs">
          <dt className="text-[color:var(--color-muted)] uppercase tracking-[0.18em]">
            Sanatçı
          </dt>
          <dd>Duygu Sinan</dd>
          <dt className="text-[color:var(--color-muted)] uppercase tracking-[0.18em]">
            Seri
          </dt>
          <dd>{seriesName}</dd>
          <dt className="text-[color:var(--color-muted)] uppercase tracking-[0.18em]">
            Edisyon
          </dt>
          <dd className="text-[color:var(--color-muted)]">Sayılı · DM</dd>
        </dl>

        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[11px] tracking-[0.18em] uppercase">
          <PhoneCTA
            variant="bare"
            label="Telefonla bilgi al →"
            className="editorial-link"
          />
          <InstagramInquiryButton
            title={work.title}
            path={inquiryPath}
            label="Instagram →"
            className="editorial-link"
          />
        </div>
      </div>
    </article>
  );
}
