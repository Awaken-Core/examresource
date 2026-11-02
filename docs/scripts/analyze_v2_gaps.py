    """Final gap analysis on v2 extraction."""
import json
from collections import Counter

data = json.load(open('docs/extracted/v2_questions.json', 'r', encoding='utf-8'))
valid = [q for q in data if len(q.get('options', [])) >= 2]
invalid = [q for q in data if len(q.get('options', [])) < 2]

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

valid_counts = Counter(q['chapter'] for q in valid)

print("CHAPTER GAP ANALYSIS (v2)")
print("=" * 80)
total_exp = 0
total_val = 0
for ch, exp in EXPECTED.items():
    v = valid_counts.get(ch, 0)
    gap = exp - v
    total_exp += exp
    total_val += v
    status = "[OK]" if gap <= 2 else f"[MISSING {gap}]"
    print(f"  {ch[:45]:45s} exp={exp:4d}  got={v:4d}  gap={gap:3d}  {status}")

print(f"\n  TOTAL: exp={total_exp}  got={total_val}  gap={total_exp - total_val}")

# Find the exact missing question numbers
print(f"\nMISSING QUESTION NUMBERS:")
for ch, exp in EXPECTED.items():
    ch_valid = set(q['questionNumber'] for q in valid if q['chapter'] == ch)
    ch_all = set(q['questionNumber'] for q in data if q['chapter'] == ch)
    expected_nums = set(range(1, exp + 1))
    
    completely_missing = expected_nums - ch_all
    parsed_but_invalid = ch_all - ch_valid
    
    if completely_missing or parsed_but_invalid:
        print(f"\n  {ch}:")
        if completely_missing:
            print(f"    Not parsed: {sorted(completely_missing)}")
        if parsed_but_invalid:
            nums = sorted(parsed_but_invalid)
            print(f"    Parsed but <2 opts: {nums}")
            # Show the content of these
            for q in data:
                if q['chapter'] == ch and q['questionNumber'] in parsed_but_invalid and len(q['options']) < 2:
                    safe = q['content'][:100].encode('ascii', 'replace').decode()
                    print(f"      q#{q['questionNumber']}: opts={len(q['options'])} text={safe}")
