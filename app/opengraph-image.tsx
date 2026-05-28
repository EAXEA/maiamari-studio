import { defaultOGImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-image";

export const alt = "MAIAMARI · Baskı Atölyesi ve Galeri · Ankara";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return defaultOGImage();
}
