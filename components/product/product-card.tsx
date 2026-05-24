"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Product } from "@/lib/types";
import { formatTRY } from "@/lib/format";
import { Watermark } from "@/components/brand/watermark";

const easeOut = [0.22, 1, 0.36, 1] as const;

export function ProductCard({ product }: { product: Product }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: easeOut }}
    >
      <Link
        href={`/urun/${product.slug}`}
        className="group block"
        aria-label={product.title}
      >
        <div
          className="relative aspect-square overflow-hidden"
          style={{ background: "var(--color-surface-2)" }}
        >
          <motion.div
            className="absolute inset-0"
            whileHover={{ scale: 1.06 }}
            transition={{ duration: 0.9, ease: easeOut }}
          >
            <Image
              src={product.coverImage}
              alt={product.title}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              className="object-cover"
            />
          </motion.div>

          {/* Brand watermark — alt sağ, hover'da hafifçe vurgulanır */}
          <Watermark
            position="bottom-right"
            opacity={0.42}
            scale={0.28}
            className="transition-opacity duration-500 group-hover:opacity-60"
          />

          {/* Hover overlay sweep */}
          <div
            className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700"
            style={{
              background:
                "linear-gradient(180deg, transparent 55%, rgba(31,35,40,0.55) 100%)",
            }}
          />
          <div className="absolute inset-x-0 bottom-0 p-4 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700 ease-out pointer-events-none">
            <span className="text-[10px] tracking-[0.35em] uppercase text-white">
              Görüntüle →
            </span>
          </div>

          {/* Status pills */}
          {product.status === "out_of_stock" && (
            <span className="absolute top-3 left-3 text-[10px] uppercase tracking-widest bg-[color:var(--color-foreground)] text-[color:var(--color-background)] px-2 py-1">
              Tükendi
            </span>
          )}
          {product.status === "new" && (
            <span
              className="absolute top-3 left-3 text-[10px] uppercase tracking-widest px-2 py-1"
              style={{
                background: "var(--color-mint)",
                color: "var(--color-walnut-dark)",
              }}
            >
              Yeni
            </span>
          )}
          {product.status === "low_stock" && (
            <span
              className="absolute top-3 left-3 text-[10px] uppercase tracking-widest px-2 py-1"
              style={{
                background: "var(--color-accent-pink)",
                color: "var(--color-walnut-dark)",
              }}
            >
              Son ürün
            </span>
          )}
          {product.status === "sale" && product.compareAtTRY && (
            <span
              className="absolute top-3 left-3 text-[10px] uppercase tracking-widest px-2 py-1"
              style={{
                background: "var(--color-press-red)",
                color: "white",
              }}
            >
              İndirim
            </span>
          )}
        </div>

        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-lg leading-snug group-hover:italic transition-all duration-500">
              {product.title}
            </h3>
          </div>
          <div className="text-right shrink-0">
            {product.compareAtTRY && product.compareAtTRY > product.priceTRY && (
              <span
                className="block text-xs line-through"
                style={{ color: "var(--color-muted)" }}
              >
                {formatTRY(product.compareAtTRY)}
              </span>
            )}
            <span className="text-sm">{formatTRY(product.priceTRY)}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
