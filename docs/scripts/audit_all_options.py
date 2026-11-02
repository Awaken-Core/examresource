import sys
from pathlib import Path
from pymongo import MongoClient

sys.stdout.reconfigure(encoding="utf-8")

def get_db():
    for line in Path("apps/server/.env").read_text(encoding="utf-8").splitlines():
        if line.startswith("DATABASE_URL="):
            url = line.split("=", 1)[1].strip().strip('"').strip("'")
            return MongoClient(url).get_default_database()
    raise RuntimeError("DATABASE_URL not found")

db = get_db()

counts = list(db.questions.aggregate([
    {"$project": {"opt_count": {"$size": {"$ifNull": ["$options", []]}}}},
    {"$group": {"_id": "$opt_count", "total": {"$sum": 1}}},
    {"$sort": {"_id": 1}}
]))

print("Option counts in db.questions:")
for c in counts:
    print(f"  {c['_id']} options: {c['total']} questions")

# Check type field
types = list(db.questions.aggregate([
    {"$group": {"_id": "$type", "total": {"$sum": 1}}}
]))
print("\nTypes in db.questions:")
for t in types:
    print(f"  {t['_id']}: {t['total']}")

# Also check exams collection snapshots!
exam_snap_counts = list(db.exams.aggregate([
    {"$unwind": "$sections"},
    {"$unwind": "$sections.questions"},
    {"$project": {"opt_count": {"$size": {"$ifNull": ["$sections.questions.snapshot.options", []]}}}},
    {"$group": {"_id": "$opt_count", "total": {"$sum": 1}}},
    {"$sort": {"_id": 1}}
]))
print("\nOption counts in exam sections.questions.snapshot.options:")
for c in exam_snap_counts:
    print(f"  {c['_id']} options: {c['total']} snapshots")

