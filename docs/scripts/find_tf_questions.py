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

tf_qs = list(db.questions.find({
    "$or": [
        {"options.0.content": {"$regex": "^(true|सत्य)$", "$options": "i"}},
        {"options.1.content": {"$regex": "^(false|असत्य)$", "$options": "i"}},
    ]
}, {"content": 1, "options": 1}))

print(f"Total pure true/false questions: {len(tf_qs)}")
for q in tf_qs:
    print("\nID:", q["_id"], "Content:", repr(q.get("content")[:80]))
    for o in q.get("options", []):
        print(f"  [{o.get('position')}] {o.get('isCorrect')}: {o.get('content')}")

