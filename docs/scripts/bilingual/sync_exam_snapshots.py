import time
import sys
from bson import ObjectId
from pymongo import MongoClient, UpdateOne
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

def main():
    print("================================================================")
    print("SYNCHRONIZING EXAM SNAPSHOTS WITH REPAIRED QUESTIONS")
    print("================================================================")

    for line in Path("apps/server/.env").read_text(encoding="utf-8").splitlines():
        if line.startswith("DATABASE_URL="):
            url = line.split("=", 1)[1].strip().strip('"').strip("'")
    client = MongoClient(url)
    db = client.get_default_database()

    # 1. Load all 3,331 repaired questions
    t0 = time.time()
    print("• Loading repaired questions from db.questions...")
    repaired_cursor = db.questions.find(
        {"sourcePdf": "Computer-Practice-Set-All-Exams-Final.pdf"},
        {
            "_id": 1,
            "content": 1,
            "translations": 1,
            "explanation": 1,
            "explanationTranslations": 1,
            "type": 1,
            "numericalAnswer": 1,
            "blocks": 1,
            "images": 1,
            "options": 1,
        }
    )
    repaired_map = {str(q["_id"]): q for q in repaired_cursor}
    print(f"  ✓ Loaded {len(repaired_map)} repaired questions in {time.time() - t0:.2f}s")

    # 2. Iterate exams and build bulk updates
    print("• Loading all exams to check question snapshots...")
    t1 = time.time()
    exams = list(db.exams.find({}, {"_id": 1, "title": 1, "sections": 1, "questions": 1}))
    print(f"  ✓ Loaded {len(exams)} exams in {time.time() - t1:.2f}s")

    exam_bulk_ops = []
    exams_modified = 0
    questions_synced = 0

    for ex in exams:
        modified = False
        sections = ex.get("sections", [])
        for sec in sections:
            for q_item in sec.get("questions", []):
                qid_str = str(q_item.get("questionId"))
                if qid_str in repaired_map:
                    rq = repaired_map[qid_str]
                    marks = q_item.get("positiveMarks") or sec.get("positiveMarks") or 1
                    neg_marks = (
                        q_item.get("negativeMarks")
                        if q_item.get("negativeMarks") is not None
                        else (sec.get("negativeMarks", 0) if sec.get("negativeMarkingEnabled") else 0)
                    )

                    q_item["snapshot"] = {
                        "questionId": rq["_id"],
                        "content": rq["content"],
                        "translations": rq.get("translations") or {},
                        "explanation": rq.get("explanation"),
                        "explanationTranslations": rq.get("explanationTranslations") or {},
                        "type": rq.get("type") or "single_choice",
                        "numericalAnswer": rq.get("numericalAnswer"),
                        "marks": marks,
                        "negativeMarks": neg_marks,
                        "blocks": rq.get("blocks") or [],
                        "images": rq.get("images") or [],
                        "options": rq.get("options") or [],
                    }
                    modified = True
                    questions_synced += 1

        root_questions = ex.get("questions", [])
        for q_item in root_questions:
            qid_str = str(q_item.get("questionId"))
            if qid_str in repaired_map:
                rq = repaired_map[qid_str]
                marks = q_item.get("marks") or 1
                neg_marks = q_item.get("negativeMarks") or 0

                q_item["snapshot"] = {
                    "questionId": rq["_id"],
                    "content": rq["content"],
                    "translations": rq.get("translations") or {},
                    "explanation": rq.get("explanation"),
                    "explanationTranslations": rq.get("explanationTranslations") or {},
                    "type": rq.get("type") or "single_choice",
                    "numericalAnswer": rq.get("numericalAnswer"),
                    "marks": marks,
                    "negativeMarks": neg_marks,
                    "blocks": rq.get("blocks") or [],
                    "images": rq.get("images") or [],
                    "options": rq.get("options") or [],
                }
                modified = True
                questions_synced += 1

        if modified:
            exam_bulk_ops.append(
                UpdateOne(
                    {"_id": ex["_id"]},
                    {"$set": {"sections": sections, "questions": root_questions}}
                )
            )
            exams_modified += 1

    print(f"• Found {exams_modified} exams with {questions_synced} question snapshots needing update.")

    # 3. Batch bulk write into chunks of 100
    if exam_bulk_ops:
        chunk_size = 100
        for i in range(0, len(exam_bulk_ops), chunk_size):
            chunk = exam_bulk_ops[i:i+chunk_size]
            t_chunk = time.time()
            res = db.exams.bulk_write(chunk, ordered=False)
            print(f"  ✓ Batch {i//chunk_size + 1}/{(len(exam_bulk_ops)-1)//chunk_size + 1}: {res.modified_count} exams updated in {time.time() - t_chunk:.2f}s")

    print("\n================================================================")
    print("EXAM SYNCHRONIZATION COMPLETE")
    print("================================================================")
    print(f"• Total Exams Modified & Synchronized: {exams_modified}")
    print(f"• Total Question Snapshots Refreshed: {questions_synced}")


if __name__ == "__main__":
    main()

