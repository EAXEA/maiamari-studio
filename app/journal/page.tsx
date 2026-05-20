export const metadata = { title: "Günce" };

export default function JournalPage() {
  return (
    <div className="container-x py-24 lg:py-32 text-center max-w-xl mx-auto">
      <p className="text-xs tracking-[0.3em] uppercase text-[color:var(--color-muted)]">
        Günce
      </p>
      <h1 className="font-display text-4xl lg:text-5xl mt-4">
        Yakında yayında.
      </h1>
      <p className="text-base text-[color:var(--color-muted)] mt-6 leading-relaxed">
        Atölyeden notlar, baskı süreçleri ve yaklaşan etkinlikler kısa süre
        içinde burada.
      </p>
    </div>
  );
}
