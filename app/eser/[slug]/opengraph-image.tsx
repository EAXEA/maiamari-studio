import { artworkOGImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-image";
import { getAllArtworks } from "@/lib/data";

export const alt = "MAIAMARI · Eser";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export async function generateStaticParams() {
  return (await getAllArtworks()).map((w) => ({ slug: w.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return artworkOGImage(slug);
}
