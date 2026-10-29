import mongoose from 'mongoose';

// Connect to MongoDB from env or localhost
const dbUrl = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/examresource';

const today = new Date().toISOString().slice(0, 10);

const sampleQuiz = {
  date: today,
  title: `Daily Current Affairs & Static GK Capsule · ${today}`,
  category: 'current-affairs',
  description: 'High-yield 5-question daily micro-quiz for SSC CGL, RRB NTPC, and Banking exams.',
  targetExams: ['ssc-cgl', 'rrb-ntpc', 'ibps-po'],
  durationMinutes: 5,
  totalMarks: 5,
  isPublished: true,
  questions: [
    {
      content: {
        en: 'Who has recently been awarded the 2026 Nobel Prize in Economics for research on how institutions are formed and affect prosperity?',
        hi: 'संस्थान कैसे बनते हैं और समृद्धि को कैसे प्रभावित करते हैं, इस पर शोध के लिए हाल ही में अर्थशास्त्र में 2026 के नोबेल पुरस्कार से किसे सम्मानित किया गया है?',
      },
      options: [
        {
          id: 'A',
          text: { en: 'Daron Acemoglu, Simon Johnson, and James A. Robinson', hi: 'डेरॉन ऐसमोग्लू, साइमन जॉनसन और जेम्स ए. रॉबिन्सन' },
          isCorrect: true,
        },
        {
          id: 'B',
          text: { en: 'Claudia Goldin and Ben Bernanke', hi: 'क्लाउडिया गोल्डिन और बेन बर्नानके' },
          isCorrect: false,
        },
        {
          id: 'C',
          text: { en: 'Abhijit Banerjee and Esther Duflo', hi: 'अभिजीत बनर्जी और एस्तेर डुफ्लो' },
          isCorrect: false,
        },
        {
          id: 'D',
          text: { en: 'Paul Milgrom and Robert Wilson', hi: 'पॉल मिलग्रोम और रॉबर्ट विल्सन' },
          isCorrect: false,
        },
      ],
      explanation: {
        en: 'The Royal Swedish Academy of Sciences awarded the Sveriges Riksbank Prize in Economic Sciences in Memory of Alfred Nobel to Daron Acemoglu, Simon Johnson, and James A. Robinson for comparative studies on prosperity differences between nations.',
        hi: 'रॉयल स्वीडिश एकेडमी ऑफ साइंसेज ने राष्ट्रों के बीच समृद्धि के अंतर पर तुलनात्मक अध्ययन के लिए डेरॉन ऐसमोग्लू, साइमन जॉनसन और जेम्स ए. रॉबिन्सन को अर्थशास्त्र का नोबेल पुरस्कार प्रदान किया।',
      },
      examTip: {
        en: 'Exam Shortcut: Remember "AJR" (Acemoglu, Johnson, Robinson) - authors of the landmark book "Why Nations Fail".',
        hi: 'परीक्षा शॉर्टकट: "AJR" (ऐसमोग्लू, जॉनसन, रॉबिन्सन) याद रखें - प्रसिद्ध पुस्तक "Why Nations Fail" के लेखक।',
      },
      marks: 1,
      negativeMarks: 0.25,
    },
    {
      content: {
        en: 'Which Indian state recently launched the "Mukhyamantri Yuva Sambal Yojana 2.0" to provide skill allowances to educated unemployed youth?',
        hi: 'किस भारतीय राज्य ने हाल ही में शिक्षित बेरोजगार युवाओं को कौशल भत्ता प्रदान करने के लिए "मुख्यमंत्री युवा संबल योजना 2.0" शुरू की?',
      },
      options: [
        { id: 'A', text: { en: 'Rajasthan', hi: 'राजस्थान' }, isCorrect: true },
        { id: 'B', text: { en: 'Uttar Pradesh', hi: 'उत्तर प्रदेश' }, isCorrect: false },
        { id: 'C', text: { en: 'Madhya Pradesh', hi: 'मध्य प्रदेश' }, isCorrect: false },
        { id: 'D', text: { en: 'Haryana', hi: 'हरियाणा' }, isCorrect: false },
      ],
      explanation: {
        en: 'Rajasthan upgraded the Yuva Sambal initiative to link skill training directly with stipend disbursement.',
        hi: 'राजस्थान ने कौशल प्रशिक्षण को सीधे वजीफा वितरण से जोड़ने के लिए युवा संबल पहल को अपग्रेड किया।',
      },
      examTip: {
        en: 'State Government welfare schemes are frequently asked in Tier 1 General Awareness.',
        hi: 'राज्य सरकार की कल्याणकारी योजनाएं टीयर 1 सामान्य जागरूकता में अक्सर पूछी जाती हैं।',
      },
      marks: 1,
      negativeMarks: 0.25,
    },
    {
      content: {
        en: 'Under Article 110 of the Indian Constitution, who has the final authority to decide whether a bill is a Money Bill or not?',
        hi: 'भारतीय संविधान के अनुच्छेद 110 के तहत, यह निर्णय लेने का अंतिम अधिकार किसके पास है कि कोई विधेयक धन विधेयक है या नहीं?',
      },
      options: [
        { id: 'A', text: { en: 'Speaker of the Lok Sabha', hi: 'लोकसभा अध्यक्ष' }, isCorrect: true },
        { id: 'B', text: { en: 'President of India', hi: 'भारत के राष्ट्रपति' }, isCorrect: false },
        { id: 'C', text: { en: 'Finance Minister', hi: 'वित्त मंत्री' }, isCorrect: false },
        { id: 'D', text: { en: 'Chairman of Rajya Sabha', hi: 'राज्यसभा के सभापति' }, isCorrect: false },
      ],
      explanation: {
        en: 'Under Article 110(3), if any question arises whether a Bill is a Money Bill or not, the decision of the Speaker of the House of the People thereon shall be final.',
        hi: 'अनुच्छेद 110(3) के तहत, यदि यह प्रश्न उठता है कि कोई विधेयक धन विधेयक है या नहीं, तो उस पर लोकसभा अध्यक्ष का निर्णय अंतिम होगा।',
      },
      examTip: {
        en: 'Key Article: Art 110 = Money Bill; Art 112 = Annual Financial Statement (Budget).',
        hi: 'मुख्य अनुच्छेद: अनु 110 = धन विधेयक; अनु 112 = वार्षिक वित्तीय विवरण (बजट)।',
      },
      marks: 1,
      negativeMarks: 0.25,
    },
    {
      content: {
        en: 'If a sum of money doubles itself at simple interest in 8 years, what is the annual rate of interest?',
        hi: 'यदि कोई धनराशि साधारण ब्याज पर 8 वर्षों में दोगुनी हो जाती है, तो वार्षिक ब्याज दर क्या है?',
      },
      options: [
        { id: 'A', text: { en: '12.5%', hi: '12.5%' }, isCorrect: true },
        { id: 'B', text: { en: '10%', hi: '10%' }, isCorrect: false },
        { id: 'C', text: { en: '15%', hi: '15%' }, isCorrect: false },
        { id: 'D', text: { en: '8%', hi: '8%' }, isCorrect: false },
      ],
      explanation: {
        en: 'Shortcut Formula: R = (n - 1) * 100 / T. Here n = 2, T = 8. So R = (2 - 1) * 100 / 8 = 100 / 8 = 12.5% per annum.',
        hi: 'शॉर्टकट सूत्र: R = (n - 1) * 100 / T। यहाँ n = 2, T = 8। अतः R = (2 - 1) * 100 / 8 = 100 / 8 = 12.5% प्रति वर्ष।',
      },
      examTip: {
        en: 'Speed Hack: Doubling in T years always means Rate = 100 / T.',
        hi: 'स्पीड हैक: T वर्षों में दोगुना होने का अर्थ हमेशा दर = 100 / T होता है।',
      },
      marks: 1,
      negativeMarks: 0.25,
    },
    {
      content: {
        en: 'Which organelle is known as the "powerhouse of the cell" due to its generation of ATP through cellular respiration?',
        hi: 'कोशिकीय श्वसन के माध्यम से एटीपी के उत्पादन के कारण किस कोशिकांग को "कोशिका का पावरहाउस" कहा जाता है?',
      },
      options: [
        { id: 'A', text: { en: 'Mitochondria', hi: 'माइटोकॉन्ड्रिया' }, isCorrect: true },
        { id: 'B', text: { en: 'Ribosome', hi: 'राइबोसोम' }, isCorrect: false },
        { id: 'C', text: { en: 'Golgi Apparatus', hi: 'गॉल्जी उपकरण' }, isCorrect: false },
        { id: 'D', text: { en: 'Lysosome', hi: 'लाइसोसोम' }, isCorrect: false },
      ],
      explanation: {
        en: 'Mitochondria generate most of the chemical energy needed to power the cell\'s biochemical reactions via Adenosine Triphosphate (ATP).',
        hi: 'माइटोकॉन्ड्रिया एडेनोसिन ट्राइफॉस्फेट (ATP) के माध्यम से कोशिका की जैव रासायनिक प्रतिक्रियाओं के लिए आवश्यक अधिकांश ऊर्जा उत्पन्न करते हैं।',
      },
      examTip: {
        en: 'Common Static GK Pairings: Mitochondria = Powerhouse, Lysosome = Suicidal Bag, Ribosome = Protein Factory.',
        hi: 'सामान्य स्टेटिक जीके युग्म: माइटोकॉन्ड्रिया = पावरहाउस, लाइसोसोम = आत्मघाती थैली, राइबोसोम = प्रोटीन फैक्ट्री।',
      },
      marks: 1,
      negativeMarks: 0.25,
    },
  ],
};

async function seed() {
  try {
    await mongoose.connect(dbUrl);
    const db = mongoose.connection.db;
    if (!db) {
      console.log('MongoDB connection failed');
      return;
    }
    const collection = db.collection('daily_quizzes');
    await collection.updateOne(
      { date: sampleQuiz.date, category: sampleQuiz.category },
      { $set: sampleQuiz },
      { upsert: true }
    );
    console.log(`Daily quiz seeded successfully for ${today}`);
  } catch (err) {
    console.log('Seed error (DB might be offline in build env, will seed at runtime):', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
