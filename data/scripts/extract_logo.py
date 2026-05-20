"""
MAIAMARI logosunu (pembe dairesel etiket) ürün fotoğrafından
crop + dairesel mask + transparent PNG olarak çıkartır.
"""
from PIL import Image, ImageDraw
import os

SRC = r"C:\Users\wc_am\Documents\GitHub\maimari-studio\data\images\shopier\38261472\img_00.jpeg"
OUT_BRAND_DIR = r"C:\Users\wc_am\Documents\GitHub\maimari-studio\data\brand"
WEB_BRAND_DIR = r"C:\Users\wc_am\Documents\GitHub\maimari-studio\web\public\brand"

os.makedirs(OUT_BRAND_DIR, exist_ok=True)
os.makedirs(WEB_BRAND_DIR, exist_ok=True)

src = Image.open(SRC).convert("RGB")
W, H = src.size  # 916, 916

# Etiket merkezi ve yarıçapı — manuel kalibre
cx, cy = 442, 506
r = 128  # küçült, kenar siyahlığa kaçmasın

# Square crop (logo merkezde)
crop = src.crop((cx - r, cy - r, cx + r, cy + r))
crop = crop.resize((1024, 1024), Image.LANCZOS)

# Sıkı dairesel mask + arka planı tek tip pembe ile değiştir (kavanozun siyahını öldür)
import numpy as np
from PIL import ImageFilter

arr = np.array(crop)  # H, W, 3
R, G, B = arr[..., 0], arr[..., 1], arr[..., 2]

# Pembe (etiketin zemini)
pink = (R > 200) & (G > 140) & (G < 220) & (B > 160) & (B < 230)
# Kırmızı (logo motifi)
red = (R > 150) & (G < 140) & (B < 140)
keep = pink | red

# Logo dairesel — dış çemberden başlayarak NON-keep pikselleri transparent yap
H, W = keep.shape
cy_c, cx_c = H // 2, W // 2
yy, xx = np.ogrid[:H, :W]
dist = np.sqrt((xx - cx_c) ** 2 + (yy - cy_c) ** 2)
inner_disc = dist <= (min(H, W) // 2 - 6)

# Tüm dairenin içini pembe yap; sadece dairenin dışını transparent yap
# Bu, içerideki siyah lekeleri pembeye boyar
out_arr = arr.copy()
pink_color = np.array([232, 182, 200], dtype=np.uint8)
# inner_disc içinde ama keep=False olan pikselleri pembeye boya (siyah artefaktları temizle)
fill_mask = inner_disc & (~keep)
out_arr[fill_mask] = pink_color

out_img = Image.fromarray(out_arr)

# Alpha = inner_disc; kenarları hafif yumuşat
mask = (inner_disc.astype(np.uint8)) * 255
mask_img = Image.fromarray(mask).filter(ImageFilter.GaussianBlur(radius=1.2))

rgba = out_img.convert("RGBA")
rgba.putalpha(mask_img)

# Kaydet (data + public)
for d in [OUT_BRAND_DIR, WEB_BRAND_DIR]:
    out = os.path.join(d, "maimari-mark.png")
    rgba.save(out, "PNG", optimize=True)
    print(f"saved {out} ({os.path.getsize(out)} bytes)")

# Ayrıca tek renk (pembe daire) versiyonu — wordmark için arka plan
pink_avg = (232, 182, 200)
solid = Image.new("RGBA", (1024, 1024), pink_avg + (0,))
disc = Image.new("L", solid.size, 0)
ImageDraw.Draw(disc).ellipse((0, 0, 1024, 1024), fill=255)
solid.putalpha(disc)
for d in [OUT_BRAND_DIR, WEB_BRAND_DIR]:
    out = os.path.join(d, "pink-disc.png")
    solid.save(out, "PNG", optimize=True)
    print(f"saved {out}")
