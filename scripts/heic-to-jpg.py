"""HEIC → JPG dönüştürücü.

Kullanım:
    python scripts/heic-to-jpg.py <kaynak_klasor> <hedef_klasor>

- Pillow + pillow-heif gerekir.
- EXIF orientation uygulanır.
- En uzun kenar 2400px'e küçültülür (yüksek çözünürlüklü iPhone HEIC'leri için web boyutu).
- JPEG kalite 88, progressive, optimize=True.
- Çıktı isimleri: maske-01.jpg, maske-02.jpg, ... (kaynak sıralamasına göre)
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageOps
from pillow_heif import register_heif_opener

register_heif_opener()

MAX_EDGE = 2400
QUALITY = 88


def convert(src_dir: Path, dst_dir: Path, prefix: str = "maske") -> list[Path]:
    dst_dir.mkdir(parents=True, exist_ok=True)
    # Windows case-insensitive — dedupe via lowercased name
    seen: set[str] = set()
    sources: list[Path] = []
    for p in sorted(list(src_dir.glob("*.HEIC")) + list(src_dir.glob("*.heic"))):
        key = p.name.lower()
        if key in seen:
            continue
        seen.add(key)
        sources.append(p)
    out: list[Path] = []
    for i, src in enumerate(sources, start=1):
        with Image.open(src) as im:
            im = ImageOps.exif_transpose(im)
            if im.mode != "RGB":
                im = im.convert("RGB")
            w, h = im.size
            scale = min(1.0, MAX_EDGE / max(w, h))
            if scale < 1.0:
                im = im.resize(
                    (int(w * scale), int(h * scale)), Image.LANCZOS
                )
            dst = dst_dir / f"{prefix}-{i:02d}.jpg"
            im.save(
                dst,
                format="JPEG",
                quality=QUALITY,
                optimize=True,
                progressive=True,
            )
            out.append(dst)
            print(f"  {src.name} -> {dst.name} ({im.size[0]}x{im.size[1]})")
    return out


def main() -> int:
    if len(sys.argv) < 3:
        print(__doc__)
        return 1
    src = Path(sys.argv[1])
    dst = Path(sys.argv[2])
    prefix = sys.argv[3] if len(sys.argv) > 3 else "maske"
    if not src.is_dir():
        print(f"Kaynak klasor bulunamadi: {src}", file=sys.stderr)
        return 2
    files = convert(src, dst, prefix)
    print(f"\n{len(files)} dosya donusturuldu -> {dst}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
