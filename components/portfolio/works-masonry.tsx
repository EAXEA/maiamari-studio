import { WorkCard } from "./work-card";
import type { PortfolioWork } from "@/lib/types";

type Props = {
  works: PortfolioWork[];
  seriesName: string;
  inquiryPath: string;
};

/**
 * Eserleri "öne çıkan eser" tarzında, foto + metadata içeren kartlarla
 * 2-kolon (lg+ 3) grid'de sunar. Her kartın genişliği grid kolonuna
 * bağlı; böylece foto rastgele büyük görünmez ve her eser kendi
 * sunumuyla yer alır.
 */
export function WorksMasonry({ works, seriesName, inquiryPath }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-9">
      {works.map((w, i) => (
        <WorkCard
          key={w.id}
          work={w}
          seriesName={seriesName}
          inquiryPath={inquiryPath}
          priority={i < 2}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      ))}
    </div>
  );
}
