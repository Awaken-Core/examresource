"""
Targeted page-level extraction for the 18 completely missing questions.
Dumps raw text from pages where these questions should exist.
"""
import pymupdf
import re
from pathlib import Path

PDF_PATH = Path("docs/Computer-Practice-Set-All-Exams-Final.pdf")
doc = pymupdf.open(str(PDF_PATH))

LEFT_COL = pymupdf.Rect(50, 65, 308, 785)
RIGHT_COL = pymupdf.Rect(308, 65, 560, 785)

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

def detect_chapter(page_text, current):
    lines = [l.strip() for l in page_text.split('\n') if l.strip()]
    for line in lines[:4]:
        for key in CHAPTER_MAP:
            if key.lower() in line.lower():
                return CHAPTER_MAP[key]
    return current

# Build page->chapter map
page_chapters = {}
current_ch = "Digital Logic Circuits"
for pno in range(len(doc)):
    current_ch = detect_chapter(doc[pno].get_text(), current_ch)
    page_chapters[pno] = current_ch

# Missing questions to find
MISSING = [
    ("Digital Logic Circuits", 82),
    ("Digital Logic Circuits", 311),
    ("Object Oriented Programming (C++ / Java)", 20),
    ("Object Oriented Programming (C++ / Java)", 71),
    ("Operating Systems", 86),
    ("Database Management Systems (DBMS / SQL)", 247),
    ("Computer Networks & Data Communication", 192),
    ("Computer Networks & Data Communication", 291),
    ("Computer Networks & Data Communication", 292),
    ("Computer Networks & Data Communication", 293),
    ("Computer Networks & Data Communication", 294),
    ("Computer Networks & Data Communication", 295),
    ("Computer Networks & Data Communication", 296),
    ("Computer Networks & Data Communication", 297),
    ("Computer Networks & Data Communication", 298),
    ("Computer Networks & Data Communication", 299),
    ("Software Engineering", 132),
    ("Internet & Web Technologies", 71),
]

import sys

# For each missing question, search the relevant chapter pages
for target_ch, target_num in MISSING:
    ch_pages = sorted([pno for pno, ch in page_chapters.items() if ch == target_ch])
    
    sys.stdout.buffer.write(f"\n{'='*70}\n".encode('utf-8'))
    sys.stdout.buffer.write(f"LOOKING FOR: {target_ch} Q#{target_num}\n".encode('utf-8'))
    sys.stdout.buffer.write(f"Chapter pages: {ch_pages[0]+1} to {ch_pages[-1]+1} ({len(ch_pages)} pages)\n".encode('utf-8'))
    
    found_pages = []
    for pno in ch_pages:
        page = doc[pno]
        full = page.get_text()
        # Search for the question number pattern
        patterns = [
            rf'(?:^|\n)\s*{target_num}\.\s+',  # Standard: "82. "
            rf'(?:^|\n)\s*{target_num}\.\s*\n',  # Number on its own line
        ]
        for pat in patterns:
            if re.search(pat, full, re.MULTILINE):
                found_pages.append(pno)
                break
    
    if found_pages:
        for pno in found_pages:
            sys.stdout.buffer.write(f"\n  FOUND on page {pno+1}. Column text:\n".encode('utf-8'))
            page = doc[pno]
            for ci, col_rect in enumerate([LEFT_COL, RIGHT_COL]):
                blocks = page.get_text("blocks", clip=col_rect)
                blocks.sort(key=lambda b: b[1])
                col_text = "\n".join(b[4].strip() for b in blocks if b[4].strip())
                # Find context around the question number
                m = re.search(rf'(?:^|\n)(\s*{target_num}\.\s+.*?)(?=\n\s*\d{{1,3}}\.\s+|\Z)', col_text, re.DOTALL)
                if m:
                    snippet = m.group(0)[:500]
                    sys.stdout.buffer.write(f"  Col {ci} snippet:\n".encode('utf-8'))
                    sys.stdout.buffer.write(f"  ---\n{snippet}\n  ---\n".encode('utf-8', errors='replace'))
    else:
        # Search for nearby questions to determine range
        sys.stdout.buffer.write(f"  NOT FOUND anywhere! Searching for Q#{target_num-1} and Q#{target_num+1}...\n".encode('utf-8'))
        for near_num in [target_num - 1, target_num + 1]:
            for pno in ch_pages:
                full = doc[pno].get_text()
                if re.search(rf'(?:^|\n)\s*{near_num}\.\s+', full, re.MULTILINE):
                    sys.stdout.buffer.write(f"    Q#{near_num} found on page {pno+1}\n".encode('utf-8'))
                    # Show bottom of left col and top of right col for cross-col split check
                    page = doc[pno]
                    for ci, col_rect in enumerate([LEFT_COL, RIGHT_COL]):
                        blocks = page.get_text("blocks", clip=col_rect)
                        blocks.sort(key=lambda b: b[1])
                        col_text = "\n".join(b[4].strip() for b in blocks if b[4].strip())
                        # Show last 200 chars of col 0 and first 200 of col 1
                        if ci == 0:
                            sys.stdout.buffer.write(f"    Col 0 (last 300 chars):\n    {col_text[-300:]}\n".encode('utf-8', errors='replace'))
                        else:
                            sys.stdout.buffer.write(f"    Col 1 (first 300 chars):\n    {col_text[:300]}\n".encode('utf-8', errors='replace'))
                    break

doc.close()

