import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://maimari.art"),
  title: {
    default: "MAIMARI · Baskı Atölyesi ve Galeri",
    template: "%s · MAIMARI",
  },
  description:
    "Ankara Çankaya'da bir baskı atölyesi ve galeri. Özgün linol baskılar, el yapımı kâğıtlar, baskı malzemeleri ve atölye programları.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "MAIMARI · Baskı Atölyesi ve Galeri",
    description:
      "Ankara'da çağdaş bir baskı atölyesi ve galeri. Atölyeden galeriye, sanatın elle dokunulmuş hali.",
    url: "https://maimari.art",
    siteName: "Maiamari Baskı Atölyesi",
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MAIMARI · Baskı Atölyesi ve Galeri",
    description:
      "Ankara'da çağdaş bir baskı atölyesi ve galeri.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="tr"
      className={`${inter.variable} ${display.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
