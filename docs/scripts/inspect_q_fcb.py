import sys
from pathlib import Path
from bson import ObjectId
from pymongo import MongoClient

sys.stdout.reconfigure(encoding="utf-8")

def get_db():
    for line in Path("apps/server/.env").read_text(encoding="utf-8").splitlines():
        if line.startswith("DATABASE_URL="):
            url = line.split("=", 1)[1].strip().strip('"').strip("'")
            return MongoClient(url).get_default_database()
    raise RuntimeError("DATABASE_URL not found")

db = get_db()
q = db.questions.find_one({"_id": ObjectId("6ad79fcba08c936a147f0fcb")})
print("q in db.questions:")
print("Type:", q.get("type"))
print("Content:", q.get("content"))
print("Options:")
for o in q.get("options", []):
    print(" ", o)
print("Explanation:", q.get("explanation"))

