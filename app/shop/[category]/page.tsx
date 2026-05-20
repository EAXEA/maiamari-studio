import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getBusiness,
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
      url: `https://www.maiamari.art/shop/${cat.slug}`,
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
  const biz = getBusiness();
  const whatsapp = biz.contact.whatsapp.replace(/\D/g, "");

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
        <section
          className="border border-[color:var(--color-border)] bg-[color:var(--color-surface)] grid lg:grid-cols-[1fr_1.2fr] gap-10 lg:gap-16 items-center p-10 lg:p-16"
        >
          <div
            className="relative aspect-square w-full max-w-[460px] mx-auto lg:mx-0 overflow-hidden bg-[color:var(--color-surface-2)]"
          >
            <Image
              src="/brand/maimari-mark.png"
              alt=""
              fill
              sizes="(max-width: 1024px) 80vw, 40vw"
              className="object-contain p-12 opacity-95"
            />
            <span className="absolute top-4 left-4 text-[10px] tracking-[0.35em] uppercase bg-[color:var(--color-walnut-dark)] text-[color:var(--color-background)] px-3 py-1.5">
              Yakında
            </span>
          </div>

          <div>
            <p className="eyebrow">Koleksiyon · Yakında</p>
            <h2 className="font-display mt-4 leading-[0.98] text-[clamp(2.5rem,5vw,4.5rem)] tracking-tight">
              <span className="block italic">Yakında.</span>
              <span className="block text-[0.55em] mt-3 tracking-tight">
                {cat.name.toLocaleLowerCase("tr-TR")} için ilk eserler atölyede hazırlanıyor.
              </span>
            </h2>
            <p className="mt-7 max-w-md text-base lg:text-lg leading-relaxed text-[color:var(--color-muted)]">
              Bu koleksiyon için baskılar atölyede tek tek çoğaltılıyor. Yayına
              girer girmez Instagram&apos;da duyuracağız; istersen WhatsApp&apos;tan
              da haber alabilirsin.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href={biz.contact.instagram}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 px-6 items-center text-[12px] tracking-[0.22em] uppercase"
                style={{
                  background: "var(--color-walnut-dark)",
                  color: "var(--color-background)",
                }}
              >
                Instagram&apos;da takip et
              </a>
              <a
                href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(
                  `Merhaba, "${cat.name}" koleksiyonu yayınlandığında haberim olsun.`,
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 px-6 items-center text-[12px] tracking-[0.22em] uppercase border"
                style={{ borderColor: "var(--color-walnut-dark)" }}
              >
                Haberim olsun
              </a>
            </div>

            <p className="eyebrow mt-10">
              Bu arada · Diğer koleksiyonlar
            </p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {allCats
                .filter((c) => c.slug !== cat.slug)
                .slice(0, 5)
                .map((c) => (
                  <Link
                    key={c.slug}
                    href={`/shop/${c.slug}`}
                    className="editorial-link"
                  >
                    {c.name}
                  </Link>
                ))}
            </div>
          </div>
        </section>
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
