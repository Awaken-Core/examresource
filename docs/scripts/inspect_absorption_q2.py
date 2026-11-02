from pymongo import MongoClient
from pathlib import Path

def load_db_url():
    for line in Path("apps/server/.env").read_text(encoding="utf-8").splitlines():
        if line.startswith("DATABASE_URL="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise RuntimeError("DATABASE_URL not found")

client = MongoClient(load_db_url())
db = client.get_default_database()

qs = list(db.questions.find({"content": {"$regex": "DeJeMeemeve", "$options": "i"}}))
print(f"Found {len(qs)} questions matching 'DeJeMeemeve'")
for q in qs:
    print("ID:", q["_id"])
    print("Content:\n", repr(q.get("content")))
    print("Translations:\n", q.get("translations"))
    print("Options:")
    for o in q.get("options", []):
        print(f"  [{o.get('isCorrect')}] {repr(o.get('content'))} | translations: {o.get('translations')}")

if not qs:
    print("Searching by 'A + AB = A' in options...")
    qs2 = list(db.questions.find({"options.content": {"$regex": "A \\+ AB = A"}}))
    print(f"Found {len(qs2)} questions")
    for q in qs2:
        print("ID:", q["_id"])
        print("Content:\n", repr(q.get("content")))

