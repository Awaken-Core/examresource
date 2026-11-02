import sys
from pymongo import MongoClient
from pathlib import Path
import re

sys.stdout.reconfigure(encoding="utf-8")

def load_db_url():
    for line in Path("apps/server/.env").read_text(encoding="utf-8").splitlines():
        if line.startswith("DATABASE_URL="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise RuntimeError("DATABASE_URL not found")

client = MongoClient(load_db_url())
db = client.get_default_database()

LEGACY_CHARS = re.compile(r"keâ|ceW|DeefO|efJe|nw~|GheÙ|keäle|Devegceefle|DeJeMeemeve|Éeje|ieF&|uee@|DeYeerJÙeefkeäIe")

print("Collections in DB:", db.list_collection_names())

for coll_name in ["questions", "exams", "examattempts", "testattempts", "attempts"]:
    if coll_name not in db.list_collection_names():
        continue
    coll = db[coll_name]
    count = 0
    sample = []
    for doc in coll.find():
        s = str(doc)
        if LEGACY_CHARS.search(s):
            count += 1
            if len(sample) < 3:
                sample.append((doc.get("_id"), doc.get("title") or doc.get("content", "")[:60]))
    print(f"Collection {coll_name}: {count} documents contain legacy Kruti/Priyanka font strings!")
    for sid, text in sample:
        print(f"   Sample: ID={sid}, text={repr(text)}")

