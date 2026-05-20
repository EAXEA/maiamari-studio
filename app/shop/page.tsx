import Link from "next/link";
import { getAllProducts, getCategories } from "@/lib/data";
import { ProductCard } from "@/components/product/product-card";

export const metadata = { title: "Mağaza" };

export default function ShopPage() {
  const products = getAllProducts().filter((p) => p.status !== "out_of_stock");
  const cats = getCategories();
  return (
    <div className="container-x py-12 lg:py-16">
      <header className="mb-12">
        <p className="text-xs tracking-[0.3em] uppercase text-[color:var(--color-muted)]">
          Mağaza
        </p>
        <h1 className="font-display text-4xl lg:text-5xl mt-2">
          Tüm ürünler
        </h1>
        <p className="text-sm text-[color:var(--color-muted)] mt-4">
          {products.length} eser ve malzeme
        </p>
      </header>

      <nav className="mb-12 flex flex-wrap gap-x-6 gap-y-3 text-sm border-b border-[color:var(--color-border)] pb-4">
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
