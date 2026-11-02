"""Large glyph rows so each Devanagari form is readable."""
import pymupdf
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

doc = pymupdf.open("docs/Computer-Practice-Set-All-Exams-Final.pdf")
pages = list(range(2, doc.page_count, 3))
seen = {}
for pno in pages:
    page = doc[pno]
    raw = page.get_text("rawdict")
    for b in raw["blocks"]:
        if b.get("type") != 0:
            continue
        for line in b["lines"]:
            for s in line["spans"]:
                if "Priyanka" not in s.get("font", ""):
                    continue
                for ch in s.get("chars") or []:
                    c = ch.get("c") or ""
                    if not c or c == " " or c in seen:
                        continue
                    box = pymupdf.Rect(ch["bbox"])
                    if box.width < 0.3 or box.height < 0.3:
                        continue
                    box.x0 -= 1.5
                    box.x1 += 1.5
                    box.y0 -= 4
                    box.y1 += 3
                    seen[c] = (pno, box)

items = sorted(seen.items(), key=lambda kv: ord(kv[0]))
print("unique", len(items))
try:
    label_font = ImageFont.truetype("arial.ttf", 18)
except Exception:
    label_font = ImageFont.load_default()

out_dir = Path("docs/scripts/_fonts/rows")
out_dir.mkdir(exist_ok=True)
per = 8
for part in range(0, len(items), per):
    chunk = items[part : part + per]
    cells = []
    for ch, (pno, box) in chunk:
        pix = doc[pno].get_pixmap(clip=box, dpi=220, alpha=False)
        im = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
        cells.append((ch, im))
    cell_w = 160
    cell_h = 150
    sheet = Image.new("RGB", (cell_w * len(cells), cell_h), "white")
    draw = ImageDraw.Draw(sheet)
    for i, (ch, im) in enumerate(cells):
        scale = min(140 / max(im.width, 1), 100 / max(im.height, 1), 4)
        im = im.resize((max(1, int(im.width * scale)), max(1, int(im.height * scale))), Image.Resampling.NEAREST)
        x = i * cell_w
        draw.rectangle((x, 0, x + cell_w - 1, cell_h - 1), outline=(180, 180, 180))
        sheet.paste(im, (x + (cell_w - im.width) // 2, 36))
        draw.text((x + 6, 6), f"U+{ord(ch):04X}", fill=(180, 0, 0), font=label_font)
        draw.text((x + 6, 26), repr(ch), fill=(0, 0, 140), font=label_font)
    path = out_dir / f"row_{part:02d}.png"
    sheet.save(path)
    print(path)
