export interface RRBZone {
  id: string;
  name: string;
  hindiName?: string;
  code: string;
  officialWebsite: string;
  headquarters: string;
  stateRegion: string;
}

export type ExamStatus = 
  | 'Upcoming'
  | 'Active Application'
  | 'Exam Scheduled'
  | 'Answer Key Released'
  | 'Result Declared'
  | 'DV Stage'
  | 'Completed';

export const OFFICIAL_RRB_DIGIALM_LOGIN_URL = 'https://rrb.digialm.com/EForms/configuredHtml/33128/101714/login.html';

export interface ExamItem {
  id: string;
  cenNumber: string;
  title: string;
  shortCode: string;
  department: string;
  status: ExamStatus;
  totalVacancies: number;
  applicationStart?: string;
  applicationEnd?: string;
  examDates?: string;
  eligibility?: string;
  ageLimit?: string;
  payScale?: string;
  selectionStages?: string[];
  officialPdfUrl?: string;
  admitCardUrl?: string;
  cityIntimationUrl?: string;
  zoneVacancies?: Record<string, number>;
  description?: string;
  updatedAt: string;
}

export type CutoffStage = 
  | 'CBT-1'
  | 'CBT-2 (Part-A)'
  | 'CBT-2 (Part-B)'
  | 'CBAT / Psycho Test'
  | 'Typing Skill Test'
  | 'Document Verification (DV/Final)';

export interface CategoryCutoffs {
  UR?: number | string;
  OBC?: number | string;
  SC?: number | string;
  ST?: number | string;
  EWS?: number | string;
  ExSM?: number | string;
  PwBD?: number | string;
  [key: string]: number | string | undefined;
}

export interface CutoffRecord {
  id: string;
  cenNumber: string;
  examTitle: string;
  zoneCode: string;
  zoneName: string;
  postName: string;
  stage: CutoffStage | string;
  year: number | string;
  cutoffs: CategoryCutoffs;
  rawMarksCutoffs?: CategoryCutoffs;
  catNo?: string;
  tableRows?: Array<Record<string, any>>;
  rawTableRows?: Array<Record<string, any>>;
  hindiZoneName?: string;
  hindiExamTitle?: string;
  chairmanSign?: string;
  dateStr?: string;
  customColumns?: string[];
  abbreviations?: string;
  normalizedScore: boolean;
  totalCandidatesCalled?: number;
  pdfReference?: string;
  updatedAt: string;
}

export type NoticeCategory = 
  | 'Exam Date'
  | 'City Intimation / Admit Card'
  | 'Answer Key & Objections'
  | 'Corrigendum & Vacancy Revision'
  | 'Result & Merit List'
  | 'DV & Medical'
  | 'General Advisory';

export interface NoticeItem {
  id: string;
  cenNumber?: string;
  zoneCode: string; // 'ALL' or specific zone code e.g. 'ALD'
  title: string;
  category: NoticeCategory;
  publishDate: string;
  isImportant?: boolean;
  isNew?: boolean;
  pdfUrl?: string;
  contentSummary?: string;
}

export type ResultType = 
  | 'Merit List PDF'
  | 'Individual Scorecard Link'
  | 'DV Schedule & Shortlist'
  | 'Medical Examination List'
  | 'Final Provisional Panel'
  | 'Replacement Panel';

export interface CandidateScoreRecord {
  rollNumber: string;
  name: string;
  registrationNo: string;
  rawMarks: number;
  normalizedScore: number;
  community: string; // ST, UR, SC, OBC, EWS
  zonalRank: number;
  examName?: string;
  cenNumber?: string;
  zoneName?: string;
}

export interface ResultItem {
  id: string;
  cenNumber: string;
  examTitle: string;
  zoneCode: string;
  zoneName: string;
  stage: string;
  publishDate: string;
  type: ResultType;
  fileUrl?: string;
  totalSelectedCandidates?: number;
  rollNumbersSample?: string[];
  candidateRecords?: CandidateScoreRecord[];
  instructions?: string;
  isNextStageEligible?: boolean;
  nextStageTitle?: string;
}

export type PortalLinkType = 
  | 'admit_card' 
  | 'city_intimation' 
  | 'answer_key' 
  | 'score_card';

export interface CandidatePortalLink {
  id: string;
  title: string;
  examName?: string;
  cenNumber?: string;
  type: PortalLinkType;
  url: string;
  badgeText?: string;
  publishDate?: string;
  isActive: boolean;
  notes?: string;
}

export interface SiteSettings {
  isWebsiteLive: boolean; // true = LIVE (normal website), false = OFF (Coming Soon / Under Maintenance)
  maintenanceTitle?: string;
  maintenanceMessage?: string;
  expectedLaunchDate?: string;
  supportContactEmail?: string;
  telegramChannelUrl?: string;
}

// ----------------------------------------------------
// TELEGRAM -> AI -> WEBSITE AUTO-PUBLISH SYSTEM TYPES
// ----------------------------------------------------

export type PostCategory = 
  | 'Latest News'
  | 'Exam Update'
  | 'Admit Card'
  | 'Answer Key'
  | 'Result'
  | 'Cut Off'
  | 'Vacancy'
  | 'Recruitment'
  | 'Government Job'
  | 'Scholarship'
  | 'Current Affairs'
  | 'Education'
  | 'Important Notice'
  | 'Other';

export type PostType = 
  | 'NEWS'
  | 'RESULT'
  | 'ADMIT_CARD'
  | 'ANSWER_KEY'
  | 'CUT_OFF'
  | 'VACANCY'
  | 'NOTICE'
  | 'ARTICLE'
  | 'CURRENT_AFFAIRS';

export type TelegramMessageStatus = 
  | 'RECEIVED'
  | 'PROCESSING'
  | 'PROCESSED'
  | 'PUBLISHED'
  | 'DRAFT'
  | 'REJECTED'
  | 'FAILED'
  | 'DUPLICATE';

export type PostStatus = 
  | 'DRAFT'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'REJECTED';

export interface TelegramMessageRecord {
  id: string;
  telegram_chat_id: string | number;
  telegram_message_id: string | number;
  channel_title?: string;
  sender_name?: string;
  message_text: string;
  caption?: string;
  media_url?: string;
  received_at: string;
  processed_at?: string;
  status: TelegramMessageStatus;
  error_message?: string;
  raw_payload?: any;
}

export interface PostSeoMetadata {
  title: string;
  metaDescription: string;
  keywords: string[];
  ogTitle: string;
  ogDescription: string;
}

export interface WebsitePost {
  id: string;
  telegram_message_id?: string | number;
  telegram_chat_id?: string | number;
  category: PostCategory;
  post_type: PostType;
  exam: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  important_points: string[];
  tags: string[];
  source_text: string;
  source_url?: string;
  official_reference?: string;
  media_url?: string;
  media_caption?: string;
  status: PostStatus;
  confidence: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
  seo: PostSeoMetadata;
}

export interface AIProcessingLogRecord {
  id: string;
  telegram_message_id: string | number;
  model: string;
  prompt: string;
  response: string;
  status: 'SUCCESS' | 'FAILED' | 'RECEIVED' | 'PROCESSING';
  error?: string;
  created_at: string;
  execution_time_ms?: number;
}

export interface TelegramAutoPublishSettings {
  telegram_enabled: boolean;
  ai_enabled: boolean;
  auto_publish: boolean;
  default_status: 'DRAFT' | 'PUBLISHED';
  confidence_threshold: number; // e.g., 0.80
  ai_model: string; // e.g. 'gemini-3.7-flash'
  bot_token?: string; // Optional configured bot token
  webhook_secret?: string; // Optional webhook verification secret
  target_channel_id?: string;
  auto_create_notices: boolean;
  auto_create_results: boolean;
  auto_create_portal_links: boolean;
  updated_at: string;
}

export interface FullRRBDatabase {
  metadata: {
    version: string;
    lastUpdated: string;
    uploadedBy?: string;
    source?: string;
    notes?: string;
  };
  settings?: SiteSettings;
  telegramSettings?: TelegramAutoPublishSettings;
  telegramMessages?: TelegramMessageRecord[];
  posts?: WebsitePost[];
  aiLogs?: AIProcessingLogRecord[];
  zones: RRBZone[];
  exams: ExamItem[];
  cutoffs: CutoffRecord[];
  notices: NoticeItem[];
  results: ResultItem[];
  portalLinks?: CandidatePortalLink[];
  candidateScorecards?: CandidateScoreRecord[];
}

export type QuestionOption = 'Option 1' | 'Option 2' | 'Option 3' | 'Option 4';
export type StudentOptionChoice = QuestionOption | 'Not Attempted';
export type QuestionStatus = 'RIGHT' | 'WRONG' | 'UNATTENDED';

export interface ExamScoringSettings {
  correctMarks: number;
  negativeMarks: number;
}

export interface EvaluatedQuestion {
  questionNumber: number;
  questionId: string;
  subject: string;
  questionText?: string;
  options?: string[];
  studentAnswer: StudentOptionChoice;
  correctAnswer: QuestionOption | 'Unknown';
  status: QuestionStatus;
  marks: number;
  confidenceLow?: boolean;
}

export interface SubjectBreakdown {
  subject: string;
  totalQuestions: number;
  attempted: number;
  right: number;
  wrong: number;
  unattended: number;
  accuracy: number;
  score: number;
}

export interface FullAnswerEvaluationReport {
  candidateName: string;
  rollNumber: string;
  examName: string;
  shiftDate: string;
  settings: ExamScoringSettings;
  totalQuestions: number;
  attempted: number;
  unattempted: number;
  rightCount: number;
  wrongCount: number;
  unattendedCount: number;
  positiveMarks: number;
  negativeMarks: number;
  netScore: number;
  accuracy: number;
  predictedNormalizedScore?: number;
  predictedShiftRank?: number;
  totalCandidatesInShift?: number;
  predictedCategoryRank?: number;
  totalCategoryCandidates?: number;
  percentile?: number;
  questions: EvaluatedQuestion[];
  subjectBreakdown: SubjectBreakdown[];
}

export type TabView = 'home' | 'roll-check' | 'answer-check' | 'exams' | 'cutoffs' | 'notices' | 'results' | 'admin';
