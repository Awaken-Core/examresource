import json

data = json.load(open("docs/extracted/all_89_repaired.json", "r", encoding="utf-8"))
print(f"Total items: {len(data)}")

errors = []
for idx, item in enumerate(data):
    opts = item.get("options", [])
    if len(opts) != 4:
        errors.append(f"Q {item['id']}: len(opts) = {len(opts)}")
    if not any(o.get("isCorrect") for o in opts):
        errors.append(f"Q {item['id']}: no correct option")
    for pos, o in enumerate(opts):
        if o.get("position") != pos:
            errors.append(f"Q {item['id']}: bad position {o.get('position')} vs {pos}")
        if not o.get("content"):
            errors.append(f"Q {item['id']}: empty content in opt {pos}")

if errors:
    print(f"Found {len(errors)} errors:")
    for e in errors[:10]:
        print(" ", e)
else:
    print("ALL 89 QUESTIONS HAVE 100% VALID 4-OPTION STRUCTURES!")

