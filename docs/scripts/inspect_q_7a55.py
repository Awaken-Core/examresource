import sys
from pymongo import MongoClient
from pathlib import Path
from bson import ObjectId

sys.stdout.reconfigure(encoding="utf-8")

def load_db_url():
    for line in Path("apps/server/.env").read_text(encoding="utf-8").splitlines():
        if line.startswith("DATABASE_URL="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise RuntimeError("DATABASE_URL not found")

client = MongoClient(load_db_url())
db = client.get_default_database()

q = db.questions.find_one({"_id": ObjectId("6ae76ffa220a650921287a55")})
print("Question 6ae76ffa220a650921287a55:")
print("Content:\n", repr(q.get("content")))
print("Translations:\n", repr(q.get("translations")))
print("Options:")
for o in q.get("options", []):
    print(" ", repr(o))
print("Exam links / tags / source:", q.get("source"), q.get("tags"))

