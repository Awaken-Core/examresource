"""Convert APS-DV-Priyanka (and the same keystroke encoding) into Unicode.

The exam PDF draws Hindi with a legacy font. Its cmap maps Latin keystrokes
to Devanagari glyphs, and PyMuPDF therefore returns those keystrokes. This
module rebuilds a Unicode cmap for the embedded font, renders the keystrokes,
and reads them with the Hindi Tesseract model. It does not translate.
"""

from __future__ import annotations

import io
import os
import re
import shutil
import subprocess
import warnings

warnings.filterwarnings("ignore", message=".*timestamp seems very low.*")
import tempfile
import urllib.request
from pathlib import Path

import pymupdf
from fontTools.ttLib import TTFont
from fontTools.ttLib.tables._c_m_a_p import CmapSubtable
from PIL import Image

LEGACY_FONT_MARKERS = ("priyanka", "krutidev", "kruti dev", "devlys", "chanakya")
TESSDATA_DIR = Path(__file__).resolve().parent / "tessdata"
HIN_URL = "https://github.com/tesseract-ocr/tessdata_fast/raw/main/hin.traineddata"


def is_legacy_font(font_name: str) -> bool:
    name = (font_name or "").lower()
    return any(marker in name for marker in LEGACY_FONT_MARKERS)


def find_tesseract() -> str:
    env = os.environ.get("TESSERACT_CMD")
    if env and Path(env).exists():
        return env
    found = shutil.which("tesseract")
    if found:
        return found
    windows = Path(r"C:\Program Files\Tesseract-OCR\tesseract.exe")
    if windows.exists():
        return str(windows)
    raise RuntimeError("Tesseract OCR is not installed.")


def ensure_hin_traineddata() -> Path:
    TESSDATA_DIR.mkdir(parents=True, exist_ok=True)
    dest = TESSDATA_DIR / "hin.traineddata"
    if not dest.exists() or dest.stat().st_size < 100_000:
        urllib.request.urlretrieve(HIN_URL, dest)
    return TESSDATA_DIR


def font_buffer_with_unicode_cmap(buffer: bytes) -> tuple[bytes, set[int]]:
    """Map the font's legacy character codes onto a Unicode cmap PyMuPDF will draw."""
    font = TTFont(io.BytesIO(buffer))
    mac: dict[int, str] | None = None
    for table in font["cmap"].tables:
        if table.platformID == 1 and table.cmap:
            mac = dict(table.cmap)
            break
    if not mac:
        for table in font["cmap"].tables:
            if table.platformID == 3 and table.platEncID == 0 and table.cmap:
                mac = {code - 0xF000: name for code, name in table.cmap.items() if code >= 0xF000}
                break
    if not mac:
        raise ValueError("Embedded legacy font has no usable cmap.")
    sub = CmapSubtable.newSubtable(4)
    sub.platformID = 3
    sub.platEncID = 1
    sub.language = 0
    sub.cmap = {code: name for code, name in mac.items() if 0 < code < 0x10000}
    font["cmap"].tables = [
        table
        for table in font["cmap"].tables
        if not (table.platformID == 3 and table.platEncID == 1)
    ]
    font["cmap"].tables.append(sub)
    out = io.BytesIO()
    font.save(out)
    return out.getvalue(), set(sub.cmap)


class PageLegacyFonts:
    """Legacy fonts used on one PDF page, ready to render keystrokes."""

    def __init__(self, doc: pymupdf.Document, page: pymupdf.Page):
        self.faces: list[tuple[bytes, set[int]]] = []
        seen: set[int] = set()
        for font in page.get_fonts(full=True):
            xref = font[0]
            name = font[3] or ""
            if xref in seen or not is_legacy_font(name):
                continue
            seen.add(xref)
            try:
                extracted = doc.extract_font(xref)
            except Exception:
                continue
            raw = extracted[3] if extracted and len(extracted) > 3 else None
            if not raw:
                continue
            try:
                self.faces.append(font_buffer_with_unicode_cmap(raw))
            except Exception:
                continue

    def covers(self, text: str) -> tuple[bytes, set[int]] | None:
        best: tuple[bytes, set[int]] | None = None
        best_score = 0
        for face in self.faces:
            score = sum(1 for ch in text if ch == " " or ord(ch) in face[1])
            if score > best_score:
                best = face
                best_score = score
        return best


def _render_strings(fontbuf: bytes, strings: list[str]) -> Image.Image:
    gap = 36
    images: list[Image.Image] = []
    doc = pymupdf.open()
    try:
        for text in strings:
            width = min(4200, max(480, int(len(text) * 22) + 60))
            page = doc.new_page(width=width, height=96)
            page.insert_font(fontbuffer=fontbuf, fontname="pri")
            page.insert_text((8, 62), text, fontname="pri", fontsize=28)
            pix = page.get_pixmap(dpi=130, alpha=False)
            images.append(Image.frombytes("RGB", (pix.width, pix.height), pix.samples))
    finally:
        doc.close()
    if not images:
        return Image.new("RGB", (32, 32), "white")
    width = max(im.width for im in images)
    height = sum(im.height for im in images) + gap * (len(images) - 1)
    sheet = Image.new("RGB", (width, height), "white")
    y = 0
    for im in images:
        sheet.paste(im, (0, y))
        y += im.height + gap
    return sheet


def _ocr_plain(image: Image.Image) -> str:
    ensure_hin_traineddata()
    tesseract = find_tesseract()
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / "sheet.png"
        image.save(path)
        env = os.environ.copy()
        env["TESSDATA_PREFIX"] = str(TESSDATA_DIR)
        proc = subprocess.run(
            [tesseract, str(path), "stdout", "-l", "hin", "--psm", "6"],
            capture_output=True,
            env=env,
            check=False,
        )
    return proc.stdout.decode("utf-8", errors="replace").replace("\r\n", "\n").strip()


def ocr_legacy_strings(fontbuf: bytes, strings: list[str]) -> list[str]:
    """OCR keystroke strings. Returns Unicode, or '' when a string cannot be read."""
    if not strings:
        return []
    raw = _ocr_plain(_render_strings(fontbuf, strings))
    blocks = [part.strip() for part in re.split(r"\n\s*\n", raw) if part.strip()]
    if len(blocks) == len(strings):
        return [" ".join(part.splitlines()) for part in blocks]
    # A wrapped line can change the block count. Read each string on its own.
    results: list[str] = []
    for text in strings:
        single = _ocr_plain(_render_strings(fontbuf, [text]))
        results.append(" ".join(single.splitlines()).strip())
    return results


def has_devanagari(text: str) -> bool:
    return any("\u0900" <= ch <= "\u097f" for ch in text)
