import pymupdf

doc = pymupdf.open("docs/Computer-Practice-Set-All-Exams-Final.pdf")
print("Page 104 bottom:")
text = doc[103].get_text() # 0-indexed 103 is page 104
for line in text.splitlines()[-25:]:
    print("  ", line)

print("\nPage 105 top:")
text105 = doc[104].get_text() # 0-indexed 104 is page 105
for line in text105.splitlines()[:25]:
    print("  ", line)

