import json
from pathlib import Path
import re

LEGACY = re.compile(
    r"(?:keâ|ceW|DeefO|efJe|nw~|GheÙ|keäle|Devegceefle|DeJeMe|Éeje|ieF&|uee@|DeYeer|efkeä|"
    r"efvecve|heefj|efmemšce|keâes|efueS|peelee|Sueeskesâ|cee\$ee|neslee|efyeš|DeYeeJe|"
    r"efpeme|mebmeeOeve|kebâhÙ|Dee@he|efuemš|Sueerce|Deveghe|efveOee|Yee<ee|yeeo|nesle|"
    r"efnboer|ÒeMve|efÉleerÙe|ØeLece|Òeefle|efJeYeeie|mebKÙee|Devegmeej|Òeehle|Yeeie|"
    r"DeLe&|veneR|ØeÛeeueve|leb\$e|leLee|Sefkeä|efve<heeove|Debleie&le|nesiee)"
)

# For v3_final_questions.json and questions.json, remove any lines with legacy
for name in ["v3_final_questions.json", "questions.json", "complete_questions.json", "final_questions_for_seeding.json", "v2_questions.json"]:
    p = Path("docs/extracted") / name
    if not p.exists():
        continue
    try:
        data = json.loads(p.read_text(encoding="utf-8"))
        if isinstance(data, list):
            changed = 0
            for item in data:
                content = item.get("content") or ""
                if LEGACY.search(content):
                    lines = [l for l in content.splitlines() if not LEGACY.search(l)]
                    item["content"] = "\n".join(lines).strip()
                    changed += 1
            if changed:
                p.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
                print(f"Cleaned {changed} items in {name}")
    except Exception as e:
        print(f"Error updating {name}: {e}")

