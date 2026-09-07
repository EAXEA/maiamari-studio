/**
 * CSP ihlal raporu ucu — report-uri / Reporting API hedefi.
 *
 * Tarayıcı, Content-Security-Policy-Report-Only ihlallerini buraya POST eder
 * (bkz. next.config.ts). Uç HERKESE AÇIKTIR; kimlik doğrulaması mümkün değil,
 * çünkü isteği ziyaretçinin tarayıcısı üretir.
 *
 * GÜVENLİK/DAYANIKLILIK:
 * - DB'ye YAZMAZ. Rapor yalnız log'a düşer → kötüye kullanım yüzeyi yok,
 *   en kötü senaryo log gürültüsü.
 * - Gövde tavanı 64KB; üstü okunmadan reddedilir.
 * - Hiçbir durumda exception fırlatmaz; her yol 204 veya 413 döner.
 *
 * GEÇİCİ DEĞİL: report-uri enforce modda da faydalıdır, enforce'a geçişte
 * kaldırılmayacak. Kalıcı saklama/panel bilinçli olarak YOK
 * (bkz. docs/superpowers/specs/2026-08-06-csp-report-collector-design.md).
 */
import { parseCspReport, isExtensionNoise, formatViolation } from "@/lib/security/csp-report";

export const dynamic = "force-dynamic";

/** Gövde tavanı: gerçek CSP raporları birkaç KB'dir. */
const MAX_BODY_BYTES = 64 * 1024;

export async function POST(request: Request) {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) {
    return new Response(null, { status: 413 });
  }

  let violations: ReturnType<typeof parseCspReport> = [];
  try {
    const raw = await request.text();
    // content-length yalan söyleyebilir → gerçek uzunluğu da kontrol et.
    if (raw.length > MAX_BODY_BYTES) {
      return new Response(null, { status: 413 });
    }
    violations = parseCspReport(request.headers.get("content-type") ?? "", raw);
  } catch {
    // Gövde okunamadı (bağlantı koptu, bozuk encoding) → sessizce yut.
    return new Response(null, { status: 204 });
  }

  for (const v of violations) {
    if (isExtensionNoise(v)) continue;
    console.warn(formatViolation(v));
  }

  return new Response(null, { status: 204 });
}
