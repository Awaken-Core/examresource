"""
Deep structural analysis: scan ALL question numbers across the entire PDF,
including sub-sections within chapters. Count every numbered item.
This will reveal if chapters have sub-sections with independent numbering.
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

# For each chapter, look for sub-section headers that might reset numbering
# Also scan for any lines that look like "sub-topic" headers within chapters
SUBSECTION_PATTERNS = [
    r'^[A-Z][A-Za-z\s&,]+:?\s*$',  # Title-case topic headers
    r'^\d+\.\s+[A-Z]',  # Numbered sub-sections
]

# Scan all Q numbers and track resets
chapter_q_data = defaultdict(list)  # chapter -> list of (page, q_num)
current_chapter = "Digital Logic Circuits"

ans_re = re.compile(r'\bAns[\.\,\s\-]*[\(\[]?\s*([a-eA-E])', re.IGNORECASE)
opt_re = re.compile(r'\([a-eA-E]\)', re.IGNORECASE)
q_re = re.compile(r'(?:^|\n)\s*(\d{1,4})\.\s+', re.MULTILINE)

page_annotations = []  # For each page: {page_num, chapter, questions_found, q_nums}

for pno in range(2, len(doc)):
    page = doc[pno]
    full_text = page.get_text()
    current_chapter = detect_chapter(full_text, current_chapter)
    
    # Find all question numbers on this page
    q_nums = []
    for m in q_re.finditer(full_text):
        num = int(m.group(1))
        if num == 0 or num > 600:
            continue
        # Check if followed by options or answer within 1500 chars
        snippet = full_text[m.end():m.end()+1500]
        has_opts = bool(opt_re.search(snippet))
        has_ans = bool(ans_re.search(snippet))
        if has_opts or has_ans:
            q_nums.append(num)
    
    if q_nums:
        page_annotations.append({
            'page': pno + 1,
            'chapter': current_chapter,
            'q_nums': sorted(set(q_nums))
        })
        for n in set(q_nums):
            chapter_q_data[current_chapter].append((pno + 1, n))

doc.close()

# Now analyze: do chapters have multiple numbering sequences?
print("DEEP STRUCTURAL ANALYSIS - CHAPTER QUESTION NUMBERING")
print("=" * 80)

total_unique_q = 0
for chapter in sorted(chapter_q_data.keys()):
    entries = chapter_q_data[chapter]
    all_nums = [n for _, n in entries]
    unique_nums = set(all_nums)
    max_q = max(unique_nums) if unique_nums else 0
    
    # Detect resets: look for sequences that go high then start over
    pages_and_nums = sorted(entries, key=lambda x: x[0])
    
    # Find potential resets (q_num goes from high back to low)
    resets = []
    prev_max = 0
    for i in range(1, len(pages_and_nums)):
        curr_num = pages_and_nums[i][1]
        prev_num = pages_and_nums[i-1][1]
        # If numbering drops significantly (more than 50), might be a reset
        if curr_num < prev_num - 50 and prev_num > 50:
            resets.append((pages_and_nums[i-1][0], prev_num, pages_and_nums[i][0], curr_num))
    
    total_unique_q += len(unique_nums)
    print(f"\n{chapter}:")
    print(f"  Unique Q#s: {len(unique_nums)}, Max Q#: {max_q}, Occurrences: {len(all_nums)}")
    if resets:
        print(f"  *** DETECTED NUMBERING RESETS ({len(resets)} resets):")
        for r in resets[:5]:
            print(f"      Page {r[0]} Q#{r[1]} -> Page {r[2]} Q#{r[3]}")

print(f"\n{'='*80}")
print(f"TOTAL UNIQUE QUESTION NUMBERS ACROSS ALL CHAPTERS: {total_unique_q}")
print(f"\nNow checking for duplicate/repeated question numbers (different pages, same number):")

dup_count = 0
for chapter in sorted(chapter_q_data.keys()):
    entries = chapter_q_data[chapter]
    from collections import Counter
    num_freq = Counter(n for _, n in entries)
    dups = {n: cnt for n, cnt in num_freq.items() if cnt > 1}
    if dups:
        print(f"  {chapter}: {len(dups)} duplicate Q#s (e.g. Q#{list(dups.keys())[:5]})")
        dup_count += sum(cnt - 1 for cnt in dups.values())

print(f"\nTotal duplicate Q# appearances: {dup_count}")
print(f"If counting each occurrence as separate Q: {total_unique_q + dup_count}")

