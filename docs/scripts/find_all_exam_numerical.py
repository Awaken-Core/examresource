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

# Check all exams for numerical snapshots or options count != 4
exams = list(db.exams.find({}, {
    "title": 1,
    "sections.questions.questionId": 1,
    "sections.questions.snapshot": 1,
    "questions.questionId": 1,
    "questions.snapshot": 1,
}))

numerical_snaps = []
bad_opt_snaps = []

for ex in exams:
    for s_idx, sec in enumerate(ex.get("sections", [])):
        for q_idx, q in enumerate(sec.get("questions", [])):
            snap = q.get("snapshot") or {}
            opts = snap.get("options", [])
            qtype = snap.get("type")
            if qtype == "numerical" or snap.get("numericalAnswer"):
                numerical_snaps.append((ex["_id"], ex.get("title"), f"sec[{s_idx}].q[{q_idx}]", q.get("questionId"), qtype, len(opts)))
            if len(opts) != 4:
                bad_opt_snaps.append((ex["_id"], ex.get("title"), f"sec[{s_idx}].q[{q_idx}]", q.get("questionId"), len(opts)))

    for q_idx, q in enumerate(ex.get("questions", [])):
        snap = q.get("snapshot") or {}
        opts = snap.get("options", [])
        qtype = snap.get("type")
        if qtype == "numerical" or snap.get("numericalAnswer"):
            numerical_snaps.append((ex["_id"], ex.get("title"), f"root_q[{q_idx}]", q.get("questionId"), qtype, len(opts)))
        if len(opts) != 4:
            bad_opt_snaps.append((ex["_id"], ex.get("title"), f"root_q[{q_idx}]", q.get("questionId"), len(opts)))

print(f"Total exams scanned: {len(exams)}")
print(f"Total numerical snapshots found in exams: {len(numerical_snaps)}")
for n in numerical_snaps:
    print(f"  Exam: {n[1]} ({n[0]}) | Path: {n[2]} | QID: {n[3]} | Type: {n[4]} | Options: {n[5]}")

print(f"\nTotal non-4-option snapshots found in exams: {len(bad_opt_snaps)}")
by_len = {}
for b in bad_opt_snaps:
    by_len.setdefault(b[4], []).append(b)
for count, items in sorted(by_len.items()):
    print(f"  {count} options: {len(items)} snapshots across {len(set(i[0] for i in items))} exams")

