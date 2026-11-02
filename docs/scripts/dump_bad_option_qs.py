import json
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

# Find all questions with != 4 options or type == 'numerical' or with numericalAnswer
bad_qs = list(db.questions.find({
    "$or": [
        {"type": "numerical"},
        {"numericalAnswer": {"$nin": [None, ""]}},
        {"$expr": {"$ne": [{"$size": {"$ifNull": ["$options", []]}}, 4]}}
    ]
}))

out = []
for q in bad_qs:
    q_dict = {
        "id": str(q["_id"]),
        "type": q.get("type"),
        "numericalAnswer": q.get("numericalAnswer"),
        "sourcePage": q.get("sourcePage"),
        "sourceQuestionNumber": q.get("sourceQuestionNumber"),
        "source": q.get("source"),
        "subject": q.get("subject"),
        "content": q.get("content"),
        "explanation": q.get("explanation"),
        "options": [
            {
                "_id": str(o.get("_id")),
                "position": o.get("position"),
                "content": o.get("content"),
                "isCorrect": o.get("isCorrect"),
                "translations": o.get("translations")
            }
            for o in q.get("options", [])
        ]
    }
    out.append(q_dict)

Path("docs/extracted/bad_option_questions.json").write_text(
    json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8"
)
print(f"Dumped {len(out)} questions to docs/extracted/bad_option_questions.json")
