import json
import time
import sys
from bson import ObjectId
from pymongo import MongoClient, UpdateOne
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

def main():
    print("================================================================")
    print("UPDATING ALL QUESTIONS TO 4 OPTIONS & REMOVING NUMERICAL INPUT")
    print("================================================================")

    for line in Path("apps/server/.env").read_text(encoding="utf-8").splitlines():
        if line.startswith("DATABASE_URL="):
            url = line.split("=", 1)[1].strip().strip('"').strip("'")
            break
    client = MongoClient(url)
    db = client.get_default_database()

    # 1. Load repaired 4-option questions
    repaired_data = json.load(open("docs/extracted/all_89_repaired.json", "r", encoding="utf-8"))
    repaired_by_id = {item["id"]: item for item in repaired_data}
    print(f"• Loaded {len(repaired_by_id)} repaired questions with 4 options.")

    # 2. Update db.questions
    print("• Updating db.questions...")
    q_bulk_ops = []
    for q_id, item in repaired_by_id.items():
        opts = []
        for o in item["options"]:
            opts.append({
                "_id": ObjectId(o["_id"]),
                "position": o["position"],
                "content": o["content"],
                "isCorrect": o["isCorrect"],
                "imageUrl": o.get("imageUrl"),
                "translations": o.get("translations") or {},
            })
        q_bulk_ops.append(
            UpdateOne(
                {"_id": ObjectId(q_id)},
                {
                    "$set": {
                        "options": opts,
                        "type": "single_choice",
                        "numericalAnswer": None,
                    }
                }
            )
        )

    # Also update any questions with type == 'numerical' or numericalAnswer in db.questions
    db.questions.update_many(
        {"$or": [{"type": "numerical"}, {"numericalAnswer": {"$nin": [None, ""]}}]},
        {"$set": {"type": "single_choice", "numericalAnswer": None}}
    )

    if q_bulk_ops:
        res = db.questions.bulk_write(q_bulk_ops, ordered=False)
        print(f"  ✓ Questions updated: {res.modified_count} modified")

    # 3. Cache all questions in db to sync exam snapshots
    print("• Pre-fetching all questions to sync exam snapshots...")
    t0 = time.time()
    all_qs = list(db.questions.find({}, {
        "_id": 1,
        "content": 1,
        "translations": 1,
        "explanation": 1,
        "explanationTranslations": 1,
        "type": 1,
        "options": 1,
        "blocks": 1,
        "images": 1,
    }))
    q_lookup = {str(q["_id"]): q for q in all_qs}
    print(f"  ✓ Loaded {len(q_lookup)} questions in {time.time() - t0:.2f}s")

    # 4. Iterate all exams and fix all snapshots
    print("• Scanning and synchronizing exam snapshots...")
    t1 = time.time()
    exams = list(db.exams.find({}, {"_id": 1, "title": 1, "sections": 1, "questions": 1}))
    print(f"  ✓ Loaded {len(exams)} exams in {time.time() - t1:.2f}s")

    exam_bulk_ops = []
    exams_modified = 0
    snaps_updated = 0

    for ex in exams:
        modified = False
        sections = ex.get("sections", [])
        for sec in sections:
            for q_item in sec.get("questions", []):
                qid_str = str(q_item.get("questionId"))
                snap = q_item.get("snapshot") or {}
                opts = snap.get("options", [])
                qtype = snap.get("type")

                # If snapshot is numerical, or has != 4 options, or question was repaired
                need_refresh = (
                    qtype == "numerical"
                    or len(opts) != 4
                    or qid_str in repaired_by_id
                    or snap.get("numericalAnswer") is not None
                )

                if need_refresh and qid_str in q_lookup:
                    q_doc = q_lookup[qid_str]
                    marks = q_item.get("positiveMarks") or sec.get("positiveMarks") or 1
                    neg_marks = (
                        q_item.get("negativeMarks")
                        if q_item.get("negativeMarks") is not None
                        else (sec.get("negativeMarks", 0) if sec.get("negativeMarkingEnabled") else 0)
                    )

                    q_item["snapshot"] = {
                        "questionId": q_doc["_id"],
                        "content": q_doc.get("content") or snap.get("content"),
                        "translations": q_doc.get("translations") or snap.get("translations") or {},
                        "explanation": q_doc.get("explanation") or snap.get("explanation"),
                        "explanationTranslations": q_doc.get("explanationTranslations") or snap.get("explanationTranslations") or {},
                        "type": "single_choice" if q_doc.get("type") in (None, "numerical") else q_doc.get("type"),
                        "numericalAnswer": None,
                        "marks": marks,
                        "negativeMarks": neg_marks,
                        "blocks": q_doc.get("blocks") or snap.get("blocks") or [],
                        "images": q_doc.get("images") or snap.get("images") or [],
                        "options": q_doc.get("options") or [],
                    }
                    modified = True
                    snaps_updated += 1

        root_questions = ex.get("questions", [])
        for q_item in root_questions:
            qid_str = str(q_item.get("questionId"))
            snap = q_item.get("snapshot") or {}
            opts = snap.get("options", [])
            qtype = snap.get("type")

            need_refresh = (
                qtype == "numerical"
                or len(opts) != 4
                or qid_str in repaired_by_id
                or snap.get("numericalAnswer") is not None
            )

            if need_refresh and qid_str in q_lookup:
                q_doc = q_lookup[qid_str]
                marks = q_item.get("marks") or 1
                neg_marks = q_item.get("negativeMarks") or 0

                q_item["snapshot"] = {
                    "questionId": q_doc["_id"],
                    "content": q_doc.get("content") or snap.get("content"),
                    "translations": q_doc.get("translations") or snap.get("translations") or {},
                    "explanation": q_doc.get("explanation") or snap.get("explanation"),
                    "explanationTranslations": q_doc.get("explanationTranslations") or snap.get("explanationTranslations") or {},
                    "type": "single_choice" if q_doc.get("type") in (None, "numerical") else q_doc.get("type"),
                    "numericalAnswer": None,
                    "marks": marks,
                    "negativeMarks": neg_marks,
                    "blocks": q_doc.get("blocks") or snap.get("blocks") or [],
                    "images": q_doc.get("images") or snap.get("images") or [],
                    "options": q_doc.get("options") or [],
                }
                modified = True
                snaps_updated += 1

        if modified:
            exam_bulk_ops.append(
                UpdateOne(
                    {"_id": ex["_id"]},
                    {"$set": {"sections": sections, "questions": root_questions}}
                )
            )
            exams_modified += 1

    print(f"• Modified snapshots in {exams_modified} exams ({snaps_updated} snapshots refreshed).")

    # 5. Bulk write to db.exams in batches of 100
    if exam_bulk_ops:
        chunk_size = 100
        for i in range(0, len(exam_bulk_ops), chunk_size):
            chunk = exam_bulk_ops[i:i+chunk_size]
            t_chunk = time.time()
            res = db.exams.bulk_write(chunk, ordered=False)
            print(f"  ✓ Batch {i//chunk_size + 1}/{(len(exam_bulk_ops)-1)//chunk_size + 1}: {res.modified_count} exams updated in {time.time() - t_chunk:.2f}s")

    print("\n================================================================")
    print("MIGRATION & SYNCHRONIZATION COMPLETE")
    print("================================================================")
    print(f"• Total Questions Updated in db.questions: {len(q_bulk_ops)}")
    print(f"• Total Exams Synchronized in db.exams: {exams_modified}")
    print(f"• Total Snapshots Refreshed: {snaps_updated}")

if __name__ == "__main__":
    main()

