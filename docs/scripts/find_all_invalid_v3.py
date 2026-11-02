import json

v3 = json.load(open('docs/extracted/v3_final_questions.json', 'r', encoding='utf-8'))

invalid = [q for q in v3 if len(q.get('options', [])) < 2]
print(f"Total invalid in v3: {len(invalid)}")
for q in invalid:
    print(f"Ch: {q['chapter']} | Q#{q['questionNumber']} | P#{q['page']} | Content: {q['content'][:80]}")

