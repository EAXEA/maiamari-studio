"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { dbSetOrderStatus, dbClearOrderAttention } from "@/lib/db/orders";

/**
 * Admin: sipariş durumunu ilerletir (kargo/teslim). Yetki zorunlu.
 *
 * Durumu elle değiştirmek, "ödeme doğrulanamadı" uyarısının ele alındığı
 * anlamına gelir: bayrak da temizlenir, yoksa çözülmüş bir sorun panelde
 * asılı kalırdı.
 */
export async function setOrderStatus(
  orderId: string,
  status: string,
): Promise<void> {
  await requireAdmin();
  await dbSetOrderStatus(orderId, status);
  await dbClearOrderAttention(orderId);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}
