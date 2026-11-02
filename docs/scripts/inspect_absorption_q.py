from pymongo import MongoClient
from pathlib import Path

def load_db_url():
    for line in Path("apps/server/.env").read_text(encoding="utf-8").splitlines():
        if line.startswith("DATABASE_URL="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise RuntimeError("DATABASE_URL not found")

client = MongoClient(load_db_url())
db = client.get_default_database()
q = db.questions.find_one({"content": {"$regex": "Absorption law", "$options": "i"}})
if q:
    print("Found question ID:", q["_id"])
    print("Content:\n", repr(q.get("content")))
    print("Translations:\n", q.get("translations"))
    print("Options:")
    for o in q.get("options", []):
        print(f"  [{o.get('isCorrect')}] {o.get('content')} | translations: {o.get('translations')}")
else:
    print("Not found by Absorption law in content. Checking all fields...")
    for doc in db.questions.find():
        full_str = str(doc)
        if "Absorption" in full_str:
            print("Found in doc:", doc["_id"], doc.get("content")[:60])
            break

