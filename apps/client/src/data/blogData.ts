export interface TopicSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  readTime: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  order: number;
}

export interface CodeSnippet {
  language: string;
  filename?: string;
  code: string;
  highlightLines?: number[];
}

export interface ArticleSection {
  id: string;
  title: string;
  level?: 2 | 3;
  content: string[];
  codeSnippet?: CodeSnippet;
  bullets?: string[];
  numberedSteps?: string[];
  infobox?: {
    type: 'note' | 'tip' | 'warning' | 'info';
    text: string;
  };
}

export interface TopicDetail {
  slug: string;
  title: string;
  subjectSlug: string;
  subjectTitle: string;
  description: string;
  readTime: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  publishedDate: string;
  updatedDate: string;
  overviewCode?: CodeSnippet;
  introParagraphs: string[];
  sections: ArticleSection[];
  summaryPoints: string[];
  prevTopic?: {
    slug: string;
    title: string;
  };
  nextTopic?: {
    slug: string;
    title: string;
  };
}

export interface SubjectData {
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  topicsCount: number;
  topics: TopicSummary[];
}

export const SUBJECTS_MOCK: Record<string, SubjectData> = {
  java: {
    slug: 'java',
    title: 'Core & Advanced Java',
    shortDescription: 'Modern Java programming, JVM architecture, garbage collection algorithms, memory management, and OOP fundamentals.',
    description: 'A technical reference for Java developers covering language mechanics, object lifecycle on the JVM heap, multithreading primitives, memory model guarantees, and modern standard library features.',
    topicsCount: 9,
    topics: [
      {
        id: '1',
        slug: 'object-lifecycle-in-java',
        title: 'Object Lifecycle in Java',
        description: 'Analysis of how objects are declared, allocated in young generation heap, referenced, become unreachable, and reclaimed by garbage collectors.',
        readTime: '12 min read',
        difficulty: 'Intermediate',
        category: 'Memory Management',
        order: 1,
      },
      {
        id: '2',
        slug: 'classes-and-objects',
        title: 'Classes, Objects, and Memory Representation',
        description: 'Memory layout of object headers, mark words, klass pointers, field alignment, and differences between references and primitive variables.',
        readTime: '9 min read',
        difficulty: 'Beginner',
        category: 'OOP Fundamentals',
        order: 2,
      },
      {
        id: '3',
        slug: 'inheritance-and-polymorphism',
        title: 'Inheritance and Dynamic Method Dispatch',
        description: 'Virtual method table (vtable) resolution, single inheritance constraints, interface default methods, and invokedynamic bytecode mechanics.',
        readTime: '14 min read',
        difficulty: 'Intermediate',
        category: 'OOP Fundamentals',
        order: 3,
      },
      {
        id: '4',
        slug: 'garbage-collection-and-memory-tuning',
        title: 'Garbage Collection Algorithms and JVM Tuning',
        description: 'Comparison of G1GC, ZGC, and Shenandoah collectors. Generational hypothesis, compaction strategies, and GC pause metrics.',
        readTime: '18 min read',
        difficulty: 'Advanced',
        category: 'JVM Internals',
        order: 4,
      },
      {
        id: '5',
        slug: 'java-memory-model-and-concurrency',
        title: 'Java Memory Model and Happens-Before Guarantees',
        description: 'Volatile variable visibility semantics, memory barriers, instruction reordering, and synchronized block semantics under the JMM.',
        readTime: '16 min read',
        difficulty: 'Advanced',
        category: 'Concurrency',
        order: 5,
      },
      {
        id: '6',
        slug: 'collections-framework-internals',
        title: 'Java Collections Internals: HashMap & ConcurrentHashMap',
        description: 'Bucket array collisions, treeification thresholds using red-black trees, bitwise hash spreading, and lock striping in concurrent structures.',
        readTime: '15 min read',
        difficulty: 'Intermediate',
        category: 'Data Structures',
        order: 6,
      },
      {
        id: '7',
        slug: 'exception-handling-best-practices',
        title: 'Exception Hierarchy and Stack Unwinding Performance',
        description: 'Checked vs unchecked design patterns, stack trace fill overhead, try-with-resources, and custom exception best practices.',
        readTime: '10 min read',
        difficulty: 'Beginner',
        category: 'Best Practices',
        order: 7,
      },
      {
        id: '8',
        slug: 'generics-type-erasure-and-wildcards',
        title: 'Generics, Type Erasure, and PECS Guidelines',
        description: 'Compile-time type checking, bridge methods, covariance, contravariance, and Producer-Extends-Consumer-Super wildcard applications.',
        readTime: '13 min read',
        difficulty: 'Intermediate',
        category: 'Type System',
        order: 8,
      },
      {
        id: '9',
        slug: 'virtual-threads-and-project-loom',
        title: 'Virtual Threads and Structured Concurrency',
        description: 'Lightweight user-mode threads scheduled by carrier threads, non-blocking I/O mounting, and thread pool replacement patterns.',
        readTime: '15 min read',
        difficulty: 'Advanced',
        category: 'Concurrency',
        order: 9,
      },
    ],
  },
  dsa: {
    slug: 'dsa',
    title: 'Data Structures & Algorithms',
    shortDescription: 'Core algorithmic paradigms, asymptotic analysis, search techniques, tree traversals, and dynamic programming.',
    description: 'A structured reference covering fundamental data structures and algorithmic problem-solving patterns with rigorous time and space complexity evaluations.',
    topicsCount: 9,
    topics: [
      {
        id: '1',
        slug: 'binary-search',
        title: 'Binary Search: Monotonic Search Space & Predicates',
        description: 'Logarithmic search mechanics, lower bound and upper bound implementations, and binary search on continuous or discrete answer spaces.',
        readTime: '15 min read',
        difficulty: 'Intermediate',
        category: 'Searching Algorithms',
        order: 1,
      },
      {
        id: '2',
        slug: 'two-pointers-and-sliding-window',
        title: 'Two Pointers and Sliding Window Patterns',
        description: 'Linear time optimizations for substring matching, subarray constraints, and expanding-contracting window boundaries.',
        readTime: '13 min read',
        difficulty: 'Intermediate',
        category: 'Arrays & Strings',
        order: 2,
      },
      {
        id: '3',
        slug: 'monotonic-stack-patterns',
        title: 'Monotonic Stacks: Next Greater Element Applications',
        description: 'Technique for discovering nearest smaller/larger elements in linear time, histogram maximum areas, and stock span problems.',
        readTime: '11 min read',
        difficulty: 'Advanced',
        category: 'Stacks',
        order: 3,
      },
      {
        id: '4',
        slug: 'binary-trees-and-traversals',
        title: 'Binary Tree Properties and Iterative Traversals',
        description: 'Depth-first (preorder, inorder, postorder) using explicit stacks, Morris traversal for O(1) auxiliary space, and breadth-first level order.',
        readTime: '14 min read',
        difficulty: 'Beginner',
        category: 'Trees',
        order: 4,
      },
      {
        id: '5',
        slug: 'binary-search-trees-and-avl',
        title: 'Self-Balancing Binary Search Trees and AVL Rotations',
        description: 'Balancing factor maintenance, single and double tree rotations, search invariants, and worst-case O(log N) balance guarantees.',
        readTime: '16 min read',
        difficulty: 'Advanced',
        category: 'Trees',
        order: 5,
      },
      {
        id: '6',
        slug: 'dynamic-programming-memoization-tabulation',
        title: 'Dynamic Programming: State Space Reductions',
        description: 'Formulating optimal substructure and overlapping subproblems. Converting recursive memoization into iterative tabulation with space compression.',
        readTime: '20 min read',
        difficulty: 'Advanced',
        category: 'Dynamic Programming',
        order: 6,
      },
      {
        id: '7',
        slug: 'graph-traversals-bfs-dfs',
        title: 'Graph Representation, BFS, and DFS Foundations',
        description: 'Adjacency list versus matrix tradeoffs, connected component counting, cycle detection in directed graphs, and topological sorting.',
        readTime: '16 min read',
        difficulty: 'Intermediate',
        category: 'Graphs',
        order: 7,
      },
      {
        id: '8',
        slug: 'shortest-path-algorithms',
        title: 'Shortest Path Algorithms: Dijkstra and Bellman-Ford',
        description: 'Greedy shortest path selection with priority queues, negative weight cycle detection, and relaxation invariant proofs.',
        readTime: '18 min read',
        difficulty: 'Advanced',
        category: 'Graphs',
        order: 8,
      },
      {
        id: '9',
        slug: 'disjoint-set-union',
        title: 'Disjoint Set Union (DSU) with Path Compression',
        description: 'Near O(1) amortized inverse Ackermann time complexity for dynamic connectivity, Kruskal minimum spanning tree, and union by rank.',
        readTime: '12 min read',
        difficulty: 'Intermediate',
        category: 'Data Structures',
        order: 9,
      },
    ],
  },
  sql: {
    slug: 'sql',
    title: 'SQL & Relational Databases',
    shortDescription: 'Relational database theory, query execution engines, index structures, transaction isolation, and schema design.',
    description: 'In-depth reference for SQL query optimization, storage engines, indexing mechanics, and database concurrency controls.',
    topicsCount: 8,
    topics: [
      {
        id: '1',
        slug: 'query-optimization-and-b-tree-indexing',
        title: 'B-Tree Indexing and Query Optimizer Execution Plans',
        description: 'Structure of balanced tree indexes, root-to-leaf lookups, leftmost prefix matching, index coverage, and reading query plans.',
        readTime: '14 min read',
        difficulty: 'Intermediate',
        category: 'Performance',
        order: 1,
      },
      {
        id: '2',
        slug: 'advanced-window-functions',
        title: 'Analytical Window Functions and Partitioning Clauses',
        description: 'Calculating running totals, ranking variants (ROW_NUMBER vs RANK vs DENSE_RANK), and lookahead values via LEAD and LAG.',
        readTime: '11 min read',
        difficulty: 'Beginner',
        category: 'Querying',
        order: 2,
      },
      {
        id: '3',
        slug: 'transaction-isolation-levels-and-acid',
        title: 'ACID Properties and Transaction Isolation Levels',
        description: 'Anomalies including dirty reads, non-repeatable reads, and phantom reads across Read Committed, Repeatable Read, and Serializable.',
        readTime: '16 min read',
        difficulty: 'Advanced',
        category: 'Concurrency',
        order: 3,
      },
      {
        id: '4',
        slug: 'database-normalization-forms',
        title: 'Normalization Rules from 1NF to BCNF and Denormalization',
        description: 'Eliminating insertion, update, and deletion anomalies through functional dependencies, candidate keys, and read-heavy denormalization tradeoffs.',
        readTime: '12 min read',
        difficulty: 'Beginner',
        category: 'Schema Design',
        order: 4,
      },
      {
        id: '5',
        slug: 'join-algorithms-nested-loop-hash-merge',
        title: 'Join Mechanics: Nested Loop, Hash Join, and Merge Join',
        description: 'How database planners execute inner and outer joins, memory requirements for hash buckets, and sorted input requirements.',
        readTime: '15 min read',
        difficulty: 'Intermediate',
        category: 'Execution Internals',
        order: 5,
      },
      {
        id: '6',
        slug: 'multiversion-concurrency-control-mvcc',
        title: 'Multi-Version Concurrency Control (MVCC) in PostgreSQL',
        description: 'Tuple versioning via xmin and xmax headers, visibility maps, vacuum process garbage collection, and transaction snapshot isolation.',
        readTime: '17 min read',
        difficulty: 'Advanced',
        category: 'Storage Internals',
        order: 6,
      },
      {
        id: '7',
        slug: 'database-locking-and-deadlock-handling',
        title: 'Row and Table Level Locking, Deadlock Detection',
        description: 'Shared locks, exclusive locks, intentional locks, two-phase locking (2PL) protocols, and cycle detection in wait-for graphs.',
        readTime: '14 min read',
        difficulty: 'Intermediate',
        category: 'Concurrency',
        order: 7,
      },
      {
        id: '8',
        slug: 'partitioning-and-sharding-architectures',
        title: 'Table Partitioning: Range, Hash, and List Strategies',
        description: 'Partition pruning by query planner, declarative partitioning implementations, maintenance overhead, and horizontal sharding tradeoffs.',
        readTime: '15 min read',
        difficulty: 'Advanced',
        category: 'Architecture',
        order: 8,
      },
    ],
  },
  os: {
    slug: 'os',
    title: 'Operating Systems & Concurrency',
    shortDescription: 'Process scheduling, virtual memory translation, page replacement, thread synchronization, and file system design.',
    description: 'Technical reference covering system calls, kernel-space versus user-space transitions, memory hierarchies, and concurrency synchronization.',
    topicsCount: 8,
    topics: [
      {
        id: '1',
        slug: 'virtual-memory-and-paging',
        title: 'Virtual Memory, Multi-Level Paging, and Page Faults',
        description: 'Hardware address translation using MMU, translation lookaside buffer (TLB) misses, page table entries, and kernel demand paging.',
        readTime: '15 min read',
        difficulty: 'Intermediate',
        category: 'Memory Management',
        order: 1,
      },
      {
        id: '2',
        slug: 'process-scheduling-and-context-switching',
        title: 'CPU Scheduling and Context Switching Mechanics',
        description: 'Process Control Block (PCB) states, preemptive vs cooperative scheduling, completely fair scheduler (CFS), and cache invalidation cost.',
        readTime: '13 min read',
        difficulty: 'Intermediate',
        category: 'CPU Scheduling',
        order: 2,
      },
      {
        id: '3',
        slug: 'concurrency-mutexes-and-semaphores',
        title: 'Critical Sections, Mutexes, Semaphores, and Spinlocks',
        description: 'Race conditions, hardware test-and-set primitives, compare-and-swap (CAS), counting semaphores, and priority inversion workarounds.',
        readTime: '17 min read',
        difficulty: 'Advanced',
        category: 'Synchronization',
        order: 3,
      },
      {
        id: '4',
        slug: 'deadlock-coffman-conditions-and-bankers-algorithm',
        title: 'Deadlock Conditions, Banker Algorithm, and Prevention',
        description: 'Four Coffman conditions, resource allocation graphs, safe state verification via Banker algorithm, and cycle detection.',
        readTime: '14 min read',
        difficulty: 'Intermediate',
        category: 'Synchronization',
        order: 4,
      },
      {
        id: '5',
        slug: 'file-systems-and-inodes',
        title: 'File System Architecture: Inodes, Dentry, and Superblocks',
        description: 'Disk sector layout, direct and indirect block pointers, hard links vs symbolic links, file descriptors, and journaling consistency.',
        readTime: '12 min read',
        difficulty: 'Beginner',
        category: 'Storage',
        order: 5,
      },
      {
        id: '6',
        slug: 'inter-process-communication-ipc',
        title: 'Inter-Process Communication: Pipes, Shared Memory, and Sockets',
        description: 'Comparison of message passing versus shared memory regions, POSIX message queues, semaphores, and Unix domain sockets throughput.',
        readTime: '14 min read',
        difficulty: 'Intermediate',
        category: 'Process Management',
        order: 6,
      },
      {
        id: '7',
        slug: 'kernel-space-vs-user-space-syscalls',
        title: 'System Calls, Ring Transitions, and CPU Protection Rings',
        description: 'Hardware protection rings (Ring 0 vs Ring 3), trap handling, CPU register saving, and software interrupts for context transitions.',
        readTime: '13 min read',
        difficulty: 'Intermediate',
        category: 'Kernel Architecture',
        order: 7,
      },
      {
        id: '8',
        slug: 'page-replacement-algorithms',
        title: 'Page Replacement: LRU, Clock, and Belady Anomaly',
        description: 'Minimizing page fault rates, FIFO limitations, second-chance clock algorithm approximation, and working set memory model.',
        readTime: '11 min read',
        difficulty: 'Beginner',
        category: 'Memory Management',
        order: 8,
      },
    ],
  },
  cn: {
    slug: 'cn',
    title: 'Computer Networks',
    shortDescription: 'TCP/IP protocol stack, congestion control, routing algorithms, transport layer protocols, and modern web application delivery.',
    description: 'Engineering reference for network architecture, packet traversal from physical layer to application layer, reliable byte-streams, and security protocols.',
    topicsCount: 8,
    topics: [
      {
        id: '1',
        slug: 'tcp-three-way-handshake-and-termination',
        title: 'TCP Handshake, Connection Teardown, and State Machine',
        description: 'SYN, SYN-ACK, ACK sequence numbers, TIME_WAIT state rationale, MSL timers, and handling SYN flood attack vectors.',
        readTime: '14 min read',
        difficulty: 'Beginner',
        category: 'Transport Layer',
        order: 1,
      },
      {
        id: '2',
        slug: 'tcp-congestion-control-algorithms',
        title: 'TCP Flow & Congestion Control: Reno, Tahoe, and BBR',
        description: 'Sliding window mechanics, slow start, congestion avoidance, fast retransmit, fast recovery, and Google BBR bandwidth delay product.',
        readTime: '17 min read',
        difficulty: 'Advanced',
        category: 'Transport Layer',
        order: 2,
      },
      {
        id: '3',
        slug: 'osi-model-vs-tcp-ip-suite',
        title: 'OSI 7-Layer Model vs Modern TCP/IP Protocol Stack',
        description: 'Layer encapsulation, headers, Protocol Data Units (PDU), packet forwarding, and router vs switch operational distinctions.',
        readTime: '11 min read',
        difficulty: 'Beginner',
        category: 'Foundations',
        order: 3,
      },
      {
        id: '4',
        slug: 'dns-resolution-process-and-hierarchy',
        title: 'DNS Resolution Architecture: Root, TLD, and Recursive Resolvers',
        description: 'Hierarchical name resolution, DNS record types (A, AAAA, CNAME, MX), TTL caching, authoritative servers, and DNS over HTTPS.',
        readTime: '13 min read',
        difficulty: 'Beginner',
        category: 'Application Layer',
        order: 4,
      },
      {
        id: '5',
        slug: 'http-evolution-from-1-1-to-http-3',
        title: 'HTTP Evolution: HTTP/1.1 Pipelining, HTTP/2 Multiplexing, and QUIC/HTTP/3',
        description: 'Head-of-line blocking at application and transport layers, binary framing streams, zero-RTT connection resumption with UDP QUIC.',
        readTime: '16 min read',
        difficulty: 'Intermediate',
        category: 'Application Layer',
        order: 5,
      },
      {
        id: '6',
        slug: 'ip-addressing-subnetting-and-cidr',
        title: 'IPv4 Subnetting, VLSM, CIDR Notation, and NAT',
        description: 'Network prefix calculation, broadcast addresses, subnet mask bitwise operations, and Network Address Translation mapping tables.',
        readTime: '15 min read',
        difficulty: 'Intermediate',
        category: 'Network Layer',
        order: 6,
      },
      {
        id: '7',
        slug: 'routing-algorithms-link-state-vs-distance-vector',
        title: 'Routing Protocols: OSPF Link-State and BGP Path-Vector',
        description: 'Dijkstra shortest path in OSPF, count-to-infinity in distance-vector, autonomous systems, and exterior gateway routing over BGP.',
        readTime: '18 min read',
        difficulty: 'Advanced',
        category: 'Network Layer',
        order: 7,
      },
      {
        id: '8',
        slug: 'tls-handshake-and-asymmetric-encryption',
        title: 'TLS 1.3 Cryptographic Handshake and Certificate Validation',
        description: 'Diffie-Hellman key exchange, symmetric session keys, digital certificates, Certificate Authorities, and PKI trust chains.',
        readTime: '15 min read',
        difficulty: 'Advanced',
        category: 'Security',
        order: 8,
      },
    ],
  },
};

export const TOPIC_DETAILS_MOCK: Record<string, TopicDetail> = {
  'java/object-lifecycle-in-java': {
    slug: 'object-lifecycle-in-java',
    title: 'Object Lifecycle in Java',
    subjectSlug: 'java',
    subjectTitle: 'Core & Advanced Java',
    description: 'An architectural breakdown of how Java objects are created, initialized on the JVM heap, referenced, transition into an unreachable state, and are collected by the Garbage Collector.',
    readTime: '12 min read',
    difficulty: 'Intermediate',
    category: 'Memory Management',
    publishedDate: '2026-03-15',
    updatedDate: '2026-04-02',
    introParagraphs: [
      'In Java, memory management is primarily handled automatically by the Java Virtual Machine (JVM). However, understanding the exact stages an object traverses—from declaration and memory allocation on the heap to becoming unreachable and getting reaped by garbage collection—is essential for designing stable, low-latency applications.',
      'Unlike languages such as C or C++ where developers explicitly invoke malloc() and free(), Java abstracts explicit deallocation away. Let us inspect the 5 distinct phases of every Java object lifecycle.',
    ],
    overviewCode: {
      language: 'java',
      filename: 'Main.java',
      code: `class Student {
    private String name;

    Student(String name) {
        this.name = name;
    }

    void displayName() {
        System.out.println("Student: " + name);
    }
}

public class Main {
    public static void main(String[] args) {
        // Creates and initializes a Student object
        Student student = new Student("Rahul");

        // Uses the object
        student.displayName(); // Output: Student: Rahul
    }
}`,
      highlightLines: [16, 19],
    },
    sections: [
      {
        id: 'object-creation-and-initialization',
        title: '1. Object Creation and Initialization',
        level: 2,
        content: [
          'An object is instantiated in the JVM when the new keyword is executed. This process involves three distinct sub-phases: declaration, instantiation, and initialization.',
        ],
        bullets: [
          'student is a reference variable stored on the thread stack frame.',
          'new Student("Rahul") creates the object inside the JVM Young Generation Heap.',
          'The constructor Student(String name) initializes the instance variables of the object.',
          'The reference variable points directly to the memory address of the newly created object.',
        ],
        codeSnippet: {
          language: 'java',
          filename: 'ObjectCreationDemo.java',
          code: `// Step 1: Declaration (Reference pointer on Stack)
Student student; // References null, no memory allocated on Heap yet

// Step 2 & 3: Instantiation & Initialization (Heap allocation & Constructor execution)
student = new Student("Rahul"); // Memory allocated on heap, constructor runs`,
          highlightLines: [2, 5],
        },
        infobox: {
          type: 'info',
          text: 'Memory Allocation: All object instances in Java reside on the Heap memory. Only primitive local variables and object reference pointers live on the Stack.',
        },
      },
      {
        id: 'object-usage',
        title: '2. Object Usage',
        level: 2,
        content: [
          'Once initialized, the object enters its active usage phase. During this phase, client code accesses instance fields, calls member methods, passes the object reference as parameters to other functions, or returns it as a function result.',
          'As long as at least one active, live thread maintains a valid GC Root reference path to this object, it remains alive and protected from collection.',
        ],
        codeSnippet: {
          language: 'java',
          filename: 'UsageExample.java',
          code: `// Invoking methods through the reference
student.displayName();

// Passing reference across method boundaries
processStudent(student);`,
          highlightLines: [2],
        },
      },
      {
        id: 'object-becomes-unreachable',
        title: '3. Object Becomes Unreachable',
        level: 2,
        content: [
          'An object transitions to an unreachable state when there are no remaining reference paths from any GC Root (such as active thread local variables, static variables, or JNI global references).',
          'There are four common ways an object becomes eligible for garbage collection in Java:',
        ],
        numberedSteps: [
          'Nullifying the reference variable: Setting student = null breaks the pointer.',
          'Reassigning the reference variable: Directing student = new Student("Aman") leaves the previous instance orphaned.',
          'Object created inside a method going out of scope: Local variables are popped off the call stack once the method frame exits.',
          'Anonymous objects: Objects created without assigning to any reference variable, such as new Student("Temp").displayName().',
        ],
        codeSnippet: {
          language: 'java',
          filename: 'UnreachableExample.java',
          code: `Student s1 = new Student("Rahul");
Student s2 = new Student("Priya");

// Case 1: Nullifying reference
s1 = null; // The "Rahul" object is now unreachable

// Case 2: Reassigning reference
s2 = new Student("Aman"); // The "Priya" object is now unreachable`,
          highlightLines: [5, 8],
        },
      },
      {
        id: 'garbage-collection',
        title: '4. Garbage Collection',
        level: 2,
        content: [
          'Garbage Collection is an automated background daemon process managed by the JVM that reclaims memory occupied by unreachable objects, making it available for subsequent allocations.',
          'Java divides heap memory into generational spaces: Eden Space, Survivor Spaces (S0/S1), and Tenured / Old Generation. Most objects die young in the Eden space.',
        ],
        bullets: [
          'Mark Phase: The GC identifies which objects are still reachable by traversing reference graphs starting from GC Roots.',
          'Sweep Phase: Unreachable objects are discarded, and their memory blocks are returned to the free list.',
          'Compact Phase: Survived objects are compacted toward the start of the memory region to eliminate fragmentation.',
        ],
        infobox: {
          type: 'warning',
          text: 'Garbage Collection is non-deterministic. Developers cannot force GC execution; calling System.gc() merely hints the JVM.',
        },
      },
      {
        id: 'system-gc-method',
        title: 'The System.gc() Method',
        level: 3,
        content: [
          'Java provides System.gc() and Runtime.getRuntime().gc() to request garbage collection explicitly. However, the JVM specification makes no guarantee that the garbage collector will actually run upon invocation.',
          'In production systems, invoking System.gc() is strongly discouraged as it often triggers a full Stop-The-World (STW) pause across all application threads.',
        ],
        codeSnippet: {
          language: 'java',
          filename: 'SystemGcAntiPattern.java',
          code: `Student s = new Student("Aditya");
s = null; // Eligible for GC

// Requesting JVM to trigger GC (Not guaranteed and expensive in production)
System.gc();
System.out.println("GC request suggested to JVM.");`,
          highlightLines: [5],
        },
      },
      {
        id: 'cyclic-references',
        title: 'Cyclic References',
        level: 3,
        content: [
          'What happens if Object A references Object B, and Object B references Object A, but neither is referenced from any active GC Root? In older reference-counting systems, this caused leaks.',
          'Java uses Root-Reachability (tracing) algorithms. Because neither Object A nor B can be reached from any GC Root, the JVM correctly collects both objects despite their circular pointers.',
        ],
        codeSnippet: {
          language: 'java',
          filename: 'CyclicReferenceDemo.java',
          code: `class Node {
    Node neighbour;
}

Node first = new Node();
Node second = new Node();

first.neighbour = second;
second.neighbour = first;

// Severing connection from GC Root:
first = null;
second = null;
// Even though both nodes reference each other, both are safely reclaimed!`,
          highlightLines: [11, 12],
        },
      },
      {
        id: 'memory-leaks-in-java',
        title: 'Memory Leaks in Java',
        level: 2,
        content: [
          'Even with automatic garbage collection, memory leaks are still common in Java applications. A memory leak in Java occurs when an object is no longer needed by application logic, but an unintended reference to it remains reachable from a GC Root.',
          'Typical causes of Java memory leaks include:',
        ],
        bullets: [
          'Static collections holding items indefinitely without eviction policies.',
          'Unclosed resources such as database connections, file streams, and network sockets.',
          'Unregistered listeners, callbacks, and event observers.',
          'ThreadLocal variables in thread pool environments without explicit remove() calls.',
        ],
        infobox: {
          type: 'tip',
          text: 'Pro Tip: Always use try-with-resources for AutoCloseable resources, and clear ThreadLocal variables in finally blocks.',
        },
      },
      {
        id: 'summary',
        title: 'Summary',
        level: 2,
        content: [
          'The lifecycle of every Java object moves from declaration and instantiation on the heap, through an active usage phase, into an unreachable state once all GC Root references are severed, and culminates in memory reclamation by the Garbage Collector.',
          'Mastering these stages helps you build memory-efficient applications and diagnose OutOfMemoryError (OOM) bugs with confidence.',
        ],
      },
    ],
    summaryPoints: [
      'Objects are allocated dynamically on the Heap; reference variables live on the Stack.',
      'An object is eligible for GC when it can no longer be reached from any active GC Root.',
      'Circular references are safely handled by Java root-reachability garbage collectors.',
      'Calling System.gc() is non-deterministic and should be avoided in production environments.',
      'Prevent memory leaks by scoping references appropriately and avoiding unbounded static data structures.',
    ],
    prevTopic: undefined,
    nextTopic: {
      slug: 'classes-and-objects',
      title: 'Classes, Objects, and Memory Representation',
    },
  },
  'dsa/binary-search': {
    slug: 'binary-search',
    title: 'Binary Search: Monotonic Search Space & Predicates',
    subjectSlug: 'dsa',
    subjectTitle: 'Data Structures & Algorithms',
    description: 'Master binary search mechanics on monotonic spaces, lower bound, upper bound, rotated arrays, and binary search on continuous or discrete answer spaces.',
    readTime: '15 min read',
    difficulty: 'Intermediate',
    category: 'Searching Algorithms',
    publishedDate: '2026-03-20',
    updatedDate: '2026-04-05',
    introParagraphs: [
      'Binary Search is among the most fundamental algorithmic paradigms in computer science. It reduces a linear O(N) search space down to logarithmic O(log N) by repeatedly halving the active evaluation window.',
      'While searching an element in a sorted array is straightforward, the true power of Binary Search appears in predicate functions (Binary Search on Answer Space).',
    ],
    overviewCode: {
      language: 'cpp',
      filename: 'BinarySearch.cpp',
      code: `int binarySearch(const vector<int>& nums, int target) {
    int low = 0, high = nums.size() - 1;
    
    while (low <= high) {
        int mid = low + (high - low) / 2;
        
        if (nums[mid] == target) return mid;
        else if (nums[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    
    return -1; // Target not found
}`,
      highlightLines: [5, 7],
    },
    sections: [
      {
        id: 'foundational-concept',
        title: '1. Foundational Concept & Monotonicity',
        level: 2,
        content: [
          'Binary search operates on the principle of monotonicity: if a condition changes from false to true (or vice-versa), the boundary can be located in O(log N) iterations.',
        ],
        bullets: [
          'Time Complexity: O(log N) worst and average case.',
          'Space Complexity: O(1) iterative space.',
          'Always calculate mid as low + (high - low) / 2 to prevent integer 32-bit overflow.',
        ],
      },
      {
        id: 'lower-and-upper-bound',
        title: '2. Lower Bound & Upper Bound',
        level: 2,
        content: [
          'Lower bound finds the first index where element >= target. Upper bound finds the first index where element > target.',
        ],
        codeSnippet: {
          language: 'cpp',
          filename: 'LowerBound.cpp',
          code: `int lowerBound(const vector<int>& arr, int target) {
    int low = 0, high = arr.size() - 1;
    int ans = arr.size();
    
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (arr[mid] >= target) {
            ans = mid;
            high = mid - 1; // Look for smaller index on the left
        } else {
            low = mid + 1;
        }
    }
    return ans;
}`,
        },
      },
      {
        id: 'binary-search-on-answer',
        title: '3. Binary Search on Answer Space',
        level: 2,
        content: [
          'When an optimization problem asks for the minimum possible maximum (or maximum possible minimum) value, define a monotonic predicate check(mid) and binary search across the feasible value range.',
        ],
        infobox: {
          type: 'tip',
          text: 'Problems such as Koko Eating Bananas, Aggressive Cows, and Book Allocation all map directly to Binary Search on Answer.',
        },
      },
      {
        id: 'summary',
        title: 'Summary',
        level: 2,
        content: [
          'Binary search extends far beyond simple array lookups. Identifying monotonicity in problem constraints allows you to reduce brute-force algorithms to logarithmic runtime.',
        ],
      },
    ],
    summaryPoints: [
      'Avoid overflow using low + (high - low) / 2.',
      'Check loop boundary: low <= high vs low < high depends on interval closure.',
      'Lower bound returns smallest index where arr[i] >= target.',
      'Identify monotonic predicates for BS on Answer Space.',
    ],
    prevTopic: undefined,
    nextTopic: {
      slug: 'two-pointers-and-sliding-window',
      title: 'Two Pointers and Sliding Window Patterns',
    },
  },
};
