import { productOGImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-image";
import { getAllProducts } from "@/lib/data";

export const alt = "MAIAMARI · Ürün";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export async function generateStaticParams() {
  return getAllProducts().map((p) => ({ slug: p.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return productOGImage(slug);
}
