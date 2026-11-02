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

print("--- 18 QUESTIONS DETAILS ---")
for q in db.questions.find():
    s = str(q)
    if LEGACY_CHARS.search(s):
        print(f"\nQuestion ID: {q['_id']}")
        print(f"Content: {repr(q.get('content'))}")
        print(f"Translations: {repr(q.get('translations'))}")
        for idx, opt in enumerate(q.get("options", [])):
            if LEGACY_CHARS.search(str(opt)):
                print(f"  Opt {idx}: {repr(opt)}")

print("\n--- CHECKING EXAM SNAPSHOTS ---")
legacy_exams = []
for exam in db.exams.find():
    s = str(exam)
    if LEGACY_CHARS.search(s):
        legacy_exams.append(exam)

print(f"Total exams with legacy text: {len(legacy_exams)}")
for exam in legacy_exams[:5]:
    print(f"\nExam ID: {exam['_id']} | Title: {exam.get('title')}")
    for sec_idx, sec in enumerate(exam.get("sections", [])):
        for q_idx, q in enumerate(sec.get("questions", [])):
            snap = q.get("snapshot", {})
            if LEGACY_CHARS.search(str(snap)):
                print(f"  [Sec {sec_idx}, Q {q_idx}, QuestionId={q.get('questionId')}]:")
                print(f"    Snapshot Content: {repr(snap.get('content'))}")
                print(f"    Snapshot Translations: {repr(snap.get('translations'))}")
                for o_idx, opt in enumerate(snap.get("options", [])):
                    if LEGACY_CHARS.search(str(opt)):
                        print(f"      Opt {o_idx}: {repr(opt)}")

