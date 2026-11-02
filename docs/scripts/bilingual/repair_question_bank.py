"""Repair stored questions from a bilingual re-extraction.

Preserves question ids, option ids, and exam links. Legacy keystroke text is
replaced only when the source PDF produced Devanagari. Unmatched corrupted
questions are flagged for review and kept out of new papers.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

from pymongo import MongoClient

EXTRACT_PATH = Path("docs/extracted/bilingual_questions.json")
LEGACY = re.compile(r"keâ|ceW|DeefO|efJe|nw~|GheÙ|keäle|Devegceefle")
DEVANAGARI = re.compile(r"[\u0900-\u097F]")


def load_db_url() -> str:
    for line in Path("apps/server/.env").read_text(encoding="utf-8").splitlines():
        if line.startswith("DATABASE_URL="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise RuntimeError("DATABASE_URL is missing.")


def norm(text: str) -> str:
    kept = []
    for line in (text or "").splitlines():
        if LEGACY.search(line):
            line = line.split("/")[0]
        if LEGACY.search(line):
            continue
        kept.append(line)
    return re.sub(r"\s+", " ", " ".join(kept)).strip().lower()


def fingerprint(text: str) -> str:
    return norm(text)[:90]


def option_payload(existing: list[dict], extracted: list[dict]) -> list[dict] | None:
    if len(existing) != len(extracted):
        return None
    updated = []
    for index, (old, new) in enumerate(zip(existing, extracted)):
        letter = chr(ord("a") + index)
        payload = {
            **old,
            "content": new.get("en") or old.get("content") or "",
            "translations": {"hi": new.get("hi") or ""} if new.get("hi") else (old.get("translations") or {}),
        }
        correct = new.get("_correct")
        if correct:
            payload["isCorrect"] = letter == correct
        updated.append(payload)
    return updated


def main() -> None:
    questions = json.loads(EXTRACT_PATH.read_text(encoding="utf-8"))
    client = MongoClient(load_db_url())
    db = client.get_default_database()
    bank = list(db.questions.find({}, {"content": 1, "source": 1, "options": 1, "translations": 1}))
    by_source: dict[str, list[dict]] = {}
    legacy_docs = []
    for doc in bank:
        by_source.setdefault((doc.get("source") or "").strip().lower(), []).append(doc)
        blob = doc.get("content") or ""
        blob += " ".join((opt.get("content") or "") for opt in doc.get("options") or [])
        if LEGACY.search(blob):
            legacy_docs.append(doc)

    repaired = 0
    pending = 0
    rejected = 0
    snapshots = 0
    used_ids: set[str] = set()

    for item in questions:
        source = (item.get("source") or "").strip().lower()
        key = fingerprint(item.get("content") or "")
        if len(key) < 24:
            pending += 1
            continue
        candidates = by_source.get(source, [])
        match = None
        for doc in candidates:
            if str(doc["_id"]) in used_ids:
                continue
            if fingerprint(doc.get("content") or "")[:70] == key[:70] or key[:70] in norm(doc.get("content") or ""):
                match = doc
                break
        if match is None:
            for doc in legacy_docs:
                if str(doc["_id"]) in used_ids:
                    continue
                if key[:70] and key[:70] in norm(doc.get("content") or ""):
                    match = doc
                    break
        if match is None:
            if item.get("qualityStatus") == "needs_correction":
                rejected += 1
            else:
                pending += 1
            continue

        hindi = (item.get("translations") or {}).get("hi") or ""
        if item.get("qualityStatus") == "needs_correction" or (not hindi and LEGACY.search(match.get("content") or "")):
            db.questions.update_one(
                {"_id": match["_id"]},
                {
                    "$set": {
                        "qualityStatus": "needs_correction",
                        "qualityFlags": item.get("qualityFlags") or ["legacy_unrepaired"],
                        "extractionConfidence": item.get("extractionConfidence"),
                        "isAvailableForNewTests": False,
                    }
                },
            )
            used_ids.add(str(match["_id"]))
            pending += 1
            continue
        if hindi and not DEVANAGARI.search(hindi):
            pending += 1
            continue

        correct = item.get("correctLetter")
        extracted_options = []
        for index, opt in enumerate(item.get("options") or []):
            extracted_options.append({**opt, "_correct": correct})
        new_options = option_payload(match.get("options") or [], extracted_options)
        update = {
            "content": item.get("content") or match.get("content"),
            "translations": {"hi": hindi} if hindi else (match.get("translations") or {}),
            "explanationTranslations": item.get("explanationTranslations") or {},
            "blocks": item.get("blocks") or [],
            "images": [
                {"url": block.get("imageUrl"), "alt": "Question diagram", "order": index}
                for index, block in enumerate(item.get("blocks") or [])
                if block.get("type") == "image" and block.get("imageUrl")
            ],
            "qualityStatus": "extracted",
            "qualityFlags": item.get("qualityFlags") or [],
            "extractionConfidence": item.get("extractionConfidence"),
            "isAvailableForNewTests": item.get("qualityStatus") == "extracted",
            "sourcePage": item.get("page"),
            "sourceQuestionNumber": item.get("number"),
            "sourcePdf": "Computer-Practice-Set-All-Exams-Final.pdf",
        }
        if item.get("explanation"):
            update["explanation"] = item["explanation"]
        if new_options is not None:
            for opt in new_options:
                opt.pop("_correct", None)
            update["options"] = new_options
        else:
            update["qualityFlags"] = list(set([*(update["qualityFlags"] or []), "option_count_mismatch"]))
            update["qualityStatus"] = "pending_review"
            update["isAvailableForNewTests"] = False
        db.questions.update_one({"_id": match["_id"]}, {"$set": update})
        used_ids.add(str(match["_id"]))
        repaired += 1

        snapshot_set = {
            "questions.$[q].snapshot.content": update["content"],
            "questions.$[q].snapshot.translations": update["translations"],
            "questions.$[q].snapshot.blocks": update["blocks"],
            "questions.$[q].snapshot.images": update["images"],
            "questions.$[q].snapshot.explanationTranslations": update["explanationTranslations"],
        }
        if update.get("explanation"):
            snapshot_set["questions.$[q].snapshot.explanation"] = update["explanation"]
        if new_options is not None:
            snapshot_set["questions.$[q].snapshot.options"] = new_options
        result = db.exams.update_many(
            {"questions.questionId": match["_id"]},
            {"$set": snapshot_set},
            array_filters=[{"q.questionId": match["_id"]}],
        )
        attempt = db.test_attempts.update_many(
            {"answers.questionId": match["_id"]},
            {
                "$set": {
                    "answers.$[a].questionSnapshot.content": update["content"],
                    "answers.$[a].questionSnapshot.translations": update["translations"],
                    "answers.$[a].questionSnapshot.blocks": update["blocks"],
                    "answers.$[a].questionSnapshot.images": update["images"],
                    "answers.$[a].questionSnapshot.explanationTranslations": update["explanationTranslations"],
                    **(
                        {"answers.$[a].questionSnapshot.options": new_options}
                        if new_options is not None
                        else {}
                    ),
                    **(
                        {"answers.$[a].questionSnapshot.explanation": update["explanation"]}
                        if update.get("explanation")
                        else {}
                    ),
                }
            },
            array_filters=[{"a.questionId": match["_id"]}],
        )
        snapshots += result.modified_count + attempt.modified_count

    still_legacy = 0
    for doc in legacy_docs:
        if str(doc["_id"]) in used_ids:
            continue
        db.questions.update_one(
            {"_id": doc["_id"]},
            {
                "$set": {
                    "qualityStatus": "needs_correction",
                    "qualityFlags": ["legacy_unmatched"],
                    "isAvailableForNewTests": False,
                }
            },
        )
        still_legacy += 1
        pending += 1

    print(
        json.dumps(
            {
                "extracted": len(questions),
                "repaired": repaired,
                "pending_review": pending,
                "rejected_or_unusable_extracts": rejected,
                "legacy_left_flagged": still_legacy,
                "snapshot_documents_updated": snapshots,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
