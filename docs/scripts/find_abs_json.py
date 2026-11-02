import json
from pathlib import Path

for path in Path("docs/extracted").glob("*.json"):
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(data, list):
            for i, item in enumerate(data):
                s = str(item)
                if "Absorption" in s and "DeJeMeemeve" in s:
                    print(f"Found in {path.name} at index {i}:")
                    print("  content:", repr(item.get("content")))
                    print("  en:", repr(item.get("en")))
                    print("  hi:", repr(item.get("hi")))
    except Exception as e:
        print(f"Error reading {path}: {e}")

