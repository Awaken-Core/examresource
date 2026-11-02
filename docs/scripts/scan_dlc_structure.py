"""
The subsection analysis shows that Q#1 appears on MANY pages within each chapter.
The numbering resets are from sub-topics (e.g. Page 9 = Gray Code sub-topic Q1-n,
then page 14 = Sign representation sub-topic Q1-m, etc.)

This means the BOOK IS ORGANIZED AS:
  Chapter -> Multiple Topic Sub-sections -> Questions (each sub-section starts at Q#1)

So to count all questions including sub-section resets:
  3,763 unique Q occurrences physically printed

But the publisher says 5,940 which includes the ORIGINAL exam questions that appeared
in multiple exams. Let me verify what the max possible count is by scanning more
carefully with sub-section awareness.

Let me examine a few pages to understand the sub-section headers.
"""
import pymupdf

doc = pymupdf.open('docs/Computer-Practice-Set-All-Exams-Final.pdf')

# Look at pages 7-15 (beginning of Digital Logic Circuits) to understand structure
with open('docs/extracted/dlc_structure.txt', 'w', encoding='utf-8') as f:
    for pno in range(6, 20):  # Pages 7-20 (0-indexed)
        f.write(f"\n{'='*40} PAGE {pno+1} {'='*40}\n")
        f.write(doc[pno].get_text())

doc.close()
print("Saved Digital Logic Circuits structure to dlc_structure.txt")

