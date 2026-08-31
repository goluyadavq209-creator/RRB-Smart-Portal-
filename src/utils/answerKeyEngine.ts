import {
  EvaluatedQuestion,
  ExamScoringSettings,
  FullAnswerEvaluationReport,
  QuestionOption,
  QuestionStatus,
  StudentOptionChoice,
  SubjectBreakdown
} from '../types';

export const DEFAULT_EXAM_SETTINGS: ExamScoringSettings = {
  correctMarks: 1.0,
  negativeMarks: 0.3333,
};

/**
 * Standard Subject mappings for RRB Exams (NTPC, Group D, ALP, Technician, JE, RPF)
 */
export function getSubjectForQuestion(qNum: number, totalQ: number = 100, customSubject?: string): string {
  if (customSubject && customSubject.trim().length > 0) {
    return customSubject.trim();
  }
  if (totalQ === 100) {
    if (qNum <= 30) return 'Mathematics';
    if (qNum <= 60) return 'General Intelligence & Reasoning';
    if (qNum <= 85) return 'General Science';
    return 'General Awareness & Current Affairs';
  } else if (totalQ === 75) {
    // ALP CBT-1
    if (qNum <= 20) return 'Mathematics';
    if (qNum <= 45) return 'General Intelligence & Reasoning';
    if (qNum <= 65) return 'General Science';
    return 'General Awareness on Current Affairs';
  } else if (totalQ === 120) {
    // NTPC CBT-2
    if (qNum <= 35) return 'Mathematics';
    if (qNum <= 70) return 'General Intelligence & Reasoning';
    return 'General Awareness';
  }
  // Default fallback
  const mod = qNum % 4;
  if (mod === 1) return 'Mathematics';
  if (mod === 2) return 'General Intelligence & Reasoning';
  if (mod === 3) return 'General Science';
  return 'General Awareness';
}

/**
 * Normalizes an option number or string to 'Option 1' | 'Option 2' | 'Option 3' | 'Option 4'
 */
export function normalizeOptionNumber(val: string | number | undefined | null): QuestionOption | 'Unknown' {
  if (val === undefined || val === null) return 'Unknown';
  const str = String(val).trim();
  if (/^1$|^option\s*1$/i.test(str)) return 'Option 1';
  if (/^2$|^option\s*2$/i.test(str)) return 'Option 2';
  if (/^3$|^option\s*3$/i.test(str)) return 'Option 3';
  if (/^4$|^option\s*4$/i.test(str)) return 'Option 4';
  return 'Unknown';
}

export function normalizeStudentChoice(val: string | number | undefined | null): StudentOptionChoice {
  if (val === undefined || val === null) return 'Not Attempted';
  const str = String(val).trim();
  if (!str || str === '--' || str === '-' || str === '.' || /not\s*(?:attempted|answered)/i.test(str) || str === '0') {
    return 'Not Attempted';
  }
  if (/^1$|^option\s*1$/i.test(str)) return 'Option 1';
  if (/^2$|^option\s*2$/i.test(str)) return 'Option 2';
  if (/^3$|^option\s*3$/i.test(str)) return 'Option 3';
  if (/^4$|^option\s*4$/i.test(str)) return 'Option 4';
  return 'Not Attempted';
}

/**
 * Core Evaluation and Scoring Formula Engine
 * Strict Rule:
 * 1. IF Student Answer == Official Correct Answer: RIGHT (+correctMarks)
 * 2. IF Student Answer != Official Correct Answer (and student attempted): WRONG (-negativeMarks)
 * 3. IF Student did NOT attempt the question: UNATTENDED (0 marks, never penalized)
 */
export function evaluateQuestionsList(
  rawQuestions: Array<{
    questionNumber?: number;
    questionId?: string;
    subject?: string;
    questionText?: string;
    options?: string[];
    studentAnswer: StudentOptionChoice | string;
    correctAnswer: QuestionOption | string;
    confidenceLow?: boolean;
  }>,
  settings: ExamScoringSettings = DEFAULT_EXAM_SETTINGS,
  candidateMeta?: {
    candidateName?: string;
    rollNumber?: string;
    examName?: string;
    shiftDate?: string;
    category?: string;
  }
): FullAnswerEvaluationReport {
  const evaluatedQuestions: EvaluatedQuestion[] = [];
  let rightCount = 0;
  let wrongCount = 0;
  let unattendedCount = 0;

  const totalQuestions = rawQuestions.length;

  rawQuestions.forEach((q, idx) => {
    const qNum = q.questionNumber || idx + 1;
    const qId = q.questionId || `RRB-Q${String(qNum).padStart(3, '0')}`;
    const subject = q.subject || getSubjectForQuestion(qNum, totalQuestions);
    
    const studentChoice = normalizeStudentChoice(q.studentAnswer);
    const correctChoice = normalizeOptionNumber(q.correctAnswer);

    let status: QuestionStatus = 'UNATTENDED';
    let marks = 0;

    if (studentChoice === 'Not Attempted') {
      status = 'UNATTENDED';
      marks = 0;
      unattendedCount++;
    } else if (correctChoice !== 'Unknown' && studentChoice === correctChoice) {
      status = 'RIGHT';
      marks = settings.correctMarks;
      rightCount++;
    } else {
      status = 'WRONG';
      marks = -settings.negativeMarks;
      wrongCount++;
    }

    evaluatedQuestions.push({
      questionNumber: qNum,
      questionId: qId,
      subject,
      questionText: q.questionText,
      options: q.options,
      studentAnswer: studentChoice,
      correctAnswer: correctChoice,
      status,
      marks,
      confidenceLow: q.confidenceLow || correctChoice === 'Unknown',
    });
  });

  const attempted = rightCount + wrongCount;
  const unattempted = unattendedCount;
  const positiveMarks = Number((rightCount * settings.correctMarks).toFixed(4));
  const negativeMarks = Number((wrongCount * settings.negativeMarks).toFixed(4));
  const netScore = Number((positiveMarks - negativeMarks).toFixed(4));
  const accuracy = attempted > 0 ? Number(((rightCount / attempted) * 100).toFixed(2)) : 0;

  // Subject-wise Breakdown
  const subjectMap = new Map<string, EvaluatedQuestion[]>();
  evaluatedQuestions.forEach((q) => {
    const arr = subjectMap.get(q.subject) || [];
    arr.push(q);
    subjectMap.set(q.subject, arr);
  });

  const subjectBreakdown: SubjectBreakdown[] = [];
  subjectMap.forEach((qList, subj) => {
    const sTotal = qList.length;
    const sRight = qList.filter((x) => x.status === 'RIGHT').length;
    const sWrong = qList.filter((x) => x.status === 'WRONG').length;
    const sUnattended = qList.filter((x) => x.status === 'UNATTENDED').length;
    const sAttempted = sRight + sWrong;
    const sPositive = sRight * settings.correctMarks;
    const sNegative = sWrong * settings.negativeMarks;
    const sScore = Number((sPositive - sNegative).toFixed(4));
    const sAcc = sAttempted > 0 ? Number(((sRight / sAttempted) * 100).toFixed(2)) : 0;

    subjectBreakdown.push({
      subject: subj,
      totalQuestions: sTotal,
      attempted: sAttempted,
      right: sRight,
      wrong: sWrong,
      unattended: sUnattended,
      accuracy: sAcc,
      score: sScore,
    });
  });

  // Predicted Normalized Score & Rank Metrics
  const normalizedBonus = Math.min(15, Math.max(0, (netScore * 0.12) + (accuracy > 80 ? 4.5 : 2.0)));
  const predictedNormalizedScore = Number(Math.max(0, Math.min(100, netScore + normalizedBonus)).toFixed(2));
  
  const basePool = 28540;
  const rankPercent = Math.max(0.01, 1 - (netScore / (totalQuestions * settings.correctMarks)));
  const predictedShiftRank = Math.max(1, Math.round(basePool * Math.pow(rankPercent, 1.8)));
  const totalCandidatesInShift = basePool;
  const predictedCategoryRank = Math.max(1, Math.round(predictedShiftRank * 0.38));
  const totalCategoryCandidates = Math.round(basePool * 0.38);
  const percentile = Number((((totalCandidatesInShift - predictedShiftRank) / totalCandidatesInShift) * 100).toFixed(2));

  return {
    candidateName: candidateMeta?.candidateName || 'Candidate',
    rollNumber: candidateMeta?.rollNumber || '284192004812',
    examName: candidateMeta?.examName || 'RRB NTPC (Graduate/Undergraduate) CBT-1',
    shiftDate: candidateMeta?.shiftDate || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ' (Shift 2: 12:30 PM - 2:00 PM)',
    settings,
    totalQuestions,
    attempted,
    unattempted,
    rightCount,
    wrongCount,
    unattendedCount,
    positiveMarks,
    negativeMarks,
    netScore,
    accuracy,
    predictedNormalizedScore,
    predictedShiftRank,
    totalCandidatesInShift,
    predictedCategoryRank,
    totalCategoryCandidates,
    percentile,
    questions: evaluatedQuestions,
    subjectBreakdown,
  };
}

/**
 * Parser for TCS iON / DigiALM HTML Response Sheet
 */
export function parseDigiALMResponseSheetHTML(htmlContent: string): {
  candidateName?: string;
  rollNumber?: string;
  examName?: string;
  shiftDate?: string;
  questions: Array<{
    questionNumber: number;
    questionId: string;
    subject?: string;
    studentAnswer: StudentOptionChoice;
    correctAnswer: QuestionOption;
    questionText?: string;
    options?: string[];
  }>;
} {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  // Candidate Details Extraction
  let candidateName = '';
  let rollNumber = '';
  let examName = '';
  let shiftDate = '';

  const metaRows = doc.querySelectorAll('table tr, .main-info tr');
  metaRows.forEach((row) => {
    const text = row.textContent || '';
    if (/Candidate\s*Name/i.test(text)) {
      const parts = text.split(':');
      if (parts[1]) candidateName = parts[1].trim();
    }
    if (/Roll\s*Number/i.test(text)) {
      const parts = text.split(':');
      if (parts[1]) rollNumber = parts[1].trim();
    }
    if (/Subject|Test\s*Name|Exam/i.test(text)) {
      const parts = text.split(':');
      if (parts[1]) examName = parts[1].trim();
    }
    if (/Test\s*Date|Date/i.test(text)) {
      const parts = text.split(':');
      if (parts[1]) shiftDate = parts[1].trim();
    }
  });

  // Extract Questions
  const questionContainers = doc.querySelectorAll('.question-pnl, .section-cnt, table.menu-tbl, .question-view');
  const extractedQuestions: Array<{
    questionNumber: number;
    questionId: string;
    subject?: string;
    studentAnswer: StudentOptionChoice;
    correctAnswer: QuestionOption;
    questionText?: string;
    options?: string[];
  }> = [];

  let qIndex = 1;

  questionContainers.forEach((container) => {
    const text = container.textContent || '';
    
    // Extract Question ID
    const qIdMatch = text.match(/Question\s*ID\s*[:=]?\s*(\d+)/i);
    const qId = qIdMatch ? qIdMatch[1] : `Q-${qIndex}`;

    // Extract Chosen Option (Student Answer)
    const chosenMatch = text.match(/Chosen\s*Option\s*[:=]?\s*([1-4]|\-\-|\.|\w+)/i);
    let chosenVal = chosenMatch ? chosenMatch[1] : '--';
    
    // If Status says "Not Answered", override
    if (/Status\s*[:=]?\s*Not\s*Answered/i.test(text) || /Marked\s*For\s*Review/i.test(text) && chosenVal === '--') {
      chosenVal = '--';
    }

    const studentAnswer = normalizeStudentChoice(chosenVal);

    // Extract Official Correct Answer (Look for green tick or bold correct answer)
    let correctAnswer: QuestionOption = 'Option 1'; // fallback
    const greenTickImg = container.querySelector('img[src*="tick"], img[src*="right"], img[src*="correct"], .rightAns, .bold.correctAns');
    
    if (greenTickImg) {
      // Find parent table cell or row index
      const parentRow = greenTickImg.closest('tr, td, .option-row');
      if (parentRow && parentRow.textContent) {
        const optNumMatch = parentRow.textContent.match(/([1-4])\./) || parentRow.textContent.match(/Option\s*([1-4])/i);
        if (optNumMatch) {
          correctAnswer = normalizeOptionNumber(optNumMatch[1]) as QuestionOption;
        }
      }
    } else {
      // Look for regex text in container "Correct Option: 3"
      const corrMatch = text.match(/Correct\s*(?:Option|Answer)\s*[:=]?\s*([1-4])/i);
      if (corrMatch) {
        correctAnswer = normalizeOptionNumber(corrMatch[1]) as QuestionOption;
      }
    }

    extractedQuestions.push({
      questionNumber: qIndex,
      questionId: qId,
      studentAnswer,
      correctAnswer,
    });

    qIndex++;
  });

  return {
    candidateName: candidateName || 'RRB Aspirant',
    rollNumber: rollNumber || '284192004812',
    examName: examName || 'RRB NTPC CBT-1 Examination',
    shiftDate: shiftDate || 'Shift 2 (12:30 PM - 2:00 PM)',
    questions: extractedQuestions,
  };
}

/**
 * Text regex parser for pasted text or OCR strings
 */
export function parseRawTextResponseSheet(rawText: string): Array<{
  questionNumber: number;
  questionId: string;
  studentAnswer: StudentOptionChoice;
  correctAnswer: QuestionOption;
}> {
  const lines = rawText.split('\n');
  const results: Array<{
    questionNumber: number;
    questionId: string;
    studentAnswer: StudentOptionChoice;
    correctAnswer: QuestionOption;
  }> = [];

  let currentQNum = 1;
  let currentQId = '';
  let currentChosen: StudentOptionChoice = 'Not Attempted';
  let currentCorrect: QuestionOption = 'Option 1';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const qNumMatch = line.match(/^Q(?:uestion)?\.?\s*(\d+)[:\.]?/i) || line.match(/^(\d+)[\.\)]/);
    if (qNumMatch) {
      if (currentQId) {
        results.push({
          questionNumber: currentQNum,
          questionId: currentQId,
          studentAnswer: currentChosen,
          correctAnswer: currentCorrect,
        });
      }
      currentQNum = parseInt(qNumMatch[1], 10);
      currentQId = `Q${currentQNum}`;
      currentChosen = 'Not Attempted';
      currentCorrect = 'Option 1';
    }

    const qIdMatch = line.match(/Question\s*ID\s*[:=]?\s*(\d+)/i);
    if (qIdMatch) {
      currentQId = qIdMatch[1];
    }

    const chosenMatch = line.match(/Chosen\s*Option\s*[:=]?\s*([1-4]|--|\.|Not Answered|None)/i);
    if (chosenMatch) {
      currentChosen = normalizeStudentChoice(chosenMatch[1]);
    }

    const correctMatch = line.match(/(?:Correct\s*Option|Official\s*Key|Ans|Answer)\s*[:=]?\s*([1-4])/i);
    if (correctMatch) {
      currentCorrect = normalizeOptionNumber(correctMatch[1]) as QuestionOption;
    }
  }

  if (currentQId) {
    results.push({
      questionNumber: currentQNum,
      questionId: currentQId,
      studentAnswer: currentChosen,
      correctAnswer: currentCorrect,
    });
  }

  return results;
}
