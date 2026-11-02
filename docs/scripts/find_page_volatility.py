import pymupdf

doc = pymupdf.open("docs/Computer-Practice-Set-All-Exams-Final.pdf")
print(f"Total pages: {len(doc)}")

for pno in range(len(doc)):
    text = doc[pno].get_text()
    if "volatility" in text.lower() and "density" in text.lower():
        print(f"Found on page {pno + 1}:")
        for line in text.splitlines():
            if any(w in line.lower() for w in ["volatility", "density", "sata", "scsi", "bus"]):
                print("  ", line)
        print("--- FULL PAGE EXCERPT ---")
        lines = text.splitlines()
        for idx, l in enumerate(lines):
            if "volatility" in l.lower():
                start = max(0, idx - 15)
                end = min(len(lines), idx + 15)
                print("\n".join(lines[start:end]))
        break

