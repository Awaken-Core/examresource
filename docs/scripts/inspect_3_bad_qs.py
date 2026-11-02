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

bad_ids = [
    ObjectId("6ae76ff9220a6509212875e7"),
    ObjectId("6ae77001220a650921289823"),
    ObjectId("6ae77003220a65092128a195"),
    ObjectId("6ae77000220a650921289411")
]

for qid in bad_ids:
    q = db.questions.find_one({"_id": qid})
    print(f"\n================ Question ID: {qid} ================")
    print("Content:\n", repr(q.get("content")))
    print("Translations:\n", repr(q.get("translations")))
    print("Options:")
    for o in q.get("options", []):
        print(f"  [{o.get('isCorrect')}] {repr(o.get('content'))} | trans: {repr(o.get('translations'))}")

