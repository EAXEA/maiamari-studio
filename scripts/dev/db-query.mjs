/**
 * scripts/db-query.mjs — Terminalden hızlı SQL (Playwright/admin paneli dolambacı yerine).
 *
 * Kullanım:
 *   node scripts/db-query.mjs "SELECT title, paper FROM products WHERE kind='artwork' LIMIT 5"
 *   node scripts/db-query.mjs "UPDATE products SET paper='270 gr Handmade Paper' WHERE title='Lord of Fire'"
 *
 * Bağlantı: .env.local içindeki DATABASE_URL (Supabase pooler; prepare:false zorunlu).
 * SELECT → satırları tablo olarak yazdırır. INSERT/UPDATE/DELETE → etkilenen satır sayısı.
 *
 * DİKKAT: SQL doğrudan (unsafe) çalıştırılır; yıkıcı komutları (DELETE/UPDATE/DROP)
 * WHERE'siz çalıştırma. Vitrin verisini değiştirdiğinde admin panelin revalidate'i
 * DEVREYE GİRMEZ (doğrudan DB yazıyorsun); canlının yansıması için ilgili sayfayı
 * yeniden deploy/revalidate etmen ya da panelden bir kayıt kaydetmen gerekebilir.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

// Bu dosya scripts/dev/ altında: repo kökü iki seviye yukarıda.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

// .env.local'i yükle (değerler loglanmaz)
const envPath = path.join(root, ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined)
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL bulunamadı (.env.local).");
  process.exit(1);
}

const query = process.argv.slice(2).join(" ").trim();
if (!query) {
  console.error('Kullanım: node scripts/db-query.mjs "SELECT ... "');
  process.exit(1);
}

// Uzun hücreleri tabloda kısalt (okunabilirlik)
const clip = (v) => {
  if (v === null || v === undefined) return v;
  const s = typeof v === "object" ? JSON.stringify(v) : String(v);
  return s.length > 60 ? s.slice(0, 57) + "…" : s;
};

const client = postgres(url, { prepare: false, max: 1, idle_timeout: 5 });
try {
  const rows = await client.unsafe(query);
  if (Array.isArray(rows) && rows.length > 0) {
    console.table(rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, clip(v)]))));
    console.log(`(${rows.length} satır)`);
  } else if (rows && rows.count !== undefined) {
    console.log(`OK — etkilenen satır: ${rows.count}`);
  } else {
    console.log("OK (0 satır döndü)");
  }
} catch (e) {
  console.error("SQL hatası:", e.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
