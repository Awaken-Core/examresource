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

exams = list(db.exams.find({"sections.questions.snapshot.options": {"$size": 0}}))
print(f"Found {len(exams)} exams with 0-option snapshots:")
for ex in exams:
    print(f"\nExam ID: {ex['_id']} | Title: {ex.get('title')}")
    for sec in ex.get("sections", []):
        for q in sec.get("questions", []):
            snap = q.get("snapshot") or {}
            opts = snap.get("options", [])
            if len(opts) == 0:
                print(f"  QuestionId: {q.get('questionId')} | type: {snap.get('type')}")
                print(f"  Content: {repr(snap.get('content')[:120])}")
                print(f"  Explanation: {repr((snap.get('explanation') or '')[:100])}")
                # Look up this question in db.questions
                actual_q = db.questions.find_one({"_id": q.get("questionId")})
                if actual_q:
                    print(f"  -> In db.questions: {len(actual_q.get('options', []))} options, type={actual_q.get('type')}")
                else:
                    print(f"  -> Not found in db.questions")

