// Anasayfa mosaic hero'sunun yeni hâliyle "maiamari.art yayında" milestone
// görselini yeniden üretir. Playwright ile desktop viewport screenshot alır,
// sharp ile macOS-style chrome bar (3 traffic light + URL pill) composite eder.
// Output: public/images/journal/maiamari-art-yayinda.jpg (1600x947, mozjpeg q82).
//
// Run: node scripts/milestone-screenshot.mjs
// Prereq: dev server localhost:3000 ayakta.

import { chromium } from "playwright";
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_PATH = join(ROOT, "public/images/journal/maiamari-art-yayinda.jpg");

const VIEWPORT = { width: 1440, height: 900 };
const CHROME_HEIGHT = 44;
const URL_PILL = "maiamari.art";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(300);

const raw = await page.screenshot({ type: "png", fullPage: false });
await browser.close();

// Chrome bar SVG — minimal macOS pencere başlığı: kırmızı/sarı/yeşil + URL pill
const W = VIEWPORT.width;
const H = CHROME_HEIGHT;
const chromeSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="#e8e4dd"/>
  <circle cx="22" cy="${H / 2}" r="6" fill="#ff5f57"/>
  <circle cx="44" cy="${H / 2}" r="6" fill="#febc2e"/>
  <circle cx="66" cy="${H / 2}" r="6" fill="#28c840"/>
  <rect x="${W / 2 - 120}" y="${H / 2 - 13}" width="240" height="26" rx="13" fill="#ffffff" stroke="#d0c8bd" stroke-width="0.5"/>
  <text x="${W / 2}" y="${H / 2 + 4}" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="13" fill="#1f1f1f" text-anchor="middle">${URL_PILL}</text>
</svg>`;

const chromePng = await sharp(Buffer.from(chromeSvg)).png().toBuffer();

// Composite: chrome bar üstte, screenshot altta. Sharp 'extend' ile üst kenara
// 44px alan açıp screenshot'ı aşağı kaydırıyoruz; sonra chrome bar'ı 0,0'a basıyoruz.
const screenshotPng = await sharp(raw)
  .resize({ width: W }) // 2x screenshot → 1x viewport width
  .toBuffer();
const { height: shotH } = await sharp(screenshotPng).metadata();

const finalHeight = H + shotH;
const composed = await sharp({
  create: {
    width: W,
    height: finalHeight,
    channels: 3,
    background: { r: 232, g: 228, b: 221 },
  },
})
  .composite([
    { input: chromePng, top: 0, left: 0 },
    { input: screenshotPng, top: H, left: 0 },
  ])
  .png()
  .toBuffer();

// Resize 1600 wide and crop to 1600x947 (16:9.5 ratio), then mozjpeg
const TARGET_W = 1600;
const TARGET_H = 947;
await sharp(composed)
  .resize({ width: TARGET_W })
  .extract({ left: 0, top: 0, width: TARGET_W, height: TARGET_H })
  .jpeg({ quality: 82, mozjpeg: true, progressive: true })
  .toFile(OUT_PATH);

console.log(`✓ written ${OUT_PATH}`);
