import Image from "next/image";
import type { PortfolioWork } from "@/lib/types";

type Props = {
  work: PortfolioWork;
  priority?: boolean;
  sizes?: string;
  /** Pasapartu kalınlığı — küçük thumbs için "tight", öne çıkan eserde "loose" */
  spacing?: "tight" | "loose";
};

/**
 * Eserin orijinal aspect ratio'sunu kırpmadan, kâğıt zemin + ince
 * pasapartu + yumuşak gölge ile sunan kart. Yazı kullanmaz, "bu bir sanat
 * eseridir" hissini tasarımla taşır.
 *
 * Görselin width/height'ı bilinmiyorsa intrinsic kare varsayılır; bu durumda
 * görsel yine kırpılmaz, sadece konteyner kare olur.
 */
export function WorkPlate({
  work,
  priority,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  spacing = "tight",
}: Props) {
  const w = work.width ?? 1000;
  const h = work.height ?? 1000;
  const pad = spacing === "loose" ? "p-5 sm:p-7 lg:p-9" : "p-3 sm:p-4 lg:p-6";

  return (
    <figure
      className={`group block bg-[color:var(--color-paper,var(--color-surface))] ${pad}
                  shadow-[0_1px_2px_rgba(60,40,28,0.05),0_18px_40px_-22px_rgba(60,40,28,0.20)]
                  ring-1 ring-[color:var(--color-hairline)]
                  transition-shadow duration-500 hover:shadow-[0_2px_3px_rgba(60,40,28,0.06),0_30px_60px_-22px_rgba(60,40,28,0.28)]`}
    >
      {/* iç pasapartu — ince kâğıt çizgisi */}
      <div className="relative ring-[0.5px] ring-[color:var(--color-hairline)] overflow-hidden">
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
      </div>
    </figure>
  );
}
