"""
Targeted fix script to recover the last ~19 missing questions.
Handles: match-the-following tables, cross-page splits, and noise filtering.
"""
import json
import re
import pymupdf
from pathlib import Path
from collections import defaultdict

PDF_PATH = Path("docs/Computer-Practice-Set-All-Exams-Final.pdf")
V2_PATH = Path("docs/extracted/v2_questions.json")
OUTPUT_PATH = Path("docs/extracted/v3_final_questions.json")

# Load v2 data
v2_data = json.load(open(V2_PATH, 'r', encoding='utf-8'))

# Index existing valid questions by (chapter, qnum)
valid_index = {}
all_index = {}
for q in v2_data:
    key = (q["chapter"], q["questionNumber"])
    all_index[key] = q
    if len(q["options"]) >= 2:
        valid_index[key] = q

print(f"V2 data: {len(v2_data)} total, {len(valid_index)} valid")

# ============================================================
# STEP 1: Remove noise items (numbers from explanation text)
# These are items where questionNumber > max expected for the chapter
# ============================================================
EXPECTED_MAX = {
    "Digital Logic Circuits": 382,
    "Computer Organization & Architecture": 265,
    "Data Structures & Algorithms": 466,
    "Programming Concepts in C": 156,
    "Object Oriented Programming (C++ / Java)": 131,
    "Operating Systems": 378,
    "Database Management Systems (DBMS / SQL)": 432,
    "Computer Networks & Data Communication": 421,
    "Software Engineering": 229,
    "Internet & Web Technologies": 137,
    "Computer Fundamentals, Security & MS Office": 352,
}

noise_removed = 0
clean_data = []
for q in v2_data:
    ch = q["chapter"]
    qn = q["questionNumber"]
    max_expected = EXPECTED_MAX.get(ch, 500)
    
    if qn > max_expected:
        noise_removed += 1
        continue
    if qn == 0:
        noise_removed += 1
        continue
    clean_data.append(q)

print(f"Removed {noise_removed} noise items (q# > expected max or q#=0)")

# ============================================================
# STEP 2: Fix "Match the following" questions
# These have List-I/List-II or Column-I/Column-II format
# Options are encoded as "Codes:" section with (a) 1-B, 2-A, etc.
# ============================================================

# Identify which questions are match-the-following with 0 options
match_questions = []
for q in clean_data:
    if len(q["options"]) < 2:
        content = q["content"].lower()
        if any(kw in content for kw in ["match", "list-i", "list-ii", "column-i", "column-ii"]):
            match_questions.append(q)

print(f"Found {len(match_questions)} match-the-following questions with <2 options")

# For match-the-following, we need to re-extract from the PDF
# The options are typically in the "Codes:" section after the table
doc = pymupdf.open(str(PDF_PATH))

LEFT_COL = pymupdf.Rect(50, 65, 308, 785)
RIGHT_COL = pymupdf.Rect(308, 65, 560, 785)

def get_surrounding_text(doc, page_num, search_text, radius=2):
    """Get text from pages around the question to find options that span pages."""
    combined = ""
    for p in range(max(0, page_num - 1), min(len(doc), page_num + radius)):
        page = doc[p]
        for col_rect in [LEFT_COL, RIGHT_COL]:
            blocks = page.get_text("blocks", clip=col_rect)
            blocks.sort(key=lambda b: b[1])
            col_text = "\n".join(b[4].strip() for b in blocks if b[4].strip())
            combined += col_text + "\n"
    return combined

def extract_match_options(text_around_q, q_num):
    """
    For match-the-following questions, look for Codes: section with options like:
    (a) A-1, B-2, C-3, D-4
    (b) A-2, B-1, C-4, D-3
    etc.
    """
    # Find the question start
    q_pattern = re.compile(rf'(?:^|\n)\s*{q_num}\.\s+', re.MULTILINE)
    m = q_pattern.search(text_around_q)
    if not m:
        return []
    
    # Get text after question start until next question
    start = m.end()
    next_q = re.search(rf'(?:^|\n)\s*{q_num + 1}\.\s+', text_around_q[start:], re.MULTILINE)
    if next_q:
        chunk = text_around_q[start:start + next_q.start()]
    else:
        chunk = text_around_q[start:start + 2000]
    
    # Find answer line first to know where options end
    ans_re = re.compile(r'\bAns[\.\,\s\-]*[\(\[]?\s*([a-eA-E])\s*[\)\]]?\s*[:\.\-]?', re.IGNORECASE)
    m_ans = ans_re.search(chunk)
    if m_ans:
        chunk = chunk[:m_ans.start()]
    
    # Look for option patterns: (a) followed by content
    opt_re = re.compile(r'\(([a-dA-D])\)\s*(.*?)(?=\([a-dA-D]\)|$)', re.DOTALL)
    matches = list(opt_re.finditer(chunk))
    
    options = []
    seen = set()
    for m in matches:
        letter = m.group(1).lower()
        if letter in seen:
            continue
        seen.add(letter)
        val = m.group(2).strip()
        # Clean up multi-line
        val = ' '.join(l.strip() for l in val.split('\n') if l.strip())[:200]
        if val and len(val) > 2:
            options.append({
                "letter": letter,
                "content": val,
                "isCorrect": False,
                "position": len(options)
            })
    
    return options

fixed_match = 0
for q in match_questions:
    page = q["page"]
    text = get_surrounding_text(doc, page - 1, q["content"][:50], radius=3)
    options = extract_match_options(text, q["questionNumber"])
    
    if len(options) >= 2:
        q["options"] = options
        # Re-set correct answer
        if q.get("correctAnswer"):
            for opt in q["options"]:
                opt["isCorrect"] = (opt["letter"] == q["correctAnswer"])
        fixed_match += 1

print(f"Fixed {fixed_match} match-the-following questions")

# ============================================================
# STEP 3: Recover cross-page split questions
# Computer Networks Q291-Q299 are completely missing
# ============================================================

# Find which questions are completely missing (not in data at all)
missing_questions = []
for ch, max_q in EXPECTED_MAX.items():
    existing_nums = set(q["questionNumber"] for q in clean_data if q["chapter"] == ch)
    for n in range(1, max_q + 1):
        if n not in existing_nums:
            missing_questions.append((ch, n))

print(f"\nCompletely missing questions: {len(missing_questions)}")
for ch, n in missing_questions:
    print(f"  {ch}: Q#{n}")

# For completely missing questions, do targeted extraction from specific pages
# We need to find which page these questions are on

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

CHAPTER_MAP_REVERSE = {v: k for k, v in CHAPTER_MAP.items()}

def detect_chapter(page_text, current):
    lines = [l.strip() for l in page_text.split('\n') if l.strip()]
    for line in lines[:4]:
        for key in CHAPTER_MAP:
            if key.lower() in line.lower():
                return CHAPTER_MAP[key]
    return current

# Build a page->chapter mapping
page_chapters = {}
current_ch = "Digital Logic Circuits"
for pno in range(len(doc)):
    page = doc[pno]
    current_ch = detect_chapter(page.get_text(), current_ch)
    page_chapters[pno] = current_ch

# For each missing question, search the relevant pages
ans_re = re.compile(r'\bAns[\.\,\s\-]*[\(\[]?\s*([a-eA-E])\s*[\)\]]?\s*[:\.\-]?', re.IGNORECASE)
opt_re = re.compile(r'\(([a-eA-E])\)\s*', re.IGNORECASE)

recovered = 0
for target_ch, target_num in missing_questions:
    # Find pages for this chapter
    ch_pages = [pno for pno, ch in page_chapters.items() if ch == target_ch]
    
    found = False
    for pno in ch_pages:
        page = doc[pno]
        # Get full page text (both columns merged)
        full_text = ""
        for col_rect in [LEFT_COL, RIGHT_COL]:
            blocks = page.get_text("blocks", clip=col_rect)
            blocks.sort(key=lambda b: b[1])
            full_text += "\n".join(b[4].strip() for b in blocks if b[4].strip()) + "\n"
        
        # Search for this question number
        q_pattern = re.compile(rf'(?:^|\n)\s*{target_num}\.\s+(.*?)(?=(?:^|\n)\s*\d{{1,3}}\.\s+|$)', re.DOTALL | re.MULTILINE)
        m = q_pattern.search(full_text)
        if not m:
            continue
        
        body = m.group(1).strip()
        if len(body) < 15:
            continue
        
        # Check this is actually a question (has options or answer)
        m_ans = ans_re.search(body)
        correct_letter = None
        explanation = None
        q_part = body
        
        if m_ans:
            correct_letter = m_ans.group(1).lower()
            explanation = body[m_ans.end():].strip()
            q_part = body[:m_ans.start()].strip()
        
        # Parse options
        tokens = opt_re.split(q_part)
        options = []
        question_stem = tokens[0].strip()
        
        if len(tokens) >= 3:
            for i in range(1, len(tokens) - 1, 2):
                letter = tokens[i].lower()
                val = tokens[i + 1].strip()
                if val:
                    options.append({
                        "letter": letter,
                        "content": val,
                        "isCorrect": (letter == correct_letter),
                        "position": len(options)
                    })
        
        if len(options) >= 2:
            clean_data.append({
                "questionNumber": target_num,
                "chapter": target_ch,
                "subject": "Computer Science",
                "content": question_stem,
                "options": options,
                "correctAnswer": correct_letter,
                "hasAnswer": bool(correct_letter),
                "explanation": explanation,
                "source": "Computer Practice Set PYQ",
                "page": pno + 1,
                "images": []
            })
            recovered += 1
            found = True
            break
    
    if not found:
        # Try cross-page: get text from this page + next page combined
        for pno in ch_pages:
            if pno + 1 >= len(doc):
                continue
            combined = ""
            for p in [pno, pno + 1]:
                page = doc[p]
                for col_rect in [LEFT_COL, RIGHT_COL]:
                    blocks = page.get_text("blocks", clip=col_rect)
                    blocks.sort(key=lambda b: b[1])
                    combined += "\n".join(b[4].strip() for b in blocks if b[4].strip()) + "\n"
            
            q_pattern = re.compile(rf'(?:^|\n)\s*{target_num}\.\s+(.*?)(?=(?:^|\n)\s*(?:{target_num + 1})\.\s+|$)', re.DOTALL | re.MULTILINE)
            m = q_pattern.search(combined)
            if not m:
                continue
            
            body = m.group(1).strip()
            if len(body) < 15:
                continue
            
            m_ans = ans_re.search(body)
            correct_letter = None
            explanation = None
            q_part = body
            
            if m_ans:
                correct_letter = m_ans.group(1).lower()
                explanation = body[m_ans.end():].strip()
                q_part = body[:m_ans.start()].strip()
            
            tokens = opt_re.split(q_part)
            options = []
            question_stem = tokens[0].strip()
            
            if len(tokens) >= 3:
                for i in range(1, len(tokens) - 1, 2):
                    letter = tokens[i].lower()
                    val = tokens[i + 1].strip()
                    if val:
                        options.append({
                            "letter": letter,
                            "content": val,
                            "isCorrect": (letter == correct_letter),
                            "position": len(options)
                        })
            
            if len(options) >= 2:
                clean_data.append({
                    "questionNumber": target_num,
                    "chapter": target_ch,
                    "subject": "Computer Science",
                    "content": question_stem,
                    "options": options,
                    "correctAnswer": correct_letter,
                    "hasAnswer": bool(correct_letter),
                    "explanation": explanation,
                    "source": "Computer Practice Set PYQ",
                    "page": pno + 1,
                    "images": []
                })
                recovered += 1
                found = True
                break

print(f"Recovered {recovered} cross-page split questions")

# ============================================================
# STEP 4: Final dedup and sort
# ============================================================
# Remove duplicates - keep best version per (chapter, questionNumber)
final_index = {}
for q in clean_data:
    key = (q["chapter"], q["questionNumber"])
    max_q = EXPECTED_MAX.get(q["chapter"], 500)
    if q["questionNumber"] > max_q or q["questionNumber"] == 0:
        continue
    if key not in final_index or len(q["options"]) > len(final_index[key]["options"]):
        final_index[key] = q

final_data = sorted(final_index.values(), key=lambda q: (q["chapter"], q["questionNumber"]))

valid_final = [q for q in final_data if len(q["options"]) >= 2]

print(f"\n{'='*70}")
print(f"FINAL RESULTS")
print(f"{'='*70}")
print(f"Total questions: {len(final_data)}")
print(f"Valid (>=2 options): {len(valid_final)}")

from collections import Counter
ch_counts = Counter(q["chapter"] for q in valid_final)
total_gap = 0
for ch in sorted(EXPECTED_MAX.keys()):
    exp = EXPECTED_MAX[ch]
    got = ch_counts.get(ch, 0)
    gap = exp - got
    total_gap += max(0, gap)
    mark = "[OK]" if gap <= 0 else f"[gap {gap}]"
    print(f"  {ch[:45]:45s}  {got:4d}/{exp:4d}  {mark}")

print(f"\n  Total gap: {total_gap}")
print(f"  Extraction rate: {len(valid_final)/3349*100:.1f}%")

# Save
OUTPUT_PATH.write_text(json.dumps(final_data, indent=2, ensure_ascii=False), encoding='utf-8')
print(f"\nSaved to {OUTPUT_PATH}")

doc.close()

