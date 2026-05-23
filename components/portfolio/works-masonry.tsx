import { WorkPlate } from "./work-plate";
import type { PortfolioWork } from "@/lib/types";

type Props = {
  works: PortfolioWork[];
  /** Görsellerin doğal aspect'lerine göre dengeli kolon sayısı */
  columns?: { sm?: number; md?: number; lg?: number };
};

const COLUMN_PRESET = {
  1: "columns-1",
  2: "columns-2",
  3: "columns-3",
  4: "columns-4",
} as const;

function colClass(n?: number, prefix = ""): string {
  if (!n) return "";
  const c = COLUMN_PRESET[n as keyof typeof COLUMN_PRESET];
  if (!c) return "";
  return prefix ? `${prefix}:${c}` : c;
}

/**
 * Eserleri pasapartu kartlarda, CSS columns ile masonry düzeninde sunar.
 * Görseller orijinal aspect oranında kalır; başlık/etiket KULLANMAZ —
 * sanat eseri hissi yalnızca tasarımla (kâğıt zemin + gölge + boşluk)
 * verilir.
 */
export function WorksMasonry({
  works,
  columns = { sm: 1, md: 2, lg: 3 },
}: Props) {
  const cls = [
    colClass(columns.sm),
    colClass(columns.md, "sm"),
    colClass(columns.lg, "lg"),
    "gap-5 sm:gap-7 lg:gap-9",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cls}>
      {works.map((w, i) => (
        <div
          key={w.id}
          className="mb-5 sm:mb-7 lg:mb-9 break-inside-avoid"
        >
          <WorkPlate work={w} priority={i < 2} />
        </div>
      ))}
    </div>
  );
}
