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

export interface FullRRBDatabase {
  metadata: {
    version: string;
    lastUpdated: string;
    uploadedBy?: string;
    source?: string;
    notes?: string;
  };
  settings?: SiteSettings;
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

export type TabView = 'home' | 'roll-check' | 'answer-check' | 'exams' | 'cutoffs' | 'notices' | 'results' | 'workspace' | 'admin';
