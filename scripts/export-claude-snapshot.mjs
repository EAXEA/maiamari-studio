/**
 * MAIAMARI.STUDIO — Kod/içerik → claude.ai Projects snapshot paketi
 * -----------------------------------------------------------------
 * NEDEN: maiamari.art'ın güncel durumunu claude.ai'da bir "Proje" (salt-okunur
 * ayna) olarak görmek için. Geliştirme sohbeti claude.ai'da yapılır; kod/içerik
 * üretimi gerektiğinde claude.ai terminal (Claude Code) için prompt yazar.
 * Bu script tracked kaynağı (görsel/font/lockfile hariç, secret YOK) mantıksal
 * markdown bundle'larına böler + bir tersine mühendislik OVERVIEW üretir.
 *
 * Çalıştırma:
 *   npm run snapshot:claude                       → varsayılan çıktı dizinine
 *   node scripts/export-claude-snapshot.mjs --out "C:/path/to/dir"
 *   SNAPSHOT_OUT="C:/path" npm run snapshot:claude
 *
 * Varsayılan çıktı: <repo>/.claude-snapshot  (gitignore'lu, commit EDİLMEZ)
 * Yalnız git tracked dosyaları okur; diske repo dışında yazar. Secret sızmaz
 * (repoda secret yok; .env* gitignore'da — script yalnız tracked kaynağı alır).
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

// ---- Çıktı dizini (arg > env > varsayılan) ----
const argOut = (() => {
  const i = process.argv.indexOf("--out");
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : null;
})();
const OUT = resolve(argOut || process.env.SNAPSHOT_OUT || join(process.cwd(), ".claude-snapshot"));

const FENCE = "````"; // 4 backtick — dosya içi 3-backtick fence'lerle çakışmaz

const today = new Date().toISOString().slice(0, 10);
const commit = execFileSync("git", ["rev-parse", "--short", "HEAD"]).toString().trim();

// ---- git tracked dosya listesi yardımcıları ----
// execFileSync + arg dizisi: shell yok → pathspec'ler metakarakter olarak
// yorumlanmaz (injection yüzeyi yok).
const lsFiles = (...patterns) =>
  execFileSync("git", ["ls-files", ...patterns])
    .toString()
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

const langFor = (f) => {
  if (f.endsWith(".tsx")) return "tsx";
  if (f.endsWith(".ts")) return "ts";
  if (f.endsWith(".mjs") || f.endsWith(".js")) return "js";
  if (f.endsWith(".json")) return "json";
  if (f.endsWith(".css")) return "css";
  if (f.endsWith(".sql")) return "sql";
  if (f.endsWith(".yml") || f.endsWith(".yaml")) return "yaml";
  if (f.endsWith(".md")) return "markdown";
  return "";
};

const emitBundle = (outfile, title, intro, files) => {
  const parts = [
    `# ${title}`,
    "",
    intro,
    "",
    `_Snapshot: maiamari.art · ${today} · commit ${commit}_`,
    "",
    "---",
    "",
  ];
  for (const f of files) {
    let content;
    try {
      content = readFileSync(f, "utf8");
    } catch {
      continue; // silinmiş/okunamayan dosyayı atla
    }
    parts.push(`## \`${f}\``, "", `${FENCE}${langFor(f)}`, content.replace(/\n$/, ""), FENCE, "");
  }
  const text = parts.join("\n");
  writeFileSync(join(OUT, outfile), text, "utf8");
  console.log(`  ✓ ${outfile} (${text.split("\n").length} satır)`);
};

// ---- Dosya grupları (görsel/font/lockfile hariç) ----
const appAll = lsFiles("app/*", "app/**/*").filter((f) => /\.(tsx|ts)$/.test(f));
const appPublic = appAll.filter((f) => !f.startsWith("app/admin/")).sort();
const appAdmin = appAll.filter((f) => f.startsWith("app/admin/")).sort();
const components = lsFiles("components/**").filter((f) => /\.(tsx|ts)$/.test(f)).sort();
const lib = lsFiles("lib/**").filter((f) => /\.(tsx|ts)$/.test(f)).sort();
const config = lsFiles("*.ts", "*.mjs", "*.json", "vercel.json")
  .filter((f) => !/^(app|components|lib|data|scripts|tests|supabase)\//.test(f))
  .filter((f) => !/package-lock/.test(f))
  .sort();
const scriptsTests = lsFiles("scripts/**", "tests/**", "supabase/**").sort();
const data = lsFiles("data/**/*.json").sort();
const docs = lsFiles("docs/*.md", "README.md", "AGENTS.md", "CLAUDE.md", "public/llms.txt").sort();

// ---- Üret ----
if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
console.log(`claude.ai snapshot üretiliyor → ${OUT}`);

writeOverview();

emitBundle("10-app-public-routes.md", "Public Routes (app/)",
  "Tüm herkese açık sayfa ve API route'ları (ana sayfa, galeri, mağaza, ürün, atölyeler, günce, iletişim, checkout, legal, SEO). Admin hariç.",
  appPublic);
emitBundle("11-app-admin.md", "Admin Panel (app/admin/)",
  "İçerik yönetim paneli: artworks, series, categories, products, journal, workshops, orders, health, auth. Server Actions dahil.",
  appAdmin);
emitBundle("20-components.md", "Components (components/)",
  "Editorial section blokları, portfolio/galeri, ürün, layout (header/footer/mobile-menu), inquiry CTA'ları, brand watermark, search, motion.",
  components);
emitBundle("30-lib.md", "Library / Data Layer (lib/)",
  "Server-only veri getter'ları (lib/data.ts), Drizzle DB katmanı (lib/db/*), yapısal veri (JSON-LD), OG image, ödeme (iyzico), auth, format, contact.",
  lib);
emitBundle("40-config.md", "Config (root)",
  "next.config, tsconfig, tailwind/postcss, eslint, drizzle, playwright, vercel.json, proxy, package.json.",
  config);
emitBundle("41-scripts-tests-sql.md", "Scripts, Tests, SQL",
  "DB seed/migrate/snapshot script'leri, Playwright e2e + unit testleri, Supabase RLS SQL.",
  scriptsTests);
emitBundle("50-content-data.md", "Content Data (data/)",
  "Sitenin içerik kaynağı: business, series, portfolio, products, journal + data/snapshot/* (DB'den export edilmiş güncel içerik).",
  data);
emitBundle("60-project-docs.md", "Project Docs",
  "Reponun kendi dokümanları: README, architecture, content-model, deployment, brand-guidelines, AGENTS, CLAUDE, llms.txt.",
  docs);

console.log(`\nBitti. ${OUT} içindeki .md dosyalarını claude.ai Projesi'nin knowledge'ına yükle.`);
console.log("İlk okunacak: 00-OVERVIEW.md · Custom instructions için §10'a bak.");

// ---- OVERVIEW (tersine mühendislik haritası) ----
function writeOverview() {
  const md = `# maiamari.art — Proje Snapshot (Tersine Mühendislik Haritası)

> **Bu nedir?** maiamari.art'ın **${today} tarihli** kod ve içerik durumunun **salt-okunur bir kopyası**.
> Kaynak repo: \`C:\\Projects\\maiamari-studio\` (GitHub: \`EAXEA/maiamari-studio\`, private) · commit \`${commit}\`.
> Bu paket claude.ai Projects knowledge'ına yüklenmek üzere hazırlandı. **Statik snapshot'tır** — repo geliştikçe bayatlar.

---

## 0. Bu snapshot nasıl kullanılır (claude.ai için çalışma modeli)

Bu Proje bir **aynadır**, bir geliştirme ortamı değil. Kod diskte, terminaldeki Claude Code'da yaşar; burası düşünme/konuşma katmanıdır.

- ✅ **Yap:** Mimariyi anla, sayfa/akışları tersine mühendislikle çöz, "şu nasıl çalışıyor / neyi nerede değiştirmeli" konuş, strateji/SEO/içerik/UX tartış, refactor planla.
- ✍️ **Kod veya içerik üretimi gerektiğinde:** Doğrudan patch yazmak yerine, **terminaldeki Claude Code için net bir prompt üret.** Prompt'ta: hedef dosya yolları, ne değişecek, neden, ve doğrulama adımı olsun. Kullanıcı o prompt'u terminale yapıştırır.
- ⚠️ **Unutma:** Buradaki kod bir **snapshot**; gerçek dosya terminalde farklı olabilir. Kesin konuşmadan önce "terminalde şu dosyanın güncel halini doğrula" de.
- 🔒 Secret yok: Bu pakette API key/token/parola bulunmaz.

**Bayatlama:** Büyük değişikliklerden sonra \`npm run snapshot:claude\` ile yeniden üret ve Projects knowledge'ını güncelle.

---

## 1. Proje bir bakışta

**maiamari.art**, Ankara Çankaya'daki **Maiamari Baskı Atölyesi**'nin resmi sitesi ve sanatçı **Duygu Sinan**'ın işlerinin vitrini. Dört şeyi tek editorial sitede birleştirir: **Galeri** (8 baskı serisi, passe-partout), **Mağaza** (atölye malzemeleri + hediyelik), **Atölyeler** (\`/atolyeler\`), **Günce** (\`/journal\`). Arayüz dili **Türkçe**. Tasarım: krem-beyaz zemin, ceviz vurgu, Cormorant Garamond + Inter. Canlı: **www.maiamari.art** · Hosting **Vercel** (master'a push → otomatik deploy).

## 2. Teknoloji yığını

Next.js **16** (App Router, Turbopack) · React **19** · Tailwind CSS **4** · Framer Motion 12 · Fuse.js (arama) · **Supabase Postgres + Drizzle ORM** · iyzico (HMAC ödeme) · bcrypt admin auth · Playwright + tsx (test) · TypeScript. Paket: \`maiamari-studio@2.0.0\`.

## 3. Sitemap / route haritası

Public (\`app/\`): \`/\` · \`/galeri\` · \`/galeri/[series]\` (8 seri) · \`/galeri/sanatci/[slug]\` · \`/shop\` · \`/shop/[category]\` · \`/urun/[slug]\` · \`/atolyeler\` · \`/journal\` · \`/kagit\` · \`/about\` · \`/contact\` · \`/cart\` + \`/checkout/*\` · \`/legal/{kvkk,gizlilik,iade,mesafeli-satis}\`. API: \`/api/search\`, \`/api/payment/iyzico/callback\`. SEO: \`sitemap.ts\`, \`robots.ts\`, \`feed.xml\`, per-page OG (Satori).
**Admin** (\`app/admin/**\`): login + dashboard + CRUD (artworks, series, categories, products, journal, workshops, orders, health); Server Actions \`app/admin/actions.ts\`.

## 4. Mimari ve veri akışı

> Not: \`README.md\` "no runtime database" diyor ama **eskimiş**. Güncel gerçek (\`docs/architecture.md\`): içerik **Supabase Postgres**'te, \`/admin\`'den yönetilir, Drizzle ile runtime okunur; commit'li JSON build-time/DB-yok fallback. Sipariş yalnız DB.

\`\`\`
Supabase Postgres (kaynak-doğruluk; /admin)
  │  lib/db/*  (Drizzle; build'de veya DATABASE_URL yoksa getDb()→null)
  ▼
lib/data.ts (server-only; fallback: DB → data/snapshot/*.json → legacy data/*.json)
  ▼
app/**/page.tsx (RSC; build JSON'dan prerender, runtime DB-authoritative ISR)
  ▼
components/** (sunum + küçük client island'ları)
\`\`\`

- **Render:** RSC varsayılan; public DB-sayfaları \`revalidate=60\`, \`/atolyeler\`+\`/journal\`+admin+checkout \`force-dynamic\`. Admin mutasyonları \`revalidatePath\` ile anında yansır.
- **Build-time DB skip:** \`lib/db/client.ts\`, \`NEXT_PHASE==="phase-production-build"\` iken \`null\` → statik sayfalar pooler'ı tüketmez.
- **Snapshot fallback:** \`npm run db:snapshot\` DB'yi \`data/snapshot/*.json\`'a export eder (release öncesi; elle düzenlenmez).
- **Server-only sınırı:** \`lib/data.ts\` \`fs\` kullanır → client'e import EDİLMEZ. Client-safe sabitler \`lib/contact.ts\`'te.

**lib:** \`data.ts\` (getter'lar) · \`db/*\` (Drizzle şema/client/CRUD/slug factory) · \`contact.ts\` · \`types.ts\` · \`structured-data.ts\` (JSON-LD) · \`og-image.tsx\` (Satori) · \`payment/iyzico.ts\` · \`admin/auth.ts\` · \`health.ts\`.

## 5. Component haritası (\`components/\`)

- **sections/** — \`production-hero\` (ana hero), \`home-destination-cards\` (Galeri+Mağaza grid; \`fit:cover|contain\` passe-partout/studio ayrımı; prop \`workshop\`/\`shop\` **legacy, semantik değil**), \`feature-banner\`, \`interest-hero\`.
- **portfolio/** \`works-detail-list\` (seri sayfası + lightbox) · **product/** \`product-card\`, \`product-gallery\`, \`product-tutorial-reel\` · **layout/** \`site-header\`, \`site-footer\`, \`mobile-menu\` · **inquiry/** \`phone-cta\` (5 variant, tel:), \`whatsapp-cta\`, \`instagram-inquiry-button\` · **cart/** provider+button+add · **admin/** form/delete component'leri · **brand/** \`watermark\` (tek CSS-var watermark), \`payment-marks\` · **search/motion/instructor/transit/legal/** tek amaçlı.

## 6. Tasarım sistemi

Krem-beyaz zemin + ceviz vurgu. CSS değişkenleri: \`--color-background/foreground/walnut-dark/hairline/surface/muted\` (tanım \`app/globals.css\`). Tipografi: Cormorant Garamond (\`font-display\`) + Inter; uppercase + \`tracking-[0.22em]\`. **Tailwind 4 uyarısı:** \`text-[color:var(--color-x)]\` her yerde parse edilmez → CSS-var renkleri inline \`style\` ile. Galeri işleri kırpılmaz (passe-partout). Detay: \`docs/brand-guidelines.md\`.

## 7. İçerik envanteri (\`data/\`)

\`business.json\` · \`series.json\` · \`portfolio.json\` · \`products_full.json\` (legacy Shopier) · \`journal.json\` · \`instagram.json\` + \`data/snapshot/{artists,categories,journal,portfolio,products,series,workshops}.json\` (DB export — güncel içeriğin en yakın hali). \`data/snapshot/*\`=son DB export; \`data/*.json\`=legacy/son-çare fallback.

## 8. SEO altyapısı

\`sitemap.ts\`+\`robots.ts\` generated · \`lib/structured-data.ts\` JSON-LD (Store/Product/VisualArtwork/CollectionPage/Breadcrumb) · OG Satori per-page (kısıt: WOFF2/variable font yok → \`assets/\` statik TTF; JSX flex) · \`public/llms.txt\`.

## 9. Bu snapshot'taki dosyalar

\`00-OVERVIEW.md\` (bu harita) · \`10-app-public-routes.md\` · \`11-app-admin.md\` · \`20-components.md\` · \`30-lib.md\` · \`40-config.md\` · \`41-scripts-tests-sql.md\` · \`50-content-data.md\` · \`60-project-docs.md\`.

## 10. Öneri: Proje custom instructions

claude.ai Projesi'nin "Custom instructions" alanına:

> Bu proje maiamari.art'ın salt-okunur snapshot'ıdır (Next.js 16 + React 19 + Tailwind 4 + Supabase/Drizzle; canlı: maiamari.art; repo: EAXEA/maiamari-studio, terminalde \`C:\\Projects\\maiamari-studio\`). Kaynak-doğruluk terminaldeki Claude Code'dadır — buradaki kod bir snapshot'tır ve bayatlamış olabilir. Kod veya içerik üretimi gerektiğinde doğrudan patch yazma; bunun yerine terminal (Claude Code) için hedef dosya yolları, yapılacak değişiklik, gerekçe ve doğrulama adımı içeren net bir prompt üret. Türkçe konuş.
`;
  writeFileSync(join(OUT, "00-OVERVIEW.md"), md, "utf8");
  console.log("  ✓ 00-OVERVIEW.md");
}
