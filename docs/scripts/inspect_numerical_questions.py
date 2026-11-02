import sys
from pathlib import Path
from pymongo import MongoClient

sys.stdout.reconfigure(encoding="utf-8")

def get_db():
    for line in Path("apps/server/.env").read_text(encoding="utf-8").splitlines():
        if line.startswith("DATABASE_URL="):
            url = line.split("=", 1)[1].strip().strip('"').strip("'")
            return MongoClient(url).get_default_database()
    raise RuntimeError("DATABASE_URL not found")

db = get_db()
total_q = db.questions.count_documents({})
print(f"Total questions in DB: {total_q}")

types = list(db.questions.aggregate([
    {"$group": {"_id": "$type", "count": {"$sum": 1}}}
]))
print("\nQuestions by type:")
for t in types:
    print(f"  {t['_id']}: {t['count']}")

with_num_ans = db.questions.count_documents({"numericalAnswer": {"$nin": [None, ""]}})
print(f"\nQuestions with numericalAnswer: {with_num_ans}")

option_counts = list(db.questions.aggregate([
    {"$project": {"opt_len": {"$size": {"$ifNull": ["$options", []]}}}},
    {"$group": {"_id": "$opt_len", "count": {"$sum": 1}}},
    {"$sort": {"_id": 1}}
]))
print("\nOption counts distribution:")
for oc in option_counts:
    print(f"  {oc['_id']} options: {oc['count']} questions")

# Let's inspect all questions that are numerical or have opt_len != 4
non_standard_qs = list(db.questions.find({
    "$or": [
        {"type": "numerical"},
        {"numericalAnswer": {"$nin": [None, ""]}},
        {"$expr": {"$ne": [{"$size": {"$ifNull": ["$options", []]}}, 4]}}
    ]
}, {
    "_id": 1,
    "content": 1,
    "type": 1,
    "numericalAnswer": 1,
    "explanation": 1,
    "options": 1,
    "subject": 1,
    "source": 1
}))

print(f"\nTotal non-standard questions (numerical, or not 4 options): {len(non_standard_qs)}")
for i, q in enumerate(non_standard_qs[:20]):
    print(f"\n--- Question {i+1} [ID: {q['_id']}] ---")
    print(f"Type: {q.get('type')}")
    print(f"Numerical Answer: {q.get('numericalAnswer')}")
    print(f"Content: {repr(q.get('content')[:120])}")
    print(f"Options count: {len(q.get('options', []))}")
    for opt_idx, opt in enumerate(q.get('options', [])):
        print(f"   [{opt_idx}] {opt.get('isCorrect')}: {repr(opt.get('content')[:60])}")
    print(f"Explanation: {repr((q.get('explanation') or '')[:100])}")

