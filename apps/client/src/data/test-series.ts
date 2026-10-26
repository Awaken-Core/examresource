export interface MockExamCard {
  id: string;
  title: string;
  organization: string;
  badge: string;
  access: 'Free Tests' | 'Premium';
  totalTests: number;
  freeTests: number;
  languages: string[];
  description: string;
  category: string; // 'central-government' | 'state-exams' | 'banking' | 'ssc-railways' | 'teaching' | 'defence' | 'others'
  badgeColor?: string;
  logoUrl?: string;
  initials?: string;
  initialBg?: string;
  initialColor?: string;
}

export const mockTestSeriesData: MockExamCard[] = [
  {
    id: 'rrb-ntpc-graduate',
    title: 'RRB NTPC Graduate Level',
    organization: 'Railway Recruitment Board',
    badge: 'Popular',
    access: 'Free Tests',
    totalTests: 50,
    freeTests: 5,
    languages: ['Hindi', 'English'],
    description: 'Complete mock test series for RRB NTPC Graduate level with latest pattern.',
    category: 'ssc-railways',
    badgeColor: 'bg-[#FFF7ED] text-[#EA580C] border-[#FFEDD5]',
    logoUrl: '/rrb-seal.svg',
    initials: 'R',
    initialBg: 'bg-[#E11D48]',
    initialColor: 'text-white',
  },
  {
    id: 'ssc-cgl-tier1-tier2',
    title: 'SSC CGL Tier 1 & Tier 2',
    organization: 'Staff Selection Commission',
    badge: 'Best for Practice',
    access: 'Premium',
    totalTests: 60,
    freeTests: 3,
    languages: ['Hindi', 'English'],
    description: 'Full length mocks, sectionals and previous year papers for SSC CGL.',
    category: 'ssc-railways',
    badgeColor: 'bg-[#EFF6FF] text-[#2563EB] border-[#DBEAFE]',
    logoUrl: '/ssc-seal.svg',
    initials: 'S',
    initialBg: 'bg-[#854D0E]',
    initialColor: 'text-white',
  },
  {
    id: 'ibps-po-complete',
    title: 'IBPS PO Complete Series',
    organization: 'Institute of Banking Personnel Selection',
    badge: 'Trending',
    access: 'Free Tests',
    totalTests: 40,
    freeTests: 5,
    languages: ['Hindi', 'English'],
    description: 'Prelims and Mains mock tests with detailed solutions.',
    category: 'banking',
    badgeColor: 'bg-[#F3E8FF] text-[#9333EA] border-[#E9D5FF]',
    logoUrl: '/ibps-seal.svg',
    initials: 'IBPS',
    initialBg: 'bg-[#1E40AF]',
    initialColor: 'text-white',
  },
  {
    id: 'upsc-civil-services-prelims',
    title: 'UPSC Civil Services (Prelims)',
    organization: 'Union Public Service Commission',
    badge: 'New',
    access: 'Premium',
    totalTests: 30,
    freeTests: 2,
    languages: ['Hindi', 'English'],
    description: 'Current pattern mocks with detailed explanations.',
    category: 'central-government',
    badgeColor: 'bg-[#FDF2F8] text-[#DB2777] border-[#FCE7F3]',
    logoUrl: '/upsc-seal.svg',
    initials: 'U',
    initialBg: 'bg-[#0F172A]',
    initialColor: 'text-[#FBBF24]',
  },
  {
    id: 'rrb-group-d',
    title: 'RRB Group D',
    organization: 'Railway Recruitment Board',
    badge: 'Most Attempted',
    access: 'Free Tests',
    totalTests: 45,
    freeTests: 5,
    languages: ['Hindi', 'English'],
    description: 'Chapter-wise and full mocks for RRB Group D.',
    category: 'ssc-railways',
    badgeColor: 'bg-[#ECFDF5] text-[#059669] border-[#D1FAE5]',
    logoUrl: '/rrb-seal.svg',
    initials: 'R',
    initialBg: 'bg-[#E11D48]',
    initialColor: 'text-white',
  },
  {
    id: 'bihar-bpsc-prelims',
    title: 'Bihar BPSC (Prelims)',
    organization: 'Bihar Public Service Commission',
    badge: 'State Exam',
    access: 'Premium',
    totalTests: 35,
    freeTests: 3,
    languages: ['Hindi', 'English'],
    description: 'Latest pattern tests with subject-wise practice.',
    category: 'state-exams',
    badgeColor: 'bg-[#EFF6FF] text-[#2563EB] border-[#DBEAFE]',
    logoUrl: '/bpsc-seal.svg',
    initials: 'BPSC',
    initialBg: 'bg-[#15803D]',
    initialColor: 'text-white',
  },
];

export const heroStats = [
  { value: '25+', label: 'Exam Categories', icon: 'categories' },
  { value: '1,200+', label: 'Mock Tests', icon: 'tests' },
  { value: '10L+', label: 'Students Practising', icon: 'students' },
  { value: 'Bilingual', label: 'Hindi & English', icon: 'language' },
];

export const featureShortcuts = [
  {
    id: 'mock-tests',
    title: 'Mock Tests',
    description: 'Full length tests like real exam',
    iconBg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400',
    icon: 'doc',
    href: '#popular-test-series',
  },
  {
    id: 'chapter-tests',
    title: 'Chapter Tests',
    description: 'Topic-wise practice tests',
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
    icon: 'list',
    href: '#popular-test-series',
  },
  {
    id: 'ai-generator',
    title: 'AI Test Generator',
    description: 'Create custom tests with AI',
    iconBg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400',
    icon: 'ai',
    href: '#popular-test-series',
  },
  {
    id: 'ai-notes',
    title: 'AI Notes',
    description: 'Get smart notes from tests',
    iconBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
    icon: 'note',
    href: '#popular-test-series',
  },
];
