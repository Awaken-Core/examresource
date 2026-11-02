"""Analyze the gap between extracted questions and expected totals per chapter."""
import json
from collections import Counter

data = json.load(open('docs/extracted/complete_questions.json', 'r', encoding='utf-8'))

valid = [q for q in data if len(q.get('options', [])) >= 2]
invalid = [q for q in data if len(q.get('options', [])) < 2]

# Expected max question numbers per chapter (from PDF analysis)
EXPECTED = {
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

print("=" * 80)
print("CHAPTER-BY-CHAPTER GAP ANALYSIS")
print("=" * 80)

# Count valid per chapter
valid_counts = Counter(q['chapter'] for q in valid)
invalid_counts = Counter(q['chapter'] for q in invalid)

total_expected = 0
total_valid = 0
total_gap = 0

for chapter, expected in EXPECTED.items():
    v = valid_counts.get(chapter, 0)
    inv = invalid_counts.get(chapter, 0)
    gap = expected - v
    total_expected += expected
    total_valid += v
    total_gap += gap
    pct = (v / expected * 100) if expected else 0
    print(f"\n{chapter}:")
    print(f"  Expected: {expected}  |  Valid: {v}  |  Invalid: {inv}  |  Gap: {gap}  |  {pct:.1f}%")

print(f"\n{'=' * 80}")
print(f"TOTALS: Expected={total_expected}  Valid={total_valid}  Gap={total_gap}  Rate={total_valid/total_expected*100:.1f}%")

# Analyze invalid items - categorize them
print(f"\n{'=' * 80}")
print(f"INVALID ITEMS ANALYSIS ({len(invalid)} total)")
print("=" * 80)

categories = {
    'has_0_options': [],
    'has_1_option': [],
    'looks_like_question': [],
    'looks_like_header': [],
    'looks_like_fragment': [],
}

for q in invalid:
    n_opts = len(q.get('options', []))
    text = q.get('content', '')
    
    if n_opts == 1:
        categories['has_1_option'].append(q)
    elif n_opts == 0:
        # Is it a real question or a header/fragment?
        if len(text) > 50 and '?' in text:
            categories['looks_like_question'].append(q)
        elif len(text) < 30:
            categories['looks_like_header'].append(q)
        else:
            categories['looks_like_fragment'].append(q)

for cat, items in categories.items():
    print(f"\n{cat}: {len(items)}")
    for q in items[:5]:
        safe_text = q['content'][:80].encode('ascii', 'replace').decode()
        print(f"  ch={q['chapter'][:25]}  q#={q['questionNumber']}  p={q['page']}  text={safe_text}")

# Find question number gaps per chapter
print(f"\n{'=' * 80}")
print("MISSING QUESTION NUMBERS PER CHAPTER (gaps in sequential numbering)")
print("=" * 80)

for chapter in EXPECTED:
    ch_qs = [q for q in data if q['chapter'] == chapter]
    ch_valid = [q for q in valid if q['chapter'] == chapter]
    seen_nums = set(q['questionNumber'] for q in ch_qs)
    valid_nums = set(q['questionNumber'] for q in ch_valid)
    expected_max = EXPECTED[chapter]
    
    all_expected = set(range(1, expected_max + 1))
    completely_missing = all_expected - seen_nums  # Not even parsed as raw
    parsed_but_invalid = seen_nums - valid_nums  # Parsed but < 2 options
    
    print(f"\n{chapter} (expected 1..{expected_max}):")
    print(f"  Completely missing (not parsed at all): {len(completely_missing)}")
    if completely_missing and len(completely_missing) <= 20:
        print(f"    Numbers: {sorted(completely_missing)}")
    elif completely_missing:
        print(f"    First 20: {sorted(completely_missing)[:20]}")
    print(f"  Parsed but invalid (<2 options): {len(parsed_but_invalid)}")
    if parsed_but_invalid and len(parsed_but_invalid) <= 20:
        print(f"    Numbers: {sorted(parsed_but_invalid)}")
    elif parsed_but_invalid:
        print(f"    First 20: {sorted(parsed_but_invalid)[:20]}")
