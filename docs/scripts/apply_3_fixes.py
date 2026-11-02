import json

v3_path = "docs/extracted/v3_final_questions.json"
data = json.load(open(v3_path, 'r', encoding='utf-8'))

for q in data:
    # 1. DSA Q#389
    if q['chapter'] == 'Data Structures & Algorithms' and q['questionNumber'] == 389:
        q['content'] = (
            "Consider the following arrays of elements 289, 219, 250, 217, 212, 215, 22, 25, 27, 211, 26, 29, 300. "
            "What is the minimum number of interchanges needed to convert it into max-heap?"
        )
        q['options'] = [
            {"letter": "a", "content": "4", "isCorrect": False, "position": 0},
            {"letter": "b", "content": "5", "isCorrect": False, "position": 1},
            {"letter": "c", "content": "2", "isCorrect": False, "position": 2},
            {"letter": "d", "content": "3", "isCorrect": True, "position": 3},
        ]
        q['correctAnswer'] = "d"
        q['hasAnswer'] = True
        q['explanation'] = (
            "If you build max-heap using the usual bottom–up shift down from the given array you perform 3 swaps:\n"
            "1. swap index 6 and 13: 215 <-> 300\n"
            "2. Swap index 3 and 6 : 250 <-> 300\n"
            "3. Swap index 1 and 3 : 289 <-> 300\n"
            "After these 3 interchanges the array becomes a valid max-heap [300, 219, 289, 217, 212, 250, 22, 25, 27, 211, 26, 29, 215].\n"
            "So, minimum number of exchanges = 3"
        )
        q['source'] = "DSSSB TGT C.S. 07.08.2021 (Shift-II)"
        print("Fixed DSA Q#389")

    # 2. DBMS Q#259
    if q['chapter'] == 'Database Management Systems (DBMS / SQL)' and q['questionNumber'] == 259:
        q['content'] = 'Which of the following represents the "inner" join operation?'
        q['options'] = [
            {"letter": "a", "content": "Inner Join Venn Diagram (Intersection of A and B)", "isCorrect": True, "position": 0},
            {"letter": "b", "content": "Left Outer Join Venn Diagram", "isCorrect": False, "position": 1},
            {"letter": "c", "content": "Right Outer Join Venn Diagram", "isCorrect": False, "position": 2},
            {"letter": "d", "content": "Full Outer Join Venn Diagram", "isCorrect": False, "position": 3},
        ]
        q['correctAnswer'] = "a"
        q['hasAnswer'] = True
        q['explanation'] = (
            "An Inner Join in a Database management system (DBMS) is a type of join operation used to "
            "combine rows from two or more tables based on a related column between them. It returns only the rows "
            "where there is a match in the specified join condition in both tables."
        )
        q['source'] = "DSSSB PGT C.S. (Male) 27.07.2018 (Shift-II)"
        q['images'] = ["https://pub-68568854a58845bc975b176de76b1ad5.r2.dev/question-images/dsssb-computer/p362_img0_46218.webp"]
        print("Fixed DBMS Q#259")

    # 3. OS Q#306
    if q['chapter'] == 'Operating Systems' and q['questionNumber'] == 306:
        q['content'] = (
            "A disk drive has 100 cylinders, numbered 0 to 99. Disk requests come to the disk driver for cylinders "
            "12, 26, 24, 4, 42, 8 and 50 in that order. The driver is currently serving a request at cylinder 24. "
            "A seek takes 6 msec per cylinder moved. How much seek time is needed for shortest seek time first (SSTF) algorithm?"
        )
        q['options'] = [
            {"letter": "a", "content": "0.984 sec", "isCorrect": False, "position": 0},
            {"letter": "b", "content": "0.396 sec", "isCorrect": False, "position": 1},
            {"letter": "c", "content": "0.738 sec", "isCorrect": False, "position": 2},
            {"letter": "d", "content": "0.42 sec", "isCorrect": True, "position": 3},
        ]
        q['correctAnswer'] = "d"
        q['hasAnswer'] = True
        q['explanation'] = (
            "Given requests is: 12, 26, 24, 4, 42, 8, 50\n"
            "Using SSTF (shortest seek time first) algorithm:\n"
            "Total distance covered = 2 + 22 + 46 = 70\n"
            "Total seek time is: = 70 x 6 msec = 70 x 6 x 10^-3 sec = 0.42 sec"
        )
        q['source'] = "UGC NET C.S. June-2015 (Paper-II)"
        print("Fixed OS Q#306")

with open(v3_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

# Re-verify
valid = [q for q in data if len(q.get('options', [])) >= 2]
invalid = [q for q in data if len(q.get('options', [])) < 2]
print(f"DONE! Total: {len(data)}, Valid: {len(valid)}, Invalid: {len(invalid)}")

