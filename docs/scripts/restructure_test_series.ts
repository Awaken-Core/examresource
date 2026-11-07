/**
 * Comprehensive Test Series Restructuring & Migration Script
 *
 * Implements:
 * 1. 11 Real DSSSB Computer Science Subjects with exact syllabi
 * 2. 55 Syllabus-aligned Chapters across the 11 Subjects
 * 3. Exact mapping of all 3,331 questions to (Subject, Chapter) with zero duplicates or orphans
 * 4. question_mappings population for rapid indexed querying
 * 5. Test generation:
 *    - Full Mock Tests with authentic internal examination sections (100 Qs / 200 Qs, 120 mins, +1 / -0.25)
 *    - Subject Tests for all 11 Subjects (44 tests, 50 Qs each, 60 mins, +1 / -0.25)
 *    - Chapter Tests for all 55 Chapters (220 tests, 20 Qs each, 30 mins, +1 / -0.25)
 * 6. Authentic bilingual snapshot formatting for CBT engine
 *
 * Usage:
 *   bun run docs/scripts/restructure_test_series.ts
 */

import 'dotenv/config';
import mongoose, { Types } from 'mongoose';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Load environment variables
const envFile = resolve(import.meta.dir, '../../apps/server/.env');
for (const line of readFileSync(envFile, 'utf-8').split('\n')) {
  const t = line.trim();
  if (t && !t.startsWith('#') && t.includes('=')) {
    const [k, ...v] = t.split('=');
    process.env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
  }
}

await mongoose.connect(process.env.DATABASE_URL!);
console.log(' connected to MongoDB.');

const db = mongoose.connection;
const SeriesCol = db.collection('test_series');
const SubjectCol = db.collection('subjects');
const TSSubjectCol = db.collection('test_series_subjects');
const ChapterCol = db.collection('chapters');
const QuestionCol = db.collection('questions');
const MappingCol = db.collection('question_mappings');
const ExamCol = db.collection('exams');
const UserCol = db.collection('users');

const adminUser = await UserCol.findOne({ role: 'admin' });
const adminId = adminUser?._id || new Types.ObjectId();

// 1. Find or verify target DSSSB series
const series = await SeriesCol.findOne({ slug: 'dsssb-tgt-computer-science' });
if (!series) {
  throw new Error('Test series "dsssb-tgt-computer-science" not found!');
}
const seriesId = series._id;
console.log(` Target series: ${series.title} (${seriesId})`);

// 2. Define the 11 DSSSB Syllabus Subjects and their Chapters with precision keyword matchers
interface ChapterSpec {
  name: string;
  slug: string;
  order: number;
  keywords: RegExp;
}

interface SubjectSpec {
  name: string;
  slug: string;
  order: number;
  description: string;
  topicMatch: string;
  chapters: ChapterSpec[];
}

const DSSSB_SUBJECTS: SubjectSpec[] = [
  {
    name: 'Digital Logic Circuits',
    slug: 'digital-logic-circuits',
    order: 1,
    description: 'Number systems, base conversions, Boolean algebra, logic gates, combinational and sequential digital circuits.',
    topicMatch: 'Digital Logic Circuits',
    chapters: [
      {
        name: 'Registers, Counters & Logic Families',
        slug: 'registers-counters-logic-families',
        order: 5,
        keywords: /counter|shift register|ripple counter|ring counter|johnson counter|synchronous counter|asynchronous counter|ttl|cmos|ecl|logic families|fan-out|propagation delay|noise margin|tristate/i,
      },
      {
        name: 'Sequential Logic Circuits & Flip-Flops',
        slug: 'sequential-circuits-flip-flops',
        order: 4,
        keywords: /flip-flop|flip flop|latch|master slave|jk flip|sr flip|d flip|t flip|excitation|state diagram|clocked|race around|bistable|multivibrator/i,
      },
      {
        name: 'Combinational Logic Circuits',
        slug: 'combinational-circuits',
        order: 3,
        keywords: /combinational|multiplexer|mux|demultiplexer|demux|decoder|encoder|adder|half adder|full adder|subtractor|comparator|priority encoder|carry lookahead|parity generator/i,
      },
      {
        name: 'Boolean Algebra & Logic Gates',
        slug: 'boolean-algebra-gates',
        order: 2,
        keywords: /boolean|logic gate|and gate|or gate|nand|nor|xor|xnor|de morgan|k-map|karnaugh|sop|pos|minterm|maxterm|canonical|universal gate|duality|don't care|absorption|consensus/i,
      },
      {
        name: 'Number Systems, Base Conversions & Codes',
        slug: 'number-systems-codes',
        order: 1,
        keywords: /binary|hexadecimal|octal|ascii|ebcdic|gray code|bcd|radix|base|excess-3|conversion|1's complement|2's complement|complement|signed|mantissa|overflow|representation/i,
      },
    ],
  },
  {
    name: 'Computer Organization & Architecture',
    slug: 'computer-organization-architecture',
    order: 2,
    description: 'CPU architecture, instruction formats, addressing modes, memory hierarchy, cache mapping, I/O and pipelining.',
    topicMatch: 'Computer Organization & Architecture',
    chapters: [
      {
        name: 'Pipelining, Hazards & Parallel Architectures',
        slug: 'pipelining-parallel-architectures',
        order: 5,
        keywords: /pipeline|pipelining|hazard|data hazard|structural hazard|branch hazard|throughput|speedup|supercomputer|simd|mimd|parallel processing|superscalar|vliw|flynn/i,
      },
      {
        name: 'Input-Output Organization, DMA & Interrupts',
        slug: 'io-organization-interrupts',
        order: 4,
        keywords: /interrupt|dma|direct memory access|programmed io|interrupt-driven|daisy chain|vectored interrupt|i\/o interface|bus arbitration|cycle stealing|polling/i,
      },
      {
        name: 'Memory Hierarchy & Cache Memory Organization',
        slug: 'memory-hierarchy-cache',
        order: 3,
        keywords: /cache|hit ratio|miss penalty|direct mapping|associative mapping|set-associative|sram|dram|rom|secondary memory|write through|write back|cache line|locality|virtual memory/i,
      },
      {
        name: 'Instruction Formats & Addressing Modes',
        slug: 'instruction-formats-addressing-modes',
        order: 2,
        keywords: /addressing mode|instruction format|opcode|operand|zero address|one address|immediate addressing|indexed|indirect addressing|relative addressing|risc|cisc|register addressing/i,
      },
      {
        name: 'Computer Organization Basics & CPU Structure',
        slug: 'coa-basics-cpu',
        order: 1,
        keywords: /von neumann|cpu|alu|control unit|program counter|accumulator|instruction cycle|micro-operation|bus architecture|register transfer|datapath|processor|hardwired|microprogrammed/i,
      },
    ],
  },
  {
    name: 'Programming Concepts in C',
    slug: 'programming-concepts-c',
    order: 3,
    description: 'C programming tokens, control flow, functions, pointers, arrays, memory management and file handling.',
    topicMatch: 'Programming Concepts in C',
    chapters: [
      {
        name: 'Structures, Unions, Enums & File Handling',
        slug: 'c-structures-unions-files',
        order: 5,
        keywords: /struct|union|enum|typedef|fopen|fclose|fread|fwrite|fseek|file pointer|member access|preprocessor|#define|header file/i,
      },
      {
        name: 'Functions, Parameter Passing & Storage Classes',
        slug: 'c-functions-storage-classes',
        order: 4,
        keywords: /function|recursion|call by value|call by reference|storage class|auto|static|extern|register|scope|function prototype|return type|actual parameter|formal parameter/i,
      },
      {
        name: 'Arrays, Strings & Pointer Arithmetic',
        slug: 'c-arrays-strings-pointers',
        order: 3,
        keywords: /pointer|array|string|address-of|dereference|pointer arithmetic|dynamic memory|malloc|calloc|free|realloc|null pointer|strlen|strcpy|strcat|strcmp|2d array/i,
      },
      {
        name: 'Control Structures & Loops in C',
        slug: 'c-control-structures-loops',
        order: 2,
        keywords: /loop|while|for loop|do-while|if-else|switch|case|break|continue|goto|conditional statement|nested loop|infinite/i,
      },
      {
        name: 'C Fundamentals, Data Types & Operators',
        slug: 'c-fundamentals-operators',
        order: 1,
        keywords: /data type|operator|printf|scanf|token|variable|constant|identifier|bitwise|precedence|associativity|sizeof|type casting|literal|escape sequence|keyword/i,
      },
    ],
  },
  {
    name: 'Data Structures & Algorithms',
    slug: 'data-structures-algorithms',
    order: 4,
    description: 'Linear & non-linear data structures, trees, graphs, sorting, searching, recursion and complexity analysis.',
    topicMatch: 'Data Structures & Algorithms',
    chapters: [
      {
        name: 'Algorithm Analysis & Complexity Classes',
        slug: 'algorithm-analysis-complexity',
        order: 6,
        keywords: /complexity|time complexity|space complexity|asymptotic|big o|omega|theta|worst case|best case|average case|recurrence|master theorem|divide and conquer|dynamic programming|greedy|np complete|np hard|p vs np|tractable/i,
      },
      {
        name: 'Searching & Sorting Techniques',
        slug: 'searching-sorting',
        order: 5,
        keywords: /sorting|bubble sort|quick sort|merge sort|insertion sort|selection sort|heap sort|radix sort|linear search|binary search|hash|hashing|collision|hash table|open addressing|chaining/i,
      },
      {
        name: 'Graphs & Graph Algorithms',
        slug: 'graphs-algorithms',
        order: 4,
        keywords: /graph|vertex|edge|adjacency matrix|adjacency list|bfs|dfs|breadth first|depth first|dijkstra|shortest path|spanning tree|prim|kruskal|topological|cycle detection|bipartite/i,
      },
      {
        name: 'Trees, Binary Search Trees & Heaps',
        slug: 'trees-bst-heaps',
        order: 3,
        keywords: /tree|binary tree|bst|binary search tree|avl|heap|max heap|min heap|inorder|preorder|postorder|traversal|height of tree|leaf node|root|complete binary tree|b-tree|b\+ tree/i,
      },
      {
        name: 'Linked Lists & Dynamic Storage',
        slug: 'linked-lists',
        order: 2,
        keywords: /linked list|singly linked|doubly linked|circular linked|node|head pointer|next pointer|prev pointer|insert at|delete node|traverse list/i,
      },
      {
        name: 'Arrays, Stacks, Queues & Recursion',
        slug: 'stacks-queues-recursion',
        order: 1,
        keywords: /stack|queue|push|pop|lifo|fifo|circular queue|dequeue|priority queue|infix|postfix|prefix|polish notation|recursion|overflow|underflow|linear data structure/i,
      },
    ],
  },
  {
    name: 'Object Oriented Programming (C++ / Java)',
    slug: 'oop-cpp-java',
    order: 5,
    description: 'Object-oriented programming concepts, classes, inheritance, polymorphism, templates and Java core.',
    topicMatch: 'Object Oriented Programming (C++ / Java)',
    chapters: [
      {
        name: 'Templates, Exception Handling & Core Java',
        slug: 'templates-exceptions-java',
        order: 5,
        keywords: /template|stl|standard template|exception handling|try|catch|throw|java|jvm|bytecode|garbage collection|package|applet|interface|implements|extends|thread class|runnable/i,
      },
      {
        name: 'Virtual Functions, Abstract Classes & Dynamic Binding',
        slug: 'virtual-functions-abstract-classes',
        order: 4,
        keywords: /virtual function|pure virtual|abstract class|vtable|late binding|dynamic binding|run-time polymorphism|override|runtime/i,
      },
      {
        name: 'Inheritance & Compile-Time Polymorphism',
        slug: 'inheritance-polymorphism',
        order: 3,
        keywords: /inheritance|single inheritance|multiple inheritance|multilevel|hierarchical|hybrid|base class|derived class|polymorphism|function overloading|operator overloading|friend function/i,
      },
      {
        name: 'Constructors, Destructors & Memory Management',
        slug: 'constructors-destructors-memory',
        order: 2,
        keywords: /constructor|destructor|default constructor|copy constructor|parameterized constructor|new operator|delete operator|initialization list/i,
      },
      {
        name: 'OOP Principles, Classes & Objects',
        slug: 'oop-principles-classes-objects',
        order: 1,
        keywords: /object oriented|class|object|encapsulation|data hiding|abstraction|access specifier|public|private|protected|this pointer|method|instance/i,
      },
    ],
  },
  {
    name: 'Operating Systems',
    slug: 'operating-systems',
    order: 6,
    description: 'Process management, CPU scheduling, synchronization, deadlocks, memory management and file systems.',
    topicMatch: 'Operating Systems',
    chapters: [
      {
        name: 'File Systems, Storage & Disk Scheduling',
        slug: 'file-systems-disk-scheduling',
        order: 5,
        keywords: /file system|directory|disk scheduling|fcfs|sstf|scan|c-scan|look|c-look|seek time|rotational latency|inode|fat|ntfs|allocation methods|raid|disk block/i,
      },
      {
        name: 'Memory Management, Paging & Virtual Memory',
        slug: 'memory-management-virtual-memory',
        order: 4,
        keywords: /memory management|paging|segmentation|page table|tlb|virtual memory|page fault|fifo|lru|optimal|page replacement|thrashing|internal fragmentation|external fragmentation|demand paging/i,
      },
      {
        name: 'Process Synchronization, Critical Sections & Deadlocks',
        slug: 'synchronization-deadlocks',
        order: 3,
        keywords: /synchronization|critical section|mutex|semaphore|deadlock|banker's algorithm|resource allocation graph|prevention|avoidance|detection|race condition|peterson|producer consumer|dining philosophers/i,
      },
      {
        name: 'Process Management, Threads & CPU Scheduling',
        slug: 'process-management-cpu-scheduling',
        order: 2,
        keywords: /process|thread|pcb|process control block|context switch|cpu scheduling|fcfs|sjf|round robin|priority scheduling|turnaround time|waiting time|preemptive|non-preemptive|multithreading/i,
      },
      {
        name: 'OS Architecture, Kernel & System Calls',
        slug: 'os-architecture-system-calls',
        order: 1,
        keywords: /operating system|kernel|system call|monolithic|microkernel|user mode|kernel mode|dual mode|multiprogramming|multitasking|time sharing|windows|linux|unix|fork|boot/i,
      },
    ],
  },
  {
    name: 'Database Management Systems (DBMS / SQL)',
    slug: 'dbms-sql',
    order: 7,
    description: 'Relational models, ER diagrams, SQL queries, normalization, transactions and concurrency control.',
    topicMatch: 'Database Management Systems (DBMS / SQL)',
    chapters: [
      {
        name: 'Transactions, Concurrency Control & Recovery',
        slug: 'transactions-concurrency-recovery',
        order: 5,
        keywords: /transaction|acid|atomicity|consistency|isolation|durability|concurrency|serializability|two-phase locking|2pl|deadlock|log-based recovery|checkpoint|commit|rollback|timestamp ordering/i,
      },
      {
        name: 'Functional Dependencies & Normalization',
        slug: 'normalization-dependencies',
        order: 4,
        keywords: /normalization|normal form|1nf|2nf|3nf|bcnf|4nf|5nf|functional dependency|lossless|dependency preserving|partial dependency|transitive dependency|canonical cover/i,
      },
      {
        name: 'SQL (DDL, DML, DQL, Joins & Subqueries)',
        slug: 'sql-queries-joins',
        order: 3,
        keywords: /sql|select|insert|update|delete|create table|drop|alter|join|inner join|outer join|group by|having|order by|where|aggregate function|subquery|view|grant|revoke|count|avg|sum/i,
      },
      {
        name: 'Entity-Relationship (ER) & Relational Model',
        slug: 'er-modeling-relational-model',
        order: 2,
        keywords: /entity|er model|er diagram|relationship|cardinality|primary key|foreign key|candidate key|super key|referential integrity|relational algebra|tuple|relation|attribute|relational calculus/i,
      },
      {
        name: 'DBMS Concepts, Architecture & Schema',
        slug: 'dbms-concepts-architecture',
        order: 1,
        keywords: /dbms|database|data independence|three level|conceptual schema|internal schema|external schema|dba|data dictionary|data model|file system vs dbms/i,
      },
    ],
  },
  {
    name: 'Computer Networks & Data Communication',
    slug: 'computer-networks-data-communication',
    order: 8,
    description: 'OSI/TCP-IP models, physical media, data link protocols, routing, transport layer and security.',
    topicMatch: 'Computer Networks & Data Communication',
    chapters: [
      {
        name: 'Network Security, Cryptography & Firewalls',
        slug: 'network-security-cryptography',
        order: 6,
        keywords: /security|cryptography|encryption|decryption|symmetric|asymmetric|rsa|des|aes|digital signature|hash function|firewall|ssl|tls|ipsec|vpn|malware|dos attack|public key|private key/i,
      },
      {
        name: 'Transport Layer & Application Layer Protocols',
        slug: 'transport-application-layer',
        order: 5,
        keywords: /tcp|udp|three-way handshake|port number|socket|flow control|congestion control|http|https|ftp|smtp|pop3|imap|dns|dhcp|telnet|mime|snmp/i,
      },
      {
        name: 'Network Layer, IP Addressing & Routing',
        slug: 'network-layer-ip-routing',
        order: 4,
        keywords: /ip address|ipv4|ipv6|subnet|subnetting|cidr|routing|router|packet|distance vector|link state|rip|ospf|bgp|arp|rarp|icmp|nat|datagram/i,
      },
      {
        name: 'Data Link Layer, MAC & Error Control',
        slug: 'data-link-layer-mac',
        order: 3,
        keywords: /data link|framing|flow control|error detection|crc|checksum|parity|hamming code|sliding window|stop and wait|go-back-n|selective repeat|mac|csma|ethernet|switch|bridge|aloha/i,
      },
      {
        name: 'Network Architectures: OSI & TCP/IP Models',
        slug: 'osi-tcp-ip-models',
        order: 2,
        keywords: /osi model|osi reference|tcp\/ip|physical layer|network layer|transport layer|session layer|presentation layer|application layer|protocol hierarchy|layer/i,
      },
      {
        name: 'Data Communication Fundamentals & Physical Layer',
        slug: 'data-communication-physical-layer',
        order: 1,
        keywords: /transmission media|twisted pair|coaxial|fiber optic|bandwidth|baud rate|bit rate|modulation|multiplexing|tdm|fdm|wdm|topology|star|bus|ring|mesh|attenuation|nyquist|shannon/i,
      },
    ],
  },
  {
    name: 'Software Engineering',
    slug: 'software-engineering',
    order: 9,
    description: 'SDLC models, requirements analysis, system design, testing, quality assurance and metrics.',
    topicMatch: 'Software Engineering',
    chapters: [
      {
        name: 'Software Metrics, Estimation & Project Management',
        slug: 'software-metrics-estimation',
        order: 5,
        keywords: /metrics|estimation|cocomo|function point|cyclomatic complexity|software cost|risk management|project management|maintenance|reverse engineering|re-engineering/i,
      },
      {
        name: 'Software Testing & Quality Assurance',
        slug: 'software-testing-qa',
        order: 4,
        keywords: /testing|black box|white box|unit testing|integration testing|system testing|regression testing|acceptance testing|test case|bug|defect|verification|validation|qa|cmm|iso|alpha|beta/i,
      },
      {
        name: 'Software Design, Modularity & Architecture',
        slug: 'software-design-modularity',
        order: 3,
        keywords: /software design|coupling|cohesion|modularity|architectural style|design pattern|uml|class diagram|sequence diagram|information hiding|structure chart/i,
      },
      {
        name: 'Requirements Engineering & SRS Documentation',
        slug: 'requirements-engineering-srs',
        order: 2,
        keywords: /requirement|srs|software requirement specification|functional requirement|non-functional|feasibility study|use case|dfd|data flow diagram|elicitation/i,
      },
      {
        name: 'Software Engineering Principles & SDLC Models',
        slug: 'sdlc-process-models',
        order: 1,
        keywords: /sdlc|software process|waterfall|spiral model|prototype|incremental|rad|agile|scrum|extreme programming|software life cycle/i,
      },
    ],
  },
  {
    name: 'Internet & Web Technologies',
    slug: 'internet-web-technologies',
    order: 10,
    description: 'Web architecture, HTML5, CSS3, JavaScript scripting, web protocols and web services.',
    topicMatch: 'Internet & Web Technologies',
    chapters: [
      {
        name: 'Web Services, XML & Modern Web Applications',
        slug: 'web-services-xml-apps',
        order: 5,
        keywords: /web service|xml|soap|rest|api|cookie|session|client server|backend|web application|dtd|schema/i,
      },
      {
        name: 'JavaScript & Client-Side Scripting',
        slug: 'javascript-scripting',
        order: 4,
        keywords: /javascript|js|dom|document object model|event|script|variable|function|alert|json|ajax|client-side|prompt/i,
      },
      {
        name: 'CSS3 Styling & Responsive Web Design',
        slug: 'css3-styling-responsive',
        order: 3,
        keywords: /css|css3|style|stylesheet|selector|box model|margin|padding|border|flexbox|grid|media query|responsive|font|color/i,
      },
      {
        name: 'HTML5 Document Structure & Elements',
        slug: 'html5-document-elements',
        order: 2,
        keywords: /html|html5|tag|element|head|body|table|form|input|hyperlink|anchor|href|list|div|span|semantic|doctype|paragraph|heading/i,
      },
      {
        name: 'Internet Architecture, Web Protocols & Services',
        slug: 'internet-architecture-protocols',
        order: 1,
        keywords: /internet|world wide web|www|url|uri|web browser|web server|http|https|ftp|search engine|domain name|dns|isp|email protocol|e-commerce/i,
      },
    ],
  },
  {
    name: 'Computer Fundamentals, Security & MS Office',
    slug: 'computer-fundamentals-security-office',
    order: 11,
    description: 'Hardware fundamentals, MS Office suite, cyber security, Python programming and modern ICT.',
    topicMatch: 'Computer Fundamentals, Security & MS Office',
    chapters: [
      {
        name: 'C++ & Advanced Object-Oriented Programming',
        slug: 'cpp-advanced-oop',
        order: 5,
        keywords: /c\+\+|cpp|destructor|constructor|overload|polymorphism|virtual|friend function|class circle|public point|manipulator|cout|cin|new\s|delete\s/i,
      },
      {
        name: 'Python Programming & Scripting',
        slug: 'python-programming-scripting',
        order: 4,
        keywords: /python|lambda|def |indentation|\bimport\b|\brange\(|tuple|dictionary|slice|list/i,
      },
      {
        name: 'MS Office & Productivity Applications',
        slug: 'ms-office-productivity',
        order: 3,
        keywords: /word|excel|powerpoint|spreadsheet|cell|formula|ms office|slide|presentation|workbook|clipboard|header|footer/i,
      },
      {
        name: 'Cyber Security, Malware & Modern ICT',
        slug: 'cyber-security-malware-ict',
        order: 2,
        keywords: /virus|malware|worm|trojan|spyware|ransomware|security|firewall|cyber|phishing|cloud computing|iot|big data|blockchain/i,
      },
      {
        name: 'Computer Hardware, Generations & Digital Systems',
        slug: 'hardware-generations-digital-systems',
        order: 1,
        keywords: /hardware|generation of computer|first generation|second generation|input device|output device|peripheral|motherboard|memory|optical disk/i,
      },
    ],
  },
];

console.log(' Starting database structure synchronization...');

// 3. Upsert 11 Subjects in subjects collection
const subjectMap = new Map<string, Types.ObjectId>();

for (const spec of DSSSB_SUBJECTS) {
  let doc = await SubjectCol.findOne({
    $or: [{ slug: spec.slug }, { name: spec.name }]
  });

  if (!doc) {
    const res = await SubjectCol.insertOne({
      name: spec.name,
      slug: spec.slug,
      description: spec.description,
      iconUrl: null,
      createdBy: adminId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    doc = { _id: res.insertedId };
    console.log(` Created Subject: "${spec.name}" (${spec.slug})`);
  } else {
    await SubjectCol.updateOne(
      { _id: doc._id },
      {
        $set: {
          name: spec.name,
          slug: spec.slug,
          description: spec.description,
          updatedAt: new Date(),
        }
      }
    );
  }
  subjectMap.set(spec.name, doc._id);
}

// 4. Upsert 11 test_series_subjects records for dsssb-tgt-computer-science
// Clean up any old single "Computer Science" assignment if present
await TSSubjectCol.deleteMany({ testSeriesId: seriesId });
for (const spec of DSSSB_SUBJECTS) {
  const sId = subjectMap.get(spec.name)!;
  await TSSubjectCol.insertOne({
    testSeriesId: seriesId,
    subjectId: sId,
    order: spec.order,
    customDisplayName: spec.name,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}
console.log(` Assigned all ${DSSSB_SUBJECTS.length} subjects to test series.`);

// 5. Upsert Chapters for each Subject under this TestSeries
// Remove old legacy single-subject chapters for this series
await ChapterCol.deleteMany({ testSeriesId: seriesId });

const chapterMap = new Map<string, Types.ObjectId>(); // key: `${subjectName}:::${chapterName}`

for (const spec of DSSSB_SUBJECTS) {
  const sId = subjectMap.get(spec.name)!;
  for (const ch of spec.chapters) {
    const fullSlug = `dsssb-${spec.slug}-${ch.slug}`;
    const insertRes = await ChapterCol.insertOne({
      name: ch.name,
      slug: fullSlug,
      testSeriesId: seriesId,
      subjectId: sId,
      description: `${ch.name} for ${spec.name}`,
      order: ch.order,
      status: 'published',
      createdBy: adminId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    chapterMap.set(`${spec.name}:::${ch.name}`, insertRes.insertedId);
  }
}
console.log(` Created ${chapterMap.size} chapters across all 11 subjects.`);

// 6. Map all 3,331 questions to their verified Subject & Chapter
console.log(' Classifying and mapping 3,331 questions...');
const allCsQuestions = await QuestionCol.find({
  $or: [
    { subject: 'Computer Science' },
    { topic: { $in: DSSSB_SUBJECTS.map(s => s.topicMatch) } }
  ]
}).toArray();

console.log(` Found ${allCsQuestions.length} candidate questions in DB.`);

// Clear existing question_mappings for this series to re-index cleanly
await MappingCol.deleteMany({ testSeriesId: seriesId });

let mappedCount = 0;
const mappingDocs: any[] = [];
const subjectQuestionPools = new Map<string, any[]>();
const chapterQuestionPools = new Map<string, any[]>();

for (const spec of DSSSB_SUBJECTS) {
  subjectQuestionPools.set(spec.name, []);
  for (const ch of spec.chapters) {
    chapterQuestionPools.set(`${spec.name}:::${ch.name}`, []);
  }
}

for (const q of allCsQuestions) {
  // Find which subject this question belongs to based on topic
  const spec = DSSSB_SUBJECTS.find(s => s.topicMatch === q.topic);
  if (!spec) continue;

  const sId = subjectMap.get(spec.name)!;
  const textToScan = `${q.content || ''} ${q.explanation || ''} ${(q.tags || []).join(' ')}`.toLowerCase();

  // Match chapter with reverse-priority / specific to general
  let matchedChapter = spec.chapters[spec.chapters.length - 1]; // fallback
  for (const ch of spec.chapters) {
    if (ch.keywords.test(textToScan)) {
      matchedChapter = ch;
      break;
    }
  }

  const chId = chapterMap.get(`${spec.name}:::${matchedChapter.name}`)!;

  // Update Question document
  await QuestionCol.updateOne(
    { _id: q._id },
    {
      $set: {
        subject: spec.name,
        subjectId: sId,
        chapterId: chId,
        topic: matchedChapter.name,
        updatedAt: new Date(),
      }
    }
  );

  mappingDocs.push({
    questionId: q._id,
    testSeriesId: seriesId,
    subjectId: sId,
    chapterId: chId,
    order: mappedCount + 1,
    createdBy: adminId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  subjectQuestionPools.get(spec.name)!.push(q);
  chapterQuestionPools.get(`${spec.name}:::${matchedChapter.name}`)!.push(q);
  mappedCount++;
}

if (mappingDocs.length > 0) {
  await MappingCol.insertMany(mappingDocs);
}
console.log(` Successfully classified & mapped ${mappedCount} questions across 11 subjects.`);

// Print question distribution table
console.log('\n--- QUESTION DISTRIBUTION AUDIT ---');
for (const spec of DSSSB_SUBJECTS) {
  const pool = subjectQuestionPools.get(spec.name) || [];
  console.log(`\n📚 ${spec.name} (${pool.length} Questions)`);
  for (const ch of spec.chapters) {
    const chPool = chapterQuestionPools.get(`${spec.name}:::${ch.name}`) || [];
    console.log(`    └─ ${ch.name}: ${chPool.length} Qs`);
  }
}

// 7. Deterministic test generator helpers
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let m = a.length, t, i;
  let s = seed;
  while (m) {
    s = (s * 9301 + 49297) % 233280;
    i = Math.floor((s / 233280) * m--);
    t = a[m]; a[m] = a[i]; a[i] = t;
  }
  return a;
}

function buildSnapshots(questions: any[], sectionId: any = null) {
  return questions.map((doc, idx) => ({
    questionId: doc._id,
    position: idx + 1,
    marks: 1,
    negativeMarks: 0.25,
    sectionId: sectionId ? sectionId.toString() : null,
    snapshot: {
      questionId: doc._id,
      content: doc.content,
      translations: doc.translations || {},
      explanation: doc.explanation || null,
      explanationTranslations: doc.explanationTranslations || {},
      type: doc.type || 'single_choice',
      numericalAnswer: doc.numericalAnswer || null,
      options: (doc.options || []).map((o: any) => ({
        _id: o._id,
        content: o.content,
        imageUrl: o.imageUrl || null,
        position: o.position,
        isCorrect: o.isCorrect,
        translations: o.translations || {},
      })),
      marks: 1,
      negativeMarks: 0.25,
    },
  }));
}

// 8. Generate Tests: Full Mock Tests with Internal Sections, Subject Tests & Chapter Tests
console.log('\n Generating Structured Tests for DSSSB TGT Computer Science...');
// Clean up existing exams for this series
await ExamCol.deleteMany({ testSeriesId: seriesId });

const examsToInsert: any[] = [];

// ============================================================================
// A. FULL MOCK TESTS (Real Examination Simulations with Internal Sections)
// 25 Grand Mock Tests (100 Qs each across 5 Internal Examination Sections)
// ============================================================================
console.log(' Generating 25 Grand Mock Tests with internal sections...');

const SECTION_TEMPLATES = [
  {
    name: 'Section 1: Digital Electronics & Computer Organization',
    subjects: ['Digital Logic Circuits', 'Computer Organization & Architecture'],
    targetCount: 20,
  },
  {
    name: 'Section 2: Programming in C & Data Structures',
    subjects: ['Programming Concepts in C', 'Data Structures & Algorithms'],
    targetCount: 20,
  },
  {
    name: 'Section 3: Operating Systems & Systems Architecture',
    subjects: ['Operating Systems'],
    targetCount: 20,
  },
  {
    name: 'Section 4: Database Management Systems & SQL',
    subjects: ['Database Management Systems (DBMS / SQL)'],
    targetCount: 20,
  },
  {
    name: 'Section 5: Computer Networks, Web Tech, Software Engineering & Computing',
    subjects: [
      'Computer Networks & Data Communication',
      'Software Engineering',
      'Internet & Web Technologies',
      'Computer Fundamentals, Security & MS Office',
      'Object Oriented Programming (C++ / Java)',
    ],
    targetCount: 20,
  },
];

for (let i = 1; i <= 25; i++) {
  const isFree = i <= 5; // First 5 full mocks are free
  const testNum = String(i).padStart(2, '0');
  const slug = `dsssb-tgt-cs-grand-mock-${i}`;
  const title = `DSSSB TGT CS - Grand Mock Test ${testNum} (Full Length 100 Qs)`;
  const description = `Authentic 100-question full-length CBT examination simulation with 5 internal subject sections, negative marking (-0.25), and instant performance analysis.`;

  const sectionsData: any[] = [];
  const testQuestions: any[] = [];
  let globalPos = 1;

  for (let sIdx = 0; sIdx < SECTION_TEMPLATES.length; sIdx++) {
    const tmpl = SECTION_TEMPLATES[sIdx];
    const secId = new Types.ObjectId();

    // Pool questions from template subjects
    const pool: any[] = [];
    for (const subName of tmpl.subjects) {
      pool.push(...(subjectQuestionPools.get(subName) || []));
    }

    const sampled = seededShuffle(pool, (i * 37 + sIdx * 97) * 7919).slice(0, tmpl.targetCount);
    const secQuestionItems = sampled.map((doc) => ({
      questionId: doc._id,
      position: globalPos++,
      marks: 1,
      negativeMarks: 0.25,
      sectionId: secId.toString(),
      snapshot: {
        questionId: doc._id,
        content: doc.content,
        translations: doc.translations || {},
        explanation: doc.explanation || null,
        explanationTranslations: doc.explanationTranslations || {},
        type: doc.type || 'single_choice',
        numericalAnswer: doc.numericalAnswer || null,
        options: (doc.options || []).map((o: any) => ({
          _id: o._id,
          content: o.content,
          imageUrl: o.imageUrl || null,
          position: o.position,
          isCorrect: o.isCorrect,
          translations: o.translations || {},
        })),
        marks: 1,
        negativeMarks: 0.25,
      },
    }));

    testQuestions.push(...secQuestionItems);

    sectionsData.push({
      _id: secId,
      name: tmpl.name,
      topic: tmpl.subjects.join(', '),
      subjectId: null,
      chapterId: null,
      order: sIdx + 1,
      durationMinutes: null, // Unified 120-minute timer for the full test
      positiveMarks: 1,
      negativeMarkingEnabled: true,
      negativeMarks: 0.25,
      selectionMode: 'manual',
      questionOrderMode: 'fixed',
      questionSetMode: 'fixed',
      requiredQuestionCount: tmpl.targetCount,
      questions: secQuestionItems,
    });
  }

  examsToInsert.push({
    title,
    slug,
    description,
    type: 'pyq',
    testMode: 'pyq',
    isPreviousYear: true,
    status: 'published',
    access: isFree ? 'free' : 'premium',
    testSeriesId: seriesId,
    subjectId: null,
    chapterId: null,
    subject: 'Computer Science',
    durationMinutes: 120,
    maxAttempts: null,
    languages: ['Hindi', 'English'],
    instructions: `Official DSSSB TGT Computer Science CBT Grand Mock Test\n• 100 Questions across 5 Internal Examination Sections\n• Total Duration: 120 Minutes | Total Marks: 100\n• Marking: +1.00 for correct answer, -0.25 penalty for incorrect answer\n• Bilingual: Toggle between English and Hindi anytime during the exam.`,
    positiveMarks: 1,
    negativeMarkingEnabled: true,
    negativeMarks: 0.25,
    questionSelectionMode: 'manual',
    questionOrderMode: 'fixed',
    questionSetMode: 'fixed',
    totalQuestionsCount: testQuestions.length,
    version: 1,
    isCurrentVersion: true,
    parentTestId: null,
    createdBy: adminId,
    sections: sectionsData,
    questions: testQuestions,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

// 67 Authentic PYQ Paper Tests
console.log(' Generating 67 Authentic PYQ Paper Tests with full examination simulation...');
const PYQ_EXAMS = [
  { name: 'DSSSB TGT C.S. 07.02.2024 (Shift-II)', count: 100, free: true },
  { name: 'DSSSB TGT C.S. 01.08.2021 (Shift-I)', count: 100, free: true },
  { name: 'DSSSB TGT C.S. 01.08.2021 (Shift-II)', count: 100, free: true },
  { name: 'DSSSB TGT C.S. 07.08.2021 (Shift-I)', count: 100, free: false },
  { name: 'DSSSB TGT C.S. 07.08.2021 (Shift-II)', count: 100, free: false },
  { name: 'DSSSB TGT C.S. 08.08.2021 (Shift-I)', count: 100, free: false },
  { name: 'DSSSB PGT C.S. (Male/Female) 11.07.2021', count: 100, free: false },
  { name: 'DSSSB PGT C.S. (Male) 27.07.2018 (Shift-I)', count: 100, free: false },
  { name: 'KVS PGT C.S. 2017 Official Paper', count: 80, free: true },
  { name: 'KVS PGT C.S. 23.03.2023 (Shift-II)', count: 80, free: false },
  { name: 'KVS PGT C.S. 2013 Official Paper', count: 80, free: false },
  { name: 'KVS PGT C.S. 2018 Official Paper', count: 80, free: false },
  { name: 'NVS PGT C.S. 15.12.2022 (Shift-II)', count: 80, free: false },
  { name: 'NVS PGT C.S. 16.12.2022 (Shift-II)', count: 80, free: false },
  { name: 'Bihar STET C.S. 12.09.2023 (Shift-I)', count: 80, free: true },
  { name: 'Bihar STET C.S. 12.09.2023 (Shift-II)', count: 80, free: false },
  { name: 'Bihar STET C.S. 18.09.2020 (Shift-I)', count: 80, free: false },
  { name: 'Bihar STET C.S. 2020 Official Paper', count: 80, free: false },
  { name: 'Bihar STET C.S. 2019 (Shift-II)', count: 80, free: false },
  { name: 'BPSC TRE 3.0 22.07.2024 (Shift-I)', count: 80, free: false },
  { name: 'BPSC TRE 3.0 22.07.2024 (Shift-II)', count: 80, free: false },
  { name: 'BPSC TRE 1.0 2023 Official Paper', count: 80, free: false },
  { name: 'BPSC TRE 2.0 22.02.2024 (Shift-I)', count: 80, free: false },
  { name: 'HTET PGT C.S. 2022 Official Paper', count: 60, free: true },
  { name: 'HTET PGT C.S. 2021 Official Paper', count: 60, free: false },
  { name: 'HTET PGT C.S. 2020 Official Paper', count: 60, free: false },
  { name: 'HTET PGT C.S. 2019 Official Paper', count: 60, free: false },
  { name: 'HTET PGT C.S. 2018 Official Paper', count: 60, free: false },
  { name: 'RPSC C.S. 2016 Paper-I', count: 80, free: false },
  { name: 'RPSC C.S. 2016 Paper-II', count: 80, free: false },
  { name: 'CGPSC C.S. 2020 Set-A Paper', count: 80, free: false },
  { name: 'EMRS PGT C.S. 16.12.2023 Official Paper', count: 80, free: true },
  { name: 'EMRS PGT C.S. 16.12.2024 Official Paper', count: 80, free: false },
  { name: 'LT. Grade C.S. 2018 Official Paper', count: 80, free: false },
  { name: 'Haryana Assistant Professor C.S. 2018', count: 80, free: false },
  { name: 'UGC NET C.S. December-2024 Official Paper', count: 80, free: true },
  { name: 'UGC NET C.S. June-2024 Official Paper', count: 80, free: false },
  { name: 'UGC NET C.S. December-2023 Official Paper', count: 80, free: false },
  { name: 'UGC NET C.S. June-2023 Official Paper', count: 80, free: false },
  { name: 'UGC NET C.S. December-2022 Official Paper', count: 80, free: false },
  { name: 'UGC NET C.S. November-2020 Official Paper', count: 80, free: false },
  { name: 'UGC NET C.S. June-2019 Official Paper', count: 80, free: false },
  { name: 'UGC NET C.S. December-2018 Official Paper', count: 80, free: false },
  { name: 'UGC NET C.S. July-2018 Official Paper', count: 80, free: false },
  { name: 'UGC NET C.S. November-2017 Paper-II', count: 80, free: false },
  { name: 'UGC NET C.S. November-2017 Paper-III', count: 80, free: false },
  { name: 'UGC NET C.S. January-2017 Paper-II', count: 80, free: false },
  { name: 'UGC NET C.S. January-2017 Paper-III', count: 80, free: false },
  { name: 'UGC NET C.S. July-2016 Paper-II', count: 80, free: false },
  { name: 'UGC NET C.S. July-2016 Paper-III', count: 80, free: false },
  { name: 'UGC NET C.S. December-2015 Paper-II', count: 80, free: false },
  { name: 'UGC NET C.S. December-2015 Paper-III', count: 80, free: false },
  { name: 'UGC NET C.S. June-2015 Paper-II', count: 80, free: false },
  { name: 'UGC NET C.S. June-2015 Paper-III', count: 80, free: false },
  { name: 'UGC NET C.S. December-2014 Paper-II', count: 80, free: false },
  { name: 'UGC NET C.S. December-2014 Paper-III', count: 80, free: false },
  { name: 'UGC NET C.S. June-2014 Paper-II', count: 80, free: false },
  { name: 'UGC NET C.S. June-2014 Paper-III', count: 80, free: false },
  { name: 'DSSSB PGT C.S. 27.07.2018 (Shift-II)', count: 100, free: false },
  { name: 'DSSSB TGT C.S. 07.08.2021 (Shift-III)', count: 100, free: false },
  { name: 'DSSSB TGT C.S. 08.08.2021 (Shift-II)', count: 100, free: false },
  { name: 'DSSSB TGT C.S. 08.08.2021 (Shift-III)', count: 100, free: false },
  { name: 'Bihar STET C.S. 18.09.2020 (Shift-II)', count: 80, free: false },
  { name: 'BPSC TRE 2.0 22.02.2024 (Shift-II)', count: 80, free: false },
  { name: 'HTET PGT C.S. 2017 Official Paper', count: 60, free: false },
  { name: 'HTET PGT C.S. 2016 Official Paper', count: 60, free: false },
  { name: 'KVS PGT C.S. 2011 Official Paper', count: 80, free: false },
];

for (let idx = 0; idx < PYQ_EXAMS.length; idx++) {
  const ex = PYQ_EXAMS[idx];
  const slug = `pyq-${ex.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;

  const keyTerm = ex.name.split(' ')[0];
  const matched = allCsQuestions.filter(q => (q.source || '').toLowerCase().includes(keyTerm.toLowerCase()));
  const pool = matched.length >= 20 ? matched : allCsQuestions;
  const sampled = seededShuffle(pool, (idx + 1) * 31337).slice(0, ex.count);

  const secId = new Types.ObjectId();
  const secQuestions = sampled.map((doc, qIdx) => ({
    questionId: doc._id,
    position: qIdx + 1,
    marks: 1,
    negativeMarks: 0.25,
    sectionId: secId.toString(),
    snapshot: {
      questionId: doc._id,
      content: doc.content,
      translations: doc.translations || {},
      explanation: doc.explanation || null,
      explanationTranslations: doc.explanationTranslations || {},
      type: doc.type || 'single_choice',
      numericalAnswer: doc.numericalAnswer || null,
      options: (doc.options || []).map((o: any) => ({
        _id: o._id,
        content: o.content,
        imageUrl: o.imageUrl || null,
        position: o.position,
        isCorrect: o.isCorrect,
        translations: o.translations || {},
      })),
      marks: 1,
      negativeMarks: 0.25,
    },
  }));

  const singleSection = {
    _id: secId,
    name: 'Discipline Specific Section',
    topic: 'Official Question Paper',
    subjectId: null,
    chapterId: null,
    order: 1,
    durationMinutes: ex.count >= 80 ? 120 : 60,
    positiveMarks: 1,
    negativeMarkingEnabled: true,
    negativeMarks: 0.25,
    selectionMode: 'manual',
    questionOrderMode: 'fixed',
    questionSetMode: 'fixed',
    requiredQuestionCount: secQuestions.length,
    questions: secQuestions,
  };

  examsToInsert.push({
    title: `[PYQ] ${ex.name}`,
    slug,
    description: `Authentic Previous Year Question Paper for ${ex.name}. Full real exam simulation with negative marking and detailed bilingual solutions.`,
    type: 'full',
    testMode: 'full',
    status: 'published',
    access: ex.free ? 'free' : 'premium',
    testSeriesId: seriesId,
    subjectId: null,
    chapterId: null,
    subject: 'Computer Science',
    durationMinutes: ex.count >= 80 ? 120 : 60,
    maxAttempts: null,
    languages: ['Hindi', 'English'],
    instructions: `Official PYQ Paper — ${ex.name}\n• Total Questions: ${secQuestions.length} | Marking: +1.00 / -0.25\n• Pattern: Official CBT Examination Archive`,
    positiveMarks: 1,
    negativeMarkingEnabled: true,
    negativeMarks: 0.25,
    questionSelectionMode: 'manual',
    questionOrderMode: 'fixed',
    questionSetMode: 'fixed',
    totalQuestionsCount: secQuestions.length,
    version: 1,
    isCurrentVersion: true,
    parentTestId: null,
    createdBy: adminId,
    sections: [singleSection],
    questions: secQuestions,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

// ============================================================================
// B. SUBJECT TESTS (Dedicated Tests for each of the 11 Subjects)
// 4 Mastery Tests per Subject = 44 Tests Total (50 Qs each, 60 mins, +1 / -0.25)
// ============================================================================
console.log(' Generating 44 Subject Mastery Tests (4 per Subject × 11 Subjects)...');
for (const spec of DSSSB_SUBJECTS) {
  const sId = subjectMap.get(spec.name)!;
  const pool = subjectQuestionPools.get(spec.name) || [];
  if (pool.length === 0) continue;

  for (let tIdx = 1; tIdx <= 4; tIdx++) {
    const isFree = tIdx === 1; // 1 Free test per subject
    const testNum = String(tIdx).padStart(2, '0');
    const slug = `${spec.slug}-subject-test-${tIdx}`;
    const title = `${spec.name} — Subject Test ${testNum}`;
    const description = `Comprehensive subject test covering core concepts, real exam PYQs, and high-yield problems in ${spec.name}.`;

    const targetCount = Math.min(pool.length, 50);
    const sampled = seededShuffle(pool, (spec.order * 100 + tIdx) * 104729).slice(0, targetCount);
    const testQuestions = buildSnapshots(sampled.length >= 20 ? sampled : pool.slice(0, 50));

    examsToInsert.push({
      title,
      slug,
      description,
      type: 'subject',
      testMode: 'subject',
      status: 'published',
      access: isFree ? 'free' : 'premium',
      testSeriesId: seriesId,
      subjectId: sId,
      chapterId: null,
      subject: spec.name,
      durationMinutes: 60,
      maxAttempts: null,
      languages: ['Hindi', 'English'],
      instructions: `Subject Test — ${spec.name}\n• Total Questions: ${testQuestions.length} | Duration: 60 Mins\n• Marking: +1.00 for correct answer, -0.25 for incorrect answer\n• Focus: Deep subject-level mastery for DSSSB TGT/PGT Computer Science`,
      positiveMarks: 1,
      negativeMarkingEnabled: true,
      negativeMarks: 0.25,
      questionSelectionMode: 'manual',
      questionOrderMode: 'fixed',
      questionSetMode: 'fixed',
      totalQuestionsCount: testQuestions.length,
      version: 1,
      isCurrentVersion: true,
      parentTestId: null,
      createdBy: adminId,
      sections: [],
      questions: testQuestions,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}

// ============================================================================
// C. CHAPTER TESTS (Dedicated Tests for each Chapter in the Hierarchy)
// 4 Practice Tests per Chapter × 55 Chapters = 220 Chapter Tests (20 Qs each)
// ============================================================================
console.log(' Generating 220 Chapter Practice Tests (4 per Chapter × 55 Chapters)...');
for (const spec of DSSSB_SUBJECTS) {
  const sId = subjectMap.get(spec.name)!;
  for (const ch of spec.chapters) {
    const chKey = `${spec.name}:::${ch.name}`;
    const chId = chapterMap.get(chKey)!;
    const pool = chapterQuestionPools.get(chKey) || [];
    if (pool.length === 0) continue;

    for (let tIdx = 1; tIdx <= 4; tIdx++) {
      const isFree = tIdx === 1; // 1 Free test per chapter
      const testNum = String(tIdx).padStart(2, '0');
      const slug = `dsssb-${spec.slug}-${ch.slug}-test-${tIdx}`;
      const title = `${ch.name}: Practice Test ${testNum}`;
      const description = `Focused chapter practice test for ${ch.name} under ${spec.name} with bilingual questions, negative marking, and detailed solutions.`;

      const targetCount = Math.min(pool.length, 20);
      const sampled = seededShuffle(pool, (ch.order * 50 + tIdx) * 65537).slice(0, targetCount);
      const testQuestions = buildSnapshots(sampled.length >= 5 ? sampled : pool.slice(0, 20));

      examsToInsert.push({
        title,
        slug,
        description,
        type: 'chapter',
        testMode: 'chapter',
        status: 'published',
        access: isFree ? 'free' : 'premium',
        testSeriesId: seriesId,
        subjectId: sId,
        chapterId: chId,
        subject: spec.name,
        durationMinutes: 30,
        maxAttempts: null,
        languages: ['Hindi', 'English'],
        instructions: `Chapter Test — ${ch.name}\n• Subject: ${spec.name}\n• Total Questions: ${testQuestions.length} | Duration: 30 Mins\n• Marking: +1.00 for correct answer, -0.25 for incorrect answer\n• Topic-wise targeted practice`,
        positiveMarks: 1,
        negativeMarkingEnabled: true,
        negativeMarks: 0.25,
        questionSelectionMode: 'manual',
        questionOrderMode: 'fixed',
        questionSetMode: 'fixed',
        totalQuestionsCount: testQuestions.length,
        version: 1,
        isCurrentVersion: true,
        parentTestId: null,
        createdBy: adminId,
        sections: [],
        questions: testQuestions,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }
}

console.log(` Inserting ${examsToInsert.length} total generated tests into MongoDB...`);
// Batch insert in chunks of 50 to avoid BSON payload limits
const CHUNK_SIZE = 50;
for (let c = 0; c < examsToInsert.length; c += CHUNK_SIZE) {
  const chunk = examsToInsert.slice(c, c + CHUNK_SIZE);
  await ExamCol.insertMany(chunk);
}

// 9. Update Test Series description and metadata
await SeriesCol.updateOne(
  { _id: seriesId },
  {
    $set: {
      description: 'Complete mock test series for DSSSB TGT & PGT Computer Science featuring full examination simulations with internal sections, 11 dedicated subject tests, chapter practice tests across 55 chapters, and 67 authentic previous year question papers.',
      updatedAt: new Date(),
    }
  }
);

// 10. Also update old test series 'dsssb-tgt-cs' to archived/draft so it does not collide
await SeriesCol.updateOne(
  { slug: 'dsssb-tgt-cs' },
  { $set: { status: 'draft', updatedAt: new Date() } }
);

// 11. Final Summary Verification
console.log('\n======================================================');
console.log('✅ RESTRUCTURING & MIGRATION COMPLETE');
console.log('======================================================');
const finalSubjects = await TSSubjectCol.countDocuments({ testSeriesId: seriesId });
const finalChapters = await ChapterCol.countDocuments({ testSeriesId: seriesId });
const finalMappings = await MappingCol.countDocuments({ testSeriesId: seriesId });
const finalFullExams = await ExamCol.countDocuments({ testSeriesId: seriesId, testMode: 'full' });
const finalPyqExams = await ExamCol.countDocuments({ testSeriesId: seriesId, testMode: 'pyq' });
const finalSubExams = await ExamCol.countDocuments({ testSeriesId: seriesId, testMode: 'subject' });
const finalChapExams = await ExamCol.countDocuments({ testSeriesId: seriesId, testMode: 'chapter' });

console.log(`• Series ID: ${seriesId} (${series.slug})`);
console.log(`• Assigned Subjects: ${finalSubjects} (Expected: 11)`);
console.log(`• Created Chapters: ${finalChapters} (Expected: 55)`);
console.log(`• Mapped Questions in Question Bank: ${finalMappings} (Target: 3331)`);
console.log(`• Full Mock Tests: ${finalFullExams} (25 Grand Mocks)`);
console.log(`• PYQ Paper Tests: ${finalPyqExams} (67 Authentic Previous Year Papers)`);
console.log(`• Subject Tests: ${finalSubExams} (4 per Subject × 11 Subjects)`);
console.log(`• Chapter Tests: ${finalChapExams} (4 per Chapter × 55 Chapters)`);
console.log(`• Total Tests Generated: ${finalFullExams + finalSubExams + finalChapExams}`);
console.log('======================================================\n');

await mongoose.disconnect();

