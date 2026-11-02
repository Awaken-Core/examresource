import json, sys
import pymupdf
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

bad_qs = json.load(open("docs/extracted/bad_option_questions.json", "r", encoding="utf-8"))
doc = pymupdf.open("docs/Computer-Practice-Set-All-Exams-Final.pdf")

print("Checking source pages in PDF for questions...")
for idx, q in enumerate(bad_qs[:15]):
    page = q.get("sourcePage")
    num = q.get("sourceQuestionNumber")
    print(f"\n--- Q {idx+1}: ID {q['id']}, Page {page}, Num {num} ---")
    print(f"Content: {repr(q['content'][:80])}")
    print(f"Current options ({len(q['options'])}): {[o['content'] for o in q['options']]}")
    if page and page <= len(doc):
        page_text = doc[page - 1].get_text()
        lines = page_text.splitlines()
        for i, l in enumerate(lines):
            if num and (f"{num}." in l or f"{num} " in l or f"Q.{num}" in l or f"({num})" in l):
                print(f"  Snippet from PDF page {page}:")
                for s in lines[max(0, i-1):min(len(lines), i+18)]:
                    print(f"    | {s}")
                break
