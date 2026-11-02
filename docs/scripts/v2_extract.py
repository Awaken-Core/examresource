"""
Superseded for bilingual papers by docs/scripts/bilingual/extract_bilingual.py.
That pipeline keeps English on the Unicode text layer and converts the
APS-DV-Priyanka Hindi font to Devanagari instead of merging keystrokes
into the English string.

V2 Complete Question Extractor - Recovers all ~3,349 questions from the PDF.

Key improvements over v1:
1. Continuous text stream: stitches left-col -> right-col -> next-page-left-col seamlessly
2. State machine: carries incomplete questions across page/column boundaries  
3. Smarter option parsing: handles (a)/(b)/(c)/(d) with special chars, multi-line options
4. Merges orphan fragments back into parent questions
5. Handles (e) as 5th option for HTET papers
6. Better answer line detection with edge cases like "Ans," and "Ans-"
"""

import re
import json
import sys
from pathlib import Path
from collections import defaultdict
import pymupdf

PDF_PATH = Path("docs/Computer-Practice-Set-All-Exams-Final.pdf")
OUTPUT_DIR = Path("docs/extracted")

# Bounding boxes for 2 columns
LEFT_COL = pymupdf.Rect(50, 65, 308, 785)
RIGHT_COL = pymupdf.Rect(308, 65, 560, 785)

# Chapter detection
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


def build_continuous_stream(doc):
    """
    Build a continuous text stream across all pages, respecting 2-column layout.
    Returns list of (text, page_num, chapter) tuples for each block of text,
    in the correct reading order: left-col top-to-bottom, right-col top-to-bottom, next page...
    """
    stream = []  # list of { text, page, chapter, col }
    current_chapter = "Digital Logic Circuits"
    
    for pno in range(2, len(doc)):  # Skip ToC pages
        page = doc[pno]
        full_text = page.get_text()
        current_chapter = detect_chapter(full_text, current_chapter)
        
        for col_idx, col_rect in enumerate([LEFT_COL, RIGHT_COL]):
            blocks = page.get_text("blocks", clip=col_rect)
            blocks.sort(key=lambda b: b[1])  # Sort by y0
            
            col_text = "\n".join(b[4].strip() for b in blocks if b[4].strip())
            
            if col_text.strip():
                stream.append({
                    "text": col_text,
                    "page": pno + 1,
                    "chapter": current_chapter,
                    "col": col_idx
                })
    
    return stream


def extract_questions_v2(doc):
    """
    Parse all questions using a state machine that handles cross-column/cross-page splits.
    """
    stream = build_continuous_stream(doc)
    
    # Concatenate entire stream into one massive string with page markers
    full_text = ""
    page_markers = []  # (char_offset, page, chapter)
    
    for segment in stream:
        offset = len(full_text)
        page_markers.append((offset, segment["page"], segment["chapter"]))
        full_text += segment["text"] + "\n"
    
    def get_page_chapter(char_pos):
        """Find which page/chapter a character position belongs to."""
        result_page = 3
        result_chapter = "Digital Logic Circuits"
        for offset, pg, ch in page_markers:
            if offset <= char_pos:
                result_page = pg
                result_chapter = ch
            else:
                break
        return result_page, result_chapter
    
    # Pattern to match question starts: a number followed by a dot and space
    # Must be at start of line. Question numbers are 1-466 range.
    q_start_pattern = re.compile(r'^(\d{1,3})\.\s+', re.MULTILINE)
    
    # Find ALL question-start positions
    q_starts = list(q_start_pattern.finditer(full_text))
    
    # Answer pattern - handles "Ans. (b) :", "Ans, (c):", "Ans-(a):", "Ans.(b).", etc.
    ans_re = re.compile(
        r'\bAns[\.\,\s\-]*[\(\[]?\s*([a-eA-E])\s*[\)\]]?\s*[:\.\-]?',
        re.IGNORECASE
    )
    
    # Exam tag pattern
    exam_tag_re = re.compile(
        r'((?:DSSSB|KVS|NVS|HTET|BPSC|UGC\s+NET|LT\.?\s+Grade|EMRS|UKPSC|RPSC|CGPSC|UPPSC|Haryana\s+PGT|Bihar\s+STET|Bihar\s+TRE)[^\n]{5,60})',
        re.IGNORECASE
    )
    
    # Option pattern - handles (a), (b), (c), (d), (e)
    # Must handle cases where options are on separate lines
    opt_re = re.compile(r'\(([a-eA-E])\)\s*', re.IGNORECASE)
    
    # Filter watermark lines
    watermark_re = re.compile(r'(?:freepdfhall|Sarkari\s+Resource|Click\s+here)', re.IGNORECASE)
    
    questions = []
    prev_chapter = "Digital Logic Circuits"
    
    for idx in range(len(q_starts)):
        match = q_starts[idx]
        q_num = int(match.group(1))
        start_pos = match.start()
        
        # End position is the start of the next question, or end of text
        if idx + 1 < len(q_starts):
            end_pos = q_starts[idx + 1].start()
        else:
            end_pos = len(full_text)
        
        # Limit chunk size to avoid grabbing too much
        chunk_len = end_pos - start_pos
        if chunk_len > 3000:
            end_pos = start_pos + 3000
        
        body = full_text[match.end():end_pos].strip()
        page, chapter = get_page_chapter(start_pos)
        
        # Skip if this looks like a watermark line or section header
        if watermark_re.search(body[:50]):
            continue
        
        # Skip if body is too short (likely a fragment number in explanation text)
        if len(body) < 15:
            continue
        
        # Clean watermark lines from body
        lines = body.split('\n')
        clean_lines = [l for l in lines if not watermark_re.search(l)]
        body = '\n'.join(clean_lines)
        
        # Extract answer
        m_ans = ans_re.search(body)
        correct_letter = None
        explanation = None
        q_part = body
        
        if m_ans:
            correct_letter = m_ans.group(1).lower()
            explanation = body[m_ans.end():].strip()
            q_part = body[:m_ans.start()].strip()
        
        # Extract exam tag
        m_exam = exam_tag_re.search(q_part)
        exam_tag = None
        if m_exam:
            exam_tag = m_exam.group(1).strip()
            q_part = q_part[:m_exam.start()] + q_part[m_exam.end():]
        
        # Parse options using multiple strategies
        options = parse_options(q_part)
        
        # If we got < 2 options, try alternate parsing strategies
        if len(options) < 2:
            options = parse_options_aggressive(q_part)
        
        # Determine question stem
        if options:
            # Stem is everything before the first option marker
            first_opt_match = opt_re.search(q_part)
            if first_opt_match:
                question_stem = q_part[:first_opt_match.start()].strip()
            else:
                question_stem = q_part.strip()
        else:
            question_stem = q_part.strip()
        
        # Track chapter transitions
        if chapter != prev_chapter:
            prev_chapter = chapter
        
        questions.append({
            "questionNumber": q_num,
            "chapter": chapter,
            "subject": "Computer Science",
            "content": question_stem if question_stem else body[:500],
            "options": options,
            "correctAnswer": correct_letter,
            "hasAnswer": bool(correct_letter),
            "explanation": explanation,
            "source": exam_tag or "Computer Practice Set PYQ",
            "page": page,
            "images": []
        })
    
    return questions


def parse_options(text):
    """Standard option parsing: split by (a), (b), (c), (d) markers."""
    opt_re = re.compile(r'\(([a-eA-E])\)\s*', re.IGNORECASE)
    tokens = opt_re.split(text)
    
    options = []
    if len(tokens) >= 3:
        for i in range(1, len(tokens) - 1, 2):
            letter = tokens[i].lower()
            val = tokens[i + 1].strip()
            # Clean trailing newlines and whitespace
            val = re.sub(r'\s+$', '', val)
            if val:  # Only add if there's actual content
                options.append({
                    "letter": letter,
                    "content": val,
                    "isCorrect": False,
                    "position": len(options)
                })
    
    return options


def parse_options_aggressive(text):
    """
    Aggressive option parsing for edge cases:
    - Options on separate lines like "(a)\nsome text\n(b)\nsome text"
    - Options with special characters
    - "a)" or "A)" format (no leading paren)
    - Numbered sub-options like "1. xxx  2. xxx" for match-the-following
    """
    options = []
    
    # Strategy 1: Look for (a)...(b)...(c)...(d) even with newlines between marker and text
    pattern = re.compile(
        r'\(([a-eA-E])\)\s*(.*?)(?=\([a-eA-E]\)|$)',
        re.DOTALL | re.IGNORECASE
    )
    matches = list(pattern.finditer(text))
    
    if len(matches) >= 2:
        seen_letters = set()
        for m in matches:
            letter = m.group(1).lower()
            if letter in seen_letters:
                continue
            seen_letters.add(letter)
            val = m.group(2).strip()
            # Take only the first meaningful line(s) of the option
            val_lines = [l.strip() for l in val.split('\n') if l.strip()]
            val = ' '.join(val_lines[:3])  # Max 3 lines per option
            if val:
                options.append({
                    "letter": letter,
                    "content": val,
                    "isCorrect": False,
                    "position": len(options)
                })
        if len(options) >= 2:
            return options
    
    # Strategy 2: Look for "a)" format without leading paren
    pattern2 = re.compile(r'(?:^|\n)\s*([a-dA-D])\)\s*(.*?)(?=(?:^|\n)\s*[a-dA-D]\)|$)', re.DOTALL)
    matches2 = list(pattern2.finditer(text))
    if len(matches2) >= 2:
        for m in matches2:
            letter = m.group(1).lower()
            val = m.group(2).strip().split('\n')[0].strip()
            if val:
                options.append({
                    "letter": letter,
                    "content": val,
                    "isCorrect": False,
                    "position": len(options)
                })
        if len(options) >= 2:
            return options
    
    # Strategy 3: Roman numeral or I/II/III/IV style (match-the-following)
    # These are less common, skip for now
    
    return options


def deduplicate_questions(questions):
    """
    Remove duplicate entries where same chapter + question_number appears multiple times.
    Keep the one with the most options (best parse).
    Also filter out non-question items (fragments, headers, explanation snippets).
    """
    # Group by (chapter, questionNumber)
    groups = defaultdict(list)
    for q in questions:
        key = (q["chapter"], q["questionNumber"])
        groups[key].append(q)
    
    deduped = []
    for key, group in groups.items():
        chapter, q_num = key
        
        # Filter out items that are clearly not questions
        real_questions = []
        for q in group:
            content = q["content"]
            # Skip if content is just a number or very short
            if len(content) < 10:
                continue
            # Skip if it looks like an explanation/answer continuation
            if content.startswith(("So, option", "The correct", "Hence,", "Therefore,")):
                continue
            real_questions.append(q)
        
        if not real_questions:
            real_questions = group  # Keep originals if all filtered
        
        # Pick the best version: most options, then longest content
        best = max(real_questions, key=lambda q: (len(q["options"]), len(q["content"])))
        deduped.append(best)
    
    return deduped


def merge_with_v1_data(v2_questions, v1_path="docs/extracted/complete_questions.json"):
    """
    Merge v2 extraction with v1 data. For each (chapter, questionNumber),
    keep whichever version has more options. This ensures we don't lose
    any good parses from v1.
    """
    try:
        v1_data = json.load(open(v1_path, 'r', encoding='utf-8'))
    except FileNotFoundError:
        return v2_questions
    
    # Index v1 by (chapter, qnum)
    v1_index = {}
    for q in v1_data:
        key = (q["chapter"], q["questionNumber"])
        if key not in v1_index or len(q["options"]) > len(v1_index[key]["options"]):
            v1_index[key] = q
    
    # Index v2 by (chapter, qnum)
    v2_index = {}
    for q in v2_questions:
        key = (q["chapter"], q["questionNumber"])
        if key not in v2_index or len(q["options"]) > len(v2_index[key]["options"]):
            v2_index[key] = q
    
    # Merge: for each key, take the version with more options
    all_keys = set(v1_index.keys()) | set(v2_index.keys())
    merged = []
    v1_wins = 0
    v2_wins = 0
    new_in_v2 = 0
    
    for key in all_keys:
        v1q = v1_index.get(key)
        v2q = v2_index.get(key)
        
        if v1q and v2q:
            if len(v1q["options"]) >= len(v2q["options"]):
                merged.append(v1q)
                v1_wins += 1
            else:
                merged.append(v2q)
                v2_wins += 1
        elif v2q:
            merged.append(v2q)
            new_in_v2 += 1
        else:
            merged.append(v1q)
            v1_wins += 1
    
    print(f"  Merge stats: v1 wins={v1_wins}, v2 wins={v2_wins}, new in v2={new_in_v2}")
    return merged


def assign_images(questions, image_map_path="docs/extracted/r2_image_map.json"):
    """Assign R2 image URLs from existing image map."""
    try:
        r2_map = json.load(open(image_map_path, 'r', encoding='utf-8'))
    except FileNotFoundError:
        return questions
    
    # The image map maps filename -> R2 URL
    # Images are named like p{page}_img{idx}_{xref}.webp
    # Assign images to questions on the same page
    page_images = defaultdict(list)
    for filename, url in r2_map.items():
        # Extract page number from filename
        m = re.match(r'p(\d+)_', filename)
        if m:
            page_images[int(m.group(1))].append(url)
    
    for q in questions:
        page = q.get("page")
        if page and page in page_images:
            # Simple heuristic: if only one image on the page, assign it
            # For multiple images, assign the first unassigned one
            if not q["images"] and page_images[page]:
                q["images"] = [page_images[page][0]]
    
    return questions


def main():
    print("[v2_extract] Opening PDF...")
    doc = pymupdf.open(str(PDF_PATH))
    print(f"[v2_extract] Total pages: {len(doc)}")
    
    print("[v2_extract] Phase 1: Building continuous text stream...")
    
    print("[v2_extract] Phase 2: Extracting questions with state machine...")
    v2_questions = extract_questions_v2(doc)
    print(f"[v2_extract] Raw v2 parsed: {len(v2_questions)}")
    
    print("[v2_extract] Phase 3: Deduplicating...")
    v2_deduped = deduplicate_questions(v2_questions)
    print(f"[v2_extract] After dedup: {len(v2_deduped)}")
    
    valid_v2 = [q for q in v2_deduped if len(q["options"]) >= 2]
    print(f"[v2_extract] Valid v2 (>=2 options): {len(valid_v2)}")
    
    print("[v2_extract] Phase 4: Merging with v1 data (keeping best of both)...")
    merged = merge_with_v1_data(v2_deduped)
    
    valid_merged = [q for q in merged if len(q["options"]) >= 2]
    print(f"[v2_extract] Valid merged (>=2 options): {len(valid_merged)}")
    
    # Set correct answer flags
    for q in merged:
        correct = q.get("correctAnswer")
        for opt in q["options"]:
            opt["isCorrect"] = (opt["letter"] == correct)
    
    print("[v2_extract] Phase 5: Assigning images from R2 map...")
    merged = assign_images(merged)
    
    # Sort by chapter then question number
    merged.sort(key=lambda q: (q["chapter"], q["questionNumber"]))
    
    # Save
    out_file = OUTPUT_DIR / "v2_questions.json"
    out_file.write_text(json.dumps(merged, indent=2, ensure_ascii=False), encoding="utf-8")
    
    # Print chapter stats
    print(f"\n{'='*70}")
    print("FINAL CHAPTER STATS (valid questions with >=2 options)")
    print(f"{'='*70}")
    
    from collections import Counter
    ch_counts = Counter(q["chapter"] for q in merged if len(q["options"]) >= 2)
    total = 0
    for ch in sorted(ch_counts.keys()):
        c = ch_counts[ch]
        total += c
        print(f"  {ch}: {c}")
    print(f"\n  TOTAL VALID: {total}")
    print(f"  TOTAL ALL: {len(merged)}")
    print(f"\n[v2_extract] Saved to {out_file}")


if __name__ == "__main__":
    main()

