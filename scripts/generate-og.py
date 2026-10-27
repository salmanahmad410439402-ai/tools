"""
Generates public/og-default.png (1200x630 Open Graph card).

Run once after changing the site name or tagline:
    python3 -m venv .venv && .venv/bin/pip install pillow
    .venv/bin/python scripts/generate-og.py
The PNG is committed, so the build itself needs no Python.
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "og-default.png"
W, H = 1200, 630

BRAND = (79, 70, 229)
BRAND_100 = (224, 231, 255)
BRAND_50 = (238, 242, 255)
INK = (15, 23, 42)
BODY = (71, 85, 105)
LINE = (226, 232, 240)
SUCCESS = (22, 163, 74)
WHITE = (255, 255, 255)

FONT_DIR = Path("/usr/share/fonts/truetype/dejavu")
BOLD = FONT_DIR / "DejaVuSans-Bold.ttf"
REGULAR = FONT_DIR / "DejaVuSans.ttf"


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(BOLD if bold else REGULAR), size)


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def main() -> None:
    image = Image.new("RGB", (W, H), WHITE)
    draw = ImageDraw.Draw(image)

    # Vertical gradient from an indigo tint to white.
    for y in range(H):
        t = min(1.0, (y / H) * 1.5)
        draw.line([(0, y), (W, y)], fill=lerp(BRAND_50, WHITE, t))

    # Brand lockup
    draw.rounded_rectangle([96, 96, 156, 156], radius=16, fill=BRAND)
    draw.rounded_rectangle([112, 112, 140, 142], radius=5, outline=WHITE, width=3)
    draw.line([(128, 112), (140, 124)], fill=WHITE, width=3)
    draw.line([(118, 128), (134, 128)], fill=WHITE, width=3)
    draw.line([(118, 135), (128, 135)], fill=WHITE, width=3)

    draw.text((176, 110), "Filecraft", font=font(34, True), fill=INK)

    # Headline (kept clear of the mock card on the right)
    draw.text((96, 226), "Free PDF & image tools", font=font(44, True), fill=INK)
    draw.text((96, 282), "that run in your browser", font=font(44, True), fill=BRAND)

    # Promise lines
    draw.text((96, 366), "No upload · No sign-up · No watermark.", font=font(22), fill=BODY)
    draw.text((96, 398), "Your files stay on your device.", font=font(22), fill=BODY)

    # Buttons
    draw.rounded_rectangle([96, 462, 340, 520], radius=14, fill=BRAND)
    draw.text((118, 478), "Compress a PDF", font=font(22, True), fill=WHITE)
    draw.rounded_rectangle([356, 462, 584, 520], radius=14, fill=WHITE, outline=LINE, width=2)
    draw.text((378, 478), "Browse all tools", font=font(22, True), fill=INK)

    # Tool mock card
    card = [760, 130, 1104, 500]
    draw.rounded_rectangle(card, radius=24, fill=WHITE, outline=LINE, width=2)
    draw.text((788, 158), "Compress PDF", font=font(20, True), fill=INK)
    draw.rounded_rectangle([1024, 158, 1076, 180], radius=11, fill=(240, 253, 244))
    draw.text((1032, 162), "FREE", font=font(11, True), fill=SUCCESS)

    draw.rounded_rectangle([788, 196, 1076, 300], radius=16, fill=BRAND_50, outline=(199, 210, 254), width=2)
    draw.text((846, 228), "report-2026.pdf", font=font(18, True), fill=INK)
    draw.text((846, 256), "3 pages · 12.4 MB", font=font(14), fill=BODY)

    stats = [("Before", "12.4 MB", INK), ("After", "1.8 MB", INK), ("Saved", "85%", SUCCESS)]
    for index, (label, value, colour) in enumerate(stats):
        x = 788 + index * 100
        draw.rounded_rectangle([x, 318, x + 92, 372], radius=10, fill=(248, 250, 252))
        draw.text((x + 12, 326), label.upper(), font=font(9, True), fill=(100, 116, 139))
        draw.text((x + 12, 342), value, font=font(16, True), fill=colour)

    draw.rounded_rectangle([788, 392, 1076, 400], radius=4, fill=LINE)
    draw.rounded_rectangle([788, 392, 1020, 400], radius=4, fill=BRAND)
    draw.rounded_rectangle([788, 424, 936, 466], radius=11, fill=BRAND)
    draw.text((810, 434), "Download", font=font(17, True), fill=WHITE)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    image.save(OUT, "PNG", optimize=True)
    print(f"wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
