import sys
from pymongo import MongoClient, UpdateOne
from pathlib import Path
from bson import ObjectId
import re

sys.stdout.reconfigure(encoding="utf-8")

def load_db_url():
    for line in Path("apps/server/.env").read_text(encoding="utf-8").splitlines():
        if line.startswith("DATABASE_URL="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise RuntimeError("DATABASE_URL not found")

client = MongoClient(load_db_url())
db = client.get_default_database()

# Specific curated fixes for the legacy questions identified
FIXES = {
    # 1. Python feature
    ObjectId("6ae76ff2220a650921286816"): {
        "content": "Which one is NOT a feature of Python language?",
        "translations": {"hi": "निम्नलिखित में से कौन सी पायथन भाषा की विशेषता नहीं है?"},
    },
    # 2. C++ access specifier
    ObjectId("6ae76ff2220a650921286892"): {
        "content": "In C++, which of the following is not a valid access specifier?",
        "translations": {"hi": "C++ में, निम्न में से कौन-सा एक मान्य एक्सेस स्पेसिफायर नहीं है?"},
    },
    # 3. Distributed computing example
    ObjectId("6ae76ff7220a650921286d32"): {
        "content": "Which of the following is not an example of Distributed computing?",
        "translations": {"hi": "निम्नलिखित में से कौन सा डिस्ट्रीब्यूटेड कंप्यूटिंग का उदाहरण नहीं है?"},
    },
    # 4. Supercomputer speed
    ObjectId("6ae76ff9220a6509212875e7"): {
        "content": "The speed of supercomputer is measured in ______.",
        "translations": {"hi": "सुपर कंप्यूटर की गति को ______ में मापा जाता है।"},
        "options_fix": [
            {"content": "Floating – point operations per hour", "translations": {"hi": "फ्लोटिंग-पॉइंट ऑपरेशंस प्रति घंटा"}},
            {"content": "Floating – point operations per day", "translations": {"hi": "फ्लोटिंग-पॉइंट ऑपरेशंस प्रति दिन"}},
            {"content": "Floating – point operations per second", "translations": {"hi": "फ्लोटिंग-पॉइंट ऑपरेशंस प्रति सेकंड"}},
            {"content": "Floating – point operations per minute", "translations": {"hi": "फ्लोटिंग-पॉइंट ऑपरेशंस प्रति मिनट"}},
        ]
    },
    # 5. Booth's algorithm
    ObjectId("6ae76ff9220a6509212875ec"): {
        "content": "Which of the following is not considered in Booth's algorithm for multiplication?",
        "translations": {"hi": "गुणन के लिए बूथ एल्गोरिदम (Booth's algorithm) में निम्न में से किस पर विचार नहीं किया जाता है?"},
    },
    # 6. Main memory transfer unit
    ObjectId("6ae76ff9220a650921287601"): {
        "content": "State whether the following statements are true or false.\nStatements:\n(i) For main memory, the unit of transfer is the number of bytes read out of or written into memory at a time.\n(ii) The unit of transfer need not equal a word or an addressable unit.",
        "translations": {"hi": "बताएं कि निम्नलिखित में से कौन सा कथन सत्य या असत्य है:\nकथन:\n(i) मुख्य मेमोरी के लिए, स्थानांतरण की इकाई एक समय में मेमोरी में पढ़े या लिखे गए बाइट्स की संख्या होती है।\n(ii) स्थानांतरण की इकाई किसी शब्द या एड्रेसेबल इकाई के बराबर होना आवश्यक नहीं है।"},
    },
    # 7. Data bus lines / width
    ObjectId("6ae76ffa220a650921287a54"): {
        "content": "The number of lines used in a data bus is referred to as the ______ of the data bus.",
        "translations": {"hi": "डेटा बस में उपयोग की जाने वाली लाइनों की संख्या को डेटा बस की ______ के रूप में जाना जाता है।"},
        "options_fix": [
            {"content": "length", "translations": {"hi": "लंबाई"}},
            {"content": "density", "translations": {"hi": "घनत्व"}},
            {"content": "width", "translations": {"hi": "चौड़ाई"}, "isCorrect": True},
            {"content": "volatility", "translations": {"hi": "अस्थिरता"}},
        ]
    },
    # 8. SCSI stands for
    ObjectId("6ae76ffa220a650921287a55"): {
        "content": "With respect to system buses, SCSI stands for:",
        "translations": {"hi": "सिस्टम बस के संबंध में, SCSI (एस.सी.एस.आई.) का पूर्ण रूप क्या है?"},
        "options_fix": [
            {"content": "Small Computer Side Interface", "translations": {"hi": "स्मॉल कंप्यूटर साइड इंटरफेस"}},
            {"content": "Small Computer System Interface", "translations": {"hi": "स्मॉल कंप्यूटर सिस्टम इंटरफेस"}, "isCorrect": True},
            {"content": "Solid Computer System Interface", "translations": {"hi": "सॉलिड कंप्यूटर सिस्टम इंटरफेस"}},
            {"content": "Synchronous Computer System Interface", "translations": {"hi": "सिंक्रोनस कंप्यूटर सिस्टम इंटरफेस"}},
        ]
    },
    # 9. Stack application
    ObjectId("6ae76ffb220a650921287e81"): {
        "content": "Which one of the following is not an application of the stack data structure?",
        "translations": {"hi": "निम्नलिखित में से कौन सा स्टैक डेटा संरचना का अनुप्रयोग नहीं है?"},
    },
    # 10. Binary search tree insertion
    ObjectId("6ae76ffb220a650921287ee1"): {
        "content": "Following numbers (items) are inserted in order into binary search tree: 40, 60, 20, 80, 50, 10, 30. What will be the number of comparisons required to search the item 50?",
        "translations": {"hi": "निम्नलिखित संख्याएं (आइटम) बाइनरी सर्च ट्री में क्रम से डाली गई हैं: 40, 60, 20, 80, 50, 10, 30। आइटम 50 को खोजने के लिए कितने तुलनाओं (comparisons) की आवश्यकता होगी?"},
    },
    # 11. AVL tree insertion
    ObjectId("6ae76ffd220a6509212886f7"): {
        "content": "Consider the following AVL tree. What will be the resultant tree after inserting 10?",
        "translations": {"hi": "दिए गए AVL ट्री पर विचार करें। 10 को इंसर्ट करने के बाद परिणामी ट्री क्या होगा?"},
    },
    # 12. DBMS utility
    ObjectId("6ae76ffd220a65092128874d"): {
        "content": "Which of the following is not a utility of DBMS?",
        "translations": {"hi": "निम्नलिखित में से कौन DBMS की उपयोगिता नहीं है?"},
    },
    # 13. Aggregate function
    ObjectId("6ae76ffe220a650921288c14"): {
        "content": "Which of the following is not a valid aggregate function in SQL?",
        "translations": {"hi": "SQL में निम्नलिखित में से कौन सा एक मान्य एग्रीगेट फंक्शन नहीं है?"},
    },
    # 14. Absorption law (USER'S SCREENSHOT QUESTION!)
    ObjectId("6ae77000220a650921289411"): {
        "content": "The expression for Absorption law is given by:",
        "translations": {"hi": "अवशोषण नियम (Absorption law) का व्यंजक किसके द्वारा दिया जाता है?"},
        "options_fix": [
            {"content": "A + AB = A", "translations": {"hi": "A + AB = A"}, "isCorrect": True},
            {"content": "A + AB = B", "translations": {"hi": "A + AB = B"}},
            {"content": "AB + AA' = A", "translations": {"hi": "AB + AA' = A"}},
            {"content": "A + B = B + A", "translations": {"hi": "A + B = B + A"}},
        ]
    },
    # 15. Boolean functions
    ObjectId("6ae77000220a650921289428"): {
        "content": "Let F1 = (A + B) . (A' + B') and F2 = A + AB + AB'. Choose a correct statement:",
        "translations": {"hi": "मान लीजिए F1 = (A + B) . (A' + B') और F2 = A + AB + AB' है। सही कथन का चयन करें:"},
    },
    # 16. Combinational digital circuits
    ObjectId("6ae77000220a650921289462"): {
        "content": "Consider the following properties for combinational digital circuits:\n1. Output depends on present input only.\n2. Memory elements are required.\n3. Clock is not required.\nWhich of the above statements are correct?",
        "translations": {"hi": "कॉम्बिनेशनल डिजिटल सर्किट के लिए निम्नलिखित गुणों पर विचार करें:\n1. आउटपुट केवल वर्तमान इनपुट पर निर्भर करता है।\n2. मेमोरी तत्वों की आवश्यकता होती है।\n3. क्लॉक की आवश्यकता नहीं होती है।\nउपरोक्त कथनों में से कौन से सही हैं?"},
    },
    # 17. Gates and Flip-Flops
    ObjectId("6ae77001220a650921289823"): {
        "content": "What is the correct answer of the given statements in the given order?\nI. Gate in which output of logical gate is high when all inputs are high is ______\nII. Half of a byte is known as ______\nIII. A flip-flop whose output follows the input when triggered is ______",
        "translations": {"hi": "दिए गए क्रम में कथनों का सही उत्तर क्या है?\nI. वह गेट जिसमें सभी इनपुट हाई होने पर आउटपुट हाई होता है: ______\nII. आधे बाइट को कहा जाता है: ______\nIII. वह फ्लिप-फ्लॉप जिसका आउटपुट ट्रिगर होने पर इनपुट का अनुसरण करता है: ______"},
        "options_fix": [
            {"content": "NAND gate, bit, T – flip-flop", "translations": {"hi": "NAND गेट, बिट, T – फ्लिप-फ्लॉप"}},
            {"content": "OR gate, nibble, T – flip-flop", "translations": {"hi": "OR गेट, निबल, T – फ्लिप-फ्लॉप"}},
            {"content": "AND gate, nibble, D – flip-flop", "translations": {"hi": "AND गेट, निबल, D – फ्लिप-फ्लॉप"}, "isCorrect": True},
            {"content": "NOR gate, byte, S-R flip-flop", "translations": {"hi": "NOR गेट, बाइट, S-R फ्लिप-फ्लॉप"}},
        ]
    },
    # 18. HTML tags attributes
    ObjectId("6ae77002220a650921289c71"): {
        "content": "Study the 3 statements given below and identify the tag which satisfies all of them:\n1. It is used to separate sections of text or put horizontal line.\n2. Attributes of this tag are ALIGN, WIDTH, COLOR and SIZE.\n3. This tag does not have a closing tag.",
        "translations": {"hi": "नीचे दिए गए 3 कथनों का अध्ययन करें और उस टैग की पहचान करें जो उन सभी को संतुष्ट करता है:\n1. इसका उपयोग पाठ के अनुभागों को अलग करने या क्षैतिज रेखा खींचने के लिए किया जाता है।\n2. इस टैग के एट्रिब्यूट ALIGN, WIDTH, COLOR और SIZE हैं।\n3. इस टैग का कोई क्लोजिंग टैग नहीं होता है।"},
        "options_fix": [
            {"content": "<HR>", "translations": {"hi": "<HR>"}, "isCorrect": True},
            {"content": "<BR>", "translations": {"hi": "<BR>"}},
            {"content": "<LINE>", "translations": {"hi": "<LINE>"}},
            {"content": "<P>", "translations": {"hi": "<P>"}},
        ]
    },
    # 19. Object oriented feature
    ObjectId("6ae77002220a650921289c95"): {
        "content": "Which of the following is NOT an object oriented feature?",
        "translations": {"hi": "निम्नलिखित में से कौन एक ऑब्जेक्ट ओरिएंटेड विशेषता नहीं है?"},
    },
    # 20. Multi-user OS
    ObjectId("6ae77002220a650921289d18"): {
        "content": 'The term "multi-user" in an OS context refers to:',
        "translations": {"hi": 'ऑपरेटिंग सिस्टम के संदर्भ में "मल्टी-यूज़र" शब्द का क्या अर्थ है?'},
    },
    # 21. Not an OS
    ObjectId("6ae77002220a650921289d24"): {
        "content": "Which one of the following is NOT an Operating System?",
        "translations": {"hi": "निम्नलिखित में से कौन सा एक ऑपरेटिंग सिस्टम (प्रचालन तंत्र) नहीं है?"},
    },
    # 22. Not an operating system
    ObjectId("6ae77002220a650921289d2b"): {
        "content": "Which of the following is not an operating system?",
        "translations": {"hi": "निम्नांकित में से कौन-सा ऑपरेटिंग सिस्टम नहीं है?"},
    },
    # 23. Round Robin & FCFS
    ObjectId("6ae77003220a65092128a195"): {
        "content": "Let RR3 means Round Robin Scheduling algorithm with time quantum of 3 units and FCFS means First Come First Serve [FCFS] scheduling algorithm. Now if 3 processes P1, P2, P3 has arrival time in order is (0, 2, 4) and execution time is (8, 5, 4) respectively then the completion order of P1, P2, P3 under RR3 and FCFS scheduling is:",
        "translations": {"hi": "मान लीजिए RR3 का अर्थ 3 इकाइयों के टाइम क्वांटम के साथ राउंड रॉबिन शेड्यूलिंग एल्गोरिदम है और FCFS का अर्थ फर्स्ट कम फर्स्ट सर्व (FCFS) शेड्यूलिंग एल्गोरिदम है। अब यदि 3 प्रक्रियाओं P1, P2, P3 का आगमन समय क्रमशः (0, 2, 4) है और निष्पादन समय क्रमशः (8, 5, 4) है, तो RR3 और FCFS शेड्यूलिंग के तहत P1, P2, P3 का पूर्णता क्रम क्या होगा?"},
    },
    # 24. Deadlock condition
    ObjectId("6ae77008220a65092128a579"): {
        "content": "Which of the following is not a required condition for a deadlock?",
        "translations": {"hi": "निम्न में से कौन-सी डेडलॉक के लिए आवश्यक शर्त नहीं है?"},
    },
    # 25. C pointer to array
    ObjectId("6ae77009220a65092128a9df"): {
        "content": "What is the meaning of the following declaration in C programming language?\nint (*p) [5];",
        "translations": {"hi": "C प्रोग्रामिंग भाषा में निम्नलिखित घोषणा (declaration) का क्या अर्थ है?\nint (*p) [5];"},
        "options_fix": [
            {"content": 'It will result in compile error because there should not be any parenthesis, i.e., "int*p[5]" is valid', "translations": {"hi": "यह कंपाइल त्रुटि देगा क्योंकि कोष्ठक नहीं होना चाहिए"}},
            {"content": "p is a pointer to 5 integers", "translations": {"hi": "p, 5 पूर्णांकों का एक पॉइंटर है"}},
            {"content": "p is a pointer to integer array", "translations": {"hi": "p, एक पूर्णांक सरणी (array) का पॉइंटर है"}},
            {"content": "p is a pointer to an array of 5 integers", "translations": {"hi": "p, 5 पूर्णांकों की एक सरणी (array) का पॉइंटर है"}, "isCorrect": True},
        ]
    },
}

# Also clean any leaked watermark from all questions
WATERMARK_RE = re.compile(r"(\b[pP]\s*\n+\s*Resource\b|Sarkari\s*Re(?:source)?|freepdfhall|click\s+here)", re.IGNORECASE)
TRAILING_DOTS_RE = re.compile(r"[\.…]{3,}\s*[\.…]{3,}$")

print("Applying specific fixes to db.questions...")
updates = []
for qid, fix in FIXES.items():
    doc = db.questions.find_one({"_id": qid})
    if not doc:
        continue
    
    set_fields = {
        "content": fix["content"],
        "translations": fix["translations"],
    }
    
    if "options_fix" in fix:
        existing_opts = doc.get("options", [])
        new_opts = []
        for i, opt_spec in enumerate(fix["options_fix"]):
            opt_id = existing_opts[i]["_id"] if i < len(existing_opts) and "_id" in existing_opts[i] else ObjectId()
            pos = i
            is_corr = opt_spec.get("isCorrect", existing_opts[i].get("isCorrect", False) if i < len(existing_opts) else False)
            new_opts.append({
                "_id": opt_id,
                "position": pos,
                "content": opt_spec["content"],
                "translations": opt_spec.get("translations", {}),
                "isCorrect": is_corr,
                "imageUrl": None,
            })
        set_fields["options"] = new_opts
        
    updates.append(UpdateOne({"_id": qid}, {"$set": set_fields}))

if updates:
    res = db.questions.bulk_write(updates)
    print(f"Updated {res.modified_count} specific legacy questions in db.questions.")

# Now clean any watermark and trailing dots across all questions in db.questions
general_updates = []
for doc in db.questions.find({}, {"content": 1, "options": 1}):
    stem = doc.get("content") or ""
    new_stem = WATERMARK_RE.sub("", stem).strip()
    new_stem = TRAILING_DOTS_RE.sub(".........", new_stem).strip()
    
    opts = doc.get("options", [])
    new_opts = []
    opts_changed = False
    for opt in opts:
        ocontent = opt.get("content") or ""
        new_ocontent = WATERMARK_RE.sub("", ocontent).strip()
        if new_ocontent != ocontent:
            opts_changed = True
        new_opt = {**opt, "content": new_ocontent}
        new_opts.append(new_opt)
        
    if new_stem != stem or opts_changed:
        payload = {}
        if new_stem != stem:
            payload["content"] = new_stem
        if opts_changed:
            payload["options"] = new_opts
        general_updates.append(UpdateOne({"_id": doc["_id"]}, {"$set": payload}))

if general_updates:
    res_gen = db.questions.bulk_write(general_updates)
    print(f"Cleaned watermarks/dots on {res_gen.modified_count} questions in db.questions.")

# Now SYNC all exam snapshots with the updated questions
print("\nSyncing all exam snapshots with updated questions...")
q_map = {q["_id"]: q for q in db.questions.find()}

exam_updates = []
exams = list(db.exams.find())
for exam in exams:
    changed = False
    new_sections = []
    for sec in exam.get("sections", []):
        new_sec_qs = []
        for sq in sec.get("questions", []):
            qid = sq.get("questionId")
            fresh_q = q_map.get(qid)
            if fresh_q:
                # Update snapshot
                fresh_snapshot = {
                    "content": fresh_q.get("content"),
                    "type": fresh_q.get("type", "single_choice"),
                    "marks": fresh_q.get("marks", 1),
                    "negativeMarks": fresh_q.get("negativeMarks", 0.25),
                    "options": fresh_q.get("options", []),
                    "translations": fresh_q.get("translations", {}),
                    "images": fresh_q.get("images", []),
                    "blocks": fresh_q.get("blocks", []),
                }
                new_sq = {**sq, "snapshot": fresh_snapshot}
                changed = True
                new_sec_qs.append(new_sq)
            else:
                new_sec_qs.append(sq)
        new_sections.append({**sec, "questions": new_sec_qs})
    if changed:
        exam_updates.append(UpdateOne({"_id": exam["_id"]}, {"$set": {"sections": new_sections}}))

print(f"Total exams to update with fresh snapshots: {len(exam_updates)}")
for i in range(0, len(exam_updates), 200):
    batch = exam_updates[i:i+200]
    db.exams.bulk_write(batch)
print("Finished syncing all exam snapshots!")

# Also clean any stale snapshots in test_attempts
print("\nSyncing test_attempts snapshots with fresh questions...")
att_updates = []
for att in db.test_attempts.find():
    changed = False
    new_answers = []
    for ans in att.get("answers", []):
        qid = ans.get("questionId")
        fresh_q = q_map.get(qid)
        if fresh_q:
            fresh_snapshot = {
                "content": fresh_q.get("content"),
                "type": fresh_q.get("type", "single_choice"),
                "marks": fresh_q.get("marks", 1),
                "negativeMarks": fresh_q.get("negativeMarks", 0.25),
                "options": fresh_q.get("options", []),
                "translations": fresh_q.get("translations", {}),
                "images": fresh_q.get("images", []),
                "blocks": fresh_q.get("blocks", []),
            }
            new_ans = {**ans, "snapshot": fresh_snapshot}
            changed = True
            new_answers.append(new_ans)
        else:
            new_answers.append(ans)
    if changed:
        att_updates.append(UpdateOne({"_id": att["_id"]}, {"$set": {"answers": new_answers}}))

if att_updates:
    db.test_attempts.bulk_write(att_updates)
    print(f"Updated {len(att_updates)} test attempts with fresh snapshots!")

