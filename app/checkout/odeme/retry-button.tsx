"use client";

/**
 * "Tekrar dene" butonu — ödeme sayfası açılamadığında gösterilir.
 *
 * Neden client component: eskiden bu bir <Link> idi ve AYNI adrese işaret
 * ediyordu. Next'in istemci yönlendiricisi aynı rotaya tıklamayı yok
 * sayabildiği için buton çoğu zaman hiçbir şey yapmıyordu. `router.refresh()`
 * sunucu bileşenini yeniden çalıştırır, yani iyzico initialize gerçekten
 * tekrar denenir; başarılı olursa sunucu tarafındaki yönlendirme devreye
 * girer ve alıcı ödeme sayfasına gider.
 *
 * İkinci sebep: istek artık kopan bağlantıyı üç kez deniyor, bu birkaç saniye
 * sürebiliyor. Buton basılı kalıp hiçbir şey olmuyormuş gibi görünmesin diye
 * bekleme boyunca pasifleşir ve ne olduğunu söyler.
 */
import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function RetryPaymentButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      aria-busy={pending}
      onClick={() => startTransition(() => router.refresh())}
      className="inline-flex h-11 px-6 items-center text-xs tracking-[0.2em] uppercase hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
      style={{
        background: "var(--color-walnut-dark)",
        color: "var(--color-background)",
      }}
    >
      {pending ? "Deneniyor…" : "Tekrar dene"}
    </button>
  );
}
