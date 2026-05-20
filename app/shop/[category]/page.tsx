import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCategoryBySlug,
  getCategories,
  getProductsByCategory,
} from "@/lib/data";
import type { CategorySlug } from "@/lib/types";
import { ProductCard } from "@/components/product/product-card";

export async function generateStaticParams() {
  return getCategories().map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const cat = getCategoryBySlug(category);
  if (!cat) return {};
  return {
    title: cat.name,
    description: cat.description,
    alternates: { canonical: `/shop/${cat.slug}` },
    openGraph: {
      title: `${cat.name} · MAIAMARI`,
      description: cat.description,
      url: `https://maimari.art/shop/${cat.slug}`,
      type: "website",
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const cat = getCategoryBySlug(category);
  if (!cat) notFound();
  const products = getProductsByCategory(category as CategorySlug);
  const allCats = getCategories();

  return (
    <div className="container-x py-12 lg:py-16">
      <header className="mb-12">
        <p className="text-xs tracking-[0.3em] uppercase text-[color:var(--color-muted)]">
          {cat.nameEn}
        </p>
        <h1 className="font-display text-4xl lg:text-5xl mt-2">{cat.name}</h1>
        <p className="text-base text-[color:var(--color-muted)] mt-4 max-w-prose">
          {cat.description}
        </p>
      </header>

      <nav className="mb-12 flex flex-wrap gap-x-6 gap-y-3 text-sm border-b border-[color:var(--color-border)] pb-4">
        <Link href="/shop" className="text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]">
          Tümü
        </Link>
        {allCats.map((c) => (
          <Link
            key={c.slug}
            href={`/shop/${c.slug}`}
            className={
              c.slug === cat.slug
                ? "font-medium underline underline-offset-4"
                : "text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
            }
          >
            {c.name}
          </Link>
        ))}
      </nav>

      {products.length === 0 ? (
        <p className="text-[color:var(--color-muted)] py-12">
          Bu koleksiyonda şimdilik ürün yok.
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
