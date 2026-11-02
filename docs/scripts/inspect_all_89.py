import json
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

bad_qs = json.load(open("docs/extracted/bad_option_questions.json", "r", encoding="utf-8"))

for idx, q in enumerate(bad_qs):
    print(f"[{idx+1}/89] ID: {q['id']} | Subj: {q.get('subject')} | Page: {q.get('sourcePage')} | QNum: {q.get('sourceQuestionNumber')}")
    print(f"  Content: {repr(q['content'])}")
    print(f"  Current opts ({len(q['options'])}):")
    for o_idx, o in enumerate(q['options']):
        print(f"    ({chr(97+o_idx)}) [correct={o['isCorrect']}]: {repr(o['content'])}")
    print(f"  Explanation: {repr((q.get('explanation') or '')[:100])}")
    print("-" * 60)

