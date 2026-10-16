export const whatsappChannel = import.meta.env.PUBLIC_WHATSAPP_URL || 'https://whatsapp.com/channel/0029VbDrCtD2P59lOMdotQ0S';
export const telegramChannel = import.meta.env.PUBLIC_TELEGRAM_URL || 'https://t.me/govtpariksha108';
export const contactEmail = 'awakenstudioss@gmail.com';

export const siteFaqs = [
  {
    question: 'Is govtpariksha.com an official government website?',
    answer:
      'No. govtpariksha.com publishes guides and notices for candidates. Applications, fees, and results are accepted only on the official government or exam portal linked from the article.',
  },
  {
    question: 'Where should I apply for SSC, UPSC, Railway, and bank exams?',
    answer:
      'Use the official portals in the Important links section: SSC, UPSC, RRB, IBPS, NTA, and the state board named in the notice. Do not upload documents on a third-party site.',
  },
  {
    question: 'How do I get new notice alerts?',
    answer:
      'Join the WhatsApp channel and the Telegram channel from this page. Alerts are a convenience. Confirm every date on the official PDF before you apply or pay a fee.',
  },
  {
    question: 'What if a date on an article does not match the official notice?',
    answer:
      'Follow the official notification. Articles are summaries and can lag behind a correction published by the commission.',
  },
  {
    question: 'Does this site conduct the exam or issue admit cards?',
    answer:
      'No. Admit cards, answer keys, and results are issued by the recruiting body. Download them only from the official portal.',
  },
];

export const govPortals = [
  { name: 'National Portal of India', href: 'https://www.india.gov.in/', note: 'Central government services' },
  { name: 'MyGov', href: 'https://www.mygov.in/', note: 'Citizen engagement' },
  { name: 'DigiLocker', href: 'https://www.digilocker.gov.in/', note: 'Official documents' },
  { name: 'UIDAI', href: 'https://www.uidai.gov.in/', note: 'Aadhaar' },
  { name: 'Income Tax', href: 'https://www.incometax.gov.in/', note: 'e-Filing' },
  { name: 'EPFO', href: 'https://www.epfindia.gov.in/', note: 'Provident fund' },
  { name: 'National Career Service', href: 'https://www.ncs.gov.in/', note: 'Employment services' },
];

export const examPortals = [
  { name: 'UPSC', href: 'https://www.upsc.gov.in/', note: 'Civil services' },
  { name: 'SSC', href: 'https://ssc.gov.in/', note: 'Staff Selection Commission' },
  { name: 'RRB', href: 'https://rrb.indianrailways.gov.in/', note: 'Railway recruitment' },
  { name: 'IBPS', href: 'https://www.ibps.in/', note: 'Bank exams' },
  { name: 'SBI Careers', href: 'https://sbi.co.in/web/careers', note: 'State Bank of India' },
  { name: 'NTA', href: 'https://nta.ac.in/', note: 'JEE, NEET, CUET, and other tests' },
  { name: 'CTET', href: 'https://ctet.nic.in/', note: 'Teacher eligibility' },
  { name: 'UGC NET', href: 'https://ugcnet.nta.ac.in/', note: 'National Eligibility Test' },
  { name: 'BCECEB', href: 'https://bceceboard.bihar.gov.in/', note: 'Bihar combined entrance' },
  { name: 'BPSC', href: 'https://bpsc.bihar.gov.in/', note: 'Bihar Public Service Commission' },
];

export const searchItems = [
  ...examPortals.map((portal) => ({
    title: portal.name,
    category: 'exams',
    href: portal.href,
    tag: 'Exam portal',
    icon: '🔗',
  })),
  ...govPortals.map((portal) => ({
    title: portal.name,
    category: 'all',
    href: portal.href,
    tag: 'Gov portal',
    icon: '🏛️',
  })),
  { title: 'Site FAQs', category: 'all', href: '/#faqs', tag: 'Help', icon: '❓' },
  { title: 'Important official links', category: 'all', href: '/#important-links', tag: 'Links', icon: '📌' },
];
