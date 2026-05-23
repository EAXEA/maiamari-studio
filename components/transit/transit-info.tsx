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
 * Yürüyüş süresinin önüne konan minimal "yürüyen adam" sembolü.
 * Heroicons walking pictogram (stroke 1.5). Renk muted/walnut'a uyar.
 */
function WalkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="inline-block -mt-px shrink-0"
    >
      <circle cx="13" cy="4.5" r="1.5" />
      <path d="M11 21l2-6-3-3 1-4 3 2 3 1" />
      <path d="M9 13l1-4" />
      <path d="M13 15l-2 6" />
    </svg>
  );
}

function WalkTime({ minutes }: { minutes: number }) {
  return (
    <span
      className="inline-flex items-center gap-1 align-baseline"
      aria-label={`yürüyerek ${minutes} dakika`}
      title="yürüyerek"
    >
      <WalkIcon />
      <span>{minutes} dk</span>
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
          {transit.metroWalkMinutes !== undefined ? (
            <>
              {" · "}
              <WalkTime minutes={transit.metroWalkMinutes} />
            </>
          ) : null}
        </span>
      </p>
      {transit.nearestBusStop && (
        <p className="flex items-center gap-2 leading-relaxed">
          <Mark char="B" label="Otobüs" />
          <span>
            {transit.nearestBusStop}
            {transit.busStopWalkMinutes !== undefined ? (
              <>
                {" · "}
                <WalkTime minutes={transit.busStopWalkMinutes} />
              </>
            ) : null}
            {transit.busLines && transit.busLines.length > 0
              ? ` · ${transit.busLines.join(", ")}`
              : ""}
          </span>
        </p>
      )}
    </div>
  );
}
