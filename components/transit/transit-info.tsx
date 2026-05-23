import type { Business } from "@/lib/types";

type Props = {
  transit: Business["transit"];
  size?: "sm" | "md";
};

const MARK =
  "inline-flex items-center justify-center w-5 h-5 text-[10px] font-medium border rounded-full shrink-0 leading-none";

function Mark({ char, label }: { char: string; label: string }) {
  return (
    <span
      className={MARK}
      style={{
        borderColor: "var(--color-walnut-dark)",
        color: "var(--color-walnut-dark)",
      }}
      aria-label={label}
    >
      {char}
    </span>
  );
}

/**
 * Atölyenin ulaşım bilgileri — M ve B daireli minimal mark'lar.
 * "Yakın metro: …" gibi etiket kullanmaz, sembol konuşur.
 */
export function TransitInfo({ transit, size = "md" }: Props) {
  const text = size === "sm" ? "text-xs" : "text-sm";
  const space = size === "sm" ? "space-y-1.5" : "space-y-2";

  return (
    <div className={`${space} ${text} text-[color:var(--color-muted)]`}>
      <p className="flex items-center gap-2 leading-relaxed">
        <Mark char="M" label="Metro" />
        <span>
          {transit.nearestMetro}
          {transit.metroDistance ? ` · ${transit.metroDistance}` : ""}
          {transit.metroWalkMinutes !== undefined
            ? ` · ${transit.metroWalkMinutes} dk`
            : ""}
        </span>
      </p>
      {transit.nearestBusStop && (
        <p className="flex items-center gap-2 leading-relaxed">
          <Mark char="B" label="Otobüs" />
          <span>
            {transit.nearestBusStop}
            {transit.busStopWalkMinutes !== undefined
              ? ` · ${transit.busStopWalkMinutes} dk`
              : ""}
            {transit.busLines && transit.busLines.length > 0
              ? ` · ${transit.busLines.join(", ")}`
              : ""}
          </span>
        </p>
      )}
    </div>
  );
}
