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

WATERMARK = re.compile(r"(?:sarkari|resource|freepdfhall|click\s+here|www\.)", re.IGNORECASE)
P_RESOURCE = re.compile(r"\b[pP]\s*\n+\s*Resource\b", re.IGNORECASE)
TRAILING_DOTS = re.compile(r"[\.…]{3,}\s*[\.…]{3,}")
LEGACY = re.compile(
    r"(?:keâ|ceW|DeefO|efJe|nw~|GheÙ|keäle|Devegceefle|DeJeMe|Éeje|ieF&|uee@|DeYeer|efkeä|"
    r"efvecve|heefj|efmemšce|keâes|efueS|peelee|Sueeskesâ|cee\$ee|neslee|efyeš|DeYeeJe|"
    r"efpeme|mebmeeOeve|kebâhÙ|Dee@he|efuemš|Sueerce|Deveghe|efveOee|Yee<ee|yeeo|nesle|"
    r"efnboer|ÒeMve|efÉleerÙe|ØeLece|Òeefle|efJeYeeie|mebKÙee|Devegmeej|Òeehle|Yeeie|"
    r"DeLe&|veneR|ØeÛeeueve|leb\$e|leLee|Sefkeä|efve<heeove|Debleie&le|nesiee)"
)

watermark_qs = []
trailing_dots_qs = []
legacy_qs = []

for q in db.questions.find():
    stem = q.get("content") or ""
    opts = " ".join(o.get("content") or "" for o in q.get("options", []))
    full = stem + " " + opts
    
    if WATERMARK.search(full) or P_RESOURCE.search(full):
        watermark_qs.append((q["_id"], stem[:60]))
    if TRAILING_DOTS.search(stem):
        trailing_dots_qs.append((q["_id"], stem[:60]))
    if LEGACY.search(full):
        legacy_qs.append((q["_id"], stem[:60]))

print(f"Questions with watermark/junk: {len(watermark_qs)}")
for qid, text in watermark_qs[:10]:
    print(f"  WM: {qid} -> {repr(text)}")

print(f"\nQuestions with trailing repeated dots: {len(trailing_dots_qs)}")
for qid, text in trailing_dots_qs[:10]:
    print(f"  DOTS: {qid} -> {repr(text)}")

print(f"\nQuestions with legacy characters: {len(legacy_qs)}")
for qid, text in legacy_qs:
    print(f"  LEGACY: {qid} -> {repr(text)}")

