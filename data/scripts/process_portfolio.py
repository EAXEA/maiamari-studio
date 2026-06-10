"""
Portfolio görsellerini optimize edip web/public/portfolio'ya yerleştirir
+ portfolio.json yarat
+ Gerçek logoyu data/brand ve web/public/brand'a kopyala
"""
import os
import shutil
import json
from PIL import Image

RAW = r"C:\Users\wc_am\Documents\GitHub\maiamari-studio\data\portfolio_raw"
DEST_DATA = r"C:\Users\wc_am\Documents\GitHub\maiamari-studio\data\images\portfolio"
DEST_WEB = r"C:\Users\wc_am\Documents\GitHub\maiamari-studio\web\public\images\portfolio"
LOGO_SRC = r"C:\Users\wc_am\OneDrive\Masaüstü\maiamari website\maiamari_logo_cropped.png"
LOGO_DATA = r"C:\Users\wc_am\Documents\GitHub\maiamari-studio\data\brand\maiamari-logo.png"
LOGO_WEB = r"C:\Users\wc_am\Documents\GitHub\maiamari-studio\web\public\brand\maiamari-logo.png"
PORTFOLIO_JSON = r"C:\Users\wc_am\Documents\GitHub\maiamari-studio\data\portfolio.json"

os.makedirs(DEST_DATA, exist_ok=True)
os.makedirs(DEST_WEB, exist_ok=True)

# 1) Logoyu yüksek çözünürlükte upscale + alpha koruyarak kopyala
img = Image.open(LOGO_SRC).convert("RGBA")
# 1024'e büyüt (Lanczos resize)
img = img.resize((1024, 1024), Image.LANCZOS)
for out in (LOGO_DATA, LOGO_WEB):
    img.save(out, "PNG", optimize=True)
    print(f"[logo] {out} — {os.path.getsize(out)} bytes")

# 2) Portfolio görselleri
raw_files = sorted(
    [f for f in os.listdir(RAW) if f.lower().endswith((".jpg", ".jpeg", ".png"))]
)
print(f"\n{len(raw_files)} portfolio files found")

works = []
for idx, fname in enumerate(raw_files, 1):
    src = os.path.join(RAW, fname)
    pil = Image.open(src)
    w, h = pil.size
    # Web için optimize edip kopyala (max boyut 2000, kalite 85)
    max_side = 2000
    if max(w, h) > max_side:
        scale = max_side / max(w, h)
        new_size = (int(w * scale), int(h * scale))
        pil = pil.resize(new_size, Image.LANCZOS)
    out_name = f"print_{idx:02d}.jpg"
    for d in (DEST_DATA, DEST_WEB):
        out = os.path.join(d, out_name)
        pil.convert("RGB").save(out, "JPEG", quality=85, optimize=True)
    print(f"[print_{idx:02d}] {pil.size} -> {os.path.getsize(os.path.join(DEST_WEB, out_name)) // 1024} KB")

    works.append({
        "id": f"print-{idx:02d}",
        "slug": f"baski-{idx:02d}",
        "title": f"Baskı № {idx}",
        "description": (
            "Sanatçı Duygu Sinan'ın atölyede çoğaltılmış linol baskısı. "
            "Detaylı bilgi ve edisyon bilgisi için iletişime geçin."
        ),
        "image": f"/images/portfolio/{out_name}",
        "year": 2018 if idx < 8 else 2021,  # raw dosya tarihlerine göre kabaca
    })

with open(PORTFOLIO_JSON, "w", encoding="utf-8") as f:
    json.dump(works, f, ensure_ascii=False, indent=2)
print(f"\n[json] {PORTFOLIO_JSON}")
print(f"Total: {len(works)} works")
