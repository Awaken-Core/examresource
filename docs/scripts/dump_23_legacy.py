import sys
from pymongo import MongoClient
from pathlib import Path
from bson import ObjectId
import re

sys.stdout.reconfigure(encoding="utf-8")

def load_db_url():
    for line in Path("apps/server/.env").read_text(encoding="utf-8").splitlines():
        if line.startswith("DATABASE_URL="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise RuntimeError("DATABASE_URL not found")

client = MongoClient(load_db_url())
db = client.get_default_database()

LEGACY = re.compile(
    r"(?:keâ|ceW|DeefO|efJe|nw~|GheÙ|keäle|Devegceefle|DeJeMe|Éeje|ieF&|uee@|DeYeer|efkeä|"
    r"efvecve|heefj|efmemšce|keâes|efueS|peelee|Sueeskesâ|cee\$ee|neslee|efyeš|DeYeeJe|"
    r"efpeme|mebmeeOeve|kebâhÙ|Dee@he|efuemš|Sueerce|Deveghe|efveOee|Yee<ee|yeeo|nesle|"
    r"efnboer|ÒeMve|efÉleerÙe|ØeLece|Òeefle|efJeYeeie|mebKÙee|Devegmeej|Òeehle|Yeeie|"
    r"DeLe&|veneR|ØeÛeeueve|leb\$e|leLee|Sefkeä|efve<heeove|Debleie&le|nesiee)"
)

legacy_ids = []
for q in db.questions.find():
    stem = q.get("content") or ""
    opts = " ".join(o.get("content") or "" for o in q.get("options", []))
    if LEGACY.search(stem + " " + opts):
        legacy_ids.append(q["_id"])

print(f"Total legacy questions to fix: {len(legacy_ids)}")
for qid in legacy_ids:
    q = db.questions.find_one({"_id": qid})
    print("\n" + "="*50)
    print("ID:", qid)
    print("Content:\n", repr(q.get("content")))
    print("Translations:\n", repr(q.get("translations")))
    print("Options:")
    for o in q.get("options", []):
        print("  ", repr(o.get("content")), "| trans:", repr(o.get("translations")))

