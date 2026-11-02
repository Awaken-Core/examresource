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

for qid_str in ["6ae76ffa220a650921287a52", "6ae76ffa220a650921287a53", "6ae76ffa220a650921287a54", "6ae76ffa220a650921287a55"]:
    q = db.questions.find_one({"_id": ObjectId(qid_str)})
    print(f"\n--- {qid_str} ---")
    print("Content:", repr(q.get("content")))
    print("Translations:", repr(q.get("translations")))
    print("Options:", [o.get("content") for o in q.get("options", [])])

