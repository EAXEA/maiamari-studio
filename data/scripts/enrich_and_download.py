"""
Shopier ürün detay zenginleştirme + görsel indirme
====================================================
Her ürün için detay sayfasını fetch eder, açıklamayı OG meta'dan alır,
galeri görsellerini pictures_large/ URL'leri ile indirir.

Çıktı:
  data/products_full.json   — zenginleştirilmiş ürün listesi
  data/images/shopier/<id>/img_NN.jpg — her ürün için indirilmiş görseller
"""
import json
import os
import re
import sys
import time
import urllib.request
from urllib.parse import urlparse
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE = r"C:\Users\wc_am\Documents\GitHub\maiamari-studio"
PRODUCTS_JSON = os.path.join(BASE, "data", "products_list.json")
OUT_JSON = os.path.join(BASE, "data", "products_full.json")
IMG_DIR = os.path.join(BASE, "data", "images", "shopier")
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
}


def http_get(url, max_retries=3):
    for attempt in range(max_retries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=15) as r:
                return r.read()
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            time.sleep(1 + attempt)


def parse_meta(html_text):
    """OG meta etiketlerini ve gallery URL'lerini ayıkla."""
    def extract(prop):
        m = re.search(
            rf'<meta\s+property=["\']{prop}["\']\s+content=["\']([^"\']+)["\']',
            html_text, re.I)
        if m:
            return m.group(1)
        m = re.search(
            rf'<meta\s+name=["\']{prop}["\']\s+content=["\']([^"\']+)["\']',
            html_text, re.I)
        return m.group(1) if m else None

    og_title = extract("og:title")
    og_desc = extract("og:description")
    og_image = extract("og:image")

    # Gallery: tüm pictures_large URL'leri (unique)
    pics = re.findall(
        r'https://cdn\.shopier\.app/pictures_(?:large|max|mid)/[^\s"\'<>]+',
        html_text)
    # Hepsini large'a normalize et
    pics_large = [re.sub(r'/pictures_(mid|max)/', '/pictures_large/', p) for p in pics]
    # Filtre: sadece bu mağazanın görselleri
    pics_large = [p for p in pics_large if 'maiamari_' in p]
    # Unique, sıra korunarak
    seen = set()
    uniq = []
    for p in pics_large:
        # Trim trailing characters that might leak from HTML attributes
        p_clean = p.split('"')[0].split("'")[0].rstrip('),;')
        if p_clean not in seen:
            seen.add(p_clean)
            uniq.append(p_clean)
    return {
        "og_title": og_title,
        "og_description": og_desc,
        "og_image": og_image,
        "gallery": uniq,
    }


def download_image(url, dest):
    if os.path.exists(dest) and os.path.getsize(dest) > 1024:
        return False  # already
    data = http_get(url)
    with open(dest, "wb") as f:
        f.write(data)
    return True


def process_product(p):
    pid = p["id"]
    out = dict(p)
    try:
        html = http_get(p["url"]).decode("utf-8", errors="ignore")
        meta = parse_meta(html)
        out["title_full"] = meta["og_title"] or p["title"]
        out["description"] = meta["og_description"] or ""
        out["gallery"] = meta["gallery"]
        out["coverImage"] = meta["og_image"] or p.get("imageThumb")

        # İmageleri indir
        product_dir = os.path.join(IMG_DIR, pid)
        os.makedirs(product_dir, exist_ok=True)
        local_paths = []
        for idx, img_url in enumerate(meta["gallery"]):
            ext = os.path.splitext(urlparse(img_url).path)[1] or ".jpg"
            dest = os.path.join(product_dir, f"img_{idx:02d}{ext}")
            try:
                download_image(img_url, dest)
                local_paths.append(os.path.relpath(dest, BASE).replace("\\", "/"))
            except Exception as e:
                print(f"  [warn] image fail {img_url}: {e}", file=sys.stderr)
        out["localImages"] = local_paths
        out["fetched_at"] = time.strftime("%Y-%m-%dT%H:%M:%S")
        print(f"[OK] {pid} {p['title'][:40]:40} | {len(meta['gallery'])} img")
    except Exception as e:
        out["error"] = str(e)
        print(f"[ERR] {pid}: {e}", file=sys.stderr)
    return out


def main():
    with open(PRODUCTS_JSON, encoding="utf-8") as f:
        products = json.load(f)

    print(f"Processing {len(products)} products...")
    os.makedirs(IMG_DIR, exist_ok=True)

    results = []
    with ThreadPoolExecutor(max_workers=6) as ex:
        futures = {ex.submit(process_product, p): p for p in products}
        for fut in as_completed(futures):
            results.append(fut.result())

    # Orijinal sırayı koru
    by_id = {r["id"]: r for r in results}
    ordered = [by_id[p["id"]] for p in products]

    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(ordered, f, ensure_ascii=False, indent=2)

    ok = sum(1 for r in results if "error" not in r)
    total_imgs = sum(len(r.get("localImages", [])) for r in results)
    print(f"\nDone: {ok}/{len(results)} products | {total_imgs} images total")
    print(f"Output: {OUT_JSON}")


if __name__ == "__main__":
    main()
