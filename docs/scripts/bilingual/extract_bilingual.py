"""Font-aware bilingual extractor for the computer practice-set PDF.

English stays on the Unicode text layer. Hindi is read from the legacy
APS-DV-Priyanka glyphs and stored separately. Tables stay tables. Images
are cropped with the question that contains them. Nothing is translated.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

import pymupdf

from legacy_hindi import PageLegacyFonts, has_devanagari, is_legacy_font, ocr_legacy_strings

PDF_PATH = Path("docs/Computer-Practice-Set-All-Exams-Final.pdf")
OUTPUT_PATH = Path("docs/extracted/bilingual_questions.json")
IMAGE_DIR = Path("docs/extracted/question-images")

LEFT_COL = pymupdf.Rect(48, 58, 308, 790)
RIGHT_COL = pymupdf.Rect(308, 58, 570, 790)

CHAPTER_MAP = {
    "Digital Logic Circuits": "Digital Logic Circuits",
    "Computer Organization and Architecture": "Computer Organization & Architecture",
    "Data Structures and Algorithm": "Data Structures & Algorithms",
    "Problem Solving through C-Programming": "Programming Concepts in C",
    "Object Oriented Techniques": "Object Oriented Programming (C++ / Java)",
    "Operating System": "Operating Systems",
    "Database Management System": "Database Management Systems (DBMS / SQL)",
    "Computer Networks": "Computer Networks & Data Communication",
    "Software Engineering": "Software Engineering",
    "Internet Technology, Web Design & Web Technology": "Internet & Web Technologies",
    "Miscellaneous": "Computer Fundamentals, Security & MS Office",
}

WATERMARK_RE = re.compile(
    r"(freepdfhall|sarkari\s*result|sarkari\s*re\b|click\s+here|www\.)",
    re.IGNORECASE,
)
QUESTION_RE = re.compile(r"^(\d{1,3})\.\s+(.*)$")
OPTION_RE = re.compile(r"^\(?([a-eA-E])\)[\.\)]?\s*(.*)$")
ANSWER_RE = re.compile(
    r"^Ans[\.\,\s\-]*[\(\[]?\s*([a-eA-E])\s*[\)\]]?\s*[:\.\-]?\s*(.*)$",
    re.IGNORECASE,
)
EXAM_RE = re.compile(
    r"^((?:DSSSB|KVS|NVS|HTET|BPSC|UGC\s+NET|LT\.?\s*Grade|EMRS|UKPSC|RPSC|CGPSC|UPPSC|Haryana\s+PGT|Bihar\s+STET|Bihar\s+TRE).{4,80})$",
    re.IGNORECASE,
)
CODE_RE = re.compile(
    r"(\bSELECT\b.+\bFROM\b|\bINSERT\s+INTO\b|\bCREATE\s+TABLE\b|\bpublic\s+static\b|"
    r"\b#include\b|\bconsole\.\w+|\bprintf\s*\(|\bdef\s+\w+\s*\(|\bfunction\s+\w+\s*\()",
    re.IGNORECASE,
)


def detect_chapter(page_text: str, current: str) -> str:
    for line in page_text.splitlines()[:6]:
        for key, label in CHAPTER_MAP.items():
            if key.lower() in line.lower():
                return label
    return current


def _clean(text: str) -> str:
    text = text.replace("\u00a0", " ")
    text = re.sub(r"[ \t]+", " ", text)
    return text.strip()


def _page_lines(page: pymupdf.Page, page_index: int) -> list[dict]:
    lines: list[dict] = []
    for col_index, rect in enumerate((LEFT_COL, RIGHT_COL)):
        data = page.get_text("dict", clip=rect)
        for block in data["blocks"]:
            if block.get("type") != 0:
                continue
            for line in block["lines"]:
                en_parts: list[str] = []
                hi_parts: list[str] = []
                for span in line["spans"]:
                    text = span.get("text") or ""
                    if not text.strip():
                        continue
                    if is_legacy_font(span.get("font") or ""):
                        hi_parts.append(text)
                    else:
                        en_parts.append(text)
                en = _clean("".join(en_parts))
                hi = _clean("".join(hi_parts))
                if WATERMARK_RE.search(en) or WATERMARK_RE.search(hi):
                    continue
                if not en and not hi:
                    continue
                if re.fullmatch(r"\d{1,3}", en):
                    continue
                bbox = pymupdf.Rect(line["bbox"])
                lines.append(
                    {
                        "en": en,
                        "hi_legacy": hi,
                        "hi": "",
                        "page": page_index,
                        "col": col_index,
                        "y": bbox.y0,
                        "bbox": [bbox.x0, bbox.y0, bbox.x1, bbox.y1],
                    }
                )
    return lines


def _ocr_page(doc: pymupdf.Document, page: pymupdf.Page, lines: list[dict]) -> None:
    fonts = PageLegacyFonts(doc, page)
    if not fonts.faces:
        return
    groups: dict[int, list[tuple[int, str]]] = {}
    buffers: dict[int, bytes] = {}
    for index, line in enumerate(lines):
        legacy = line["hi_legacy"]
        if not legacy:
            continue
        face = fonts.covers(legacy)
        if face is None:
            continue
        key = id(face[0])
        buffers[key] = face[0]
        groups.setdefault(key, []).append((index, legacy))
    for key, items in groups.items():
        strings = [item[1] for item in items]
        recognized = ocr_legacy_strings(buffers[key], strings)
        for (index, _legacy), text in zip(items, recognized):
            if has_devanagari(text):
                lines[index]["hi"] = _clean(text)


def _page_tables(page: pymupdf.Page, page_index: int) -> list[dict]:
    tables = []
    try:
        found = page.find_tables()
    except Exception:
        return tables
    for table in found.tables:
        bbox = pymupdf.Rect(table.bbox)
        if bbox.y0 < 70 and bbox.height < 50:
            continue
        rows = table.extract() or []
        cleaned = []
        for row in rows:
            cells = []
            for cell in row:
                text = _clean(cell or "")
                if WATERMARK_RE.search(text):
                    text = ""
                cells.append(text)
            if any(cells):
                cleaned.append(cells)
        if len(cleaned) < 2:
            continue
        col = 0 if bbox.x0 < 300 else 1
        tables.append(
            {
                "page": page_index,
                "col": col,
                "bbox": [bbox.x0, bbox.y0, bbox.x1, bbox.y1],
                "rows": cleaned,
            }
        )
    return tables


def _page_images(page: pymupdf.Page, page_index: int) -> list[dict]:
    images = []
    data = page.get_text("dict")
    for block in data["blocks"]:
        if block.get("type") != 1:
            continue
        bbox = pymupdf.Rect(block["bbox"])
        if bbox.width < 36 or bbox.height < 36:
            continue
        if bbox.width > 520 and bbox.height > 700:
            continue
        images.append(
            {
                "page": page_index,
                "col": 0 if bbox.x0 < 300 else 1,
                "bbox": [bbox.x0, bbox.y0, bbox.x1, bbox.y1],
                "y": bbox.y0,
            }
        )
    return images


def _save_image(page: pymupdf.Page, bbox: list[float], dest: Path) -> None:
    clip = pymupdf.Rect(bbox)
    pix = page.get_pixmap(clip=clip, dpi=140, alpha=False)
    dest.parent.mkdir(parents=True, exist_ok=True)
    pix.save(dest)


def _is_code(text: str) -> bool:
    compact = " ".join(text.split())
    if CODE_RE.search(compact):
        return True
    first = compact.split(" ", 1)[0].upper().rstrip(";")
    sql_words = {"SELECT", "FROM", "WHERE", "INSERT", "UPDATE", "DELETE", "CREATE", "JOIN", "HAVING"}
    return first in sql_words and len(compact.split()) <= 4


def _blocks_from_stem(stem_lines: list[dict], tables: list[dict]) -> list[dict]:
    emitted_tables: set[int] = set()
    blocks: list[dict] = []
    paragraph_en: list[str] = []
    paragraph_hi: list[str] = []
    code_en: list[str] = []

    def flush_paragraph() -> None:
        nonlocal paragraph_en, paragraph_hi
        if paragraph_en or paragraph_hi:
            blocks.append(
                {
                    "type": "paragraph",
                    "text": "\n".join(paragraph_en).strip(),
                    "translations": {"hi": "\n".join(paragraph_hi).strip()},
                }
            )
            paragraph_en, paragraph_hi = [], []

    def flush_code() -> None:
        nonlocal code_en
        if code_en:
            blocks.append({"type": "code", "text": "\n".join(code_en).strip(), "translations": {}})
            code_en = []

    def line_in_table(line: dict):
        bbox = line["bbox"]
        for index, table in enumerate(tables):
            tb = table["bbox"]
            if table["page"] != line["page"] or table["col"] != line["col"]:
                continue
            if bbox[1] >= tb[1] - 6 and bbox[3] <= tb[3] + 8:
                return index, table
        return None

    for line in stem_lines:
        overlap = line_in_table(line)
        if overlap is not None:
            index, table = overlap
            if index in emitted_tables:
                continue
            flush_code()
            flush_paragraph()
            rows = []
            for row in table["rows"]:
                cells = []
                for cell in row:
                    text = cell
                    hi = ""
                    if " / " in cell and has_devanagari(cell.split(" / ", 1)[1]):
                        text, hi = cell.split(" / ", 1)
                    elif has_devanagari(cell) and not re.search(r"[A-Za-z]{3}", cell):
                        text, hi = "", cell
                    cells.append({"text": text.strip(), "translations": {"hi": hi.strip()} if hi else {}})
                rows.append({"cells": cells})
            blocks.append({"type": "table", "rows": rows})
            emitted_tables.add(index)
            continue
        short_code_tail = bool(code_en and line["en"] and len(line["en"].split()) <= 2 and not line["en"].endswith("?"))
        if _is_code(line["en"]) or short_code_tail:
            flush_paragraph()
            code_en.append(line["en"])
            if line["hi"]:
                paragraph_hi.append(line["hi"])
            continue
        if code_en:
            flush_code()
        if line["en"]:
            paragraph_en.append(line["en"])
        if line["hi"]:
            paragraph_hi.append(line["hi"])
    flush_code()
    flush_paragraph()
    return [block for block in blocks if block.get("text") or block.get("rows")]


def _join(lines: list[dict], key: str) -> str:
    parts = [line[key] for line in lines if line.get(key)]
    return "\n".join(parts).strip()


def _split_option(en: str, hi: str) -> tuple[str, str]:
    en = en.strip(" /")
    if "/" in en and not hi:
        left, right = en.split("/", 1)
        if re.search(r"[A-Za-z]{3}", left) and not re.search(r"[A-Za-z]{4}", right):
            return left.strip(), right.strip()
    return en, hi


def parse_questions(lines: list[dict], tables: list[dict], images: list[dict], chapter: str) -> list[dict]:
    starts = [i for i, line in enumerate(lines) if QUESTION_RE.match(line["en"])]
    questions = []
    for pos, start in enumerate(starts):
        end = starts[pos + 1] if pos + 1 < len(starts) else len(lines)
        chunk = lines[start:end]
        match = QUESTION_RE.match(chunk[0]["en"])
        if not match:
            continue
        number = int(match.group(1))
        chunk[0] = {**chunk[0], "en": match.group(2).strip()}
        answer_at = None
        correct = None
        for index, line in enumerate(chunk):
            ans = ANSWER_RE.match(line["en"])
            if ans:
                answer_at = index
                correct = ans.group(1).lower()
                chunk[index] = {**line, "en": ans.group(2).strip()}
                break
        body = chunk[:answer_at] if answer_at is not None else chunk
        explanation_lines = chunk[answer_at:] if answer_at is not None else []
        source = None
        kept_body = []
        for line in body:
            exam = EXAM_RE.match(line["en"])
            if exam and source is None:
                source = _clean(exam.group(1))
                continue
            kept_body.append(line)
        option_start = None
        for index, line in enumerate(kept_body):
            if OPTION_RE.match(line["en"]):
                option_start = index
                break
        stem_lines = kept_body if option_start is None else kept_body[:option_start]
        option_lines = [] if option_start is None else kept_body[option_start:]
        options = []
        current = None
        for line in option_lines:
            opt = OPTION_RE.match(line["en"])
            if opt:
                if current:
                    options.append(current)
                en, hi = _split_option(opt.group(2), line["hi"])
                current = {"letter": opt.group(1).lower(), "en": en, "hi": hi}
            elif current:
                if line["en"]:
                    current["en"] = _clean(current["en"] + " " + line["en"])
                if line["hi"]:
                    current["hi"] = _clean(current["hi"] + " " + line["hi"])
        if current:
            options.append(current)
        region_tables = [
            table
            for table in tables
            if any(
                table["page"] == line["page"] and table["col"] == line["col"]
                and line["bbox"][1] >= table["bbox"][1] - 6
                and line["bbox"][3] <= table["bbox"][3] + 8
                for line in stem_lines
            )
        ]
        blocks = _blocks_from_stem(stem_lines, region_tables)
        prose_en = []
        prose_hi = []
        for block in blocks:
            if block["type"] == "paragraph":
                if block.get("text"):
                    prose_en.append(block["text"])
                hi = (block.get("translations") or {}).get("hi") or ""
                if hi:
                    prose_hi.append(hi)
            elif block["type"] == "code" and block.get("text"):
                prose_en.append(block["text"])
        region_images = []
        if stem_lines:
            for image in images:
                if any(
                    image["page"] == line["page"]
                    and image["col"] == line["col"]
                    and image["y"] >= line["bbox"][1] - 8
                    and image["y"] <= line["bbox"][3] + 8
                    for line in stem_lines
                ):
                    region_images.append(image)
        for image in region_images:
            blocks.append(
                {
                    "type": "image",
                    "page": image["page"],
                    "bbox": image["bbox"],
                    "text": "",
                    "translations": {},
                }
            )
        questions.append(
            {
                "number": number,
                "page": chunk[0]["page"] + 1,
                "chapter": chapter,
                "source": source,
                "content": "\n".join(prose_en).strip(),
                "translations": {"hi": "\n".join(prose_hi).strip()},
                "options": options,
                "correctLetter": correct,
                "explanation": _join(explanation_lines, "en"),
                "explanationTranslations": {"hi": _join(explanation_lines, "hi")},
                "blocks": blocks,
            }
        )
    return questions


def assess(question: dict) -> dict:
    flags: list[str] = []
    content = question.get("content") or ""
    hindi = (question.get("translations") or {}).get("hi") or ""
    options = question.get("options") or []
    if not content and not hindi:
        flags.append("empty_stem")
    if not content:
        flags.append("english_missing")
    if not hindi:
        flags.append("hindi_missing")
    elif not has_devanagari(hindi):
        flags.append("hindi_not_devanagari")
    legacy = re.compile(r"(keâ|ceW|Deef|efJe|nw~|GheÙ|keä)")
    if legacy.search(content) or legacy.search(hindi):
        flags.append("legacy_keystrokes_remain")
    if len(options) < 2:
        flags.append("options_incomplete")
    letters = [opt["letter"] for opt in options]
    if question.get("correctLetter") and question["correctLetter"] not in letters:
        flags.append("answer_not_in_options")
    if not question.get("correctLetter"):
        flags.append("answer_missing")
    if not question.get("chapter"):
        flags.append("chapter_missing")
    for block in question.get("blocks") or []:
        if block.get("type") == "table":
            rows = block.get("rows") or []
            width = {len(row.get("cells") or []) for row in rows}
            if len(width) > 1:
                flags.append("table_ragged")
    confidence = 1.0
    penalties = {
        "empty_stem": 0.7,
        "english_missing": 0.25,
        "hindi_missing": 0.2,
        "hindi_not_devanagari": 0.45,
        "legacy_keystrokes_remain": 0.5,
        "options_incomplete": 0.45,
        "answer_not_in_options": 0.35,
        "answer_missing": 0.25,
        "chapter_missing": 0.05,
        "table_ragged": 0.1,
    }
    for flag in set(flags):
        confidence -= penalties.get(flag, 0.05)
    confidence = max(0.0, round(confidence, 2))
    if "empty_stem" in flags or "legacy_keystrokes_remain" in flags:
        status = "needs_correction"
    elif confidence >= 0.75 and "options_incomplete" not in flags:
        status = "extracted"
    elif confidence >= 0.45:
        status = "pending_review"
    else:
        status = "needs_correction"
    question["qualityFlags"] = sorted(set(flags))
    question["extractionConfidence"] = confidence
    question["qualityStatus"] = status
    return question


def extract(pdf_path: Path, pages: list[int] | None = None) -> list[dict]:
    doc = pymupdf.open(pdf_path)
    selected = pages if pages is not None else list(range(2, doc.page_count))
    chapter = "Digital Logic Circuits"
    questions: list[dict] = []
    for page_index in selected:
        page = doc[page_index]
        chapter = detect_chapter(page.get_text(), chapter)
        lines = _page_lines(page, page_index)
        _ocr_page(doc, page, lines)
        tables = _page_tables(page, page_index)
        images = _page_images(page, page_index)
        # OCR legacy fragments that tables still hold.
        legacy_mark = re.compile(r"(keâ|ceW|Deef|efJe|Ù|ä|Ghe|keä)")
        fragments: list[str] = []
        slots: list[tuple[dict, int, int, str]] = []
        for table in tables:
            for r, row in enumerate(table["rows"]):
                for c, cell in enumerate(row):
                    for piece in cell.split("\n"):
                        target = piece.split("/", 1)[1] if "/" in piece else piece
                        if legacy_mark.search(target):
                            fragments.append(target.strip())
                            slots.append((table, r, c, target))
        if fragments:
            fonts = PageLegacyFonts(doc, page)
            if fonts.faces:
                face = fonts.covers(fragments[0]) or fonts.faces[0]
                recognized = ocr_legacy_strings(face[0], fragments)
                for (table, r, c, original_piece), text in zip(slots, recognized):
                    if has_devanagari(text):
                        table["rows"][r][c] = table["rows"][r][c].replace(original_piece, text, 1)
        parsed = parse_questions(lines, tables, images, chapter)
        for question in parsed:
            for block in question["blocks"]:
                if block.get("type") != "image":
                    continue
                name = f"p{block['page'] + 1}_{len(questions)}_{len([b for b in question['blocks'] if b.get('type')=='image'])}.png"
                dest = IMAGE_DIR / name
                _save_image(page, block["bbox"], dest)
                block["imageUrl"] = f"/question-images/{name}"
                block.pop("bbox", None)
            questions.append(assess(question))
        print(f"page {page_index + 1}: {len(parsed)} questions", flush=True)
    doc.close()
    return questions


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", default=str(PDF_PATH))
    parser.add_argument("--pages", default="", help="Comma-separated 1-based page numbers")
    parser.add_argument("--out", default=str(OUTPUT_PATH))
    args = parser.parse_args()
    pages = None
    if args.pages:
        pages = [int(part) - 1 for part in args.pages.split(",") if part.strip()]
    questions = extract(Path(args.pdf), pages)
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(questions, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"wrote {len(questions)} questions to {out}")


if __name__ == "__main__":
    main()
