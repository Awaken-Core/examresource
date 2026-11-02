"""Build a contact sheet of unique APS-DV-Priyanka glyphs as rendered in the PDF."""
import pymupdf
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

doc = pymupdf.open("docs/Computer-Practice-Set-All-Exams-Final.pdf")
# Sample pages across the book so rare glyphs appear.
pages = list(range(2, doc.page_count, 4))
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
                    if box.width < 0.4 or box.height < 0.4:
                        continue
                    # pad so matras above/below are included
                    box.x0 -= 1
                    box.x1 += 1
                    box.y0 -= 3
                    box.y1 += 3
                    seen[c] = (pno, box)

print("unique", len(seen))
items = sorted(seen.items(), key=lambda kv: ord(kv[0]))
cell_w, cell_h = 92, 78
cols = 10
rows = (len(items) + cols - 1) // cols
sheet = Image.new("RGB", (cols * cell_w, rows * cell_h), "white")
draw = ImageDraw.Draw(sheet)
try:
    label_font = ImageFont.truetype("arial.ttf", 12)
except Exception:
    label_font = ImageFont.load_default()

for i, (ch, (pno, box)) in enumerate(items):
    page = doc[pno]
    pix = page.get_pixmap(clip=box, dpi=110, alpha=False)
    im = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    # fit into cell
    max_w, max_h = cell_w - 8, cell_h - 22
    scale = min(max_w / max(im.width, 1), max_h / max(im.height, 1), 3)
    im = im.resize((max(1, int(im.width * scale)), max(1, int(im.height * scale))), Image.Resampling.NEAREST)
    r, c = divmod(i, cols)
    x = c * cell_w
    y = r * cell_h
    draw.rectangle((x, y, x + cell_w - 1, y + cell_h - 1), outline=(220, 220, 220))
    sheet.paste(im, (x + 4, y + 16))
    label = f"U+{ord(ch):04X} {ch}"
    draw.text((x + 3, y + 2), label, fill=(180, 0, 0), font=label_font)

out = Path("docs/scripts/_fonts/glyph_sheet.png")
sheet.save(out)
print("saved", out, sheet.size)
# also write the char list
Path("docs/scripts/_fonts/chars.txt").write_text(
    "\n".join(f"U+{ord(ch):04X}\t{ch}" for ch, _ in items),
    encoding="utf-8",
)
