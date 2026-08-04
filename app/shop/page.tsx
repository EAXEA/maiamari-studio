import Link from "next/link";
import { getAllProducts, getCategories } from "@/lib/data";
import { ProductCard } from "@/components/product/product-card";

// ISR: panelden eklenen ürün/kategori canlıda ~60sn'de yansısın. Build'de
// getDb()=null → JSON seed fallback üretilir, deploy sonrası taze değil; ISR
// runtime'da DB'den yeniden üretir (atolyeler/journal/galeri ile aynı mimari).
export const revalidate = 60;

export const metadata = {
  title: "Mağaza",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage() {
  const products = (await getAllProducts()).filter(
    (p) => p.status !== "out_of_stock",
  );
  const cats = await getCategories();
  return (
    <div className="container-x py-12 lg:py-16">
      <header className="mb-10">
        <p className="text-xs tracking-[0.3em] uppercase text-[color:var(--color-muted)]">
          Mağaza
        </p>
        <h1 className="font-display text-4xl lg:text-5xl mt-2">
          Tüm ürünler
        </h1>
        <p className="text-sm text-[color:var(--color-muted)] mt-4">
          {products.length} malzeme
        </p>
      </header>

      {/* Galeri ↔ Mağaza ayrım metni — koleksiyoner ile malzeme arayan
          ziyaretçilerin kafasını karıştırmamak için kısa editorial blok. */}
      <section className="mb-12 border-y border-[color:var(--color-hairline)] py-7 lg:py-9 grid lg:grid-cols-[1fr_1.4fr] gap-6 lg:gap-12">
        <p className="text-[11px] tracking-[0.3em] uppercase text-[color:var(--color-muted)]">
          Galeri &amp; Mağaza
        </p>
        <div className="text-sm lg:text-base leading-relaxed max-w-prose">
          <p>
            <strong className="font-normal italic">Galeri</strong>de atölye
            sanatçılarının özgün baskı eserleri yer alır.{" "}
            <strong className="font-normal italic">Mağaza</strong>daki
            boyalar, merdaneler, linol plakalar, el yapımı kâğıtlar ve oyma
            aletleri ise{" "}
            <em className="not-italic underline decoration-dotted underline-offset-4">
              bu eserleri üretirken birebir kullanılan malzemelerdir
            </em>
            . Atölyenin günlük baskı pratiğinde sınanmış, çalıştığı
            kanıtlanmış seçimler. Yanlarında, atölyede elden dikilen
            hediyelik kitap çantaları da bulunur.
          </p>
          <p className="mt-3">
            <Link href="/galeri" className="editorial-link">
              Galeriyi gör →
            </Link>
          </p>
        </div>
      </section>

      <nav className="mb-12 flex flex-wrap gap-x-6 gap-y-3 text-sm border-b border-[color:var(--color-border)] pb-4 [&_a]:py-1.5">
        <Link href="/shop" className="font-medium underline underline-offset-4">
          Tümü
        </Link>
        {cats.map((c) => (
          <Link
            key={c.slug}
            href={`/shop/${c.slug}`}
            className="text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
          >
            {c.name}
          </Link>
        ))}
      </nav>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
