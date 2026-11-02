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

q = db.questions.find_one({"_id": ObjectId("6ae77000220a650921289411")})
print("QUESTION DOC:")
print("Content:", repr(q.get("content")))
print("Translations:", repr(q.get("translations")))
print("Options:")
for o in q.get("options", []):
    print(" ", repr(o))

print("\nCHECKING EXAMS COLLECTION FOR DeJeMeemeve...")
exam_with_legacy = db.exams.find_one({"sections.questions.snapshot.content": {"$regex": "DeJeMeemeve"}})
if exam_with_legacy:
    print("Found in exam:", exam_with_legacy["_id"], exam_with_legacy.get("title"))
    for s in exam_with_legacy.get("sections", []):
        for sq in s.get("questions", []):
            snap = sq.get("snapshot", {})
            if "DeJeMeemeve" in str(snap):
                print("Snapshot content:", repr(snap.get("content")))
                print("Snapshot translations:", repr(snap.get("translations")))
                print("Snapshot options:", repr(snap.get("options")))
else:
    print("Not found in exams by regex 'DeJeMeemeve'")

print("\nCHECKING EXAMS COLLECTION FOR questionId 6ae77000220a650921289411...")
exam_with_q = db.exams.find_one({"sections.questions.questionId": ObjectId("6ae77000220a650921289411")})
if exam_with_q:
    print("Found exam with this question:", exam_with_q["_id"], exam_with_q.get("title"))
    for s in exam_with_q.get("sections", []):
        for sq in s.get("questions", []):
            if sq.get("questionId") == ObjectId("6ae77000220a650921289411"):
                snap = sq.get("snapshot", {})
                print("Snapshot content:", repr(snap.get("content")))
                print("Snapshot translations:", repr(snap.get("translations")))
                print("Snapshot options:", repr(snap.get("options")))
