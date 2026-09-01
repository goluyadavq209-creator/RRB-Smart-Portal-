import { 
  FullRRBDatabase, 
  RRBZone, 
  CandidatePortalLink, 
  ExamItem, 
  CutoffRecord, 
  NoticeItem, 
  ResultItem,
  TelegramAutoPublishSettings,
  WebsitePost
} from '../types';
import { COMPREHENSIVE_OFFICIAL_CUTOFFS } from './officialCutoffsData';

// 21 Official Regional Railway Recruitment Boards - Verified against https://rrb.indianrailways.gov.in/
export const OFFICIAL_RRB_ZONES: RRBZone[] = [
  {
    id: 'rrb-ald',
    name: 'RRB Prayagraj (Allahabad)',
    hindiName: 'आरआरबी प्रयागराज (इलाहाबाद)',
    code: 'ALD',
    officialWebsite: 'https://www.rrbald.gov.in',
    headquarters: 'Prayagraj, Uttar Pradesh',
    stateRegion: 'North Central Railway & Northern Railway',
  },
  {
    id: 'rrb-cdg',
    name: 'RRB Chandigarh',
    hindiName: 'आरआरबी चंडीगढ़',
    code: 'CDG',
    officialWebsite: 'https://www.rrbcdg.gov.in',
    headquarters: 'Chandigarh',
    stateRegion: 'Northern Railway',
  },
  {
    id: 'rrb-mum',
    name: 'RRB Mumbai',
    hindiName: 'आरआरबी मुंबई',
    code: 'MUM',
    officialWebsite: 'https://www.rrbmumbai.gov.in',
    headquarters: 'Mumbai, Maharashtra',
    stateRegion: 'Western Railway & Central Railway',
  },
  {
    id: 'rrb-kol',
    name: 'RRB Kolkata',
    hindiName: 'आरआरबी कोलकाता',
    code: 'KOL',
    officialWebsite: 'https://www.rrbkolkata.gov.in',
    headquarters: 'Kolkata, West Bengal',
    stateRegion: 'Eastern Railway, South Eastern Railway & Metro Railway',
  },
  {
    id: 'rrb-pat',
    name: 'RRB Patna',
    hindiName: 'आरआरबी पटना',
    code: 'PAT',
    officialWebsite: 'https://www.rrbpatna.gov.in',
    headquarters: 'Patna, Bihar',
    stateRegion: 'East Central Railway',
  },
  {
    id: 'rrb-bpl',
    name: 'RRB Bhopal',
    hindiName: 'आरआरबी भोपाल',
    code: 'BPL',
    officialWebsite: 'https://www.rrbbhopal.gov.in',
    headquarters: 'Bhopal, Madhya Pradesh',
    stateRegion: 'West Central Railway',
  },
  {
    id: 'rrb-ajm',
    name: 'RRB Ajmer',
    hindiName: 'आरआरबी अजमेर',
    code: 'AII',
    officialWebsite: 'https://www.rrbajmer.gov.in',
    headquarters: 'Ajmer, Rajasthan',
    stateRegion: 'North Western Railway',
  },
  {
    id: 'rrb-sec',
    name: 'RRB Secunderabad',
    hindiName: 'आरआरबी सिकंदराबाद',
    code: 'SC',
    officialWebsite: 'https://www.rrbsecunderabad.gov.in',
    headquarters: 'Secunderabad, Telangana',
    stateRegion: 'South Central Railway',
  },
  {
    id: 'rrb-chn',
    name: 'RRB Chennai',
    hindiName: 'आरआरबी चेन्नई',
    code: 'CHN',
    officialWebsite: 'https://www.rrbchennai.gov.in',
    headquarters: 'Chennai, Tamil Nadu',
    stateRegion: 'Southern Railway',
  },
  {
    id: 'rrb-bng',
    name: 'RRB Bengaluru (Bangalore)',
    hindiName: 'आरआरबी बेंगलुरु',
    code: 'SBC',
    officialWebsite: 'https://www.rrbbnc.gov.in',
    headquarters: 'Bengaluru, Karnataka',
    stateRegion: 'South Western Railway',
  },
  {
    id: 'rrb-rnc',
    name: 'RRB Ranchi',
    hindiName: 'आरआरबी रांची',
    code: 'RNC',
    officialWebsite: 'https://www.rrbranchi.gov.in',
    headquarters: 'Ranchi, Jharkhand',
    stateRegion: 'South Eastern Railway & ECR',
  },
  {
    id: 'rrb-bil',
    name: 'RRB Bilaspur',
    hindiName: 'आरआरबी बिलासपुर',
    code: 'BSP',
    officialWebsite: 'https://www.rrbbilaspur.gov.in',
    headquarters: 'Bilaspur, Chhattisgarh',
    stateRegion: 'South East Central Railway',
  },
  {
    id: 'rrb-gkp',
    name: 'RRB Gorakhpur',
    hindiName: 'आरआरबी गोरखपुर',
    code: 'GKP',
    officialWebsite: 'https://www.rrbgkp.gov.in',
    headquarters: 'Gorakhpur, Uttar Pradesh',
    stateRegion: 'North Eastern Railway',
  },
  {
    id: 'rrb-ghy',
    name: 'RRB Guwahati',
    hindiName: 'आरआरबी गुवाहाटी',
    code: 'GHY',
    officialWebsite: 'https://www.rrbguwahati.gov.in',
    headquarters: 'Guwahati, Assam',
    stateRegion: 'Northeast Frontier Railway',
  },
  {
    id: 'rrb-bbs',
    name: 'RRB Bhubaneswar',
    hindiName: 'आरआरबी भुवनेश्वर',
    code: 'BBS',
    officialWebsite: 'https://www.rrbbbs.gov.in',
    headquarters: 'Bhubaneswar, Odisha',
    stateRegion: 'East Coast Railway',
  },
  {
    id: 'rrb-ahm',
    name: 'RRB Ahmedabad',
    hindiName: 'आरआरबी अहमदाबाद',
    code: 'ADI',
    officialWebsite: 'https://www.rrbahmedabad.gov.in',
    headquarters: 'Ahmedabad, Gujarat',
    stateRegion: 'Western Railway',
  },
  {
    id: 'rrb-jmu',
    name: 'RRB Jammu-Srinagar',
    hindiName: 'आरआरबी जम्मू-श्रीनगर',
    code: 'JMU',
    officialWebsite: 'https://www.rrbjammu.nic.in',
    headquarters: 'Jammu & Kashmir',
    stateRegion: 'Northern Railway',
  },
  {
    id: 'rrb-mfp',
    name: 'RRB Muzaffarpur',
    hindiName: 'आरआरबी मुजफ्फरपुर',
    code: 'MFP',
    officialWebsite: 'https://www.rrbmuzaffarpur.gov.in',
    headquarters: 'Muzaffarpur, Bihar',
    stateRegion: 'East Central Railway',
  },
  {
    id: 'rrb-mld',
    name: 'RRB Malda',
    hindiName: 'आरआरबी मालदा',
    code: 'MLD',
    officialWebsite: 'https://www.rrbmalda.gov.in',
    headquarters: 'Malda, West Bengal',
    stateRegion: 'Eastern Railway & NFR',
  },
  {
    id: 'rrb-slg',
    name: 'RRB Siliguri',
    hindiName: 'आरआरबी सिलीगुड़ी',
    code: 'SGUJ',
    officialWebsite: 'https://www.rrbsiliguri.gov.in',
    headquarters: 'Siliguri, West Bengal',
    stateRegion: 'Northeast Frontier Railway',
  },
  {
    id: 'rrb-tvm',
    name: 'RRB Thiruvananthapuram',
    hindiName: 'आरआरबी तिरुवनंतपुरम',
    code: 'TVM',
    officialWebsite: 'https://www.rrbthiruvananthapuram.gov.in',
    headquarters: 'Thiruvananthapuram, Kerala',
    stateRegion: 'Southern Railway',
  },
];

// Clean Empty Portal Collections
export const DEFAULT_CANDIDATE_PORTAL_LINKS: CandidatePortalLink[] = [];
export const REAL_OFFICIAL_EXAMS: ExamItem[] = [];
// Official Real RRB Cutoffs - Real data from CEN 06/2025 & CEN 01/2024
export const REAL_OFFICIAL_CUTOFFS: CutoffRecord[] = COMPREHENSIVE_OFFICIAL_CUTOFFS;

export const DEFAULT_TELEGRAM_SETTINGS: TelegramAutoPublishSettings = {
  telegram_enabled: true,
  ai_enabled: true,
  auto_publish: true,
  default_status: 'PUBLISHED',
  confidence_threshold: 0.80,
  ai_model: 'gemini-3.7-flash',
  bot_token: '8580504765:AAEAULLAiL0DZL4WNfj45Mj9pxwlduckHKk',
  target_channel_id: '@railway_recruitment_updates',
  auto_create_notices: true,
  auto_create_results: true,
  auto_create_portal_links: true,
  updated_at: new Date().toISOString(),
};

export const INITIAL_SAMPLE_POSTS: WebsitePost[] = [
  {
    id: 'post-tg-1',
    telegram_message_id: 1042,
    telegram_chat_id: '-100192837465',
    category: 'Answer Key',
    post_type: 'ANSWER_KEY',
    exam: 'RRB Technician CEN 02/2024',
    title: 'RRB Technician CEN 02/2024 Answer Key & Objection Tracker Live',
    slug: 'rrb-technician-cen-02-2024-answer-key-objection-tracker-live',
    summary: 'Railway Recruitment Boards have activated the official answer key and objection tracking link for CEN 02/2024 Technician Grade-I and Grade-III examinations on the DigiALM portal.',
    content: `## Official Notice: RRB Technician (CEN 02/2024) Answer Key Released

The Railway Recruitment Boards (RRBs) have officially activated the Computer Based Test (CBT) question paper, response sheet, and tentative answer key viewing link for candidates who appeared in the **CEN 02/2024 (Technician Grade-I & Grade-III)** recruitment examination.

Candidates can now log in using their Registration Number and User Password (Date of Birth) to evaluate their scores, download their marked response sheets, and raise online objections against questions or answer options.

### Important Information & Schedule
* **Answer Key & Question Paper Viewing Start Date:** Active Now
* **Objection Raising Portal:** Available on official DigiALM gateway
* **Prescribed Fee for Raising Objection:** ₹50/- (Fifty Rupees) plus applicable bank service charges per question.
* **Refund Policy:** If the objection raised is found to be valid and correct, the fee of ₹50/- will be refunded to the candidate's payment account.

### How to Check Your Response Sheet
1. Visit the official RRB website or direct DigiALM link.
2. Enter your Registration Number and Date of Birth (DD/MM/YYYY).
3. Click on the 'Candidate Response' tab to generate your evaluated response sheet.
4. Review questions marked with green checks (correct answer determined by RRB).
`,
    important_points: [
      'DigiALM login link active for all 21 RRB regional boards.',
      'Objection fee is ₹50 per question, refundable if objection is sustained.',
      'Candidates can calculate raw marks using official marking scheme (+1 for right, -1/3 for wrong).'
    ],
    tags: ['RRB Technician', 'CEN 02/2024', 'Answer Key', 'Objection Tracker', 'DigiALM'],
    source_text: 'RRB Technician Answer Key 2026 जारी! सभी 21 जोन्स के अभ्यर्थी rrbcdg.gov.in एवं digialm पोर्टल से अपनी response sheet डाउनलोड कर सकते हैं। आपत्ति दर्ज करने का शुल्क ₹50 प्रति प्रश्न रहेगा।',
    source_url: 'https://rrbcdg.gov.in',
    official_reference: 'CEN 02/2024 Notification - Ministry of Railways',
    status: 'PUBLISHED',
    confidence: 0.98,
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    seo: {
      title: 'RRB Technician CEN 02/2024 Answer Key Released - Download Response Sheet',
      metaDescription: 'Check and download RRB Technician CEN 02/2024 Answer Key, response sheet and raise objections directly with official links.',
      keywords: ['RRB Technician Answer Key', 'CEN 02/2024', 'Railway Answer Key 2026', 'DigiALM login', 'RRB Objections'],
      ogTitle: 'RRB Technician CEN 02/2024 Answer Key Out - Direct Download Link',
      ogDescription: 'Official answer key released by Indian Railways for Technician Grade 1 and Grade 3 posts.'
    }
  }
];

// Clean Database Slate Ready for Fresh User Updates
export const INITIAL_EMPTY_DATABASE: FullRRBDatabase = {
  metadata: {
    version: '3.0.0-CLEAN',
    lastUpdated: new Date().toISOString(),
    uploadedBy: 'Administrator',
    source: 'Official Portal Gateway (https://rrb.indianrailways.gov.in/)',
    notes: 'Official cutoffs and database ready with Telegram Auto-Publish AI system.',
  },
  settings: {
    isWebsiteLive: true,
    maintenanceTitle: 'RRB Portal - Official Gateway Upgrade',
    maintenanceMessage: 'हम पोर्टल को और बेहतर और तीव्र बनाने के लिए तकनीकी अपडेट कर रहे हैं। जल्द ही सभी परीक्षा परिणाम, कट-ऑफ और उत्तर कुंजी उपलब्ध होंगे।',
    expectedLaunchDate: 'Coming Very Soon (जल्द आ रहे हैं)',
    supportContactEmail: 'helpdesk@rrb.gov.in',
    telegramChannelUrl: 'https://t.me/railway_recruitment_updates',
  },
  telegramSettings: DEFAULT_TELEGRAM_SETTINGS,
  telegramMessages: [
    {
      id: 'tg-msg-1042',
      telegram_chat_id: '-100192837465',
      telegram_message_id: 1042,
      channel_title: 'Railway Recruitment Official Updates',
      sender_name: 'RRB Channel Bot',
      message_text: 'RRB Technician Answer Key 2026 जारी! सभी 21 जोन्स के अभ्यर्थी rrbcdg.gov.in एवं digialm पोर्टल से अपनी response sheet डाउनलोड कर सकते हैं। आपत्ति दर्ज करने का शुल्क ₹50 प्रति प्रश्न रहेगा।',
      received_at: new Date().toISOString(),
      processed_at: new Date().toISOString(),
      status: 'PUBLISHED'
    }
  ],
  posts: INITIAL_SAMPLE_POSTS,
  aiLogs: [
    {
      id: 'ai-log-1',
      telegram_message_id: 1042,
      model: 'gemini-3.7-flash',
      prompt: 'Analyze Telegram post for RRB Technician Answer Key',
      response: JSON.stringify({ category: 'Answer Key', postType: 'ANSWER_KEY', confidence: 0.98 }),
      status: 'SUCCESS',
      created_at: new Date().toISOString(),
      execution_time_ms: 640
    }
  ],
  zones: OFFICIAL_RRB_ZONES,
  exams: [],
  cutoffs: REAL_OFFICIAL_CUTOFFS,
  notices: [],
  results: [],
  portalLinks: [],
};

export const SAMPLE_TEMPLATE_DATABASE: FullRRBDatabase = INITIAL_EMPTY_DATABASE;
