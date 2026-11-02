"""Inspect fonts and text runs around the SQL HAVING question."""
import pymupdf
from pathlib import Path

pdf = Path("docs/Computer-Practice-Set-All-Exams-Final.pdf")
doc = pymupdf.open(pdf)
print("pages", doc.page_count)

needle = "applies predicates"
hit = None
for i, page in enumerate(doc):
    if needle in page.get_text():
        hit = i
        break
print("hit_page", hit)

if hit is None:
    raise SystemExit(0)

page = doc[hit]
fonts = page.get_fonts(full=True)
print("--- fonts ---")
for f in fonts:
    print(f)

print("--- spans ---")
d = page.get_text("dict")
for b in d["blocks"]:
    if b.get("type") != 0:
        print("IMAGE/BLOCK", b.get("type"), b.get("bbox"))
        continue
    for line in b["lines"]:
        texts = "".join(s["text"] for s in line["spans"])
        if "predicate" in texts.lower() or "SQL" in texts or "ke" in texts or "mec" in texts:
            for s in line["spans"]:
                print(repr(s["font"]), repr(s["text"][:120]), "size", round(s["size"], 1))
