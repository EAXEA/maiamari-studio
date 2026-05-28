@AGENTS.md

# Architecture

Next.js 16 App Router + React 19 + Tailwind 4 + Framer Motion. Site: krema-beyaz editorial, Cormorant Garamond + Inter, walnut accent. Dil: TR.

## Data flow
- `data/*.json` = source of truth (business, portfolio, series, journal, products_full/list). Sanat eseri/seri verisi için Masaüstü\duygu arşiv\ kanonik; site bunu sync eder ([[feedback_duygu_arsiv_source_of_truth]]).
- `lib/data.ts` = **server-only** (fs okur). Client component'lerden import edilemez — client-safe sabitler için `lib/contact.ts`.
- `lib/structured-data.ts` = JSON-LD schemas (Store, Product, VisualArtwork, CollectionPage, Breadcrumb).
- `lib/og-image.tsx` = Satori per-page OG image. WOFF2/variable font ❌, JSX flex zorunlu ([[reference_satori_og_image]]).

## Component selection
- `components/sections/` = sayfa-level editorial blocks. Hero için tek odaklı statik **ProductionHero** (full-bleed dark, üretim izi merkezli).
- `HomeDestinationCards` = anasayfa 2-kart grid (Galeri + Mağaza). Prop adları (`workshop/shop`) legacy; semantic değil, generic `Destination` tipiyle çalışır. `fit: "cover" | "contain"` ile pasapartu galeri eseri / cover atölye fotosu ayrımı.
- `FeatureBanner` = hikaye banner (kâğıt fabrikası, atölyede baskı). `align` + `tone="dark"` props.
- `WorksDetailList` (portfolio) = galeri seri sayfası eser kartı + lightbox.
- `PhoneCTA` (5 variant: button/outline/inline/link/bare), `WhatsappCTA`, `InstagramInquiryButton` = iletişim CTA'ları.

## Brand & UX kuralları
- **Em-dash (—) ve "+" yasak** metinlerde; nokta + ayrı cümle ([[feedback_maiamari_dash_style]]).
- **"Sanatçı Duygu Sinan" prefix yok**; sadece "Duygu Sinan" ([[feedback_duygu_sinan_yazim]]).
- **Galeri eseri her yerde pasapartu** + `object-contain` (kırpılmaz). Atölye fotoları `object-cover` atmosferik.
- **Tailwind 4 arbitrary color bug**: `text-[color:var(--color-X)]` parse edilmiyor → `style={{ color: "var(--color-X)" }}` ([[feedback_tailwind4_arbitrary_color]]).
- **Showroom/drone/dış cephe/poz veren insanlar yasak**; "üretim izi" merkezli görsel dil.
- **Push açık onay ister** ([[feedback_no_push_without_consent]]). Her master push'u `vX.Y` semver tag'iyle origin'e ([[feedback_push_version_tags]]).

## Stack quirks
- `data/` `web/data/` altında (Vercel uyumlu).
- Brand kit kaynak: `OneDrive\Masaüstü\Maiamari brand kit\{source,web}\`.
- Workshop fotoları `lib/workshop-images.ts` shared.
- Watermark: `components/brand/watermark.tsx` + `--watermark-url` CSS var (tek HTTP/decode/GPU texture).
