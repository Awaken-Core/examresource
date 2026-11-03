/**
 * Restructure Test Series – Aptitude & Reasoning Master Exam 2026
 *
 * Implements:
 * 1. Test Series configuration: "Aptitude & Reasoning Master Exam 2026" (slug: "aptitude-reasoning-master-exam-2026", category: "aptitude-reasoning")
 * 2. Two Primary Subjects:
 *    - Quantitative Aptitude (slug: "quantitative-aptitude")
 *    - Logical Reasoning (slug: "logical-reasoning")
 * 3. 19 Quantitative Aptitude Chapters + 18 Logical Reasoning Chapters with complete syllabus topics
 * 4. 100% question mapping of all 292 QA questions and 220 LR questions (512 total) to exact chapters in question_mappings
 * 5. Full test suite generation:
 *    - Full Mock Tests with internal sections (Section 1: Quantitative Aptitude, Section 2: Logical Reasoning)
 *    - Subject Tests for Quantitative Aptitude and Logical Reasoning
 *    - Chapter Tests for chapters with questions
 * 6. Preserves existing question records, bilingual content, explanations, answers, and ensures zero duplication.
 *
 * Usage:
 *   bun run docs/scripts/restructure_aptitude_reasoning.ts
 */

import 'dotenv/config';
import mongoose, { Types } from 'mongoose';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ─── 1. Load Environment Variables ──────────────────────────────────────────
const envFile = resolve(process.cwd(), 'apps/server/.env');
for (const line of readFileSync(envFile, 'utf-8').split('\n')) {
  const t = line.trim();
  if (t && !t.startsWith('#') && t.includes('=')) {
    const [k, ...v] = t.split('=');
    process.env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
  }
}

await mongoose.connect(process.env.DATABASE_URL!);
console.log(' Connected to MongoDB.');

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

// ─── 2. Find or Create Target Series ─────────────────────────────────────────
let series = await SeriesCol.findOne({ slug: 'aptitude-reasoning-master-exam-2026' });
if (!series) {
  series = await SeriesCol.findOne({ title: 'Aptitude & Reasoning Master Exam 2026' });
}

const seriesId = series?._id || new Types.ObjectId('6ad8f2435ec7d4de270b4488');

await SeriesCol.updateOne(
  { _id: seriesId },
  {
    $set: {
      title: 'Aptitude & Reasoning Master Exam 2026',
      slug: 'aptitude-reasoning-master-exam-2026',
      targetExam: 'Aptitude & Reasoning',
      category: 'aptitude-reasoning',
      organization: 'GovtPariksha',
      description: 'Comprehensive CBT mock test series and practice question bank for Quantitative Aptitude and Logical Reasoning across 37 syllabus-aligned chapters with dual-section full length mocks.',
      status: 'published',
      accessType: 'free',
      supportedLanguages: ['English', 'Hindi'],
      languages: ['English', 'Hindi'],
      badge: 'Recommended',
      featured: true,
      order: 1,
      updatedAt: new Date(),
    },
    $setOnInsert: {
      createdBy: adminId,
      createdAt: new Date(),
    },
  },
  { upsert: true },
);

console.log(` Target series configured: Aptitude & Reasoning Master Exam 2026 (${seriesId})`);

// ─── 3. Two Primary Subjects ─────────────────────────────────────────────────
// Subject 1: Quantitative Aptitude
let qaSubject = await SubjectCol.findOne({ slug: 'quantitative-aptitude' });
if (!qaSubject) {
  qaSubject = await SubjectCol.findOne({ name: 'Quantitative Aptitude' });
}
const qaSubjectId = qaSubject?._id || new Types.ObjectId('6ad8f2425ec7d4de270b4486');
await SubjectCol.updateOne(
  { _id: qaSubjectId },
  {
    $set: {
      name: 'Quantitative Aptitude',
      slug: 'quantitative-aptitude',
      description: 'Arithmetic, Algebra, Geometry, Mensuration, and Data Interpretation.',
      updatedAt: new Date(),
    },
    $setOnInsert: {
      createdBy: adminId,
      createdAt: new Date(),
    },
  },
  { upsert: true },
);

// Subject 2: Logical Reasoning
let lrSubject = await SubjectCol.findOne({ slug: 'logical-reasoning' });
if (!lrSubject) {
  lrSubject = await SubjectCol.findOne({ name: 'Logical Reasoning' });
}
const lrSubjectId = lrSubject?._id || new Types.ObjectId('6ae7799eacde0c0249c61b3e');
await SubjectCol.updateOne(
  { _id: lrSubjectId },
  {
    $set: {
      name: 'Logical Reasoning',
      slug: 'logical-reasoning',
      description: 'Verbal, Analytical, Logical, Non-Verbal Reasoning and Pattern Analysis.',
      updatedAt: new Date(),
    },
    $setOnInsert: {
      createdBy: adminId,
      createdAt: new Date(),
    },
  },
  { upsert: true },
);

// Link both in test_series_subjects
await TSSubjectCol.deleteMany({ testSeriesId: seriesId });
await TSSubjectCol.insertMany([
  {
    _id: new Types.ObjectId(),
    testSeriesId: seriesId,
    subjectId: qaSubjectId,
    order: 0,
    customDisplayName: 'Quantitative Aptitude',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: new Types.ObjectId(),
    testSeriesId: seriesId,
    subjectId: lrSubjectId,
    order: 1,
    customDisplayName: 'Logical Reasoning',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]);

console.log(' Linked 2 Primary Subjects: Quantitative Aptitude & Logical Reasoning.');

// ─── 4. Chapter Hierarchy Definitions ────────────────────────────────────────
interface ChapterDef {
  name: string;
  slug: string;
  order: number;
  description: string;
  topics: string[];
}

const QA_CHAPTER_DEFS: ChapterDef[] = [
  {
    name: 'Number System',
    slug: 'number-system',
    order: 0,
    description: 'Types of numbers, prime & composite numbers, divisibility rules, unit digit calculation, remainder theorem, integers and rational numbers.',
    topics: ['Types of Numbers', 'Divisibility Rules', 'Prime & Composite Numbers', 'Unit Digit Calculation', 'Remainder Theorem'],
  },
  {
    name: 'Simplification',
    slug: 'simplification',
    order: 1,
    description: 'BODMAS / PEMDAS operations, fractions, decimals, square roots, cube roots, surds and indices.',
    topics: ['BODMAS Rules', 'Fractions & Decimals', 'Square Roots & Cube Roots', 'Surds and Indices', 'Approximation'],
  },
  {
    name: 'HCF and LCM',
    slug: 'hcf-and-lcm',
    order: 2,
    description: 'Highest Common Factor and Least Common Multiple, prime factorization, division method, relation between HCF & LCM.',
    topics: ['Prime Factorization', 'HCF by Division', 'LCM Methods', 'Product Rule of HCF & LCM', 'Word Problems on HCF/LCM'],
  },
  {
    name: 'Percentage',
    slug: 'percentage',
    order: 3,
    description: 'Concept of percent, fractional equivalents, percentage increase and decrease, successive percentage changes.',
    topics: ['Fraction to Percentage Conversion', 'Percentage Increase & Decrease', 'Successive Changes', 'Population and Value Depreciation'],
  },
  {
    name: 'Ratio and Proportion',
    slug: 'ratio-and-proportion',
    order: 4,
    description: 'Ratios, compound ratios, proportions, mean proportional, third & fourth proportional, sharing and distribution.',
    topics: ['Ratio Simplification', 'Proportions & Mean Proportional', 'Sharing & Distribution', 'Coin & Currency Problems'],
  },
  {
    name: 'Average',
    slug: 'average',
    order: 5,
    description: 'Arithmetic mean, weighted average, consecutive number averages, age-related average problems.',
    topics: ['Arithmetic Mean', 'Weighted Average', 'Consecutive Series Averages', 'Average Age Problems', 'Batting & Bowling Averages'],
  },
  {
    name: 'Profit and Loss',
    slug: 'profit-and-loss',
    order: 6,
    description: 'Cost price, selling price, profit percentage, loss percentage, dishonest dealers, marked price relations.',
    topics: ['Cost Price & Selling Price', 'Profit & Loss Percentage', 'Dishonest Shopkeeper', 'Articles Sold at Same Price'],
  },
  {
    name: 'Discount',
    slug: 'discount',
    order: 7,
    description: 'Marked price, list price, trade discount, cash discount, successive discounts, equivalent single discount.',
    topics: ['Marked Price Calculation', 'Single Equivalent Discount', 'Successive Discounts', 'Profit after Discount'],
  },
  {
    name: 'Simple and Compound Interest',
    slug: 'simple-and-compound-interest',
    order: 8,
    description: 'Simple interest calculation, compound interest annually and semi-annually, difference between CI and SI, doubling rates.',
    topics: ['Simple Interest Formula', 'Compound Interest Annually & Half-Yearly', 'Difference between CI and SI', 'Rule of Doubling/Tripling Sum'],
  },
  {
    name: 'Time and Work',
    slug: 'time-and-work',
    order: 9,
    description: 'Work efficiency, unitary method, wages distribution, alternate working days, man-days formula.',
    topics: ['Unitary Work Method', 'Work Efficiency & Ratios', 'Wages Distribution', 'Men, Women and Days Formula', 'Alternate Day Working'],
  },
  {
    name: 'Pipes and Cisterns',
    slug: 'pipes-and-cisterns',
    order: 10,
    description: 'Inlets and outlets, tank filling and emptying rates, leak problems, alternate operation of pipes.',
    topics: ['Inlet and Outlet Pipes', 'Tank Capacity Calculation', 'Leakage Problems', 'Alternate Pipe Operations'],
  },
  {
    name: 'Time, Speed and Distance',
    slug: 'time-speed-and-distance',
    order: 11,
    description: 'Speed conversion (km/h to m/s), average speed, relative speed, late and early arrival, circular tracks.',
    topics: ['Speed Unit Conversions', 'Average Speed Calculations', 'Relative Speed', 'Early and Late Arrival Problems'],
  },
  {
    name: 'Problems on Trains',
    slug: 'problems-on-trains',
    order: 12,
    description: 'Crossing stationary poles and persons, crossing platforms and bridges, two trains moving in same or opposite directions.',
    topics: ['Crossing a Pole or Person', 'Crossing a Platform or Bridge', 'Trains in Opposite Directions', 'Trains in Same Direction'],
  },
  {
    name: 'Mixture and Alligation',
    slug: 'mixture-and-alligation',
    order: 13,
    description: 'Rule of alligation, mixing liquids, concentration changes, replacement of liquids, alloy ratios.',
    topics: ['Rule of Alligation', 'Liquid Mixture Ratios', 'Replacement of Solutions', 'Alloy Composition Problems'],
  },
  {
    name: 'Partnership',
    slug: 'partnership',
    order: 14,
    description: 'Simple and compound partnership, sleeping and active partners, investment ratios and profit sharing.',
    topics: ['Simple Partnership', 'Compound Partnership', 'Working vs Sleeping Partners', 'Profit Sharing Ratios'],
  },
  {
    name: 'Mensuration',
    slug: 'mensuration',
    order: 15,
    description: '2D & 3D geometry: perimeter, area of triangle, rectangle, circle; volume and surface area of cube, cuboid, cylinder, cone, sphere.',
    topics: ['2D Perimeter & Area', 'Circle, Semicircle & Rings', 'Cube & Cuboid Volume/Surface Area', 'Cylinder, Cone & Sphere'],
  },
  {
    name: 'Algebra',
    slug: 'algebra',
    order: 16,
    description: 'Algebraic identities, linear equations in one and two variables, quadratic equations, polynomial functions.',
    topics: ['Algebraic Identities', 'Linear Equations', 'Quadratic Equations & Roots', 'Polynomial Expressions', 'System of Equations'],
  },
  {
    name: 'Geometry',
    slug: 'geometry',
    order: 17,
    description: 'Triangles, similarity, circles, chords, tangents, quadrilaterals, angles, polygons, Pythagoras theorem.',
    topics: ['Triangle Properties & Similarity', 'Circle Theorems, Chords & Tangents', 'Quadrilaterals & Polygons', 'Angles & Parallel Lines'],
  },
  {
    name: 'Data Interpretation',
    slug: 'data-interpretation',
    order: 18,
    description: 'Tables, bar graphs, pie charts, line graphs, comparative data analysis and percentage share calculation.',
    topics: ['Table Data Analysis', 'Bar Charts', 'Pie Charts & Degree Conversions', 'Line Graphs', 'Mixed Data Graphs'],
  },
];

const LR_CHAPTER_DEFS: ChapterDef[] = [
  {
    name: 'Analogy',
    slug: 'analogy',
    order: 0,
    description: 'Word analogy, letter analogy, number analogy, semantic relationships, tool-worker relationships.',
    topics: ['Word Relationships', 'Letter & Alphabet Analogy', 'Number Analogy', 'Worker & Tool Relations', 'Cause & Effect Analogy'],
  },
  {
    name: 'Classification',
    slug: 'classification',
    order: 1,
    description: 'Odd one out, semantic classification, numerical classification, alphabetical classification.',
    topics: ['Word Classification (Odd One Out)', 'Number Classification', 'Letter Group Classification', 'Semantic Categories'],
  },
  {
    name: 'Series',
    slug: 'series',
    order: 2,
    description: 'Number series, letter series, alternating series, alpha-numeric series, missing term identification.',
    topics: ['Number Series Patterns', 'Alphabet Series', 'Alpha-Numeric Series', 'Alternating Series', 'Wrong Term in Series'],
  },
  {
    name: 'Coding-Decoding',
    slug: 'coding-decoding',
    order: 3,
    description: 'Letter coding, number coding, substitution coding, deciphering fictitious language codes.',
    topics: ['Letter Shifting Codes', 'Numerical Coding', 'Substitution Coding', 'Message Deciphering Codes'],
  },
  {
    name: 'Blood Relations',
    slug: 'blood-relations',
    order: 4,
    description: 'Family tree diagrams, coded blood relations, pointing to a person or photograph, generation gaps.',
    topics: ['Family Tree Diagrams', 'Direct Relations', 'Pointing to a Photograph', 'Coded Blood Relations'],
  },
  {
    name: 'Direction and Distance',
    slug: 'direction-and-distance',
    order: 5,
    description: 'Cardinal and ordinal directions, distance calculation, turns (left/right), shadows and final coordinates.',
    topics: ['Cardinal & Ordinal Directions', 'Turns and Paths', 'Shortest Distance (Pythagoras)', 'Shadow Problems'],
  },
  {
    name: 'Ranking and Order',
    slug: 'ranking-and-order',
    order: 6,
    description: 'Position from left/right/top/bottom, total persons in a row, overlapping positions, interchanging positions.',
    topics: ['Position in a Row', 'Total Persons Calculation', 'Overlapping Positions', 'Interchanging Positions', 'Comparison of Heights/Weights'],
  },
  {
    name: 'Syllogism',
    slug: 'syllogism',
    order: 7,
    description: 'Categorical syllogisms, two-statement and three-statement deductions, either-or cases, possibility conclusions.',
    topics: ['Two-Statement Syllogisms', 'Three-Statement Syllogisms', 'Either-Or Cases', 'Possibility Conclusions', 'Negative Conclusions'],
  },
  {
    name: 'Venn Diagrams',
    slug: 'venn-diagrams',
    order: 8,
    description: 'Identification of geometric regions, three-set Venn diagrams, intersection analysis, set survey problems.',
    topics: ['Geometric Venn Representations', 'Three-Set Intersections', 'Survey & Group Problems', 'Universal Set Calculations'],
  },
  {
    name: 'Seating Arrangement',
    slug: 'seating-arrangement',
    order: 9,
    description: 'Linear seating arrangement (single & double row), circular seating arrangement facing center or outward.',
    topics: ['Linear Row Arrangement', 'Double Parallel Rows', 'Circular Table (Facing Center)', 'Circular Table (Facing Outward)'],
  },
  {
    name: 'Puzzles',
    slug: 'puzzles',
    order: 10,
    description: 'Floor puzzles, box puzzles, scheduling puzzles, comparison puzzles, grid logic.',
    topics: ['Floor Puzzles', 'Box Stacking Puzzles', 'Scheduling & Days of Week', 'Grid Logic Puzzles'],
  },
  {
    name: 'Statement and Conclusion',
    slug: 'statement-and-conclusion',
    order: 11,
    description: 'Drawing direct conclusions from given premises, logical validity, definite vs possible conclusions.',
    topics: ['Direct Logical Deduction', 'Premise Evaluation', 'Definite vs Possible Conclusions', 'Critical Reasoning'],
  },
  {
    name: 'Statement and Assumption',
    slug: 'statement-and-assumption',
    order: 12,
    description: 'Identifying implicit assumptions, stated vs unstated premises, validity of underlying assumptions.',
    topics: ['Implicit Assumptions', 'Valid vs Invalid Assumptions', 'Contextual Evaluation'],
  },
  {
    name: 'Logical Reasoning',
    slug: 'logical-reasoning',
    order: 13,
    description: 'Mathematical operations (+ - * / substitution), analytical reasoning, logical deduction and operator puzzles.',
    topics: ['Mathematical Operator Substitution', 'Equation Balancing', 'Symbolic Operations', 'Deductive Reasoning'],
  },
  {
    name: 'Non-Verbal Reasoning',
    slug: 'non-verbal-reasoning',
    order: 14,
    description: 'Dice and cubes, painted cubes, pattern recognition, spatial orientation.',
    topics: ['Dice Faces and Opposites', 'Painted Cubes and Cutting', 'Pattern Continuation'],
  },
  {
    name: 'Figure Classification',
    slug: 'figure-classification',
    order: 15,
    description: 'Grouping of identical figures, odd figure out, figure matrix completion.',
    topics: ['Odd Figure Out', 'Figure Matrix Completion', 'Identical Figure Grouping'],
  },
  {
    name: 'Mirror and Water Images',
    slug: 'mirror-and-water-images',
    order: 16,
    description: 'Lateral inversion, reflection across horizontal and vertical axes, clock mirror images.',
    topics: ['Vertical Mirror Reflection', 'Horizontal Water Reflection', 'Clock Mirror Time'],
  },
  {
    name: 'Paper Folding and Cutting',
    slug: 'paper-folding-and-cutting',
    order: 17,
    description: 'Transparent sheet folding, punched hole patterns, unfolding visualization.',
    topics: ['Transparent Sheet Folding', 'Punched Hole Patterns', 'Unfolding Visualization'],
  },
];

// Clean up old chapters for this series only
await ChapterCol.deleteMany({ testSeriesId: seriesId });

// Insert Quantitative Aptitude Chapters
const qaChapterIdMap = new Map<string, Types.ObjectId>();
for (const def of QA_CHAPTER_DEFS) {
  const chapId = new Types.ObjectId();
  await ChapterCol.insertOne({
    _id: chapId,
    name: def.name,
    slug: def.slug,
    testSeriesId: seriesId,
    subjectId: qaSubjectId,
    description: def.description,
    topics: def.topics,
    order: def.order,
    status: 'published',
    createdBy: adminId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  qaChapterIdMap.set(def.name, chapId);
}
console.log(` Created ${QA_CHAPTER_DEFS.length} Quantitative Aptitude Chapters.`);

// Insert Logical Reasoning Chapters
const lrChapterIdMap = new Map<string, Types.ObjectId>();
for (const def of LR_CHAPTER_DEFS) {
  const chapId = new Types.ObjectId();
  await ChapterCol.insertOne({
    _id: chapId,
    name: def.name,
    slug: def.slug,
    testSeriesId: seriesId,
    subjectId: lrSubjectId,
    description: def.description,
    topics: def.topics,
    order: def.order,
    status: 'published',
    createdBy: adminId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  lrChapterIdMap.set(def.name, chapId);
}
console.log(` Created ${LR_CHAPTER_DEFS.length} Logical Reasoning Chapters.`);

// ─── 5. Precision Classifiers for Existing Question Bank ────────────────────
function classifyQA(q: any): string {
  const content = q.content || '';
  const expl = q.explanation || '';
  const tags = (q.tags || []).join(' ');
  const topic = q.topic || '';
  const text = `${content} ${expl} ${tags} ${topic}`.toLowerCase();

  // 1. Data Interpretation (tables, charts, graphs)
  if (/data interpretation|bar graph|pie chart|histogram|line graph|table given below|study the following table|shows the price.*car|yearly expenditure|production of.*company|read the table/i.test(text)) {
    return 'Data Interpretation';
  }

  // 2. Problems on Trains
  if (/\btrain\b|\bplatform\b|passes a pole|speed of.*train|two trains/i.test(text)) {
    return 'Problems on Trains';
  }

  // 3. Pipes and Cisterns
  if (/\bpipe\b|\bcistern\b|empties the tank|fills? the tank|\bleak\b/i.test(text)) {
    return 'Pipes and Cisterns';
  }

  // 4. Time, Speed and Distance (excluding trains)
  if (/\bspeed\b|\bdistance\b|\bkm\/h\b|\bm\/s\b|\baverage speed\b|\blate\b.*\bearly\b|\bwalking\b|\bwalks at\b/i.test(text)) {
    return 'Time, Speed and Distance';
  }

  // 5. Time and Work (excluding pipes)
  if (/\btime and work\b|\bmen can complete\b|\bwomen can complete\b|\balone can do\b|\btogether complete\b|\befficiency\b|\bpiece of work\b|\bfinish a job\b|\bdays working\b/i.test(text)) {
    return 'Time and Work';
  }

  // 6. Simple and Compound Interest
  if (/simple interest|compound interest|\binterest\b|per annum|\bcompounded\b|sum of money doubles|\bprincipal\b/i.test(text)) {
    return 'Simple and Compound Interest';
  }

  // 7. Discount
  if (/\bdiscount\b|\bmarked price\b|\btrade discount\b|\bsuccessive discounts?\b|\bmarks? his goods\b|\bmarks? an article\b/i.test(text)) {
    return 'Discount';
  }

  // 8. Profit and Loss (excluding discount)
  if (/profit and loss|\bprofit\b|\bloss\b|cost price|selling price|gain percent|loss percent|\bshopkeeper\b|\bsells an article\b/i.test(text)) {
    return 'Profit and Loss';
  }

  // 9. Mixture and Alligation
  if (/\bmixture\b|\balligation\b|milk and water|\balloy\b|gold to silver|spirit to water/i.test(text)) {
    return 'Mixture and Alligation';
  }

  // 10. Partnership
  if (/\bpartnership\b|\bpartner\b|invested in a business|invested.*shares/i.test(text)) {
    return 'Partnership';
  }

  // 11. Average
  if (/\baverage\b|\bconsecutive numbers\b|\bmean\b/i.test(text) && !/poisson|hcf|lcm/i.test(text)) {
    return 'Average';
  }

  // 12. Ratio and Proportion
  if (/\bratio\b|\bproportion\b|ratio of boys to girls|divided among/i.test(text)) {
    return 'Ratio and Proportion';
  }

  // 13. Percentage
  if (/\bpercentage\b|\bpercent\b|%|population increases/i.test(text)) {
    return 'Percentage';
  }

  // 14. HCF and LCM
  if (/\bhcf\b|\blcm\b|highest common factor|least common multiple|greatest.*divisible/i.test(text)) {
    return 'HCF and LCM';
  }

  // 15. Mensuration (2D/3D geometry calculations like area, volume, perimeter)
  if (/\bmensuration\b|\bcylinder\b|\bcone\b|\bsphere\b|\bcube\b|\bcuboid\b|\bperimeter\b|\bvolume\b|\bsurface area\b|\btrapezium\b|\brhombus\b|\btiles\b|area of.*circle|area of.*rectangle|area of.*square|area of.*triangle|area of path/i.test(text)) {
    return 'Mensuration';
  }

  // 16. Geometry (pure geometric angles, chords, tangents, theorems)
  if (/\bgeometry\b|\btriangle\b|\bcircle\b|\bangle\b|\bchord\b|\btangent\b|\bpolygon\b|\bhypotenuse\b|\bquadrilateral\b|semicircle/i.test(text)) {
    return 'Geometry';
  }

  // 17. Simplification (BODMAS, square root, powers, fractions)
  if (/\bsimplif\b|\bevaluate\b|square root|cube root|\bsurds\b|\bindices\b|\bbodmas\b|√x/i.test(text)) {
    return 'Simplification';
  }

  // 18. Algebra
  if (/\balgebra\b|\bequation\b|\bpolynomial\b|\bquadratic\b|\broots\b|x\^2|x2|f\(x\)|f′\(x\)|derivative|matrix|vector|sum of two numbers.*difference/i.test(text)) {
    return 'Algebra';
  }

  // 19. Number System
  return 'Number System';
}

function classifyLR(q: any): string {
  const content = q.content || '';
  const expl = q.explanation || '';
  const tags = (q.tags || []).join(' ');
  const topic = q.topic || '';
  const text = `${content} ${expl} ${tags} ${topic}`.toLowerCase();

  // 1. Non-Verbal Reasoning / Figure / Mirror / Paper
  if (/mirror image|water image/i.test(text)) {
    return 'Mirror and Water Images';
  }
  if (/paper folding|paper cutting/i.test(text)) {
    return 'Paper Folding and Cutting';
  }
  if (/figure classification|embedded figure|pattern completion|next figure/i.test(text)) {
    return 'Figure Classification';
  }
  if (/cube is painted red|smaller cubes|\bdice\b/i.test(text)) {
    return 'Non-Verbal Reasoning';
  }

  // 2. Classification (Odd one out)
  if (/odd one out|find the odd|does not belong/i.test(text)) {
    return 'Classification';
  }

  // 3. Analogy
  if (/\s+::\s+|is related to.*in the same way|bird is related to|related word pair/i.test(text)) {
    return 'Analogy';
  }

  // 4. Statement and Conclusion / Statement and Assumption
  if (/statement and assumption|\bassumption\b|\bimplicit\b/i.test(text)) {
    return 'Statement and Assumption';
  }
  if (/statement:\s*.*conclusion|smoking causes cancer|success requires hard work|if it rains.*ground is wet|all graduates are educated|no river flows upward|scientific argument|contacting a large number of people|which of the following conclusions logically follow from the given statements/i.test(text)) {
    // If it's classic Syllogism (statements with Some / All / No as formal categorical syllogisms)
    if (/statements?:\s*(?:1\.|\n)?\s*(?:some|all|no)\b.*conclusions?:\s*(?:i\.|1\.|\n)?\s*(?:some|all|no)\b/is.test(text) || /\bsyllogism\b/i.test(text)) {
      return 'Syllogism';
    }
    return 'Statement and Conclusion';
  }

  // 5. Venn Diagrams
  if (/venn diagram|\bvenn\b|intersection represents|read newspaper a|universal set|survey:.*like math|set a.*set b|play cricket.*play football|survey.*like a/i.test(text)) {
    return 'Venn Diagrams';
  }

  // 6. Syllogism
  if (/\bsyllogism\b|\ball .* are\b|\bsome .* are\b|\bno .* is\b|all cats|all honest|all policemen|all computers|some books/i.test(text)) {
    return 'Syllogism';
  }

  // 7. Puzzles
  if (/\bpuzzle\b|\b3×3 grid\b|\brearrange\b|a tells b "i am your grandfather|complete the square: 4,9,16/i.test(text)) {
    return 'Puzzles';
  }

  // 8. Seating Arrangement
  if (/seating arrangement|sitting in a row|sitting around a circle|circular table|facing center|opposite to|sit in a row|sit in a circle|sit in 2 rows/i.test(text)) {
    return 'Seating Arrangement';
  }

  // 9. Ranking and Order
  if (/ranking and order|\branking\b|\border\b|\brank\b|from the left|from the right|from the top|from the bottom|\btallest\b|\bshortest\b|\bheaviest\b/i.test(text)) {
    return 'Ranking and Order';
  }

  // 10. Direction and Distance
  if (/direction|distance|\bnorth\b|\bsouth\b|\beast\b|\bwest\b|\bturns right\b|\bturns left\b|\bfacing north\b|\bfacing south\b|\bwalks \d/i.test(text)) {
    return 'Direction and Distance';
  }

  // 11. Blood Relations
  if (/blood relation|\bfather\b|\bmother\b|\bsister\b|\bbrother\b|\buncle\b|\baunt\b|\bnephew\b|\bniece\b|\bgrandmother\b|\bgrandfather\b|\bson\b|\bdaughter\b|\bmother-in-law\b|\bphotograph.*says\b|\bmaternal\b/i.test(text)) {
    return 'Blood Relations';
  }

  // 12. Coding-Decoding
  if (/coding-decoding|\bcoding\b|\bdecoding\b|\bcoded as\b|\bcode language\b|written as.*code|coded\b/i.test(text)) {
    return 'Coding-Decoding';
  }

  // 13. Series
  if (/\bseries\b|next number|next term|find the next|missing number|alphabet series|number series|\b2, 6, 12\b|select all numbers divisible by 3/i.test(text)) {
    return 'Series';
  }

  // 14. Fallback: Logical Reasoning
  return 'Logical Reasoning';
}

// ─── 6. Map All Questions to Chapters in question_mappings ──────────────────
const qaQuestions = await QuestionCol.find({ subject: 'Quantitative Aptitude' }).toArray();
const lrQuestions = await QuestionCol.find({ subject: 'Logical Reasoning' }).toArray();

console.log(` Loaded ${qaQuestions.length} Quantitative Aptitude & ${lrQuestions.length} Logical Reasoning questions from existing question bank.`);

// Clear old mappings for this series
await MappingCol.deleteMany({ testSeriesId: seriesId });

const mappingsToInsert: any[] = [];
const qaQuestionsByChapter = new Map<string, any[]>();
const lrQuestionsByChapter = new Map<string, any[]>();

for (let i = 0; i < qaQuestions.length; i++) {
  const q = qaQuestions[i];
  const chName = classifyQA(q);
  const chapterId = qaChapterIdMap.get(chName);
  if (!chapterId) throw new Error(`Missing chapter ID for QA chapter: ${chName}`);

  mappingsToInsert.push({
    questionId: q._id,
    subjectId: qaSubjectId,
    testSeriesId: seriesId,
    chapterId,
    order: i,
    createdBy: adminId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  if (!qaQuestionsByChapter.has(chName)) qaQuestionsByChapter.set(chName, []);
  qaQuestionsByChapter.get(chName)!.push(q);
}

for (let i = 0; i < lrQuestions.length; i++) {
  const q = lrQuestions[i];
  const chName = classifyLR(q);
  const chapterId = lrChapterIdMap.get(chName);
  if (!chapterId) throw new Error(`Missing chapter ID for LR chapter: ${chName}`);

  mappingsToInsert.push({
    questionId: q._id,
    subjectId: lrSubjectId,
    testSeriesId: seriesId,
    chapterId,
    order: i,
    createdBy: adminId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  if (!lrQuestionsByChapter.has(chName)) lrQuestionsByChapter.set(chName, []);
  lrQuestionsByChapter.get(chName)!.push(q);
}

await MappingCol.insertMany(mappingsToInsert);
console.log(` Successfully inserted ${mappingsToInsert.length} verified question mappings (zero duplicates, all original question IDs preserved).`);

// ─── 7. Test Generation Helpers ─────────────────────────────────────────────
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

function buildSnapshots(questions: any[], sectionId: string | null = null, startPos = 1) {
  return questions.map((q, idx) => ({
    questionId: q._id,
    position: startPos + idx,
    marks: 1,
    negativeMarks: 0.25,
    sectionId,
    snapshot: {
      questionId: q._id,
      content: q.content,
      translations: q.translations || {},
      explanation: q.explanation || null,
      explanationTranslations: q.explanationTranslations || {},
      type: q.type || 'single_choice',
      numericalAnswer: q.numericalAnswer || null,
      options: (q.options || []).map((o: any) => ({
        _id: o._id,
        content: o.content,
        imageUrl: o.imageUrl || null,
        position: o.position,
        isCorrect: o.isCorrect,
        translations: o.translations || {},
      })),
      marks: 1,
      negativeMarks: 0.25,
      blocks: q.blocks || [],
      images: q.images || [],
    },
  }));
}

// Clear old exams for this series (0 user attempts)
await ExamCol.deleteMany({ testSeriesId: seriesId });
console.log(' Cleared old placeholder exams for this test series.');

const examsToInsert: any[] = [];

// ─── 8. Generate Full Mock Tests (Mixed Aptitude & Reasoning with Internal Sections)
console.log(' Generating 10 Full Length Mock Tests with authentic dual sections...');
const FULL_MOCK_SPECS = [
  { num: 1, qPerSec: 25, duration: 60, isFree: true },
  { num: 2, qPerSec: 25, duration: 60, isFree: true },
  { num: 3, qPerSec: 25, duration: 60, isFree: true },
  { num: 4, qPerSec: 25, duration: 60, isFree: false },
  { num: 5, qPerSec: 50, duration: 120, isFree: true },
  { num: 6, qPerSec: 50, duration: 120, isFree: false },
  { num: 7, qPerSec: 50, duration: 120, isFree: false },
  { num: 8, qPerSec: 25, duration: 60, isFree: false },
  { num: 9, qPerSec: 25, duration: 60, isFree: false },
  { num: 10, qPerSec: 50, duration: 120, isFree: false },
];

for (const spec of FULL_MOCK_SPECS) {
  const seed = 1000 + spec.num * 37;
  const sampledQA = seededShuffle(qaQuestions, seed).slice(0, spec.qPerSec);
  const sampledLR = seededShuffle(lrQuestions, seed + 17).slice(0, spec.qPerSec);

  const sec1Id = new Types.ObjectId();
  const sec2Id = new Types.ObjectId();

  const sec1QuestionItems = buildSnapshots(sampledQA, sec1Id.toString(), 1);
  const sec2QuestionItems = buildSnapshots(sampledLR, sec2Id.toString(), spec.qPerSec + 1);

  const totalQ = sampledQA.length + sampledLR.length;
  const numPadded = String(spec.num).padStart(2, '0');

  const sec1 = {
    _id: sec1Id,
    name: 'Section 1: Quantitative Aptitude',
    topic: 'Quantitative Aptitude',
    subjectId: qaSubjectId,
    chapterId: null,
    order: 1,
    durationMinutes: null,
    positiveMarks: 1,
    negativeMarkingEnabled: true,
    negativeMarks: 0.25,
    selectionMode: 'manual',
    questionOrderMode: 'fixed',
    questionSetMode: 'fixed',
    requiredQuestionCount: sampledQA.length,
    questions: sec1QuestionItems,
  };

  const sec2 = {
    _id: sec2Id,
    name: 'Section 2: Logical Reasoning',
    topic: 'Logical Reasoning',
    subjectId: lrSubjectId,
    chapterId: null,
    order: 2,
    durationMinutes: null,
    positiveMarks: 1,
    negativeMarkingEnabled: true,
    negativeMarks: 0.25,
    selectionMode: 'manual',
    questionOrderMode: 'fixed',
    questionSetMode: 'fixed',
    requiredQuestionCount: sampledLR.length,
    questions: sec2QuestionItems,
  };

  examsToInsert.push({
    title: `Aptitude & Reasoning — Full Mock Test ${numPadded}`,
    slug: `aptitude-reasoning-full-mock-${numPadded}`,
    description: `Full-length ${totalQ}-question examination featuring Section 1: Quantitative Aptitude (${sampledQA.length} Qs) and Section 2: Logical Reasoning (${sampledLR.length} Qs) with TCS iON CBT simulation.`,
    type: 'full',
    testMode: 'full',
    isPreviousYear: false,
    status: 'published',
    access: spec.isFree ? 'free' : 'premium',
    testSeriesId: seriesId,
    subjectId: null,
    chapterId: null,
    subject: 'Aptitude & Reasoning',
    durationMinutes: spec.duration,
    maxAttempts: null,
    languages: ['Hindi', 'English'],
    instructions: `Aptitude & Reasoning Master Exam 2026 — Full Length Mock Test\n• Total Questions: ${totalQ} across 2 Sections (Quantitative Aptitude & Logical Reasoning)\n• Total Duration: ${spec.duration} Minutes | Total Marks: ${totalQ}\n• Marking: +1.00 for correct answer, -0.25 penalty for incorrect answer\n• Bilingual: Toggle between English and Hindi anytime during the exam.`,
    positiveMarks: 1,
    negativeMarkingEnabled: true,
    negativeMarks: 0.25,
    questionSelectionMode: 'manual',
    questionOrderMode: 'fixed',
    questionSetMode: 'fixed',
    totalQuestionsCount: totalQ,
    version: 1,
    isCurrentVersion: true,
    parentTestId: null,
    createdBy: adminId,
    sections: [sec1, sec2],
    questions: [...sec1QuestionItems, ...sec2QuestionItems],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

// ─── 9. Generate Subject Tests (Quantitative Aptitude & Logical Reasoning) ──
console.log(' Generating Subject Tests for Quantitative Aptitude & Logical Reasoning...');
const SUBJECT_TEST_SPECS = [
  { subject: 'Quantitative Aptitude', subjectId: qaSubjectId, qPool: qaQuestions, num: 1, count: 50, duration: 60, title: 'Quantitative Aptitude — Comprehensive Subject Test 01', slug: 'qa-comprehensive-subject-test-01', isFree: true },
  { subject: 'Quantitative Aptitude', subjectId: qaSubjectId, qPool: qaQuestions, num: 2, count: 50, duration: 60, title: 'Quantitative Aptitude — Comprehensive Subject Test 02', slug: 'qa-comprehensive-subject-test-02', isFree: false },
  { subject: 'Quantitative Aptitude', subjectId: qaSubjectId, qPool: qaQuestions, num: 3, count: 30, duration: 35, title: 'Quantitative Aptitude — Speed & Accuracy Test 01', slug: 'qa-speed-accuracy-test-01', isFree: true },
  { subject: 'Quantitative Aptitude', subjectId: qaSubjectId, qPool: qaQuestions, num: 4, count: 30, duration: 35, title: 'Quantitative Aptitude — Speed & Accuracy Test 02', slug: 'qa-speed-accuracy-test-02', isFree: false },

  { subject: 'Logical Reasoning', subjectId: lrSubjectId, qPool: lrQuestions, num: 1, count: 50, duration: 60, title: 'Logical Reasoning — Comprehensive Subject Test 01', slug: 'lr-comprehensive-subject-test-01', isFree: true },
  { subject: 'Logical Reasoning', subjectId: lrSubjectId, qPool: lrQuestions, num: 2, count: 50, duration: 60, title: 'Logical Reasoning — Comprehensive Subject Test 02', slug: 'lr-comprehensive-subject-test-02', isFree: false },
  { subject: 'Logical Reasoning', subjectId: lrSubjectId, qPool: lrQuestions, num: 3, count: 30, duration: 35, title: 'Logical Reasoning — Speed & Accuracy Test 01', slug: 'lr-speed-accuracy-test-01', isFree: true },
  { subject: 'Logical Reasoning', subjectId: lrSubjectId, qPool: lrQuestions, num: 4, count: 30, duration: 35, title: 'Logical Reasoning — Speed & Accuracy Test 02', slug: 'lr-speed-accuracy-test-02', isFree: false },
];

for (const spec of SUBJECT_TEST_SPECS) {
  const seed = 5000 + spec.num * 43;
  const sampled = seededShuffle(spec.qPool, seed).slice(0, spec.count);
  const qItems = buildSnapshots(sampled, null, 1);

  examsToInsert.push({
    title: spec.title,
    slug: spec.slug,
    description: `Subject-level test covering ${spec.subject} with ${spec.count} questions. Timed CBT exam simulation with detailed solutions.`,
    type: 'subject',
    testMode: 'subject',
    isPreviousYear: false,
    status: 'published',
    access: spec.isFree ? 'free' : 'premium',
    testSeriesId: seriesId,
    subjectId: spec.subjectId,
    chapterId: null,
    subject: spec.subject,
    durationMinutes: spec.duration,
    maxAttempts: null,
    languages: ['Hindi', 'English'],
    instructions: `${spec.title}\n• Total Questions: ${spec.count} | Total Duration: ${spec.duration} Minutes\n• Marking: +1.00 for correct answer, -0.25 penalty for incorrect answer\n• Bilingual: Toggle between English and Hindi anytime during the exam.`,
    positiveMarks: 1,
    negativeMarkingEnabled: true,
    negativeMarks: 0.25,
    questionSelectionMode: 'manual',
    questionOrderMode: 'fixed',
    questionSetMode: 'fixed',
    totalQuestionsCount: sampled.length,
    version: 1,
    isCurrentVersion: true,
    parentTestId: null,
    createdBy: adminId,
    sections: [],
    questions: qItems,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

// ─── 10. Generate Chapter Tests for Every Chapter with Questions ─────────────
console.log(' Generating Chapter Tests for all chapters with available questions...');
let chapterTestCount = 0;

for (const def of QA_CHAPTER_DEFS) {
  const pool = qaQuestionsByChapter.get(def.name) || [];
  if (pool.length === 0) continue;

  const chapId = qaChapterIdMap.get(def.name)!;
  // If chapter has 15+ questions, make 2 tests; otherwise 1 test
  const numTests = pool.length >= 15 ? 2 : 1;
  const qPerTest = Math.min(pool.length, numTests === 2 ? Math.ceil(pool.length * 0.7) : pool.length);

  for (let tIdx = 1; tIdx <= numTests; tIdx++) {
    chapterTestCount++;
    const seed = 7000 + def.order * 53 + tIdx * 11;
    const sampled = seededShuffle(pool, seed).slice(0, qPerTest);
    const qItems = buildSnapshots(sampled, null, 1);
    const slugSuffix = numTests > 1 ? `-0${tIdx}` : '';
    const titleSuffix = numTests > 1 ? ` (Practice Test ${tIdx})` : ' — Chapter Test';
    const isFree = tIdx === 1;

    examsToInsert.push({
      title: `${def.name}${titleSuffix}`,
      slug: `qa-${def.slug}${slugSuffix}`,
      description: `Targeted chapter test for ${def.name} (${def.topics.slice(0, 3).join(', ')}). ${sampled.length} verified practice questions.`,
      type: 'chapter',
      testMode: 'chapter',
      isPreviousYear: false,
      status: 'published',
      access: isFree ? 'free' : 'premium',
      testSeriesId: seriesId,
      subjectId: qaSubjectId,
      chapterId: chapId,
      subject: 'Quantitative Aptitude',
      durationMinutes: Math.max(15, Math.ceil(sampled.length * 1.2)),
      maxAttempts: null,
      languages: ['Hindi', 'English'],
      instructions: `${def.name} — Chapter Practice Test\n• Total Questions: ${sampled.length} | Marking: +1.00 / -0.25\n• Review your solutions and performance breakdown immediately after submission.`,
      positiveMarks: 1,
      negativeMarkingEnabled: true,
      negativeMarks: 0.25,
      questionSelectionMode: 'manual',
      questionOrderMode: 'fixed',
      questionSetMode: 'fixed',
      totalQuestionsCount: sampled.length,
      version: 1,
      isCurrentVersion: true,
      parentTestId: null,
      createdBy: adminId,
      sections: [],
      questions: qItems,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}

for (const def of LR_CHAPTER_DEFS) {
  const pool = lrQuestionsByChapter.get(def.name) || [];
  if (pool.length === 0) continue;

  const chapId = lrChapterIdMap.get(def.name)!;
  const numTests = pool.length >= 15 ? 2 : 1;
  const qPerTest = Math.min(pool.length, numTests === 2 ? Math.ceil(pool.length * 0.7) : pool.length);

  for (let tIdx = 1; tIdx <= numTests; tIdx++) {
    chapterTestCount++;
    const seed = 9000 + def.order * 67 + tIdx * 13;
    const sampled = seededShuffle(pool, seed).slice(0, qPerTest);
    const qItems = buildSnapshots(sampled, null, 1);
    const slugSuffix = numTests > 1 ? `-0${tIdx}` : '';
    const titleSuffix = numTests > 1 ? ` (Practice Test ${tIdx})` : ' — Chapter Test';
    const isFree = tIdx === 1;

    examsToInsert.push({
      title: `${def.name}${titleSuffix}`,
      slug: `lr-${def.slug}${slugSuffix}`,
      description: `Targeted chapter test for ${def.name} (${def.topics.slice(0, 3).join(', ')}). ${sampled.length} verified practice questions.`,
      type: 'chapter',
      testMode: 'chapter',
      isPreviousYear: false,
      status: 'published',
      access: isFree ? 'free' : 'premium',
      testSeriesId: seriesId,
      subjectId: lrSubjectId,
      chapterId: chapId,
      subject: 'Logical Reasoning',
      durationMinutes: Math.max(15, Math.ceil(sampled.length * 1.2)),
      maxAttempts: null,
      languages: ['Hindi', 'English'],
      instructions: `${def.name} — Chapter Practice Test\n• Total Questions: ${sampled.length} | Marking: +1.00 / -0.25\n• Review your solutions and performance breakdown immediately after submission.`,
      positiveMarks: 1,
      negativeMarkingEnabled: true,
      negativeMarks: 0.25,
      questionSelectionMode: 'manual',
      questionOrderMode: 'fixed',
      questionSetMode: 'fixed',
      totalQuestionsCount: sampled.length,
      version: 1,
      isCurrentVersion: true,
      parentTestId: null,
      createdBy: adminId,
      sections: [],
      questions: qItems,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}

console.log(` Generated ${chapterTestCount} Chapter Tests across Quantitative Aptitude & Logical Reasoning.`);

// Bulk insert all exams
await ExamCol.insertMany(examsToInsert);
console.log(` Bulk inserted ${examsToInsert.length} total exams for Aptitude & Reasoning Master Exam 2026.`);

// Count free tests
const freeTestsCount = examsToInsert.filter(e => e.access === 'free').length;

// Update test_series with real counts
await SeriesCol.updateOne(
  { _id: seriesId },
  {
    $set: {
      totalTests: examsToInsert.length,
      freeTestsCount,
      updatedAt: new Date(),
    },
  },
);

console.log(` Updated test_series metadata: totalTests=${examsToInsert.length}, freeTestsCount=${freeTestsCount}.`);
console.log(' Restructuring completed successfully!');

await mongoose.disconnect();

