"use client";

import { useState, useTransition } from "react";
import { reconcileOrderWithIyzico } from "@/app/admin/orders/actions";

/**
 * "iyzico'ya sor" düğmesi. Sonucu yerinde gösterir, çünkü asıl değer
 * cevabın kendisinde: ödeme var mı, yok mu, yoksa soru sorulamadı mı.
 */
export function AskIyzico({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition();
  const [sonuc, setSonuc] = useState<{ ok: boolean; message: string } | null>(
    null,
  );

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setSonuc(null);
            setSonuc(await reconcileOrderWithIyzico(orderId));
          })
        }
        className="h-10 px-4 text-xs tracking-[0.15em] uppercase border border-[color:var(--color-border)] hover:bg-[color:var(--color-surface-2)] disabled:opacity-50"
      >
        {pending ? "Soruluyor..." : "iyzico'ya sor"}
      </button>
      {sonuc && (
        <p
          role="status"
          className="mt-2 text-sm"
          style={{ color: sonuc.ok ? "inherit" : "#8A1C1C" }}
        >
          {sonuc.message}
        </p>
      )}
    </div>
  );
}
