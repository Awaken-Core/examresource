from pathlib import Path
p = Path("apps/server/.env")
url = ""
for line in p.read_text(encoding="utf-8").splitlines():
    if line.startswith("DATABASE_URL="):
        url = line.split("=", 1)[1].strip().strip('"').strip("'")
Path("docs/scripts/.dburl.tmp").write_text(url, encoding="utf-8")
print("HAS_URL", bool(url), "LEN", len(url))
