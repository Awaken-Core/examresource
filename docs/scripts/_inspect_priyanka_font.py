"""Dump APS-DV-Priyanka glyph names and cmap."""
import pymupdf
from pathlib import Path

doc = pymupdf.open("docs/Computer-Practice-Set-All-Exams-Final.pdf")
page = doc[335]
seen = set()
out = Path("docs/scripts/_fonts")
out.mkdir(exist_ok=True)
for f in page.get_fonts(full=True):
    xref = f[0]
    name = f[3]
    if xref in seen:
        continue
    seen.add(xref)
    if "Priyanka" not in name and "Symbol" not in name:
        continue
    try:
        info = doc.extract_font(xref)
    except Exception as e:
        print("extract fail", name, e)
        continue
    # info: (basename, ext, subtype, buffer)
    print("FONT", name, "xref", xref, "tuple_len", len(info), "ext", info[1] if len(info) > 1 else None, "buflen", len(info[3]) if len(info) > 3 and info[3] else 0)
    if info[3]:
        path = out / f"{xref}_{name.replace('+','')}.{info[1] or 'bin'}"
        path.write_bytes(info[3])
        print(" wrote", path, path.stat().st_size)
