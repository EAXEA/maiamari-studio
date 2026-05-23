/* Playwright — mobil + desktop önizleme + screenshot */
import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", ".previews");
const BASE = process.env.BASE_URL || "http://localhost:3000";

const PAGES = [
  { name: "anasayfa", url: `${BASE}/` },
  { name: "galeri", url: `${BASE}/galeri` },
  { name: "galeri-kapilar", url: `${BASE}/galeri/kapilar` },
  { name: "galeri-maskeler", url: `${BASE}/galeri/maskeler` },
  { name: "atolyeler", url: `${BASE}/atolyeler` },
  { name: "journal", url: `${BASE}/journal` },
  { name: "contact", url: `${BASE}/contact` },
];

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

const HEADED = !process.argv.includes("--headless");
const KEEP = process.argv.includes("--keep");

await fs.mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ headless: !HEADED });

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
  });
  for (const p of PAGES) {
    const page = await ctx.newPage();
    try {
      await page.goto(p.url, { waitUntil: "networkidle", timeout: 60_000 });
    } catch {
      console.warn(`  skipped ${p.name} (${vp.name}) — load timeout`);
      await page.close();
      continue;
    }
    // lazy görseller için scroll-to-bottom
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let y = 0;
        const step = 600;
        const tick = () => {
          window.scrollBy(0, step);
          y += step;
          if (y >= document.body.scrollHeight) {
            window.scrollTo(0, 0);
            resolve();
          } else {
            requestAnimationFrame(tick);
          }
        };
        tick();
      });
    });
    await page.waitForTimeout(400);
    const file = path.join(OUT, `${p.name}-${vp.name}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log(`  ${vp.name} ${p.name} -> ${path.relative(process.cwd(), file)}`);
    if (!KEEP) await page.close();
  }
  if (!KEEP) await ctx.close();
}

if (KEEP) {
  console.log("\nTarayıcı açık. Pencereyi kapatarak çıkın.");
  await new Promise(() => {});
} else {
  await browser.close();
}
