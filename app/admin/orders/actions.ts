"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { dbSetOrderStatus } from "@/lib/db/orders";

/** Admin: sipariş durumunu ilerletir (kargo/teslim). Yetki zorunlu. */
export async function setOrderStatus(
  orderId: string,
  status: string,
): Promise<void> {
  await requireAdmin();
  await dbSetOrderStatus(orderId, status);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}
