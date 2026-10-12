export interface ArticleData {
  title: string;
  slug: string;
  category: {
    name: string;
    url: string;
  };
  postDate: string;
  updatedDate: string;
  author: string;
  readTime: string;
  summary: string;
  noticeNumber: string;
  organization: string;
  totalVacancies: string;
  applicationMode: string;
  officialWebsite: string;
  importantDates: { event: string; date: string; statusBadge?: string }[];
  applicationFees: { category: string; fee: string }[];
  ageLimit: { criteria: string; details: string }[];
  eligibility: { post: string; qualification: string; vacancies: string }[];
  selectionSteps: string[];
  stepsToApply: string[];
  importantLinks: { title: string; linkText: string; url: string; highlight?: boolean }[];
  faqs: { question: string; answer: string }[];
  relatedArticles: { title: string; date: string; category: string; url: string }[];
}

export const examArticleData: ArticleData = {
  title: "Bihar DECE LE Seat Allotment Result 2026: 1st Round Allotment Letter Download Link & Document Verification Dates",
  slug: "bihar-dece-le-seat-allotment-2026",
  category: {
    name: "Admission & Counselling",
    url: "#"
  },
  postDate: "October 12, 2026",
  updatedDate: "October 12, 2026 - 02:45 PM",
  author: "ExamPortal Team",
  readTime: "5 min read",
  summary: "Bihar Combined Entrance Competitive Examination Board (BCECEB) has officially announced the Round 1 Seat Allotment Result for DECE [LE] 2026 Lateral Entry Polytechnic diploma admissions. Candidates who filled choices during online counselling can now check their allotment status, download the provisional allotment order, and complete document verification.",
  noticeNumber: "BCECEB(DECE-LE)-2026/08",
  organization: "Bihar Combined Entrance Competitive Examination Board (BCECEB)",
  totalVacancies: "Lateral Entry Seats (Govt. & Private Polytechnics)",
  applicationMode: "Online Download / Offline Verification",
  officialWebsite: "https://bceceboard.bihar.gov.in",
  
  importantDates: [
    { event: "Round 1 Choice Filling Closes", date: "08 October 2026", statusBadge: "Completed" },
    { event: "Round 1 Provisional Seat Allotment Result", date: "12 October 2026", statusBadge: "Released Now" },
    { event: "Download Allotment Order (Round 1)", date: "12 Oct to 16 Oct 2026", statusBadge: "Active" },
    { event: "Document Verification & Admission (Round 1)", date: "13 Oct to 16 Oct 2026", statusBadge: "Upcoming" },
    { event: "Round 2 Seat Allotment Result Publication", date: "21 October 2026", statusBadge: "Upcoming" },
    { event: "Download Allotment Order (Round 2)", date: "21 Oct to 25 Oct 2026", statusBadge: "Upcoming" }
  ],

  applicationFees: [
    { category: "Counseling Registration Fee", fee: "Already Paid during Registration" },
    { category: "Provisional Seat Allotment Download Fee", fee: "Nil (Free of Cost)" },
    { category: "Admission / Institute Verification Fee", fee: "As per allotted Institute norms" }
  ],

  ageLimit: [
    { criteria: "Minimum Age Limit", details: "No minimum age bar prescribed by BCECEB" },
    { criteria: "Maximum Age Limit", details: "No upper age limit for Diploma Lateral Entry" },
    { criteria: "Domicile Requirement", details: "Candidates must satisfy permanent resident criteria of Bihar state" }
  ],

  eligibility: [
    {
      post: "Diploma 2nd Year (Lateral Entry - Engineering Branches)",
      qualification: "Passed 10+2 Examination with Physics, Chemistry and Mathematics OR 10th + 2 years ITI in appropriate trade.",
      vacancies: "Available in All Govt. Polytechnic Colleges"
    },
    {
      post: "Vocational Stream Candidates",
      qualification: "10+2 (Vocational Course) with technical subject qualifications passed from recognized council.",
      vacancies: "Reserved Quota Seats"
    }
  ],

  selectionSteps: [
    "DECE (LE) State Level Entrance Examination Score & Rank Card",
    "Online Choice Filling & Registration by qualified candidates",
    "Provisional Seat Allotment Publication based on Merit-cum-Preference",
    "Physical Reporting at Designated Reporting Center for Document Verification",
    "Final Fee Submission and Admission Confirmation at the Allotted Polytechnic"
  ],

  stepsToApply: [
    "Visit the official website of BCECE Board at bceceboard.bihar.gov.in.",
    "On the homepage, navigate to the 'Online Application Forms' portal.",
    "Click on the link titled 'Download 1st Round Provisional Allotment Order of DECE(LE)-2026'.",
    "A login window will open. Select Stream as 'DECE-LE Counselling 2026'.",
    "Enter your Roll Number, Password, and Security Captcha Code.",
    "Click on Sign In to enter your candidate dashboard.",
    "Click on 'Seat Allotment Result' and review your allotted college and trade.",
    "Choose 'Willingness for Upgradation' (Yes if participating in Round 2, No for final freeze).",
    "Download the 3-page Provisional Allotment Order and take at least 2 clear printouts for verification."
  ],

  importantLinks: [
    {
      title: "Round 1 Seat Allotment Order Download (Link 1)",
      linkText: "Click Here to Download Allotment",
      url: "https://bceceboard.bihar.gov.in",
      highlight: true
    },
    {
      title: "Official Counselling Schedule & Notice PDF",
      linkText: "Download Schedule PDF",
      url: "https://bceceboard.bihar.gov.in"
    },
    {
      title: "DECE (LE) Rank Card Download",
      linkText: "Download Rank Card",
      url: "https://bceceboard.bihar.gov.in"
    },
    {
      title: "Document Verification Reporting Centers List",
      linkText: "View Centers List",
      url: "https://bceceboard.bihar.gov.in"
    },
    {
      title: "Official BCECEB Website",
      linkText: "Visit Official Portal",
      url: "https://bceceboard.bihar.gov.in"
    }
  ],

  faqs: [
    {
      question: "When was Bihar DECE LE Round 1 Seat Allotment 2026 released?",
      answer: "The Bihar Combined Entrance Competitive Examination Board published the Round 1 Seat Allotment Order on October 12, 2026."
    },
    {
      question: "What is the last date to download the Round 1 allotment letter?",
      answer: "Shortlisted candidates can download their Round 1 allotment letter until October 16, 2026."
    },
    {
      question: "What documents are required for physical verification at the reporting center?",
      answer: "Key documents include original Admit Card of DECE(LE), Rank Card, Provisional Allotment Order (3 copies), 10th & 12th/ITI Marksheets and Certificates, Domicile Certificate, Caste Certificate (if applicable), 6 passport-size photographs, and Aadhaar Card."
    },
    {
      question: "Can I participate in Round 2 if I am not satisfied with the allotted college?",
      answer: "Yes, candidates must choose the 'Auto-Upgradation: YES' option while downloading their Round 1 allotment letter and must still report for document verification in Round 1 to stay eligible for Round 2."
    },
    {
      question: "What is the official website to check BCECE DECE LE counseling updates?",
      answer: "The official website is bceceboard.bihar.gov.in."
    }
  ],

  relatedArticles: [
    {
      title: "Bihar BCECE Engineering Counselling 2026 Dates & Cutoff Marks",
      date: "Oct 10, 2026",
      category: "Admission",
      url: "#"
    },
    {
      title: "Bihar ITICAT 2nd Round Seat Allotment Result 2026 Out - Direct Link",
      date: "Oct 09, 2026",
      category: "Result",
      url: "#"
    },
    {
      title: "Bihar Polytechnic DCECE 2026 1st Round Counselling Schedule",
      date: "Oct 08, 2026",
      category: "Counselling",
      url: "#"
    },
    {
      title: "SSC GD Constable 2026 Notification, Eligibility & Online Form Dates",
      date: "Oct 07, 2026",
      category: "Govt Jobs",
      url: "#"
    }
  ]
};
