"""
The numbering resets reveal sub-sections within each chapter.
For example, "Digital Logic Circuits" chapter has topic sub-sections like:
  - Number Systems (Q# 1-65)
  - Boolean Algebra (Q# 1-something)
  - Logic Gates (Q# 1-something)
  etc.

Let me scan the actual sub-section topic headers that cause numbering resets,
and count total questions across ALL sub-sections.
"""
import pymupdf
import re
from collections import defaultdict

doc = pymupdf.open('docs/Computer-Practice-Set-All-Exams-Final.pdf')

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

# Now let's look at what happens JUST before a numbering reset
# to find sub-section topic headers
ans_re = re.compile(r'\bAns[\.\,\s\-]*[\(\[]?\s*([a-eA-E])', re.IGNORECASE)
opt_re = re.compile(r'\([a-eA-E]\)', re.IGNORECASE)
q_re = re.compile(r'(?:^|\n)[ \t]*(\d{1,4})\.[ \t]+(\S)', re.MULTILINE)

current_chapter = "Digital Logic Circuits"
all_page_data = []

for pno in range(2, len(doc)):
    page = doc[pno]
    full_text = page.get_text()
    current_chapter = detect_chapter(full_text, current_chapter)
    all_page_data.append({
        'page': pno + 1,
        'chapter': current_chapter,
        'text': full_text
    })

doc.close()

# Find reset pages and look at context around them
SAMPLE_RESET_PAGES = {
    # (chapter, page_number) -> look for sub-section header just before Q#1
    "Digital Logic Circuits": [14, 17, 24, 27, 36],
    "Data Structures & Algorithms": [124, 128, 129, 136],
}

print("SUBSECTION HEADER DETECTION")
print("=" * 80)
print("Looking at pages where Q numbering resets to 1...")

with open('docs/extracted/subsection_analysis.txt', 'w', encoding='utf-8') as f:
    for pdata in all_page_data:
        text = pdata['text']
        pg = pdata['page']
        ch = pdata['chapter']
        
        # Check if page contains Q#1 (likely a new sub-section start)
        if re.search(r'(?:^|\n)[ \t]*1\.[ \t]+\S', text, re.MULTILINE):
            # Get lines before Q#1 to find the section header
            lines = text.split('\n')
            q1_line_idx = -1
            for i, line in enumerate(lines):
                if re.match(r'[ \t]*1\.[ \t]+\S', line):
                    q1_line_idx = i
                    break
            
            if q1_line_idx > 0:
                # Get preceding non-empty lines (up to 5)
                context_before = []
                for i in range(max(0, q1_line_idx - 8), q1_line_idx):
                    l = lines[i].strip()
                    if l and len(l) > 3:
                        context_before.append(l)
                
                if context_before:
                    f.write(f"\n--- PAGE {pg} [{ch}] ---\n")
                    f.write(f"Context before Q#1:\n")
                    for line in context_before[-4:]:
                        f.write(f"  | {line[:80]}\n")

print("Saved to docs/extracted/subsection_analysis.txt")
print("\nNow computing TOTAL OCCURRENCE COUNT (counting each sub-section question separately)...")

# Re-scan: count total "question-like items" with options/answer, regardless of number resets
current_chapter = "Digital Logic Circuits"
total_q_occurrences = defaultdict(int)

doc = pymupdf.open('docs/Computer-Practice-Set-All-Exams-Final.pdf')
for pno in range(2, len(doc)):
    page = doc[pno]
    full_text = page.get_text()
    current_chapter = detect_chapter(full_text, current_chapter)
    
    for m in re.finditer(r'(?:^|\n)[ \t]*(\d{1,4})\.[ \t]+', full_text, re.MULTILINE):
        num = int(m.group(1))
        if num == 0 or num > 600:
            continue
        snippet = full_text[m.end():m.end()+800]
        has_opts = bool(opt_re.search(snippet))
        has_ans = bool(ans_re.search(snippet))
        if has_opts or has_ans:
            total_q_occurrences[current_chapter] += 1

doc.close()

print("\nTotal Q occurrences per chapter (counting sub-section questions separately):")
grand_total = 0
for ch in sorted(total_q_occurrences.keys()):
    c = total_q_occurrences[ch]
    grand_total += c
    print(f"  {ch}: {c}")
print(f"\nGRAND TOTAL (all occurrences): {grand_total}")

