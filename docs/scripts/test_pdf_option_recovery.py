import json
import re
import sys
import pymupdf
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

bad_qs = json.load(open("docs/extracted/bad_option_questions.json", "r", encoding="utf-8"))
doc = pymupdf.open("docs/Computer-Practice-Set-All-Exams-Final.pdf")

OPT_PATTERN = re.compile(r"^\s*\(([a-d])\)\s*(.+)$", re.M)

for idx, q in enumerate(bad_qs):
    page_num = q.get("sourcePage")
    q_num = q.get("sourceQuestionNumber")
    if not page_num:
        continue
    
    page = doc[page_num - 1]
    text = page.get_text()
    
    # Try finding the question block
    # Look for question number
    q_marker = f"{q_num}."
    pos = text.find(q_marker)
    if pos == -1:
        q_marker = f"{q_num} "
        pos = text.find(q_marker)
    
    found_opts = {}
    if pos != -1:
        # Get next 1500 chars
        snippet = text[pos:pos+1500]
        # Look for next question or Ans
        ans_pos = snippet.find("Ans.")
        if ans_pos != -1:
            snippet = snippet[:ans_pos]
        
        # Search for (a), (b), (c), (d)
        matches = re.findall(r"\(([a-d])\)\s*([^(\n]+(?:\n(?!\([a-d]\))[^(\n]+)*)", snippet)
        for letter, content in matches:
            found_opts[letter.lower()] = content.strip()

    print(f"[{idx+1}] ID: {q['id']}, P{page_num} Q{q_num}: Current {len(q['options'])} opts, Found in PDF {len(found_opts)} opts: {list(found_opts.keys())}")
    if len(found_opts) == 4:
        print(f"    -> Full 4 options recovered from PDF: {found_opts}")

