import { test, expect, type Page } from "@playwright/test";

/**
 * Kritik akış smoke testleri. Amaç regresyon sigortası (iyzico entegrasyonu
 * dahil): sayfalar render olur, sepet → checkout formu açılır, admin kilitli.
 * İçerik adlarına bağımlı değildir; DB'siz CI'da snapshot fallback yeterlidir.
 * NOT: Sepet akışı NEXT_PUBLIC_CHECKOUT_ENABLED=1 ile build edilmiş olmayı
 * bekler (CI build adımı bu bayrakla çalışır).
 */

function collectPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  return errors;
}

test("ana sayfa: başlık, hero ve ana nav", async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto("/");
  await expect(page).toHaveTitle(/maiamari/i);
  await expect(page.locator("h1").first()).toBeVisible();
  const header = page.locator("header").first();
  for (const name of ["Galeri", "Mağaza", "Atölyeler"]) {
    await expect(header.getByRole("link", { name }).first()).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test("galeri: landing ve seri sayfası render olur", async ({ page }) => {
  await page.goto("/galeri");
  await expect(page.locator("h1").first()).toBeVisible();
  const firstSeries = page.locator('main a[href^="/galeri/"]').first();
  await expect(firstSeries).toBeVisible();
  await firstSeries.click();
  await expect(page).toHaveURL(/\/galeri\/.+/);
  await expect(page.locator("h1").first()).toBeVisible();
  await expect(page.locator("main img").first()).toBeVisible();
});

test("mağaza → ürün → sepet → checkout formu", async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto("/shop");
  // Stokta olan ilk ürünü bul (ilk 6 karttan biri yeterli).
  const hrefs = await page
    .locator('a[href^="/urun/"]')
    .evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).getAttribute("href")));
  expect(hrefs.length).toBeGreaterThan(0);
  let added = false;
  for (const href of [...new Set(hrefs)].slice(0, 6)) {
    await page.goto(href!);
    const addBtn = page.getByRole("button", { name: /sepete ekle/i });
    if (await addBtn.isVisible().catch(() => false)) {
      await expect(page.locator("h1").first()).toBeVisible();
      await addBtn.click();
      added = true;
      break;
    }
  }
  expect(added, "ilk 6 üründe 'Sepete ekle' bulunamadı").toBe(true);

  // Header sepet rozeti canlı sayacı gösterir.
  await expect(page.getByLabel(/Sepet, 1 ürün/)).toBeVisible();

  await page.goto("/cart");
  await expect(
    page.getByRole("heading", { name: /Sepetiniz \(1\)/ }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Ödemeye geç" }).click();
  await expect(page).toHaveURL(/\/checkout$/);

  // Form alanları (sipariş GÖNDERİLMEZ — DB'siz ortamda da koşabilsin).
  // Header/footer telefon CTA'ları da "Telefon" aria-label'ı taşır → forma kapsa.
  const form = page.locator("form");
  for (const label of ["Ad Soyad", "E-posta", "Telefon", "Şehir", "Adres"]) {
    await expect(form.getByLabel(label)).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test("admin: girişe yönlenir, login sayfası render olur", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
  // ADMIN_PASSWORD_HASH yapılandırılmışsa form görünür; CI'da sadece redirect yeterli.
  const hasForm = await page.locator('input[type="password"]').isVisible().catch(() => false);
  const hasError = await page.locator("p.text-red-600, p.text-amber-700").isVisible().catch(() => false);
  expect(hasForm || hasError, "login sayfası ne form ne hata mesajı gösteriyor").toBe(true);
});

test("arama API'si indeks döndürür", async ({ request }) => {
  const res = await request.get("/api/search");
  expect(res.ok()).toBeTruthy();
  const data = (await res.json()) as { items: unknown[] };
  expect(data.items.length).toBeGreaterThan(50);
});

test("yasal sayfalar yayında (iyzico gereksinimi)", async ({ page }) => {
  for (const slug of ["mesafeli-satis", "iade", "gizlilik", "kvkk"]) {
    const res = await page.goto(`/legal/${slug}`);
    expect(res?.status(), `/legal/${slug}`).toBe(200);
    await expect(page.locator("h1").first()).toBeVisible();
  }
});

/**
 * Canonical regresyon sigortası. Root layout'ta tanımlı bir canonical, kendi
 * canonical'ını vermeyen her sayfaya miras kalır ve o sayfaları Google'a "ana
 * sayfanın kopyası" olarak bildirir (29.07.2026'da /shop ve /journal böyle
 * dizin dışı kalmıştı). Yeni sayfa eklenirken aynı tuzağa düşülmesin.
 */
const CANONICAL_ROUTES = [
  "/",
  "/shop",
  "/journal",
  "/galeri",
  "/atolyeler",
  "/about",
  "/contact",
  "/kagit",
];

for (const route of CANONICAL_ROUTES) {
  test(`canonical: ${route} kendi adresini gösterir`, async ({ page }) => {
    await page.goto(route);
    const canonical = await page
      .locator('link[rel="canonical"]')
      .getAttribute("href");
    // Next.js kök canonical'ı sondaki eğik çizgi olmadan basar (eşdeğer).
    const expected =
      route === "/"
        ? "https://www.maiamari.art"
        : `https://www.maiamari.art${route}`;
    expect(canonical).toBe(expected);
  });
}
