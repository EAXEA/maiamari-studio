/**
 * CSP ihlal raporlarının ayrıştırılması ve gürültü filtresi — saf mantık.
 * HTTP kabuğu ayrı: app/api/csp-report/route.ts.
 *
 * Uç nokta HERKESE AÇIKTIR (tarayıcı gönderir, kimlik doğrulanamaz), yani
 * gövde tamamen dışarının kontrolündedir. Buradaki hiçbir fonksiyon THROW
 * ETMEZ: tanınmayan/bozuk girdi boş dizi döner. Bir rapor ucunun 500 vermesi
 * ziyaretçiye görünmez ama logu kirletir ve asıl sinyali boğar.
 *
 * İki gövde biçimi desteklenir:
 * - `application/csp-report`  : eski `report-uri`, TEK `csp-report` nesnesi
 * - `application/reports+json`: Reporting API, rapor DİZİSİ (yalnız
 *   `type: "csp-violation"` olanlar CSP'dir; deprecation/intervention da düşer)
 */

export type CspViolation = {
  /** İhlal edilen direktif, ör. "script-src". */
  directive: string;
  /** Engellenen kaynak. Şemasız olabilir: "inline", "eval". */
  blockedUri: string;
  /** İhlalin gerçekleştiği sayfa. */
  documentUri: string;
};

/** Tarayıcı eklentilerinin enjeksiyonları — bizim kodumuzla ilgisi yoktur. */
const EXTENSION_SCHEMES = ["chrome-extension:", "moz-extension:", "safari-web-extension:"];

function asViolation(
  directive: unknown,
  blockedUri: unknown,
  documentUri: unknown,
): CspViolation | null {
  if (typeof directive !== "string" || !directive) return null;
  if (typeof blockedUri !== "string" || !blockedUri) return null;
  return {
    directive,
    blockedUri,
    documentUri: typeof documentUri === "string" ? documentUri : "",
  };
}

/** Content-Type'ı parametrelerinden ayırır: "application/csp-report; charset=utf-8". */
function mediaType(contentType: string): string {
  return contentType.split(";")[0].trim().toLowerCase();
}

export function parseCspReport(contentType: string, rawBody: string): CspViolation[] {
  const type = mediaType(contentType);
  if (type !== "application/csp-report" && type !== "application/reports+json") return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return []; // bozuk gövde → sessizce yut
  }

  // Eski biçim: { "csp-report": { ... } }
  if (type === "application/csp-report") {
    const r = (parsed as Record<string, unknown> | null)?.["csp-report"];
    if (!r || typeof r !== "object") return [];
    const rec = r as Record<string, unknown>;
    const v = asViolation(
      rec["effective-directive"] ?? rec["violated-directive"],
      rec["blocked-uri"],
      rec["document-uri"],
    );
    return v ? [v] : [];
  }

  // Yeni biçim: [ { type: "csp-violation", body: { ... } }, ... ]
  if (!Array.isArray(parsed)) return [];
  const out: CspViolation[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    if (rec.type !== "csp-violation") continue;
    const body = rec.body;
    if (!body || typeof body !== "object") continue;
    const b = body as Record<string, unknown>;
    const v = asViolation(b.effectiveDirective, b.blockedURL, b.documentURL ?? rec.url);
    if (v) out.push(v);
  }
  return out;
}

export function isExtensionNoise(violation: CspViolation): boolean {
  const uri = violation.blockedUri.toLowerCase();
  return EXTENSION_SCHEMES.some((scheme) => uri.startsWith(scheme));
}

/** Tek satır, grep'lenebilir log kaydı. Çok satırlı alanlar tek satıra indirilir. */
export function formatViolation(violation: CspViolation): string {
  const payload = JSON.stringify({
    directive: violation.directive,
    blocked: violation.blockedUri,
    document: violation.documentUri,
  });
  return `[csp] ${payload.replace(/\s*\n\s*/g, " ")}`;
}
