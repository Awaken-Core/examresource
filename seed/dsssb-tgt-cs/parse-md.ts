/**
 * parse-md.ts
 * Parses dsssb_chapterwise_weightage_analysis.md into per-subject JSON question files.
 * Run: bun run seed/dsssb-tgt-cs/parse-md.ts
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MD_PATH = join(__dirname, '../../sanchit jain sir/dsssb_chapterwise_weightage_analysis.md');
const OUT_DIR = join(__dirname, 'questions');

mkdirSync(OUT_DIR, { recursive: true });

// ── Subject / chapter taxonomy ────────────────────────────────────────────────
const SUBJECT_MAP: Record<string, { slug: string; name: string }> = {
  'Digital Electronics':            { slug: 'digital-electronics',   name: 'Digital Electronics' },
  'Programming Languages':          { slug: 'programming-languages', name: 'Programming Languages' },
  'Data Base Management System':    { slug: 'dbms',                  name: 'Database Management System' },
  'Operating System':               { slug: 'operating-systems',     name: 'Operating Systems' },
  'Computer Networks':              { slug: 'computer-networks',     name: 'Computer Networks' },
  'Pedagogy':                       { slug: 'pedagogy',              name: 'Pedagogy' },
  'Teaching Aptitude':              { slug: 'teaching-aptitude',     name: 'Teaching Aptitude' },
  'COA':                            { slug: 'computer-org-arch',     name: 'Computer Organisation & Architecture' },
  'Mathematics and Aptitude':       { slug: 'mathematics-aptitude',  name: 'Mathematics & Aptitude' },
  'Data Structure':                 { slug: 'data-structures',       name: 'Data Structures' },
  'Python':                         { slug: 'python',                name: 'Python' },
  'Software Engineering':           { slug: 'software-engineering',  name: 'Software Engineering' },
  'Algorithm':                      { slug: 'algorithms',            name: 'Algorithms' },
  'Computer Graphics':              { slug: 'computer-graphics',     name: 'Computer Graphics' },
  'General Awareness':              { slug: 'general-awareness',     name: 'General Awareness' },
  'Internet & Web Technology':      { slug: 'internet-web-tech',     name: 'Internet & Web Technology' },
  'C Programming':                  { slug: 'c-programming',         name: 'C Programming' },
  'Knowledge of ICT':               { slug: 'knowledge-ict',         name: 'Knowledge of ICT' },
  'Discrete Mathematics':           { slug: 'discrete-mathematics',  name: 'Discrete Mathematics' },
  'Research Aptitude':              { slug: 'research-aptitude',     name: 'Research Aptitude' },
};

// Maps MD topic name → chapter slug (prefix: dsssb-<subj_abbr>-)
const CHAPTER_SLUG_MAP: Record<string, string> = {
  // Digital Electronics
  'Number System':                                             'dsssb-de-number-system',
  'Logic Gates & Hardware':                                    'dsssb-de-logic-gates',
  'Combinational Circuit':                                     'dsssb-de-combinational-circuits',
  'Sequential Circuits':                                       'dsssb-de-sequential-circuits',
  'Number Representation':                                     'dsssb-de-number-representation',
  'Boolean Minimization':                                      'dsssb-de-boolean-minimization',
  'Digital Systems & Boolean Basics':                          'dsssb-de-boolean-basics',
  'Boolean Expression':                                        'dsssb-de-boolean-expression',
  // Programming Languages
  'Programming in C++':                                        'dsssb-pl-cpp',
  'HTML Basics':                                               'dsssb-pl-html',
  'Java':                                                      'dsssb-pl-java',
  'Object Oriented Programming (OOPS)':                        'dsssb-pl-oops',
  'JavaScript-Basics':                                         'dsssb-pl-javascript',
  // DBMS
  'SQL':                                                       'dsssb-dbms-sql',
  'Basics of DBMS':                                            'dsssb-dbms-basics',
  'ER Diagram':                                                'dsssb-dbms-er-diagram',
  'File Organization & Indexing':                              'dsssb-dbms-file-org',
  'Keys & Integrity Constraints':                              'dsssb-dbms-keys-constraints',
  'Normalization (1NF - BCNF)':                                'dsssb-dbms-normalization',
  'Relational Model & Functional Dependencies':                'dsssb-dbms-relational-model',
  'Transaction Management':                                    'dsssb-dbms-transaction',
  // OS
  'Introduction to OS':                                        'dsssb-os-introduction',
  'Process Management':                                        'dsssb-os-process-mgmt',
  'Memory Management':                                         'dsssb-os-memory-mgmt',
  'CPU Scheduling':                                            'dsssb-os-cpu-scheduling',
  'Virtual Memory':                                            'dsssb-os-virtual-memory',
  'Process Synchronization':                                   'dsssb-os-synchronization',
  'Threads & Process Creation':                                'dsssb-os-threads',
  'Deadlock':                                                  'dsssb-os-deadlock',
  'File Management':                                           'dsssb-os-file-mgmt',
  'Disc Scheduling':                                           'dsssb-os-disk-scheduling',
  // CN
  'Introduction to CN':                                        'dsssb-cn-introduction',
  'Data Communication':                                        'dsssb-cn-data-communication',
  'Application Layer':                                         'dsssb-cn-application-layer',
  'Hardware basics':                                           'dsssb-cn-hardware',
  'Network Security & Cryptography':                           'dsssb-cn-security-crypto',
  'DLL: Error Control':                                        'dsssb-cn-error-control',
  // Pedagogy
  'Teaching-Learning Process':                                 'dsssb-ped-teaching-learning',
  'Assessment & Evaluation':                                   'dsssb-ped-assessment',
  'Theories':                                                  'dsssb-ped-theories',
  'Child Development':                                         'dsssb-ped-child-development',
  'Teaching Methods & Strategies':                             'dsssb-ped-methods',
  'Inclusive Education':                                       'dsssb-ped-inclusive',
  'Experiential Pedagogy':                                     'dsssb-ped-experiential',
  'Psychology':                                                'dsssb-ped-psychology',
  // Teaching Aptitude
  'Methods of Teaching':                                       'dsssb-ta-methods',
  'Teaching-Learning Aids & ICT Integration':                  'dsssb-ta-ict',
  'Evaluation, Assessment & Measurement':                      'dsssb-ta-evaluation',
  'Nature, Objectives & Characteristics of Teaching':          'dsssb-ta-objectives',
  'Learners & Learning Process':                               'dsssb-ta-learners',
  'Curriculum & School Environment':                           'dsssb-ta-curriculum',
  // COA
  'Basics of COA':                                             'dsssb-coa-basics',
  'Input Output Organisation':                                 'dsssb-coa-io',
  'Register Transfer and Microoperations':                     'dsssb-coa-register-transfer',
  'Cache Memory Organization':                                 'dsssb-coa-cache',
  'Control Unit Design':                                       'dsssb-coa-control-unit',
  'Programming the Basic Computer':                            'dsssb-coa-programming',
  // Maths
  'Data Interpretation':                                       'dsssb-math-data-interpretation',
  'Probability':                                               'dsssb-math-probability',
  'Calculus':                                                  'dsssb-math-calculus',
  'Algebra':                                                   'dsssb-math-algebra',
  'Statistics':                                                'dsssb-math-statistics',
  'Linear Algebra':                                            'dsssb-math-linear-algebra',
  'Trigonometry':                                              'dsssb-math-trigonometry',
  // Data Structures
  'Tree':                                                      'dsssb-ds-tree',
  'Array':                                                     'dsssb-ds-array',
  'Stack':                                                     'dsssb-ds-stack',
  'Queue':                                                     'dsssb-ds-queue',
  'Hashing':                                                   'dsssb-ds-hashing',
  'Introduction to DS':                                        'dsssb-ds-introduction',
  'Linked List':                                               'dsssb-ds-linked-list',
  'Graphs':                                                    'dsssb-ds-graphs',
  // Python
  'Tokens, Variables, Data Types, I/O':                        'dsssb-py-tokens-datatypes',
  'File Handling & Data Analysis':                             'dsssb-py-file-handling',
  'Introduction to Python':                                    'dsssb-py-introduction',
  'Collections & Strings':                                     'dsssb-py-collections',
  'Operators & Expressions':                                   'dsssb-py-operators',
  'Control Flow & Looping':                                    'dsssb-py-control-flow',
  // Software Engineering
  'Software Design':                                           'dsssb-se-design',
  'Software Process Models':                                   'dsssb-se-process-models',
  'Software Testing':                                          'dsssb-se-testing',
  'Software Quality':                                          'dsssb-se-quality',
  'Estimation and Scheduling':                                 'dsssb-se-estimation',
  'Software Configuration Management':                         'dsssb-se-config-mgmt',
  // Algorithms
  'Sorting Algorithms':                                        'dsssb-algo-sorting',
  'Algorithm Analysis':                                        'dsssb-algo-analysis',
  'Greedy Algorithms':                                         'dsssb-algo-greedy',
  'Time Complexity Analysis':                                  'dsssb-algo-complexity',
  'Minimum Spanning Trees':                                     'dsssb-algo-mst',
  // Computer Graphics
  'Basics of Computer Graphics':                               'dsssb-cg-basics',
  '2-D Geometrical Transforms and Viewing':                    'dsssb-cg-2d-transforms',
  '3-D Object Representation, Geometric Transformations and Viewing': 'dsssb-cg-3d-transforms',
  // General Awareness
  'Physics':                                                   'dsssb-ga-physics',
  // Internet & Web Tech
  'Web Design & Development':                                  'dsssb-web-design',
  'Internet Fundamentals':                                     'dsssb-web-fundamentals',
  'Website, Browser & Services':                               'dsssb-web-browser',
  // C Programming
  'C Fundamentals':                                            'dsssb-c-fundamentals',
  'Arrays & Pointers':                                         'dsssb-c-arrays-pointers',
  'Functions':                                                 'dsssb-c-functions',
  'Storage Classes, Structures & Enums':                       'dsssb-c-storage-classes',
  // ICT
  'Emerging Tech Trends':                                      'dsssb-ict-emerging-tech',
  'Society, Law & Ethics':                                     'dsssb-ict-law-ethics',
  // Discrete Math
  'Propositional and Predicate Logic':                         'dsssb-dm-logic',
  'Set Theory':                                                'dsssb-dm-set-theory',
  // Research Aptitude
  'Research Process Steps':                                    'dsssb-ra-process',
};

// ── Parse state machine ───────────────────────────────────────────────────────
interface ParsedQuestion {
  content: string;
  type: 'single_choice';
  subject: string;
  subjectSlug: string;
  topic: string;        // sub-chapter name (e.g. "Number System")
  chapterSlug: string;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation: string;
  options: { content: string; isCorrect: boolean; position: number }[];
  source: string;
  tags: string[];
  examYear: number | null;
}

const lines = readFileSync(MD_PATH, 'utf-8').split('\n').map(l => l.trimEnd());

let currentSubject = '';
let currentTopic   = '';
let state: 'idle' | 'question' | 'options' | 'answer' | 'solution' = 'idle';

let buf: {
  questionLines: string[];
  optionLines:   string[];
  answerLine:    string;
  solutionLines: string[];
  difficulty:    'easy' | 'medium' | 'hard';
  examYear:      number | null;
} = reset();

function reset() {
  return { questionLines: [], optionLines: [], answerLine: '', solutionLines: [], difficulty: 'easy' as const, examYear: null as number | null };
}

// Subject-keyed output bucket
const buckets: Record<string, ParsedQuestion[]> = {};

function difficultyFromLevel(lvl: string): 'easy' | 'medium' | 'hard' {
  if (lvl.includes('1')) return 'easy';
  if (lvl.includes('2')) return 'medium';
  return 'hard';
}

function parseYearFromExamInfo(line: string): number | null {
  const m = line.match(/DSSSB\s*-\s*(\d{4})/);
  return m ? parseInt(m[1]) : null;
}

function letterToIndex(letter: string): number {
  return letter.trim().toUpperCase().charCodeAt(0) - 65; // A→0, B→1, …
}

function flushQuestion() {
  if (!buf.questionLines.length || !buf.optionLines.length || !buf.answerLine) return;

  const content = buf.questionLines.join('\n').trim();
  if (!content) return;

  // Parse options: lines like "- (A) some text" or "- (A) some text"
  const options: { content: string; isCorrect: boolean; position: number }[] = [];
  for (const ol of buf.optionLines) {
    const m = ol.match(/^[-*]\s*\(([A-D])\)\s*(.*)/);
    if (!m) continue;
    const letter = m[1];
    const text   = m[2].trim();
    options.push({ content: text, isCorrect: false, position: letterToIndex(letter) });
  }

  // Parse correct answer: "**Correct Answer:** Option (C) ..."
  // or "**Correct Answer:** Option (C) and (D) ..." for multi
  const correctLetters: string[] = [];
  const answerMatch = buf.answerLine.match(/Option\s*\(([A-D])\)/gi) || [];
  for (const am of answerMatch) {
    const lm = am.match(/\(([A-D])\)/i);
    if (lm) correctLetters.push(lm[1].toUpperCase());
  }

  for (const opt of options) {
    const letter = String.fromCharCode(65 + opt.position);
    opt.isCorrect = correctLetters.includes(letter);
  }

  // Skip questions with no valid correct answer (data issues)
  if (!options.some(o => o.isCorrect) || options.length < 2) return;

  const explanation = buf.solutionLines.join('\n').trim();
  const subjectInfo = SUBJECT_MAP[currentSubject];
  if (!subjectInfo) return;

  const chapterSlug = CHAPTER_SLUG_MAP[currentTopic] ?? '';
  const tags = ['dsssb', 'pyq', subjectInfo.slug];
  if (buf.examYear) tags.push(String(buf.examYear));

  const q: ParsedQuestion = {
    content,
    type: 'single_choice',
    subject: subjectInfo.name,
    subjectSlug: subjectInfo.slug,
    topic: currentTopic,
    chapterSlug,
    difficulty: buf.difficulty,
    explanation,
    options,
    source: 'DSSSB-TGT-CS',
    tags,
    examYear: buf.examYear,
  };

  if (!buckets[subjectInfo.slug]) buckets[subjectInfo.slug] = [];
  buckets[subjectInfo.slug].push(q);

  buf = reset();
  state = 'idle';
}

// ── Line-by-line state machine ────────────────────────────────────────────────
for (const raw of lines) {
  const line = raw.trim();

  // ── Subject heading: "# Chapter N: Digital Electronics (118 Questions)"
  const subjMatch = line.match(/^#\s+Chapter\s+\d+:\s+(.+?)\s+\(\d+\s+Questions?\)/i);
  if (subjMatch) {
    currentSubject = subjMatch[1].trim();
    currentTopic = '';
    state = 'idle';
    continue;
  }

  // ── Topic / sub-chapter heading: "## 1.1 Number System (22 Questions)"
  const topicMatch = line.match(/^##\s+[\d.]+\s+(.+?)\s+\(\d+\s+Questions?\)/i);
  if (topicMatch) {
    flushQuestion();
    currentTopic = topicMatch[1].trim();
    state = 'idle';
    continue;
  }

  // ── Question heading: "### Question N [...]"
  if (/^###\s+Question\s+\d+/.test(line)) {
    flushQuestion();
    buf = reset();
    state = 'idle';
    continue;
  }

  // ── Exam info line: "- **Exam Info:** DSSSB - 2021 - Computer Science"
  if (line.startsWith('- **Exam Info:**')) {
    buf.examYear = parseYearFromExamInfo(line);
    continue;
  }

  // ── Difficulty line: "- **Difficulty:** Level 1"
  const diffMatch = line.match(/^-\s+\*\*Difficulty:\*\*\s+(.+)/i);
  if (diffMatch) {
    buf.difficulty = difficultyFromLevel(diffMatch[1]);
    continue;
  }

  // ── Question block start: "**Question:**"
  if (line === '**Question:**') {
    state = 'question';
    buf.questionLines = [];
    continue;
  }

  // ── Options block start: "**Options:**"
  if (line === '**Options:**') {
    state = 'options';
    buf.optionLines = [];
    continue;
  }

  // ── Correct Answer line
  if (line.startsWith('**Correct Answer:**')) {
    state = 'answer';
    buf.answerLine = line;
    continue;
  }

  // ── Solution block start: "**Solution:**"
  if (line === '**Solution:**') {
    state = 'solution';
    buf.solutionLines = [];
    continue;
  }

  // ── Horizontal rule → end of a question block
  if (line === '---') {
    flushQuestion();
    state = 'idle';
    continue;
  }

  // ── Content accumulation based on state
  if (state === 'question' && line) {
    buf.questionLines.push(raw); // preserve original spacing
  } else if (state === 'options' && /^[-*]\s*\([A-D]\)/.test(line)) {
    buf.optionLines.push(line);
  } else if (state === 'solution' && line) {
    buf.solutionLines.push(raw);
  }
}
// flush last
flushQuestion();

// ── Write output files ────────────────────────────────────────────────────────
let totalWritten = 0;
for (const [slug, questions] of Object.entries(buckets)) {
  const outPath = join(OUT_DIR, `${slug}.json`);
  writeFileSync(outPath, JSON.stringify(questions, null, 2), 'utf-8');
  console.log(`✅  ${slug}.json — ${questions.length} questions`);
  totalWritten += questions.length;
}

console.log(`\n🎉  Total: ${totalWritten} questions across ${Object.keys(buckets).length} subjects`);
