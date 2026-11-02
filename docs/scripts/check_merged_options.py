import re
import json
from pathlib import Path

bad_qs = json.load(open("docs/extracted/bad_option_questions.json", "r", encoding="utf-8"))

merged_count = 0
not_merged = []

for q in bad_qs:
    has_merged = False
    for opt in q["options"]:
        content = opt["content"]
        # Look for (b), (c), (d), or /b/, /c/, /d/
        if re.search(r"\(?[b-d]\)|\[[b-d]\]|\b[b-d]\)", content, re.I):
            has_merged = True
            break
    if has_merged:
        merged_count += 1
    else:
        not_merged.append(q)

print(f"Total bad questions: {len(bad_qs)}")
print(f"Questions with merged option markers: {merged_count}")
print(f"Questions without obvious merged markers: {len(not_merged)}")

