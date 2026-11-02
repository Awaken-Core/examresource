"""
Comprehensive audit of every single question number physically printed in the PDF.
Scans all text, identifies every question header, and compares against v3 extraction.
"""
import pymupdf
import re
import json
from collections import defaultdict

doc = pymupdf.open('docs/Computer-Practice-Set-All-Exams-Final.pdf')

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

# Extract all text in reading order
current_ch = "Digital Logic Circuits"
# Collect all printed questions: chapter -> set of numbers
printed_questions = defaultdict(list)

# We search for lines that start with a number followed by '.' and have an Ans. within 3000 chars
ans_re = re.compile(r'\bAns[\.\,\s\-]*[\(\[]?\s*([a-eA-E])', re.IGNORECASE)

for pno in range(2, len(doc)):
    page = doc[pno]
    full_text = page.get_text()
    current_ch = detect_chapter(full_text, current_ch)
    
    for col_rect in [LEFT_COL, RIGHT_COL]:
        blocks = page.get_text("blocks", clip=col_rect)
        blocks.sort(key=lambda b: b[1])
        col_text = "\n".join(b[4].strip() for b in blocks if b[4].strip())
        
        # Find all question starts
        for match in re.finditer(r'(?:^|\n)\s*(\d{1,4})\.\s+', col_text):
            num = int(match.group(1))
            # Don't pick up sub-steps like "1.", "2." inside explanations if num > 500
            if num > 500:
                continue
            # Look ahead up to 1500 chars to see if it has options or Ans.
            snippet = col_text[match.end():match.end() + 1500]
            has_ans = bool(ans_re.search(snippet))
            has_opts = bool(re.search(r'\([a-d]\)', snippet, re.IGNORECASE))
            if has_ans or has_opts:
                printed_questions[current_ch].append((num, pno + 1))

# Compare with v3
v3_data = json.load(open('docs/extracted/v3_final_questions.json', 'r', encoding='utf-8'))
v3_valid = [q for q in v3_data if len(q['options']) >= 2]
v3_by_ch = defaultdict(set)
for q in v3_valid:
    v3_by_ch[q['chapter']].add(q['questionNumber'])

with open('docs/extracted/comprehensive_audit.txt', 'w', encoding='utf-8') as f:
    f.write("COMPREHENSIVE PHYSICAL AUDIT OF PDF QUESTIONS\n")
    f.write("=" * 70 + "\n\n")
    
    grand_printed = 0
    grand_v3 = 0
    
    for ch in sorted(CHAPTER_MAP.values()):
        # Deduplicate printed
        seen = set()
        unique_printed = []
        for num, p in printed_questions[ch]:
            if num not in seen:
                seen.add(num)
                unique_printed.append((num, p))
        
        unique_nums = set(num for num, _ in unique_printed)
        v3_nums = v3_by_ch[ch]
        
        missing_in_v3 = unique_nums - v3_nums
        extra_in_v3 = v3_nums - unique_nums
        
        grand_printed += len(unique_nums)
        grand_v3 += len(v3_nums)
        
        f.write(f"Chapter: {ch}\n")
        f.write(f"  Physically printed questions detected: {len(unique_nums)}\n")
        f.write(f"  Valid in V3 extracted: {len(v3_nums)}\n")
        if missing_in_v3:
            f.write(f"  In PDF but missing in V3: {sorted(missing_in_v3)}\n")
        else:
            f.write(f"  All printed questions extracted: 100% MATCH!\n")
        if extra_in_v3:
            f.write(f"  Extra in V3: {sorted(extra_in_v3)}\n")
        f.write("\n")
        
    f.write("=" * 70 + "\n")
    f.write(f"GRAND TOTAL PHYSICALLY PRINTED: {grand_printed}\n")
    f.write(f"GRAND TOTAL V3 EXTRACTED: {grand_v3}\n")
    f.write(f"COVERAGE: {grand_v3 / grand_printed * 100:.2f}%\n")

doc.close()
print("Audit complete! Check docs/extracted/comprehensive_audit.txt")

