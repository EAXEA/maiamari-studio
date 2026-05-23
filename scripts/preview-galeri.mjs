/* Playwright önizleme: /galeri, /galeri/kapilar, /galeri/maskeler */
import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", ".previews");
const BASE = process.env.BASE_URL || "http://localhost:3000";

const PAGES = [
  { name: "galeri-landing", url: `${BASE}/galeri` },
  { name: "galeri-kapilar", url: `${BASE}/galeri/kapilar` },
  { name: "galeri-maskeler", url: `${BASE}/galeri/maskeler` },
];

const HEADED = !process.argv.includes("--headless");
const KEEP = process.argv.includes("--keep");

const browser = await chromium.launch({ headless: !HEADED });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });

const fs = await import("node:fs/promises");
await fs.mkdir(OUT, { recursive: true });

for (const p of PAGES) {
  const page = await ctx.newPage();
  await page.goto(p.url, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForTimeout(700);
  const file = path.join(OUT, `${p.name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`  saved ${path.relative(process.cwd(), file)}`);
  if (!KEEP) await page.close();
}

if (KEEP) {
  console.log("\nTarayıcı açık bırakıldı. Pencereyi kapatarak çıkın.");
  await new Promise(() => {}); // keep alive
} else {
  await browser.close();
}
