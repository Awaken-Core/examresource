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

LEGACY_CHARS = re.compile(r"DeJeMeemeve|keâ|ceW|nw~")

print("Checking test_attempts...")
for att in db.test_attempts.find():
    s = str(att)
    if LEGACY_CHARS.search(s):
        print("Found legacy in test_attempt ID:", att["_id"], "ExamId:", att.get("examId"))
        for ans in att.get("answers", []):
            snap = ans.get("snapshot", {})
            if "DeJeMeemeve" in str(snap):
                print("Found DeJeMeemeve in answer snapshot!")

