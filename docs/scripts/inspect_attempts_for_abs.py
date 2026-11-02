import sys
from pymongo import MongoClient
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

def load_db_url():
    for line in Path("apps/server/.env").read_text(encoding="utf-8").splitlines():
        if line.startswith("DATABASE_URL="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise RuntimeError("DATABASE_URL not found")

client = MongoClient(load_db_url())
db = client.get_default_database()

for att in db.test_attempts.find():
    for idx, ans in enumerate(att.get("answers", [])):
        snap = ans.get("snapshot", {})
        if "Absorption" in (snap.get("content") or "") or "DeJeMeemeve" in str(snap):
            print(f"Found in attempt {att['_id']}, ans {idx}:")
            print("  content:", repr(snap.get("content")))
            print("  translations:", repr(snap.get("translations")))

