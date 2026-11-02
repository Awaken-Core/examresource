import json
import sys

sys.stdout.reconfigure(encoding="utf-8")

bad_qs = json.load(open("docs/extracted/bad_option_questions.json", "r", encoding="utf-8"))
two_opt_qs = [q for q in bad_qs if len(q["options"]) == 2]

print(f"Total 2-option questions: {len(two_opt_qs)}")

tf_questions = []
non_tf_questions = []

for q in two_opt_qs:
    c = q["content"]
    opt_texts = [o["content"] for o in q["options"]]
    is_tf = False
    
    # Check if options are literally True / False
    joined_opts = " ".join(opt_texts).lower()
    if ("true" in joined_opts and "false" in joined_opts) or ("सत्य" in joined_opts and "असत्य" in joined_opts):
        is_tf = True
    elif "true/false" in c.lower() or "true or false" in c.lower():
        is_tf = True
    
    if is_tf:
        tf_questions.append(q)
    else:
        non_tf_questions.append(q)

print(f"\nTrue/False questions ({len(tf_questions)}):")
for q in tf_questions:
    print(f"  ID: {q['id']} | Content: {repr(q['content'][:80])} | Opts: {[o['content'] for o in q['options']]}")

print(f"\nNon-True/False questions ({len(non_tf_questions)}):")
for q in non_tf_questions:
    print(f"  ID: {q['id']} | Content: {repr(q['content'][:80])} | Opts: {[o['content'] for o in q['options']]}")

