# GovtPariksha Test Series Seed Pack

> **Demo data only.** These are original sample questions for local UI and workflow testing, not official exam papers. Use the accompanying JSON as the machine-readable source of truth.

## Seed summary

- **testSeries:** 5
- **globalSubjects:** 8
- **examSubjectAssignments:** 15
- **chapters:** 15
- **uniqueQuestions:** 32
- **questionMappings:** 60
- **subjectWiseTests:** 10
- **chapterWiseTests:** 10
- **fullTests:** 10
- **totalTests:** 30
- **fullTestSections:** 30

## 1. Test Series and subject hierarchy

### RRB NTPC Graduate Level (`rrb-ntpc-graduate`)
- Category: `ssc-railways`; status: `published`; languages: English, Hindi
- Description: Original demo practice tests for Railway recruitment exam preparation.
  - **Mathematics** → chapter: Number System & Percentages (`rrb-number-system-and-percentages`); shared subject: `quantitative-aptitude`
  - **General Intelligence & Reasoning** → chapter: Number Series & Analogy (`rrb-series-and-analogy`); shared subject: `reasoning`
  - **General Awareness** → chapter: Indian General Awareness (`rrb-indian-general-awareness`); shared subject: `general-awareness`

### SSC CGL Tier 1 & Tier 2 (`ssc-cgl-tier1-tier2`)
- Category: `ssc-railways`; status: `published`; languages: English, Hindi
- Description: Original demo practice tests for quantitative aptitude, reasoning and English.
  - **Quantitative Aptitude** → chapter: Arithmetic & Percentages (`ssc-arithmetic-and-percentages`); shared subject: `quantitative-aptitude`
  - **General Intelligence & Reasoning** → chapter: Logical Reasoning Basics (`ssc-logical-reasoning-basics`); shared subject: `reasoning`
  - **English Language** → chapter: Grammar & Vocabulary (`ssc-grammar-and-vocabulary`); shared subject: `english-language`

### IBPS PO Complete Series (`ibps-po-complete`)
- Category: `banking`; status: `published`; languages: English, Hindi
- Description: Original demo practice tests for banking recruitment exams.
  - **Quantitative Aptitude** → chapter: Quantitative Aptitude Basics (`ibps-quantitative-aptitude-basics`); shared subject: `quantitative-aptitude`
  - **Reasoning Ability** → chapter: Logical Reasoning Basics (`ibps-logical-reasoning-basics`); shared subject: `reasoning`
  - **English Language** → chapter: English Language Basics (`ibps-english-language-basics`); shared subject: `english-language`

### UPSC Civil Services Prelims (`upsc-civil-services-prelims`)
- Category: `central-government`; status: `published`; languages: English, Hindi
- Description: Original demo practice tests for Civil Services preliminary preparation.
  - **Indian Polity** → chapter: Constitution & Governance (`upsc-constitution-and-governance`); shared subject: `indian-polity`
  - **History** → chapter: Modern Indian History (`upsc-modern-indian-history`); shared subject: `history`
  - **Geography** → chapter: Indian Physical Geography (`upsc-indian-physical-geography`); shared subject: `geography`

### Bihar BPSC Prelims (`bihar-bpsc-prelims`)
- Category: `state-exams`; status: `published`; languages: English, Hindi
- Description: Original demo practice tests for Bihar state civil services preparation.
  - **History** → chapter: Modern History Basics (`bpsc-modern-history-basics`); shared subject: `history`
  - **Bihar General Knowledge** → chapter: Bihar History & Culture (`bpsc-bihar-history-and-culture`); shared subject: `bihar-general-knowledge`
  - **Indian Polity** → chapter: Constitution & Governance (`bpsc-constitution-and-governance`); shared subject: `indian-polity`

## 2. Complete Question Bank

All questions below include their answer keys and explanations for administrator/seed use. Public test APIs must hide answer keys and explanations until submission.

### Quantitative Aptitude (`quantitative-aptitude`)

#### qa-001
- **Type:** `single_choice`; **Difficulty:** easy
- **Question (EN):** What is 25% of 240?
- **Question (HI):** 240 का 25% कितना है?
- **Options:**
  - A. 40 / 40
  - B. 50 / 50
  - C. 60 / 60 **[CORRECT]**
  - D. 80 / 80
- **Correct option key(s):** C
- **Explanation (EN):** 25% is one quarter. 240 ÷ 4 = 60.
- **Explanation (HI):** 25% का अर्थ एक-चौथाई है। 240 ÷ 4 = 60।
- **Tags:** percentage, arithmetic

#### qa-002
- **Type:** `single_choice`; **Difficulty:** easy
- **Question (EN):** The ratio of boys to girls in a class is 3:5. If there are 64 students, how many are boys?
- **Question (HI):** एक कक्षा में लड़कों और लड़कियों का अनुपात 3:5 है। यदि कुल 64 विद्यार्थी हैं, तो लड़के कितने हैं?
- **Options:**
  - A. 24 / 24 **[CORRECT]**
  - B. 32 / 32
  - C. 40 / 40
  - D. 16 / 16
- **Correct option key(s):** A
- **Explanation (EN):** Total ratio parts = 3 + 5 = 8. One part is 64 ÷ 8 = 8, so boys = 3 × 8 = 24.
- **Explanation (HI):** अनुपात के कुल भाग = 3 + 5 = 8। एक भाग = 64 ÷ 8 = 8, इसलिए लड़के = 3 × 8 = 24।
- **Tags:** ratio, arithmetic

#### qa-003
- **Type:** `single_choice`; **Difficulty:** easy
- **Question (EN):** Find the simple interest on ₹2,000 at 5% per year for 2 years.
- **Question (HI):** ₹2,000 पर 5% वार्षिक दर से 2 वर्ष का साधारण ब्याज कितना होगा?
- **Options:**
  - A. ₹100 / ₹100
  - B. ₹150 / ₹150
  - C. ₹200 / ₹200 **[CORRECT]**
  - D. ₹250 / ₹250
- **Correct option key(s):** C
- **Explanation (EN):** Simple interest = Principal × Rate × Time ÷ 100 = 2000 × 5 × 2 ÷ 100 = ₹200.
- **Explanation (HI):** साधारण ब्याज = मूलधन × दर × समय ÷ 100 = 2000 × 5 × 2 ÷ 100 = ₹200।
- **Tags:** simple-interest, arithmetic

#### qa-004
- **Type:** `single_choice`; **Difficulty:** easy
- **Question (EN):** What is 15% of 200?
- **Question (HI):** 200 का 15% कितना है?
- **Options:**
  - A. 25 / 25
  - B. 30 / 30 **[CORRECT]**
  - C. 35 / 35
  - D. 40 / 40
- **Correct option key(s):** B
- **Explanation (EN):** 10% of 200 is 20 and 5% is 10. Together, 15% of 200 is 30.
- **Explanation (HI):** 200 का 10% = 20 और 5% = 10। इसलिए 200 का 15% = 30।
- **Tags:** percentage, arithmetic

### Reasoning (`reasoning`)

#### rs-001
- **Type:** `single_choice`; **Difficulty:** easy
- **Question (EN):** Find the next number in the series: 2, 6, 12, 20, 30, __.
- **Question (HI):** श्रृंखला में अगली संख्या ज्ञात करें: 2, 6, 12, 20, 30, __।
- **Options:**
  - A. 36 / 36
  - B. 40 / 40
  - C. 42 / 42 **[CORRECT]**
  - D. 44 / 44
- **Correct option key(s):** C
- **Explanation (EN):** The differences are 4, 6, 8, and 10. The next difference is 12, so 30 + 12 = 42.
- **Explanation (HI):** अंतर 4, 6, 8 और 10 हैं। अगला अंतर 12 होगा, इसलिए 30 + 12 = 42।
- **Tags:** number-series, logical-reasoning

#### rs-002
- **Type:** `single_choice`; **Difficulty:** easy
- **Question (EN):** Bird is related to Nest in the same way as Bee is related to:
- **Question (HI):** जिस प्रकार पक्षी का संबंध घोंसले से है, उसी प्रकार मधुमक्खी का संबंध किससे है?
- **Options:**
  - A. Web / जाला
  - B. Hive / छत्ता **[CORRECT]**
  - C. Stable / अस्तबल
  - D. Burrow / बिल
- **Correct option key(s):** B
- **Explanation (EN):** A bird lives in a nest; a bee lives in a hive.
- **Explanation (HI):** पक्षी घोंसले में रहता है और मधुमक्खी छत्ते में रहती है।
- **Tags:** analogy, logical-reasoning

#### rs-003
- **Type:** `multiple_choice`; **Difficulty:** easy
- **Question (EN):** Select all numbers divisible by 3.
- **Question (HI):** वे सभी संख्याएँ चुनें जो 3 से विभाज्य हैं।
- **Options:**
  - A. 12 / 12 **[CORRECT]**
  - B. 14 / 14
  - C. 18 / 18 **[CORRECT]**
  - D. 22 / 22
- **Correct option key(s):** A, C
- **Explanation (EN):** 12 ÷ 3 = 4 and 18 ÷ 3 = 6, so both are divisible by 3. Fourteen and twenty-two are not divisible by 3.
- **Explanation (HI):** 12 ÷ 3 = 4 और 18 ÷ 3 = 6, इसलिए दोनों 3 से विभाज्य हैं। 14 और 22, 3 से विभाज्य नहीं हैं।
- **Tags:** divisibility, multiple-correct

#### rs-004
- **Type:** `single_choice`; **Difficulty:** medium
- **Question (EN):** Find the next number in the series: 3, 8, 15, 24, __.
- **Question (HI):** श्रृंखला में अगली संख्या ज्ञात करें: 3, 8, 15, 24, __।
- **Options:**
  - A. 32 / 32
  - B. 34 / 34
  - C. 35 / 35 **[CORRECT]**
  - D. 37 / 37
- **Correct option key(s):** C
- **Explanation (EN):** The differences are 5, 7, and 9. The next difference is 11, so 24 + 11 = 35.
- **Explanation (HI):** अंतर 5, 7 और 9 हैं। अगला अंतर 11 होगा, इसलिए 24 + 11 = 35।
- **Tags:** number-series, logical-reasoning

### General Awareness (`general-awareness`)

#### ga-001
- **Type:** `single_choice`; **Difficulty:** easy
- **Question (EN):** On which date did the Constitution of India come into effect?
- **Question (HI):** भारत का संविधान किस तारीख को लागू हुआ?
- **Options:**
  - A. 15 August 1947 / 15 अगस्त 1947
  - B. 26 January 1950 / 26 जनवरी 1950 **[CORRECT]**
  - C. 26 November 1949 / 26 नवंबर 1949
  - D. 2 October 1950 / 2 अक्टूबर 1950
- **Correct option key(s):** B
- **Explanation (EN):** The Constitution of India came into effect on 26 January 1950, celebrated as Republic Day.
- **Explanation (HI):** भारत का संविधान 26 जनवरी 1950 को लागू हुआ। यह दिन गणतंत्र दिवस के रूप में मनाया जाता है।
- **Tags:** indian-constitution, national-dates

#### ga-002
- **Type:** `single_choice`; **Difficulty:** medium
- **Question (EN):** Which river is commonly regarded as the longest river flowing entirely within India?
- **Question (HI):** भारत की सीमाओं के भीतर बहने वाली सबसे लंबी नदी सामान्यतः किसे माना जाता है?
- **Options:**
  - A. Narmada / नर्मदा
  - B. Krishna / कृष्णा
  - C. Godavari / गोदावरी **[CORRECT]**
  - D. Kaveri / कावेरी
- **Correct option key(s):** C
- **Explanation (EN):** The Godavari is widely described as the longest river flowing entirely within India.
- **Explanation (HI):** गोदावरी को सामान्यतः भारत की सीमाओं के भीतर बहने वाली सबसे लंबी नदी माना जाता है।
- **Tags:** indian-geography, rivers

#### ga-003
- **Type:** `single_choice`; **Difficulty:** easy
- **Question (EN):** In which year did the Reserve Bank of India begin operations?
- **Question (HI):** भारतीय रिज़र्व बैंक ने किस वर्ष काम करना शुरू किया?
- **Options:**
  - A. 1925 / 1925
  - B. 1935 / 1935 **[CORRECT]**
  - C. 1947 / 1947
  - D. 1950 / 1950
- **Correct option key(s):** B
- **Explanation (EN):** The Reserve Bank of India began operations on 1 April 1935.
- **Explanation (HI):** भारतीय रिज़र्व बैंक ने 1 अप्रैल 1935 को काम करना शुरू किया।
- **Tags:** banking-awareness, rbi

#### ga-004
- **Type:** `single_choice`; **Difficulty:** medium
- **Question (EN):** Which Constitutional Amendment added the Fundamental Duties to the Constitution of India?
- **Question (HI):** भारत के संविधान में मौलिक कर्तव्यों को किस संविधान संशोधन द्वारा जोड़ा गया?
- **Options:**
  - A. 24th Amendment / 24वाँ संशोधन
  - B. 42nd Amendment / 42वाँ संशोधन **[CORRECT]**
  - C. 44th Amendment / 44वाँ संशोधन
  - D. 52nd Amendment / 52वाँ संशोधन
- **Correct option key(s):** B
- **Explanation (EN):** The 42nd Constitutional Amendment Act of 1976 added Fundamental Duties.
- **Explanation (HI):** 1976 के 42वें संविधान संशोधन अधिनियम द्वारा मौलिक कर्तव्य जोड़े गए।
- **Tags:** indian-constitution, amendments

### English Language (`english-language`)

#### en-001
- **Type:** `single_choice`; **Difficulty:** easy
- **Question (EN):** Choose the synonym of “concise”.
- **Question (HI):** “Concise” शब्द का समानार्थी चुनें।
- **Options:**
  - A. Brief / संक्षिप्त **[CORRECT]**
  - B. Confusing / भ्रमित करने वाला
  - C. Lengthy / लंबा
  - D. Unclear / अस्पष्ट
- **Correct option key(s):** A
- **Explanation (EN):** “Concise” means brief and expressed in few words.
- **Explanation (HI):** “Concise” का अर्थ कम शब्दों में स्पष्ट रूप से व्यक्त किया गया है, यानी संक्षिप्त।
- **Tags:** vocabulary, synonyms

#### en-002
- **Type:** `single_choice`; **Difficulty:** easy
- **Question (EN):** Choose the correct preposition: “She is interested ___ learning languages.”
- **Question (HI):** सही preposition चुनें: “She is interested ___ learning languages.”
- **Options:**
  - A. on / on
  - B. at / at
  - C. in / in **[CORRECT]**
  - D. for / for
- **Correct option key(s):** C
- **Explanation (EN):** The standard expression is “interested in” something or doing something.
- **Explanation (HI):** सही प्रयोग “interested in” है, जैसे किसी काम या विषय में रुचि होना।
- **Tags:** grammar, prepositions

#### en-003
- **Type:** `single_choice`; **Difficulty:** easy
- **Question (EN):** Choose the grammatically correct sentence.
- **Question (HI):** व्याकरण की दृष्टि से सही वाक्य चुनें।
- **Options:**
  - A. He do not like tea. / He do not like tea.
  - B. He does not likes tea. / He does not likes tea.
  - C. He does not like tea. / He does not like tea. **[CORRECT]**
  - D. He not like tea. / He not like tea.
- **Correct option key(s):** C
- **Explanation (EN):** With “he” in the present simple negative, use “does not” followed by the base verb “like”.
- **Explanation (HI):** Present Simple के negative वाक्य में “he” के साथ “does not” और उसके बाद verb का मूल रूप “like” आता है।
- **Tags:** grammar, present-simple

#### en-004
- **Type:** `single_choice`; **Difficulty:** medium
- **Question (EN):** Choose the correct passive voice: “The committee approved the proposal.”
- **Question (HI):** सही passive voice चुनें: “The committee approved the proposal.”
- **Options:**
  - A. The proposal approves the committee. / The proposal approves the committee.
  - B. The proposal was approved by the committee. / The proposal was approved by the committee. **[CORRECT]**
  - C. The proposal has approve by the committee. / The proposal has approve by the committee.
  - D. The committee was approved by the proposal. / The committee was approved by the proposal.
- **Correct option key(s):** B
- **Explanation (EN):** The simple past passive uses “was/were + past participle”: “was approved”.
- **Explanation (HI):** Simple Past Passive में “was/were + past participle” लगता है, इसलिए “was approved” सही है।
- **Tags:** grammar, passive-voice

### Indian Polity (`indian-polity`)

#### ip-001
- **Type:** `single_choice`; **Difficulty:** easy
- **Question (EN):** Article 21 of the Constitution of India protects which right?
- **Question (HI):** भारत के संविधान का अनुच्छेद 21 किस अधिकार की रक्षा करता है?
- **Options:**
  - A. Right to Property / संपत्ति का अधिकार
  - B. Right to Life and Personal Liberty / जीवन और व्यक्तिगत स्वतंत्रता का अधिकार **[CORRECT]**
  - C. Right to Vote / मतदान का अधिकार
  - D. Right against Exploitation only / केवल शोषण के विरुद्ध अधिकार
- **Correct option key(s):** B
- **Explanation (EN):** Article 21 protects life and personal liberty, subject to the procedure established by law.
- **Explanation (HI):** अनुच्छेद 21 कानून द्वारा स्थापित प्रक्रिया के अनुसार जीवन और व्यक्तिगत स्वतंत्रता की रक्षा करता है।
- **Tags:** constitution, fundamental-rights

#### ip-002
- **Type:** `single_choice`; **Difficulty:** easy
- **Question (EN):** What is the normal term of the Lok Sabha, unless dissolved earlier?
- **Question (HI):** समय से पहले भंग न होने पर लोकसभा का सामान्य कार्यकाल कितना होता है?
- **Options:**
  - A. Four years / चार वर्ष
  - B. Five years / पाँच वर्ष **[CORRECT]**
  - C. Six years / छह वर्ष
  - D. Seven years / सात वर्ष
- **Correct option key(s):** B
- **Explanation (EN):** The normal term of the Lok Sabha is five years from its first meeting, unless dissolved earlier.
- **Explanation (HI):** समय से पहले भंग न होने पर लोकसभा का सामान्य कार्यकाल उसकी पहली बैठक से पाँच वर्ष होता है।
- **Tags:** parliament, lok-sabha

#### ip-003
- **Type:** `single_choice`; **Difficulty:** medium
- **Question (EN):** Who elects the President of India?
- **Question (HI):** भारत के राष्ट्रपति का चुनाव कौन करता है?
- **Options:**
  - A. All citizens by direct vote / सभी नागरिक प्रत्यक्ष मतदान से
  - B. Only the Lok Sabha members / केवल लोकसभा के सदस्य
  - C. An electoral college specified by the Constitution / संविधान द्वारा निर्दिष्ट निर्वाचक मंडल **[CORRECT]**
  - D. The Prime Minister alone / केवल प्रधानमंत्री
- **Correct option key(s):** C
- **Explanation (EN):** The President is elected by an electoral college consisting of elected MPs and elected MLAs of states and eligible Union Territories.
- **Explanation (HI):** राष्ट्रपति का चुनाव निर्वाचक मंडल करता है, जिसमें निर्वाचित सांसद तथा राज्यों और पात्र केंद्रशासित प्रदेशों के निर्वाचित विधायक शामिल होते हैं।
- **Tags:** president, elections

#### ip-004
- **Type:** `single_choice`; **Difficulty:** medium
- **Question (EN):** Which Constitutional Amendment gave constitutional status to Panchayati Raj institutions?
- **Question (HI):** किस संविधान संशोधन ने पंचायती राज संस्थाओं को संवैधानिक दर्जा दिया?
- **Options:**
  - A. 42nd Amendment / 42वाँ संशोधन
  - B. 52nd Amendment / 52वाँ संशोधन
  - C. 73rd Amendment / 73वाँ संशोधन **[CORRECT]**
  - D. 86th Amendment / 86वाँ संशोधन
- **Correct option key(s):** C
- **Explanation (EN):** The 73rd Constitutional Amendment introduced constitutional provisions for Panchayati Raj institutions.
- **Explanation (HI):** 73वें संविधान संशोधन ने पंचायती राज संस्थाओं के लिए संवैधानिक प्रावधान किए।
- **Tags:** panchayati-raj, amendments

### History (`history`)

#### hi-001
- **Type:** `single_choice`; **Difficulty:** easy
- **Question (EN):** The Battle of Plassey was fought in which year?
- **Question (HI):** प्लासी का युद्ध किस वर्ष लड़ा गया था?
- **Options:**
  - A. 1757 / 1757 **[CORRECT]**
  - B. 1764 / 1764
  - C. 1773 / 1773
  - D. 1857 / 1857
- **Correct option key(s):** A
- **Explanation (EN):** The Battle of Plassey was fought in 1757 between the forces of the East India Company and the Nawab of Bengal’s forces.
- **Explanation (HI):** प्लासी का युद्ध 1757 में ईस्ट इंडिया कंपनी की सेना और बंगाल के नवाब की सेना के बीच हुआ था।
- **Tags:** modern-history, battle-of-plassey

#### hi-002
- **Type:** `single_choice`; **Difficulty:** easy
- **Question (EN):** In which year was the Quit India Movement launched?
- **Question (HI):** भारत छोड़ो आंदोलन किस वर्ष शुरू किया गया था?
- **Options:**
  - A. 1919 / 1919
  - B. 1930 / 1930
  - C. 1942 / 1942 **[CORRECT]**
  - D. 1947 / 1947
- **Correct option key(s):** C
- **Explanation (EN):** The Quit India Movement was launched in August 1942.
- **Explanation (HI):** भारत छोड़ो आंदोलन अगस्त 1942 में शुरू हुआ था।
- **Tags:** freedom-movement, quit-india

#### hi-003
- **Type:** `single_choice`; **Difficulty:** easy
- **Question (EN):** Who founded the Maurya Empire?
- **Question (HI):** मौर्य साम्राज्य की स्थापना किसने की थी?
- **Options:**
  - A. Ashoka / अशोक
  - B. Chandragupta Maurya / चंद्रगुप्त मौर्य **[CORRECT]**
  - C. Bindusara / बिंदुसार
  - D. Harsha / हर्ष
- **Correct option key(s):** B
- **Explanation (EN):** Chandragupta Maurya founded the Maurya Empire in the late fourth century BCE.
- **Explanation (HI):** चंद्रगुप्त मौर्य ने चौथी शताब्दी ईसा पूर्व के उत्तरार्ध में मौर्य साम्राज्य की स्थापना की।
- **Tags:** ancient-history, maurya

#### hi-004
- **Type:** `single_choice`; **Difficulty:** medium
- **Question (EN):** The Salt March led by Mahatma Gandhi began in which year?
- **Question (HI):** महात्मा गांधी के नेतृत्व में नमक सत्याग्रह किस वर्ष शुरू हुआ?
- **Options:**
  - A. 1920 / 1920
  - B. 1928 / 1928
  - C. 1930 / 1930 **[CORRECT]**
  - D. 1935 / 1935
- **Correct option key(s):** C
- **Explanation (EN):** The Salt March began in March 1930 as part of the Civil Disobedience Movement.
- **Explanation (HI):** नमक सत्याग्रह मार्च 1930 में सविनय अवज्ञा आंदोलन के भाग के रूप में शुरू हुआ।
- **Tags:** freedom-movement, salt-march

### Geography (`geography`)

#### geo-001
- **Type:** `single_choice`; **Difficulty:** easy
- **Question (EN):** Which is the largest Indian state by area?
- **Question (HI):** क्षेत्रफल के आधार पर भारत का सबसे बड़ा राज्य कौन-सा है?
- **Options:**
  - A. Madhya Pradesh / मध्य प्रदेश
  - B. Maharashtra / महाराष्ट्र
  - C. Rajasthan / राजस्थान **[CORRECT]**
  - D. Uttar Pradesh / उत्तर प्रदेश
- **Correct option key(s):** C
- **Explanation (EN):** Rajasthan is the largest Indian state by area.
- **Explanation (HI):** क्षेत्रफल के आधार पर राजस्थान भारत का सबसे बड़ा राज्य है।
- **Tags:** indian-geography, states

#### geo-002
- **Type:** `single_choice`; **Difficulty:** medium
- **Question (EN):** Through how many Indian states does the Tropic of Cancer pass?
- **Question (HI):** कर्क रेखा भारत के कितने राज्यों से होकर गुजरती है?
- **Options:**
  - A. 6 / 6
  - B. 7 / 7
  - C. 8 / 8 **[CORRECT]**
  - D. 9 / 9
- **Correct option key(s):** C
- **Explanation (EN):** The Tropic of Cancer passes through eight Indian states.
- **Explanation (HI):** कर्क रेखा भारत के आठ राज्यों से होकर गुजरती है।
- **Tags:** latitude, indian-geography

#### geo-003
- **Type:** `single_choice`; **Difficulty:** easy
- **Question (EN):** Chilika Lake is located in which Indian state?
- **Question (HI):** चिलिका झील भारत के किस राज्य में स्थित है?
- **Options:**
  - A. Odisha / ओडिशा **[CORRECT]**
  - B. Gujarat / गुजरात
  - C. Kerala / केरल
  - D. Assam / असम
- **Correct option key(s):** A
- **Explanation (EN):** Chilika Lake is a brackish-water lagoon on the coast of Odisha.
- **Explanation (HI):** चिलिका झील ओडिशा के तट पर स्थित खारे-मीठे पानी की लैगून है।
- **Tags:** lakes, indian-geography

#### geo-004
- **Type:** `single_choice`; **Difficulty:** easy
- **Question (EN):** The Deccan Plateau occupies a large part of which region of India?
- **Question (HI):** दक्कन का पठार भारत के किस क्षेत्र के बड़े भाग में फैला है?
- **Options:**
  - A. Northern Himalayan region / उत्तरी हिमालयी क्षेत्र
  - B. Peninsular India / प्रायद्वीपीय भारत **[CORRECT]**
  - C. Thar Desert only / केवल थार मरुस्थल
  - D. Ganga delta only / केवल गंगा डेल्टा
- **Correct option key(s):** B
- **Explanation (EN):** The Deccan Plateau occupies a large part of southern and central peninsular India.
- **Explanation (HI):** दक्कन का पठार दक्षिणी और मध्य प्रायद्वीपीय भारत के बड़े भाग में फैला है।
- **Tags:** physiography, plateaus

### Bihar General Knowledge (`bihar-general-knowledge`)

#### bg-001
- **Type:** `single_choice`; **Difficulty:** easy
- **Question (EN):** What is the capital of Bihar?
- **Question (HI):** बिहार की राजधानी क्या है?
- **Options:**
  - A. Gaya / गया
  - B. Patna / पटना **[CORRECT]**
  - C. Bhagalpur / भागलपुर
  - D. Muzaffarpur / मुजफ्फरपुर
- **Correct option key(s):** B
- **Explanation (EN):** Patna is the capital of Bihar.
- **Explanation (HI):** पटना बिहार की राजधानी है।
- **Tags:** bihar-basics, capital

#### bg-002
- **Type:** `single_choice`; **Difficulty:** easy
- **Question (EN):** Bihar Diwas is observed on which date?
- **Question (HI):** बिहार दिवस किस तारीख को मनाया जाता है?
- **Options:**
  - A. 15 January / 15 जनवरी
  - B. 22 March / 22 मार्च **[CORRECT]**
  - C. 15 August / 15 अगस्त
  - D. 2 October / 2 अक्टूबर
- **Correct option key(s):** B
- **Explanation (EN):** Bihar Diwas is observed on 22 March, commemorating the formation of Bihar as a separate province in 1912.
- **Explanation (HI):** बिहार दिवस 22 मार्च को मनाया जाता है। यह 1912 में बिहार के अलग प्रांत बनने की याद दिलाता है।
- **Tags:** bihar-history, bihar-diwas

#### bg-003
- **Type:** `single_choice`; **Difficulty:** medium
- **Question (EN):** Vikramshila Mahavihara is associated with which historical tradition?
- **Question (HI):** विक्रमशिला महाविहार किस ऐतिहासिक परंपरा से जुड़ा है?
- **Options:**
  - A. Ancient Buddhist learning / प्राचीन बौद्ध शिक्षा **[CORRECT]**
  - B. Roman architecture / रोमन वास्तुकला
  - C. Mughal naval training / मुगल नौसैनिक प्रशिक्षण
  - D. European industrial education / यूरोपीय औद्योगिक शिक्षा
- **Correct option key(s):** A
- **Explanation (EN):** Vikramshila was a major Buddhist monastic university established under the Pala dynasty.
- **Explanation (HI):** विक्रमशिला पाल वंश के शासनकाल में स्थापित एक प्रमुख बौद्ध महाविहार था।
- **Tags:** bihar-history, vikramshila

#### bg-004
- **Type:** `single_choice`; **Difficulty:** easy
- **Question (EN):** Nalanda, an ancient centre of learning, is located in which present-day Indian state?
- **Question (HI):** प्राचीन शिक्षा केंद्र नालंदा वर्तमान भारत के किस राज्य में स्थित है?
- **Options:**
  - A. Bihar / बिहार **[CORRECT]**
  - B. Uttar Pradesh / उत्तर प्रदेश
  - C. Odisha / ओडिशा
  - D. West Bengal / पश्चिम बंगाल
- **Correct option key(s):** A
- **Explanation (EN):** The historic Nalanda site is in present-day Bihar.
- **Explanation (HI):** ऐतिहासिक नालंदा स्थल वर्तमान बिहार में स्थित है।
- **Tags:** bihar-history, nalanda

## 3. Question mappings

Every question in a subject pool is mapped to that subject and its exam-specific chapter for each series that uses that shared subject. This preserves the central question-bank pattern without duplicating question documents.

- `qa-001` → `rrb-ntpc-graduate` / `quantitative-aptitude` / `rrb-number-system-and-percentages`
- `qa-002` → `rrb-ntpc-graduate` / `quantitative-aptitude` / `rrb-number-system-and-percentages`
- `qa-003` → `rrb-ntpc-graduate` / `quantitative-aptitude` / `rrb-number-system-and-percentages`
- `qa-004` → `rrb-ntpc-graduate` / `quantitative-aptitude` / `rrb-number-system-and-percentages`
- `rs-001` → `rrb-ntpc-graduate` / `reasoning` / `rrb-series-and-analogy`
- `rs-002` → `rrb-ntpc-graduate` / `reasoning` / `rrb-series-and-analogy`
- `rs-003` → `rrb-ntpc-graduate` / `reasoning` / `rrb-series-and-analogy`
- `rs-004` → `rrb-ntpc-graduate` / `reasoning` / `rrb-series-and-analogy`
- `ga-001` → `rrb-ntpc-graduate` / `general-awareness` / `rrb-indian-general-awareness`
- `ga-002` → `rrb-ntpc-graduate` / `general-awareness` / `rrb-indian-general-awareness`
- `ga-003` → `rrb-ntpc-graduate` / `general-awareness` / `rrb-indian-general-awareness`
- `ga-004` → `rrb-ntpc-graduate` / `general-awareness` / `rrb-indian-general-awareness`
- `qa-001` → `ssc-cgl-tier1-tier2` / `quantitative-aptitude` / `ssc-arithmetic-and-percentages`
- `qa-002` → `ssc-cgl-tier1-tier2` / `quantitative-aptitude` / `ssc-arithmetic-and-percentages`
- `qa-003` → `ssc-cgl-tier1-tier2` / `quantitative-aptitude` / `ssc-arithmetic-and-percentages`
- `qa-004` → `ssc-cgl-tier1-tier2` / `quantitative-aptitude` / `ssc-arithmetic-and-percentages`
- `rs-001` → `ssc-cgl-tier1-tier2` / `reasoning` / `ssc-logical-reasoning-basics`
- `rs-002` → `ssc-cgl-tier1-tier2` / `reasoning` / `ssc-logical-reasoning-basics`
- `rs-003` → `ssc-cgl-tier1-tier2` / `reasoning` / `ssc-logical-reasoning-basics`
- `rs-004` → `ssc-cgl-tier1-tier2` / `reasoning` / `ssc-logical-reasoning-basics`
- `en-001` → `ssc-cgl-tier1-tier2` / `english-language` / `ssc-grammar-and-vocabulary`
- `en-002` → `ssc-cgl-tier1-tier2` / `english-language` / `ssc-grammar-and-vocabulary`
- `en-003` → `ssc-cgl-tier1-tier2` / `english-language` / `ssc-grammar-and-vocabulary`
- `en-004` → `ssc-cgl-tier1-tier2` / `english-language` / `ssc-grammar-and-vocabulary`
- `qa-001` → `ibps-po-complete` / `quantitative-aptitude` / `ibps-quantitative-aptitude-basics`
- `qa-002` → `ibps-po-complete` / `quantitative-aptitude` / `ibps-quantitative-aptitude-basics`
- `qa-003` → `ibps-po-complete` / `quantitative-aptitude` / `ibps-quantitative-aptitude-basics`
- `qa-004` → `ibps-po-complete` / `quantitative-aptitude` / `ibps-quantitative-aptitude-basics`
- `rs-001` → `ibps-po-complete` / `reasoning` / `ibps-logical-reasoning-basics`
- `rs-002` → `ibps-po-complete` / `reasoning` / `ibps-logical-reasoning-basics`
- `rs-003` → `ibps-po-complete` / `reasoning` / `ibps-logical-reasoning-basics`
- `rs-004` → `ibps-po-complete` / `reasoning` / `ibps-logical-reasoning-basics`
- `en-001` → `ibps-po-complete` / `english-language` / `ibps-english-language-basics`
- `en-002` → `ibps-po-complete` / `english-language` / `ibps-english-language-basics`
- `en-003` → `ibps-po-complete` / `english-language` / `ibps-english-language-basics`
- `en-004` → `ibps-po-complete` / `english-language` / `ibps-english-language-basics`
- `ip-001` → `upsc-civil-services-prelims` / `indian-polity` / `upsc-constitution-and-governance`
- `ip-002` → `upsc-civil-services-prelims` / `indian-polity` / `upsc-constitution-and-governance`
- `ip-003` → `upsc-civil-services-prelims` / `indian-polity` / `upsc-constitution-and-governance`
- `ip-004` → `upsc-civil-services-prelims` / `indian-polity` / `upsc-constitution-and-governance`
- `hi-001` → `upsc-civil-services-prelims` / `history` / `upsc-modern-indian-history`
- `hi-002` → `upsc-civil-services-prelims` / `history` / `upsc-modern-indian-history`
- `hi-003` → `upsc-civil-services-prelims` / `history` / `upsc-modern-indian-history`
- `hi-004` → `upsc-civil-services-prelims` / `history` / `upsc-modern-indian-history`
- `geo-001` → `upsc-civil-services-prelims` / `geography` / `upsc-indian-physical-geography`
- `geo-002` → `upsc-civil-services-prelims` / `geography` / `upsc-indian-physical-geography`
- `geo-003` → `upsc-civil-services-prelims` / `geography` / `upsc-indian-physical-geography`
- `geo-004` → `upsc-civil-services-prelims` / `geography` / `upsc-indian-physical-geography`
- `hi-001` → `bihar-bpsc-prelims` / `history` / `bpsc-modern-history-basics`
- `hi-002` → `bihar-bpsc-prelims` / `history` / `bpsc-modern-history-basics`
- `hi-003` → `bihar-bpsc-prelims` / `history` / `bpsc-modern-history-basics`
- `hi-004` → `bihar-bpsc-prelims` / `history` / `bpsc-modern-history-basics`
- `bg-001` → `bihar-bpsc-prelims` / `bihar-general-knowledge` / `bpsc-bihar-history-and-culture`
- `bg-002` → `bihar-bpsc-prelims` / `bihar-general-knowledge` / `bpsc-bihar-history-and-culture`
- `bg-003` → `bihar-bpsc-prelims` / `bihar-general-knowledge` / `bpsc-bihar-history-and-culture`
- `bg-004` → `bihar-bpsc-prelims` / `bihar-general-knowledge` / `bpsc-bihar-history-and-culture`
- `ip-001` → `bihar-bpsc-prelims` / `indian-polity` / `bpsc-constitution-and-governance`
- `ip-002` → `bihar-bpsc-prelims` / `indian-polity` / `bpsc-constitution-and-governance`
- `ip-003` → `bihar-bpsc-prelims` / `indian-polity` / `bpsc-constitution-and-governance`
- `ip-004` → `bihar-bpsc-prelims` / `indian-polity` / `bpsc-constitution-and-governance`

## 4. Individual tests

### Mathematics Practice Test 01
- **Seed key:** `rrb-ntpc-graduate-subject-1`
- **Series:** `rrb-ntpc-graduate`; **Mode:** `subject`; **Status:** `published`; **Access:** `free`
- **Subject:** `quantitative-aptitude`; **Chapter:** `None`
- **Questions:** 4; **Duration:** 12 minutes; **Languages:** English, Hindi
- **Scoring:** +1 correct; negative marking disabled
- **Attempts:** 3; **Selection:** `manual`; **Question set:** `fixed`; **Order:** `fixed`
- **Question IDs:** qa-001, qa-002, qa-003, qa-004
- **Instructions:** This is an original sample test for UI and workflow verification. Read each question carefully.

### General Intelligence & Reasoning Practice Test 02
- **Seed key:** `rrb-ntpc-graduate-subject-2`
- **Series:** `rrb-ntpc-graduate`; **Mode:** `subject`; **Status:** `published`; **Access:** `premium`
- **Subject:** `reasoning`; **Chapter:** `None`
- **Questions:** 4; **Duration:** 12 minutes; **Languages:** English, Hindi
- **Scoring:** +1 correct; negative marking enabled, -0.25
- **Attempts:** unlimited; **Selection:** `manual`; **Question set:** `fixed`; **Order:** `randomized`
- **Question IDs:** rs-001, rs-002, rs-003, rs-004
- **Instructions:** This is an original sample test for UI and workflow verification. Read each question carefully.

### Number System & Percentages Chapter Test 01
- **Seed key:** `rrb-ntpc-graduate-chapter-1`
- **Series:** `rrb-ntpc-graduate`; **Mode:** `chapter`; **Status:** `published`; **Access:** `free`
- **Subject:** `quantitative-aptitude`; **Chapter:** `rrb-number-system-and-percentages`
- **Questions:** 4; **Duration:** 10 minutes; **Languages:** English, Hindi
- **Scoring:** +1 correct; negative marking disabled
- **Attempts:** unlimited; **Selection:** `manual`; **Question set:** `fixed`; **Order:** `fixed`
- **Question IDs:** qa-001, qa-002, qa-003, qa-004
- **Instructions:** This is an original sample chapter test for UI and workflow verification.

### Number Series & Analogy Chapter Test 02
- **Seed key:** `rrb-ntpc-graduate-chapter-2`
- **Series:** `rrb-ntpc-graduate`; **Mode:** `chapter`; **Status:** `published`; **Access:** `premium`
- **Subject:** `reasoning`; **Chapter:** `rrb-series-and-analogy`
- **Questions:** 4; **Duration:** 10 minutes; **Languages:** English, Hindi
- **Scoring:** +1 correct; negative marking enabled, -0.25
- **Attempts:** unlimited; **Selection:** `manual`; **Question set:** `fixed`; **Order:** `fixed`
- **Question IDs:** rs-001, rs-002, rs-003, rs-004
- **Instructions:** This is an original sample chapter test for UI and workflow verification.

### RRB NTPC Graduate Level Full Mock Test 01
- **Seed key:** `rrb-ntpc-graduate-full-1`
- **Series:** `rrb-ntpc-graduate`; **Mode:** `full`; **Status:** `published`; **Access:** `free`
- **Subject:** `None`; **Chapter:** `None`
- **Questions:** 12; **Duration:** 24 minutes; **Languages:** English, Hindi
- **Scoring:** +1 correct; negative marking enabled, -0.25
- **Attempts:** unlimited; **Selection:** `manual`; **Question set:** `fixed`; **Order:** `fixed`
- **Question IDs:** (questions are specified inside sections)
- **Instructions:** This is an original sample full mock test. Each section has its own marking configuration and timer.

| Order | Section | Subject | Chapter | Questions | Duration | Marks | Negative marking | Question set / order |
|---:|---|---|---|---:|---:|---|---|---|
| 1 | Mathematics | `quantitative-aptitude` | `rrb-number-system-and-percentages` | 4 | 8 min | +1 | ON (-0.25) | `fixed` / `fixed` |
  - Fixed questions for section 1: qa-001, qa-002, qa-003, qa-004
| 2 | General Intelligence & Reasoning | `reasoning` | `rrb-series-and-analogy` | 4 | 8 min | +2 | ON (-0.5) | `fixed` / `fixed` |
  - Fixed questions for section 2: rs-001, rs-002, rs-003, rs-004
| 3 | General Awareness | `general-awareness` | `rrb-indian-general-awareness` | 4 | 8 min | +1 | OFF | `fixed` / `fixed` |
  - Fixed questions for section 3: ga-001, ga-002, ga-003, ga-004

### RRB NTPC Graduate Level Full Mock Test 02
- **Seed key:** `rrb-ntpc-graduate-full-2`
- **Series:** `rrb-ntpc-graduate`; **Mode:** `full`; **Status:** `published`; **Access:** `premium`
- **Subject:** `None`; **Chapter:** `None`
- **Questions:** 9; **Duration:** 24 minutes; **Languages:** English, Hindi
- **Scoring:** +1 correct; negative marking enabled, -0.25
- **Attempts:** 3; **Selection:** `manual`; **Question set:** `fixed`; **Order:** `fixed`
- **Question IDs:** (questions are specified inside sections)
- **Instructions:** This is an original sample full mock test. Each section has its own marking configuration and timer.

| Order | Section | Subject | Chapter | Questions | Duration | Marks | Negative marking | Question set / order |
|---:|---|---|---|---:|---:|---|---|---|
| 1 | Mathematics | `quantitative-aptitude` | `rrb-number-system-and-percentages` | 3 | 8 min | +1 | ON (-0.25) | `random_per_attempt` / `randomized` |
  - Eligible mapped question pool for section 1 (select 3 per attempt): qa-001, qa-002, qa-003, qa-004
| 2 | General Intelligence & Reasoning | `reasoning` | `rrb-series-and-analogy` | 3 | 8 min | +2 | ON (-0.5) | `random_per_attempt` / `randomized` |
  - Eligible mapped question pool for section 2 (select 3 per attempt): rs-001, rs-002, rs-003, rs-004
| 3 | General Awareness | `general-awareness` | `rrb-indian-general-awareness` | 3 | 8 min | +1 | ON (-0.25) | `random_per_attempt` / `randomized` |
  - Eligible mapped question pool for section 3 (select 3 per attempt): ga-001, ga-002, ga-003, ga-004

### Quantitative Aptitude Practice Test 01
- **Seed key:** `ssc-cgl-tier1-tier2-subject-1`
- **Series:** `ssc-cgl-tier1-tier2`; **Mode:** `subject`; **Status:** `published`; **Access:** `free`
- **Subject:** `quantitative-aptitude`; **Chapter:** `None`
- **Questions:** 4; **Duration:** 12 minutes; **Languages:** English, Hindi
- **Scoring:** +1 correct; negative marking disabled
- **Attempts:** 3; **Selection:** `manual`; **Question set:** `fixed`; **Order:** `fixed`
- **Question IDs:** qa-001, qa-002, qa-003, qa-004
- **Instructions:** This is an original sample test for UI and workflow verification. Read each question carefully.

### General Intelligence & Reasoning Practice Test 02
- **Seed key:** `ssc-cgl-tier1-tier2-subject-2`
- **Series:** `ssc-cgl-tier1-tier2`; **Mode:** `subject`; **Status:** `published`; **Access:** `premium`
- **Subject:** `reasoning`; **Chapter:** `None`
- **Questions:** 4; **Duration:** 12 minutes; **Languages:** English, Hindi
- **Scoring:** +1 correct; negative marking enabled, -0.25
- **Attempts:** unlimited; **Selection:** `manual`; **Question set:** `fixed`; **Order:** `randomized`
- **Question IDs:** rs-001, rs-002, rs-003, rs-004
- **Instructions:** This is an original sample test for UI and workflow verification. Read each question carefully.

### Arithmetic & Percentages Chapter Test 01
- **Seed key:** `ssc-cgl-tier1-tier2-chapter-1`
- **Series:** `ssc-cgl-tier1-tier2`; **Mode:** `chapter`; **Status:** `published`; **Access:** `free`
- **Subject:** `quantitative-aptitude`; **Chapter:** `ssc-arithmetic-and-percentages`
- **Questions:** 4; **Duration:** 10 minutes; **Languages:** English, Hindi
- **Scoring:** +1 correct; negative marking disabled
- **Attempts:** unlimited; **Selection:** `manual`; **Question set:** `fixed`; **Order:** `fixed`
- **Question IDs:** qa-001, qa-002, qa-003, qa-004
- **Instructions:** This is an original sample chapter test for UI and workflow verification.

### Logical Reasoning Basics Chapter Test 02
- **Seed key:** `ssc-cgl-tier1-tier2-chapter-2`
- **Series:** `ssc-cgl-tier1-tier2`; **Mode:** `chapter`; **Status:** `published`; **Access:** `premium`
- **Subject:** `reasoning`; **Chapter:** `ssc-logical-reasoning-basics`
- **Questions:** 4; **Duration:** 10 minutes; **Languages:** English, Hindi
- **Scoring:** +1 correct; negative marking enabled, -0.25
- **Attempts:** unlimited; **Selection:** `manual`; **Question set:** `fixed`; **Order:** `fixed`
- **Question IDs:** rs-001, rs-002, rs-003, rs-004
- **Instructions:** This is an original sample chapter test for UI and workflow verification.

### SSC CGL Tier 1 & Tier 2 Full Mock Test 01
- **Seed key:** `ssc-cgl-tier1-tier2-full-1`
- **Series:** `ssc-cgl-tier1-tier2`; **Mode:** `full`; **Status:** `published`; **Access:** `free`
- **Subject:** `None`; **Chapter:** `None`
- **Questions:** 12; **Duration:** 24 minutes; **Languages:** English, Hindi
- **Scoring:** +1 correct; negative marking enabled, -0.25
- **Attempts:** unlimited; **Selection:** `manual`; **Question set:** `fixed`; **Order:** `fixed`
- **Question IDs:** (questions are specified inside sections)
- **Instructions:** This is an original sample full mock test. Each section has its own marking configuration and timer.

| Order | Section | Subject | Chapter | Questions | Duration | Marks | Negative marking | Question set / order |
|---:|---|---|---|---:|---:|---|---|---|
| 1 | Quantitative Aptitude | `quantitative-aptitude` | `ssc-arithmetic-and-percentages` | 4 | 8 min | +1 | ON (-0.25) | `fixed` / `fixed` |
  - Fixed questions for section 1: qa-001, qa-002, qa-003, qa-004
| 2 | General Intelligence & Reasoning | `reasoning` | `ssc-logical-reasoning-basics` | 4 | 8 min | +2 | ON (-0.5) | `fixed` / `fixed` |
  - Fixed questions for section 2: rs-001, rs-002, rs-003, rs-004
| 3 | English Language | `english-language` | `ssc-grammar-and-vocabulary` | 4 | 8 min | +1 | OFF | `fixed` / `fixed` |
  - Fixed questions for section 3: en-001, en-002, en-003, en-004

### SSC CGL Tier 1 & Tier 2 Full Mock Test 02
- **Seed key:** `ssc-cgl-tier1-tier2-full-2`
- **Series:** `ssc-cgl-tier1-tier2`; **Mode:** `full`; **Status:** `published`; **Access:** `premium`
- **Subject:** `None`; **Chapter:** `None`
- **Questions:** 9; **Duration:** 24 minutes; **Languages:** English, Hindi
- **Scoring:** +1 correct; negative marking enabled, -0.25
- **Attempts:** 3; **Selection:** `manual`; **Question set:** `fixed`; **Order:** `fixed`
- **Question IDs:** (questions are specified inside sections)
- **Instructions:** This is an original sample full mock test. Each section has its own marking configuration and timer.

| Order | Section | Subject | Chapter | Questions | Duration | Marks | Negative marking | Question set / order |
|---:|---|---|---|---:|---:|---|---|---|
| 1 | Quantitative Aptitude | `quantitative-aptitude` | `ssc-arithmetic-and-percentages` | 3 | 8 min | +1 | ON (-0.25) | `random_per_attempt` / `randomized` |
  - Eligible mapped question pool for section 1 (select 3 per attempt): qa-001, qa-002, qa-003, qa-004
| 2 | General Intelligence & Reasoning | `reasoning` | `ssc-logical-reasoning-basics` | 3 | 8 min | +2 | ON (-0.5) | `random_per_attempt` / `randomized` |
  - Eligible mapped question pool for section 2 (select 3 per attempt): rs-001, rs-002, rs-003, rs-004
| 3 | English Language | `english-language` | `ssc-grammar-and-vocabulary` | 3 | 8 min | +1 | ON (-0.25) | `random_per_attempt` / `randomized` |
  - Eligible mapped question pool for section 3 (select 3 per attempt): en-001, en-002, en-003, en-004

### Quantitative Aptitude Practice Test 01
- **Seed key:** `ibps-po-complete-subject-1`
- **Series:** `ibps-po-complete`; **Mode:** `subject`; **Status:** `published`; **Access:** `free`
- **Subject:** `quantitative-aptitude`; **Chapter:** `None`
- **Questions:** 4; **Duration:** 12 minutes; **Languages:** English, Hindi
- **Scoring:** +1 correct; negative marking disabled
- **Attempts:** 3; **Selection:** `manual`; **Question set:** `fixed`; **Order:** `fixed`
- **Question IDs:** qa-001, qa-002, qa-003, qa-004
- **Instructions:** This is an original sample test for UI and workflow verification. Read each question carefully.

### Reasoning Ability Practice Test 02
- **Seed key:** `ibps-po-complete-subject-2`
- **Series:** `ibps-po-complete`; **Mode:** `subject`; **Status:** `published`; **Access:** `premium`
- **Subject:** `reasoning`; **Chapter:** `None`
- **Questions:** 4; **Duration:** 12 minutes; **Languages:** English, Hindi
- **Scoring:** +1 correct; negative marking enabled, -0.25
- **Attempts:** unlimited; **Selection:** `manual`; **Question set:** `fixed`; **Order:** `randomized`
- **Question IDs:** rs-001, rs-002, rs-003, rs-004
- **Instructions:** This is an original sample test for UI and workflow verification. Read each question carefully.

### Quantitative Aptitude Basics Chapter Test 01
- **Seed key:** `ibps-po-complete-chapter-1`
- **Series:** `ibps-po-complete`; **Mode:** `chapter`; **Status:** `published`; **Access:** `free`
- **Subject:** `quantitative-aptitude`; **Chapter:** `ibps-quantitative-aptitude-basics`
- **Questions:** 4; **Duration:** 10 minutes; **Languages:** English, Hindi
- **Scoring:** +1 correct; negative marking disabled
- **Attempts:** unlimited; **Selection:** `manual`; **Question set:** `fixed`; **Order:** `fixed`
- **Question IDs:** qa-001, qa-002, qa-003, qa-004
- **Instructions:** This is an original sample chapter test for UI and workflow verification.

### Logical Reasoning Basics Chapter Test 02
- **Seed key:** `ibps-po-complete-chapter-2`
- **Series:** `ibps-po-complete`; **Mode:** `chapter`; **Status:** `published`; **Access:** `premium`
- **Subject:** `reasoning`; **Chapter:** `ibps-logical-reasoning-basics`
- **Questions:** 4; **Duration:** 10 minutes; **Languages:** English, Hindi
- **Scoring:** +1 correct; negative marking enabled, -0.25
- **Attempts:** unlimited; **Selection:** `manual`; **Question set:** `fixed`; **Order:** `fixed`
- **Question IDs:** rs-001, rs-002, rs-003, rs-004
- **Instructions:** This is an original sample chapter test for UI and workflow verification.

### IBPS PO Complete Series Full Mock Test 01
- **Seed key:** `ibps-po-complete-full-1`
- **Series:** `ibps-po-complete`; **Mode:** `full`; **Status:** `published`; **Access:** `free`
- **Subject:** `None`; **Chapter:** `None`
- **Questions:** 12; **Duration:** 24 minutes; **Languages:** English, Hindi
- **Scoring:** +1 correct; negative marking enabled, -0.25
- **Attempts:** unlimited; **Selection:** `manual`; **Question set:** `fixed`; **Order:** `fixed`
- **Question IDs:** (questions are specified inside sections)
- **Instructions:** This is an original sample full mock test. Each section has its own marking configuration and timer.

| Order | Section | Subject | Chapter | Questions | Duration | Marks | Negative marking | Question set / order |
|---:|---|---|---|---:|---:|---|---|---|
| 1 | Quantitative Aptitude | `quantitative-aptitude` | `ibps-quantitative-aptitude-basics` | 4 | 8 min | +1 | ON (-0.25) | `fixed` / `fixed` |
  - Fixed questions for section 1: qa-001, qa-002, qa-003, qa-004
| 2 | Reasoning Ability | `reasoning` | `ibps-logical-reasoning-basics` | 4 | 8 min | +2 | ON (-0.5) | `fixed` / `fixed` |
  - Fixed questions for section 2: rs-001, rs-002, rs-003, rs-004
| 3 | English Language | `english-language` | `ibps-english-language-basics` | 4 | 8 min | +1 | OFF | `fixed` / `fixed` |
  - Fixed questions for section 3: en-001, en-002, en-003, en-004

### IBPS PO Complete Series Full Mock Test 02
- **Seed key:** `ibps-po-complete-full-2`
- **Series:** `ibps-po-complete`; **Mode:** `full`; **Status:** `published`; **Access:** `premium`
- **Subject:** `None`; **Chapter:** `None`
- **Questions:** 9; **Duration:** 24 minutes; **Languages:** English, Hindi
- **Scoring:** +1 correct; negative marking enabled, -0.25
- **Attempts:** 3; **Selection:** `manual`; **Question set:** `fixed`; **Order:** `fixed`
- **Question IDs:** (questions are specified inside sections)
- **Instructions:** This is an original sample full mock test. Each section has its own marking configuration and timer.

| Order | Section | Subject | Chapter | Questions | Duration | Marks | Negative marking | Question set / order |
|---:|---|---|---|---:|---:|---|---|---|
| 1 | Quantitative Aptitude | `quantitative-aptitude` | `ibps-quantitative-aptitude-basics` | 3 | 8 min | +1 | ON (-0.25) | `random_per_attempt` / `randomized` |
  - Eligible mapped question pool for section 1 (select 3 per attempt): qa-001, qa-002, qa-003, qa-004
| 2 | Reasoning Ability | `reasoning` | `ibps-logical-reasoning-basics` | 3 | 8 min | +2 | ON (-0.5) | `random_per_attempt` / `randomized` |
  - Eligible mapped question pool for section 2 (select 3 per attempt): rs-001, rs-002, rs-003, rs-004
| 3 | English Language | `english-language` | `ibps-english-language-basics` | 3 | 8 min | +1 | ON (-0.25) | `random_per_attempt` / `randomized` |
  - Eligible mapped question pool for section 3 (select 3 per attempt): en-001, en-002, en-003, en-004

### Indian Polity Practice Test 01
- **Seed key:** `upsc-civil-services-prelims-subject-1`
- **Series:** `upsc-civil-services-prelims`; **Mode:** `subject`; **Status:** `published`; **Access:** `free`
- **Subject:** `indian-polity`; **Chapter:** `None`
- **Questions:** 4; **Duration:** 12 minutes; **Languages:** English, Hindi
- **Scoring:** +1 correct; negative marking disabled
- **Attempts:** 3; **Selection:** `manual`; **Question set:** `fixed`; **Order:** `fixed`
- **Question IDs:** ip-001, ip-002, ip-003, ip-004
- **Instructions:** This is an original sample test for UI and workflow verification. Read each question carefully.

### History Practice Test 02
- **Seed key:** `upsc-civil-services-prelims-subject-2`
- **Series:** `upsc-civil-services-prelims`; **Mode:** `subject`; **Status:** `published`; **Access:** `premium`
- **Subject:** `history`; **Chapter:** `None`
- **Questions:** 4; **Duration:** 12 minutes; **Languages:** English, Hindi
- **Scoring:** +1 correct; negative marking enabled, -0.25
- **Attempts:** unlimited; **Selection:** `manual`; **Question set:** `fixed`; **Order:** `randomized`
- **Question IDs:** hi-001, hi-002, hi-003, hi-004
- **Instructions:** This is an original sample test for UI and workflow verification. Read each question carefully.

### Constitution & Governance Chapter Test 01
- **Seed key:** `upsc-civil-services-prelims-chapter-1`
- **Series:** `upsc-civil-services-prelims`; **Mode:** `chapter`; **Status:** `published`; **Access:** `free`
- **Subject:** `indian-polity`; **Chapter:** `upsc-constitution-and-governance`
- **Questions:** 4; **Duration:** 10 minutes; **Languages:** English, Hindi
- **Scoring:** +1 correct; negative marking disabled
- **Attempts:** unlimited; **Selection:** `manual`; **Question set:** `fixed`; **Order:** `fixed`
- **Question IDs:** ip-001, ip-002, ip-003, ip-004
- **Instructions:** This is an original sample chapter test for UI and workflow verification.

### Modern Indian History Chapter Test 02
- **Seed key:** `upsc-civil-services-prelims-chapter-2`
- **Series:** `upsc-civil-services-prelims`; **Mode:** `chapter`; **Status:** `published`; **Access:** `premium`
- **Subject:** `history`; **Chapter:** `upsc-modern-indian-history`
- **Questions:** 4; **Duration:** 10 minutes; **Languages:** English, Hindi
- **Scoring:** +1 correct; negative marking enabled, -0.25
- **Attempts:** unlimited; **Selection:** `manual`; **Question set:** `fixed`; **Order:** `fixed`
- **Question IDs:** hi-001, hi-002, hi-003, hi-004
- **Instructions:** This is an original sample chapter test for UI and workflow verification.

### UPSC Civil Services Prelims Full Mock Test 01
- **Seed key:** `upsc-civil-services-prelims-full-1`
- **Series:** `upsc-civil-services-prelims`; **Mode:** `full`; **Status:** `published`; **Access:** `free`
- **Subject:** `None`; **Chapter:** `None`
- **Questions:** 12; **Duration:** 24 minutes; **Languages:** English, Hindi
- **Scoring:** +1 correct; negative marking enabled, -0.25
- **Attempts:** unlimited; **Selection:** `manual`; **Question set:** `fixed`; **Order:** `fixed`
- **Question IDs:** (questions are specified inside sections)
- **Instructions:** This is an original sample full mock test. Each section has its own marking configuration and timer.

| Order | Section | Subject | Chapter | Questions | Duration | Marks | Negative marking | Question set / order |
|---:|---|---|---|---:|---:|---|---|---|
| 1 | Indian Polity | `indian-polity` | `upsc-constitution-and-governance` | 4 | 8 min | +1 | ON (-0.25) | `fixed` / `fixed` |
  - Fixed questions for section 1: ip-001, ip-002, ip-003, ip-004
| 2 | History | `history` | `upsc-modern-indian-history` | 4 | 8 min | +2 | ON (-0.5) | `fixed` / `fixed` |
  - Fixed questions for section 2: hi-001, hi-002, hi-003, hi-004
| 3 | Geography | `geography` | `upsc-indian-physical-geography` | 4 | 8 min | +1 | OFF | `fixed` / `fixed` |
  - Fixed questions for section 3: geo-001, geo-002, geo-003, geo-004

### UPSC Civil Services Prelims Full Mock Test 02
- **Seed key:** `upsc-civil-services-prelims-full-2`
- **Series:** `upsc-civil-services-prelims`; **Mode:** `full`; **Status:** `published`; **Access:** `premium`
- **Subject:** `None`; **Chapter:** `None`
- **Questions:** 9; **Duration:** 24 minutes; **Languages:** English, Hindi
- **Scoring:** +1 correct; negative marking enabled, -0.25
- **Attempts:** 3; **Selection:** `manual`; **Question set:** `fixed`; **Order:** `fixed`
- **Question IDs:** (questions are specified inside sections)
- **Instructions:** This is an original sample full mock test. Each section has its own marking configuration and timer.

| Order | Section | Subject | Chapter | Questions | Duration | Marks | Negative marking | Question set / order |
|---:|---|---|---|---:|---:|---|---|---|
| 1 | Indian Polity | `indian-polity` | `upsc-constitution-and-governance` | 3 | 8 min | +1 | ON (-0.25) | `random_per_attempt` / `randomized` |
  - Eligible mapped question pool for section 1 (select 3 per attempt): ip-001, ip-002, ip-003, ip-004
| 2 | History | `history` | `upsc-modern-indian-history` | 3 | 8 min | +2 | ON (-0.5) | `random_per_attempt` / `randomized` |
  - Eligible mapped question pool for section 2 (select 3 per attempt): hi-001, hi-002, hi-003, hi-004
| 3 | Geography | `geography` | `upsc-indian-physical-geography` | 3 | 8 min | +1 | ON (-0.25) | `random_per_attempt` / `randomized` |
  - Eligible mapped question pool for section 3 (select 3 per attempt): geo-001, geo-002, geo-003, geo-004

### History Practice Test 01
- **Seed key:** `bihar-bpsc-prelims-subject-1`
- **Series:** `bihar-bpsc-prelims`; **Mode:** `subject`; **Status:** `published`; **Access:** `free`
- **Subject:** `history`; **Chapter:** `None`
- **Questions:** 4; **Duration:** 12 minutes; **Languages:** English, Hindi
- **Scoring:** +1 correct; negative marking disabled
- **Attempts:** 3; **Selection:** `manual`; **Question set:** `fixed`; **Order:** `fixed`
- **Question IDs:** hi-001, hi-002, hi-003, hi-004
- **Instructions:** This is an original sample test for UI and workflow verification. Read each question carefully.

### Bihar General Knowledge Practice Test 02
- **Seed key:** `bihar-bpsc-prelims-subject-2`
- **Series:** `bihar-bpsc-prelims`; **Mode:** `subject`; **Status:** `published`; **Access:** `premium`
- **Subject:** `bihar-general-knowledge`; **Chapter:** `None`
- **Questions:** 4; **Duration:** 12 minutes; **Languages:** English, Hindi
- **Scoring:** +1 correct; negative marking enabled, -0.25
- **Attempts:** unlimited; **Selection:** `manual`; **Question set:** `fixed`; **Order:** `randomized`
- **Question IDs:** bg-001, bg-002, bg-003, bg-004
- **Instructions:** This is an original sample test for UI and workflow verification. Read each question carefully.

### Modern History Basics Chapter Test 01
- **Seed key:** `bihar-bpsc-prelims-chapter-1`
- **Series:** `bihar-bpsc-prelims`; **Mode:** `chapter`; **Status:** `published`; **Access:** `free`
- **Subject:** `history`; **Chapter:** `bpsc-modern-history-basics`
- **Questions:** 4; **Duration:** 10 minutes; **Languages:** English, Hindi
- **Scoring:** +1 correct; negative marking disabled
- **Attempts:** unlimited; **Selection:** `manual`; **Question set:** `fixed`; **Order:** `fixed`
- **Question IDs:** hi-001, hi-002, hi-003, hi-004
- **Instructions:** This is an original sample chapter test for UI and workflow verification.

### Bihar History & Culture Chapter Test 02
- **Seed key:** `bihar-bpsc-prelims-chapter-2`
- **Series:** `bihar-bpsc-prelims`; **Mode:** `chapter`; **Status:** `published`; **Access:** `premium`
- **Subject:** `bihar-general-knowledge`; **Chapter:** `bpsc-bihar-history-and-culture`
- **Questions:** 4; **Duration:** 10 minutes; **Languages:** English, Hindi
- **Scoring:** +1 correct; negative marking enabled, -0.25
- **Attempts:** unlimited; **Selection:** `manual`; **Question set:** `fixed`; **Order:** `fixed`
- **Question IDs:** bg-001, bg-002, bg-003, bg-004
- **Instructions:** This is an original sample chapter test for UI and workflow verification.

### Bihar BPSC Prelims Full Mock Test 01
- **Seed key:** `bihar-bpsc-prelims-full-1`
- **Series:** `bihar-bpsc-prelims`; **Mode:** `full`; **Status:** `published`; **Access:** `free`
- **Subject:** `None`; **Chapter:** `None`
- **Questions:** 12; **Duration:** 24 minutes; **Languages:** English, Hindi
- **Scoring:** +1 correct; negative marking enabled, -0.25
- **Attempts:** unlimited; **Selection:** `manual`; **Question set:** `fixed`; **Order:** `fixed`
- **Question IDs:** (questions are specified inside sections)
- **Instructions:** This is an original sample full mock test. Each section has its own marking configuration and timer.

| Order | Section | Subject | Chapter | Questions | Duration | Marks | Negative marking | Question set / order |
|---:|---|---|---|---:|---:|---|---|---|
| 1 | History | `history` | `bpsc-modern-history-basics` | 4 | 8 min | +1 | ON (-0.25) | `fixed` / `fixed` |
  - Fixed questions for section 1: hi-001, hi-002, hi-003, hi-004
| 2 | Bihar General Knowledge | `bihar-general-knowledge` | `bpsc-bihar-history-and-culture` | 4 | 8 min | +2 | ON (-0.5) | `fixed` / `fixed` |
  - Fixed questions for section 2: bg-001, bg-002, bg-003, bg-004
| 3 | Indian Polity | `indian-polity` | `bpsc-constitution-and-governance` | 4 | 8 min | +1 | OFF | `fixed` / `fixed` |
  - Fixed questions for section 3: ip-001, ip-002, ip-003, ip-004

### Bihar BPSC Prelims Full Mock Test 02
- **Seed key:** `bihar-bpsc-prelims-full-2`
- **Series:** `bihar-bpsc-prelims`; **Mode:** `full`; **Status:** `published`; **Access:** `premium`
- **Subject:** `None`; **Chapter:** `None`
- **Questions:** 9; **Duration:** 24 minutes; **Languages:** English, Hindi
- **Scoring:** +1 correct; negative marking enabled, -0.25
- **Attempts:** 3; **Selection:** `manual`; **Question set:** `fixed`; **Order:** `fixed`
- **Question IDs:** (questions are specified inside sections)
- **Instructions:** This is an original sample full mock test. Each section has its own marking configuration and timer.

| Order | Section | Subject | Chapter | Questions | Duration | Marks | Negative marking | Question set / order |
|---:|---|---|---|---:|---:|---|---|---|
| 1 | History | `history` | `bpsc-modern-history-basics` | 3 | 8 min | +1 | ON (-0.25) | `random_per_attempt` / `randomized` |
  - Eligible mapped question pool for section 1 (select 3 per attempt): hi-001, hi-002, hi-003, hi-004
| 2 | Bihar General Knowledge | `bihar-general-knowledge` | `bpsc-bihar-history-and-culture` | 3 | 8 min | +2 | ON (-0.5) | `random_per_attempt` / `randomized` |
  - Eligible mapped question pool for section 2 (select 3 per attempt): bg-001, bg-002, bg-003, bg-004
| 3 | Indian Polity | `indian-polity` | `bpsc-constitution-and-governance` | 3 | 8 min | +1 | ON (-0.25) | `random_per_attempt` / `randomized` |
  - Eligible mapped question pool for section 3 (select 3 per attempt): ip-001, ip-002, ip-003, ip-004

## 5. Important ingestion rules

1. Use the JSON file as the canonical seed manifest. Resolve subject, TestSeries, chapter, question, mapping, and test references by stable slugs/seed keys, then persist actual database IDs.
2. Inspect the live Mongoose schemas and DTOs before writing the seed adapter. Translate the manifest shape into current schema fields; do not blindly insert fixture-only keys.
3. Seed only the verified local development database `govtpariksha`; never production.
For Full Mock Test 02, each section selects 3 questions per attempt from a pool of 4 eligible mapped questions; use `eligibleQuestionSlugs` as fixture references for verifying the candidate pool. Do not persist those four IDs as a fixed selected set.
4. Do not clear collections. Use seed-owned deterministic records and safe upserts; never overwrite unrelated or manually edited records.
5. Ensure all test question counts, section question counts, mappings, snapshots, and scoring settings are internally consistent.
6. Run the existing seed command twice and verify no duplicate records are created.
7. Verify the public APIs return all five test series and their six tests each, and verify the seeded tests can be started and submitted with an authenticated student.
8. UI badges for Premium are descriptive only; do not add membership enforcement in this seed task.
