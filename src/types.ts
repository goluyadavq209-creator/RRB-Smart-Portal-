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
  stage: CutoffStage;
  year: number | string;
  cutoffs: CategoryCutoffs;
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

export interface FullRRBDatabase {
  metadata: {
    version: string;
    lastUpdated: string;
    uploadedBy?: string;
    source?: string;
    notes?: string;
  };
  zones: RRBZone[];
  exams: ExamItem[];
  cutoffs: CutoffRecord[];
  notices: NoticeItem[];
  results: ResultItem[];
  portalLinks?: CandidatePortalLink[];
}

export type TabView = 'home' | 'exams' | 'cutoffs' | 'notices' | 'results' | 'admin';
