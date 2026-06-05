import { seriesOGImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-image";
import { getSeries } from "@/lib/data";

export const alt = "MAIAMARI · Galeri serisi";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export async function generateStaticParams() {
  return (await getSeries()).map((s) => ({ series: s.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ series: string }>;
}) {
  const { series } = await params;
  return seriesOGImage(series);
}
