export type StateOption =
  | 'All India'
  | 'Bihar'
  | 'Uttar Pradesh'
  | 'Rajasthan'
  | 'Madhya Pradesh'
  | 'Delhi'
  | 'Maharashtra';

export type CategoryOption =
  | 'All Categories'
  | 'Admission & Counselling'
  | 'Latest Jobs'
  | 'Admit Card'
  | 'Result'
  | 'Answer Key'
  | 'Syllabus';

export interface ExamPost {
  id: string;
  title: string;
  slug: string;
  category: CategoryOption | string;
  state: StateOption;
  status: 'Published' | 'Draft';
  postDate: string;
  updatedDate: string;
  summary: string;
  views: number;
  featured?: boolean;
}

export const STATES_LIST: StateOption[] = [
  'All India',
  'Bihar',
  'Uttar Pradesh',
  'Rajasthan',
  'Madhya Pradesh',
  'Delhi',
  'Maharashtra',
];

export const CATEGORIES_LIST: { id: string; name: string; count: number }[] = [
  { id: 'all', name: 'All Categories', count: 18 },
  { id: 'admission', name: 'Admission & Counselling', count: 4 },
  { id: 'jobs', name: 'Latest Jobs', count: 5 },
  { id: 'admit-card', name: 'Admit Card', count: 3 },
  { id: 'result', name: 'Result', count: 4 },
  { id: 'answer-key', name: 'Answer Key', count: 2 },
];

export const INITIAL_MOCK_POSTS: ExamPost[] = [
  {
    id: 'post-1',
    title: 'Bihar DECE LE Seat Allotment Result 2026: 1st Round Letter Download Link',
    slug: 'bihar-dece-le-seat-allotment-2026',
    category: 'Admission & Counselling',
    state: 'Bihar',
    status: 'Published',
    postDate: '12 Oct 2026',
    updatedDate: '12 Oct 2026',
    summary: 'BCECEB has announced Round 1 Seat Allotment Result for Lateral Entry Polytechnic admissions. Download letter & check reporting center.',
    views: 4520,
    featured: true,
  },
  {
    id: 'post-2',
    title: 'Bihar ITICAT 2026 2nd Round Seat Allotment Order Out - Direct Link',
    slug: 'bihar-iticat-2nd-round-allotment-2026',
    category: 'Admission & Counselling',
    state: 'Bihar',
    status: 'Published',
    postDate: '10 Oct 2026',
    updatedDate: '11 Oct 2026',
    summary: 'BCECEB ITI Counselling Round 2 seat allotment published. Check rank wise trade allotment list.',
    views: 2940,
  },
  {
    id: 'post-3',
    title: 'UP Police Constable 60244 Vacancy Final Result & Merit List 2026 PDF',
    slug: 'up-police-constable-final-result-2026',
    category: 'Result',
    state: 'Uttar Pradesh',
    status: 'Published',
    postDate: '09 Oct 2026',
    updatedDate: '10 Oct 2026',
    summary: 'UPPRPB releases Constable written exam qualified candidate list for DV/PST stage.',
    views: 8910,
    featured: true,
  },
  {
    id: 'post-4',
    title: 'UPSSSC PET 2026 Admit Card Released: Download Exam Hall Ticket',
    slug: 'upsssc-pet-admit-card-2026',
    category: 'Admit Card',
    state: 'Uttar Pradesh',
    status: 'Published',
    postDate: '08 Oct 2026',
    updatedDate: '09 Oct 2026',
    summary: 'Download UPSSSC Preliminary Eligibility Test hall ticket using registration number and date of birth.',
    views: 6120,
  },
  {
    id: 'post-5',
    title: 'Rajasthan RSMSSB CET Graduate Level 2026 Answer Key & Objection Link',
    slug: 'rajasthan-cet-answer-key-2026',
    category: 'Answer Key',
    state: 'Rajasthan',
    status: 'Published',
    postDate: '07 Oct 2026',
    updatedDate: '08 Oct 2026',
    summary: 'Official provisional answer key released for Rajasthan Common Eligibility Test Graduate Level.',
    views: 3410,
  },
  {
    id: 'post-6',
    title: 'Rajasthan Police Constable 2026 Physical Efficiency Test (PET) Admit Card',
    slug: 'rajasthan-police-constable-pet-admit-card-2026',
    category: 'Admit Card',
    state: 'Rajasthan',
    status: 'Draft',
    postDate: '06 Oct 2026',
    updatedDate: '06 Oct 2026',
    summary: 'Police Headquarters Rajasthan releases physical test venue details and dates.',
    views: 1100,
  },
  {
    id: 'post-7',
    title: 'MPESB MP Police Constable Result 2026 Cutoff Marks & Scorecard',
    slug: 'mp-police-constable-result-cutoff-2026',
    category: 'Result',
    state: 'Madhya Pradesh',
    status: 'Published',
    postDate: '05 Oct 2026',
    updatedDate: '06 Oct 2026',
    summary: 'MP Employees Selection Board announces stage-1 written examination normalized scores.',
    views: 4200,
  },
  {
    id: 'post-8',
    title: 'MP Patwari 2026 Document Verification Schedule & List of Centers',
    slug: 'mp-patwari-document-verification-2026',
    category: 'Admission & Counselling',
    state: 'Madhya Pradesh',
    status: 'Draft',
    postDate: '04 Oct 2026',
    updatedDate: '04 Oct 2026',
    summary: 'District-wise counseling and verification dates for shortlisted Patwari candidates.',
    views: 870,
  },
  {
    id: 'post-9',
    title: 'DSSSB Various Teaching & Non-Teaching Posts Recruitment 2026 Online Form',
    slug: 'dsssb-recruitment-online-form-2026',
    category: 'Latest Jobs',
    state: 'Delhi',
    status: 'Published',
    postDate: '04 Oct 2026',
    updatedDate: '05 Oct 2026',
    summary: 'Delhi Subordinate Services Selection Board invites online applications for 4,200+ vacancies.',
    views: 5400,
  },
  {
    id: 'post-10',
    title: 'Maharashtra Police Bharti 2026 Written Exam Hall Ticket Direct Link',
    slug: 'maharashtra-police-bharti-hall-ticket-2026',
    category: 'Admit Card',
    state: 'Maharashtra',
    status: 'Published',
    postDate: '03 Oct 2026',
    updatedDate: '04 Oct 2026',
    summary: 'State police department issues district-wise exam hall tickets for constable posts.',
    views: 3950,
  },
  {
    id: 'post-11',
    title: 'MPSC Rajyaseva Prelims 2026 Official Answer Key & Cut Off Marks',
    slug: 'mpsc-rajyaseva-prelims-answer-key-2026',
    category: 'Answer Key',
    state: 'Maharashtra',
    status: 'Published',
    postDate: '02 Oct 2026',
    updatedDate: '03 Oct 2026',
    summary: 'Maharashtra Public Service Commission issues paper 1 and paper 2 answer key PDF.',
    views: 2890,
  },
  {
    id: 'post-12',
    title: 'SSC GD Constable 2026 Notification: 39,481 Posts, Eligibility & Online Form',
    slug: 'ssc-gd-constable-notification-2026',
    category: 'Latest Jobs',
    state: 'All India',
    status: 'Published',
    postDate: '01 Oct 2026',
    updatedDate: '02 Oct 2026',
    summary: 'Staff Selection Commission announces 39k+ Constable (GD) posts in CAPFs, SSF, and Assam Rifles.',
    views: 12400,
    featured: true,
  },
  {
    id: 'post-13',
    title: 'RRB NTPC 2026 Recruitment: 11,558 Posts Apply Online Link Activated',
    slug: 'rrb-ntpc-recruitment-online-form-2026',
    category: 'Latest Jobs',
    state: 'All India',
    status: 'Published',
    postDate: '30 Sep 2026',
    updatedDate: '01 Oct 2026',
    summary: 'Railway Recruitment Boards invite applications for Graduate & Undergraduate NTPC posts.',
    views: 15300,
    featured: true,
  },
  {
    id: 'post-14',
    title: 'IBPS PO 2026 Mains Exam Admit Card Download Link Live',
    slug: 'ibps-po-mains-admit-card-2026',
    category: 'Admit Card',
    state: 'All India',
    status: 'Published',
    postDate: '29 Sep 2026',
    updatedDate: '30 Sep 2026',
    summary: 'Institute of Banking Personnel Selection releases call letters for Probationary Officer mains exam.',
    views: 4800,
  },
  {
    id: 'post-15',
    title: 'UPSC Civil Services Prelims 2026 Detailed Notification & Syllabus',
    slug: 'upsc-civil-services-prelims-2026',
    category: 'Latest Jobs',
    state: 'All India',
    status: 'Draft',
    postDate: '28 Sep 2026',
    updatedDate: '28 Sep 2026',
    summary: 'Union Public Service Commission civil services examination notification guidelines draft.',
    views: 3100,
  }
];
