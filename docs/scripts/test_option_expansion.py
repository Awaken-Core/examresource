import json
import re
import sys
from bson import ObjectId
import pymupdf
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

bad_qs = json.load(open("docs/extracted/bad_option_questions.json", "r", encoding="utf-8"))
doc = pymupdf.open("docs/Computer-Practice-Set-All-Exams-Final.pdf")

WATERMARK_RE = re.compile(r"(freepdfhall|sarkari\s*resource|sarkari\s*result|click\s+here|www\.|YCT|RPSC|DSSSB|UGC\s+NET|HTET|EMRS|BPSC)", re.I)

def clean_opt_text(text: str) -> str:
    lines = []
    for l in (text or "").splitlines():
        t = l.strip()
        if not t or WATERMARK_RE.search(t):
            continue
        if "/" in t:
            t = t.split("/", 1)[0].strip()
        lines.append(t)
    res = " ".join(lines).strip()
    return re.sub(r"\s+", " ", res)

def recover_pdf_options(page_num: int, q_num: int):
    if not page_num or page_num > len(doc):
        return {}
    page = doc[page_num - 1]
    text = page.get_text()
    pos = text.find(f"{q_num}.")
    if pos == -1:
        pos = text.find(f"{q_num} ")
    if pos == -1:
        pos = text.find(f"Q.{q_num}")
    if pos == -1:
        return {}
    snippet = text[pos:pos+2000]
    ans_m = re.search(r"\bAns[\.\s\:\-\(]", snippet)
    if ans_m:
        snippet = snippet[:ans_m.start()]
    matches = re.findall(r"\(([a-d])\)\s*([^(\n]+(?:\n(?!\([a-d]\))[^(\n]+)*)", snippet)
    res = {}
    for letter, content in matches:
        cleaned = clean_opt_text(content)
        if cleaned:
            res[letter.lower()] = cleaned
    return res

results = []
for idx, q in enumerate(bad_qs):
    page_num = q.get("sourcePage")
    q_num = q.get("sourceQuestionNumber")
    current_opts = q["options"]
    content = q["content"]
    expl = q.get("explanation") or ""
    
    pdf_opts = recover_pdf_options(page_num, q_num) if page_num and q_num else {}
    
    resolved_opts = []
    
    # Check if 4 options in PDF
    if len(pdf_opts) == 4:
        # Which option was correct?
        correct_letter = 'a'
        for o_idx, o in enumerate(current_opts):
            if o.get("isCorrect"):
                correct_letter = chr(97 + o_idx)
                break
        for l in ['a', 'b', 'c', 'd']:
            resolved_opts.append({
                "content": pdf_opts[l],
                "isCorrect": (l == correct_letter)
            })
    else:
        # Check if any current option has merged (b), (c), (d)
        merged_found = False
        expanded_opts = []
        for o in current_opts:
            c = o["content"]
            m = re.search(r"(\([b-d]\)|\[[b-d]\]|\b[b-d]\))\s*(.+)$", c)
            if m:
                first_part = c[:m.start()].strip()
                second_part = m.group(2).strip()
                expanded_opts.append({"content": clean_opt_text(first_part), "isCorrect": o["isCorrect"]})
                expanded_opts.append({"content": clean_opt_text(second_part), "isCorrect": False})
                merged_found = True
            else:
                expanded_opts.append({"content": clean_opt_text(c), "isCorrect": o["isCorrect"]})
        
        if len(expanded_opts) == 4:
            resolved_opts = expanded_opts
        elif len(expanded_opts) == 3:
            # Check if PDF has option (d)
            d_opt = pdf_opts.get('d')
            if d_opt:
                expanded_opts.append({"content": d_opt, "isCorrect": False})
            else:
                # Plausible distractor
                if "which" in content.lower() or "not" in content.lower():
                    expanded_opts.append({"content": "None of the above", "isCorrect": False})
                else:
                    expanded_opts.append({"content": "All of the above", "isCorrect": False})
            resolved_opts = expanded_opts
        elif len(expanded_opts) == 2:
            # Check if statement I and II
            c_lower = content.lower()
            if "statement i" in c_lower or "i." in content:
                expanded_opts = [
                    {"content": "Only I", "isCorrect": expanded_opts[0]["isCorrect"] and "only i" in expanded_opts[0]["content"].lower()},
                    {"content": "Only II", "isCorrect": (len(expanded_opts) > 1 and expanded_opts[1]["isCorrect"])},
                    {"content": "Both I and II", "isCorrect": "both" in expl.lower() or "1 and 2" in expl.lower()},
                    {"content": "Neither I nor II", "isCorrect": "neither" in expl.lower() or "none" in expl.lower()}
                ]
                if not any(o["isCorrect"] for o in expanded_opts):
                    expanded_opts[0]["isCorrect"] = True
            elif "true" in c_lower and "false" in c_lower:
                expanded_opts.append({"content": "Partially True", "isCorrect": False})
                expanded_opts.append({"content": "Cannot be determined", "isCorrect": False})
            else:
                if pdf_opts.get('c') and pdf_opts.get('d'):
                    expanded_opts.append({"content": pdf_opts['c'], "isCorrect": False})
                    expanded_opts.append({"content": pdf_opts['d'], "isCorrect": False})
                elif pdf_opts.get('c'):
                    expanded_opts.append({"content": pdf_opts['c'], "isCorrect": False})
                    expanded_opts.append({"content": "None of the above", "isCorrect": False})
                else:
                    expanded_opts.append({"content": "Both (A) and (B)", "isCorrect": False})
                    expanded_opts.append({"content": "Neither (A) nor (B)", "isCorrect": False})
            resolved_opts = expanded_opts

    # Ensure exactly 4 options
    while len(resolved_opts) < 4:
        resolved_opts.append({"content": "None of the above", "isCorrect": False})
    resolved_opts = resolved_opts[:4]
    
    # Ensure at least one correct
    if not any(o["isCorrect"] for o in resolved_opts):
        resolved_opts[0]["isCorrect"] = True
    
    results.append({
        "id": q["id"],
        "content": content[:80],
        "options_count": len(resolved_opts),
        "options": [f"({chr(97+i)}) [{'✓' if o['isCorrect'] else ' '}] {o['content']}" for i, o in enumerate(resolved_opts)]
    })

print(f"Processed {len(results)} questions.")
for r in results[:10]:
    print(f"\nID: {r['id']} | Content: {r['content']}")
    for opt in r['options']:
        print(f"   {opt}")

