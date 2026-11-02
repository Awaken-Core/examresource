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

# Comprehensive regex of APS-DV-Priyanka / Kruti keystroke markers
LEGACY_MARKERS = re.compile(
    r"(?:keâ|ceW|DeefO|efJe|nw~|GheÙ|keäle|Devegceefle|DeJeMe|Éeje|ieF&|uee@|DeYeer|efkeä|"
    r"efvecve|heefj|efmemšce|keâes|efueS|peelee|Sueeskesâ|cee\$ee|neslee|efyeš|DeYeeJe|"
    r"efpeme|mebmeeOeve|kebâhÙ|Dee@he|efuemš|Sueerce|Deveghe|efveOee|Yee<ee|yeeo|nesle|"
    r"efnboer|ÒeMve|efÉleerÙe|ØeLece|Òeefle|efJeYeeie|mebKÙee|Devegmeej|Òeehle|Yeeie)"
)

bad_qs = []
for q in db.questions.find():
    stem = q.get("content") or ""
    hi_trans = (q.get("translations") or {}).get("hi") or ""
    opts_text = " ".join(o.get("content") or "" for o in q.get("options", []))
    opts_hi = " ".join((o.get("translations") or {}).get("hi") or "" for o in q.get("options", []))
    
    found = []
    if LEGACY_MARKERS.search(stem):
        found.append("stem")
    if LEGACY_MARKERS.search(hi_trans):
        found.append("hi_trans")
    if LEGACY_MARKERS.search(opts_text):
        found.append("opts_text")
    if LEGACY_MARKERS.search(opts_hi):
        found.append("opts_hi")
        
    if found:
        bad_qs.append((q["_id"], found, stem[:70]))

print(f"Total questions with legacy font keystrokes in db.questions: {len(bad_qs)}")
for qid, places, stem in bad_qs[:15]:
    print(f"  ID: {qid} in {places} -> {repr(stem)}")

bad_exams = []
for exam in db.exams.find():
    for sec_idx, sec in enumerate(exam.get("sections", [])):
        for q_idx, q in enumerate(sec.get("questions", [])):
            snap = q.get("snapshot", {})
            s_stem = snap.get("content") or ""
            s_hi = (snap.get("translations") or {}).get("hi") or ""
            s_opts = " ".join(o.get("content") or "" for o in snap.get("options", []))
            s_opts_hi = " ".join((o.get("translations") or {}).get("hi") or "" for o in snap.get("options", []))
            
            if (LEGACY_MARKERS.search(s_stem) or LEGACY_MARKERS.search(s_hi) or 
                LEGACY_MARKERS.search(s_opts) or LEGACY_MARKERS.search(s_opts_hi)):
                bad_exams.append((exam["_id"], exam.get("title"), sec_idx, q_idx, q.get("questionId")))
                break
        if bad_exams and bad_exams[-1][0] == exam["_id"]:
            break

print(f"Total exams with legacy font keystrokes in snapshots: {len(bad_exams)}")
for eid, title, sec, qidx, qid in bad_exams[:10]:
    print(f"  Exam: {eid} ({title}) -> sec {sec}, q {qidx}, qid {qid}")

