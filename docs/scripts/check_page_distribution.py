import json
import sys

sys.stdout.reconfigure(encoding="utf-8")
bad_qs = json.load(open("docs/extracted/bad_option_questions.json", "r", encoding="utf-8"))

with_page = [q for q in bad_qs if q.get("sourcePage")]
without_page = [q for q in bad_qs if not q.get("sourcePage")]

print(f"Total: {len(bad_qs)}")
print(f"With sourcePage: {len(with_page)}")
print(f"Without sourcePage: {len(without_page)}")

for q in without_page:
    print(f"Without page: ID={q['id']}, subject={q.get('subject')}, content={repr(q['content'][:80])}, options count={len(q['options'])}")

