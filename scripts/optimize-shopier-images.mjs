/**
 * MAIAMARI.STUDIO — Shopier kaynak görsellerini web için optimize et
 * ------------------------------------------------------------------
 * public/images/shopier/** Shopier scrape orijinalleri (~102 MB, ort 1.1 MB).
 * next/image bunları zaten dönüştürüyor ama kaynak boyutu repo/deploy şişkinliği
 * ve optimizer maliyeti. Tek seferlik: uzun kenar max 1600px + mozjpeg q80.
 * Yalnız kazanç varsa üzerine yazar (zaten küçük dosya atlanır). Uzantı korunur;
 * .JPG uzantılı PNG'ler gerçek JPEG'e döner (içerik sniff'i sharp yapar).
 *
 * Çalıştırma: node scripts/optimize-shopier-images.mjs
 * Geri dönüş: git checkout -- public/images/shopier
 */
import sharp from "sharp";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

// OneDrive altındaki repo'da dosya kilitleri görülebiliyor: girdi buffer'a
// okunur (fd tutulmaz), yazma kısa aralıklarla yeniden denenir.
sharp.cache(false);

const ROOT = join(process.cwd(), "public", "images", "shopier");
const MAX_EDGE = 1600;
const QUALITY = 80;

async function writeWithRetry(file, buf, attempts = 5) {
  for (let i = 1; ; i++) {
    try {
      writeFileSync(file, buf);
      return;
    } catch (e) {
      if (i >= attempts) throw e;
      await sleep(300 * i);
    }
  }
}

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (/\.(jpe?g|png)$/i.test(name)) yield full;
  }
}

let total = 0;
let written = 0;
let beforeSum = 0;
let afterSum = 0;

for (const file of walk(ROOT)) {
  total++;
  const before = statSync(file).size;
  beforeSum += before;
  const buf = await sharp(readFileSync(file))
    .rotate() // EXIF orientation'ı piksele işle (metadata stripleniyor)
    .resize(MAX_EDGE, MAX_EDGE, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: QUALITY, mozjpeg: true })
    .toBuffer();
  if (buf.length < before * 0.95) {
    await writeWithRetry(file, buf);
    afterSum += buf.length;
    written++;
  } else {
    afterSum += before; // kazanç yok → dokunma
  }
}

const mb = (n) => (n / 1024 / 1024).toFixed(1);
console.log(
  `${total} dosya tarandı, ${written} yeniden yazıldı: ${mb(beforeSum)} MB → ${mb(afterSum)} MB`,
);
