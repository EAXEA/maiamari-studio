/** Sipariş durumu etiketleri, rozet tonları ve ileri geçişler (client-safe). */

export type OrderTone = "neutral" | "good" | "warn" | "bad";

export const ORDER_STATUS: Record<
  string,
  { label: string; tone: OrderTone }
> = {
  pending: { label: "Ödeme bekliyor", tone: "neutral" },
  paid: { label: "Ödendi", tone: "good" },
  shipped: { label: "Kargolandı", tone: "warn" },
  delivered: { label: "Teslim edildi", tone: "good" },
  failed: { label: "Başarısız", tone: "bad" },
  cancelled: { label: "İptal edildi", tone: "bad" },
};

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS[status]?.label ?? status;
}

export function orderBadgeStyle(status: string): {
  background: string;
  color: string;
} {
  const tone = ORDER_STATUS[status]?.tone ?? "neutral";
  switch (tone) {
    case "good":
      return { background: "var(--color-mint)", color: "var(--color-walnut-dark)" };
    case "warn":
      return {
        background: "var(--color-accent-pink)",
        color: "var(--color-walnut-dark)",
      };
    case "bad":
      return { background: "var(--color-press-red)", color: "#fff" };
    default:
      return {
        background: "var(--color-surface-2)",
        color: "var(--color-muted)",
      };
  }
}

/** Admin'in ilerletebileceği bir sonraki kargo/teslim adımı (varsa). */
export function nextFulfillmentStatus(
  status: string,
): { to: string; label: string } | null {
  if (status === "paid") return { to: "shipped", label: "Kargolandı olarak işaretle" };
  if (status === "shipped")
    return { to: "delivered", label: "Teslim edildi olarak işaretle" };
  return null;
}

/**
 * Sipariş arşivlik mi (tamamlanmış/sonlanmış): teslim edildi, iptal veya
 * başarısız. Aktif siparişler (ödeme bekliyor / ödendi / kargolandı) işlem ister.
 */
export const ARCHIVED_STATUSES = ["delivered", "cancelled", "failed"] as const;

export function isArchivedStatus(status: string): boolean {
  return (ARCHIVED_STATUSES as readonly string[]).includes(status);
}
