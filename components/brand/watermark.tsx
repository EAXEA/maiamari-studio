import { cn } from "@/lib/utils";

type Position = "center" | "bottom-right" | "bottom-left" | "tile";
type Blend = "normal" | "multiply" | "screen" | "overlay" | "soft-light";

type WatermarkProps = {
  /** Görselin neresinde dursun */
  position?: Position;
  /** 0-1 arası opacity */
  opacity?: number;
  /** Görsele oranı, 0-1. Tile modunda yoksayılır. */
  scale?: number;
  /** Tile modunda her motifin px boyutu */
  tileSize?: number;
  /** Blend mode — koyu görsellerde "screen", açıkta "multiply" */
  blend?: Blend;
  className?: string;
};

const POSITION_BG: Record<Exclude<Position, "tile">, string> = {
  center: "bg-center",
  "bottom-right": "bg-[right_6%_bottom_6%]",
  "bottom-left": "bg-[left_6%_bottom_6%]",
};

/**
 * Watermark katmanı. Parent'ın `position: relative` olması beklenir.
 *
 * Performans notları:
 * - `background-image` üzerinden çalışır → tek dosya, tarayıcı tek seferlik
 *   decode + tüm instance'lar GPU cache'den paylaşır.
 * - `pointer-events: none` ve `aria-hidden` ile semantik+interaktif gürültü yok.
 * - `contain: paint` ile boyama scope'u izole, scroll perf korunur.
 * - `mix-blend-mode` mobil GPU'larda pahalı; default "normal" bırakıldı.
 */
export function Watermark({
  position = "bottom-right",
  opacity = 0.42,
  scale = 0.3,
  tileSize = 120,
  blend = "normal",
  className,
}: WatermarkProps) {
  const isTile = position === "tile";
  const sizeStyle: React.CSSProperties = isTile
    ? { backgroundSize: `${tileSize}px ${tileSize}px` }
    : { backgroundSize: `${scale * 100}% auto` };
  const posClass = isTile ? "bg-repeat" : POSITION_BG[position];

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 bg-no-repeat watermark-layer",
        posClass,
        className,
      )}
      style={{
        backgroundImage: "var(--watermark-url)",
        backgroundBlendMode: blend,
        opacity,
        ...sizeStyle,
      }}
    />
  );
}

/**
 * Görsel + watermark'ı tek wrapper'da rendere eden kısa form.
 * `relative` otomatik eklenir; tüketici sadece `<Image>` veriyor.
 */
export function Watermarked({
  children,
  className,
  ...wm
}: { children: React.ReactNode; className?: string } & WatermarkProps) {
  return (
    <div className={cn("relative", className)}>
      {children}
      <Watermark {...wm} />
    </div>
  );
}
