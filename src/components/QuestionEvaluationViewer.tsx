import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  MinusCircle, 
  Edit3, 
  Filter, 
  RotateCcw, 
  Download, 
  Layers, 
  Search, 
  HelpCircle,
  Save,
  X,
  Sparkles,
  Sliders,
  Check,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { 
  EvaluatedQuestion, 
  ExamScoringSettings, 
  FullAnswerEvaluationReport, 
  QuestionOption, 
  StudentOptionChoice 
} from '../types';

interface QuestionEvaluationViewerProps {
  report: FullAnswerEvaluationReport;
  onUpdateQuestion: (
    questionNumber: number, 
    newStudentAnswer: StudentOptionChoice, 
    newCorrectAnswer: QuestionOption
  ) => void;
  onUpdateSettings: (newSettings: ExamScoringSettings) => void;
  onReset: () => void;
  onNavigateTab?: (tab: any) => void;
}

export const QuestionEvaluationViewer: React.FC<QuestionEvaluationViewerProps> = ({
  report,
  onUpdateQuestion,
  onUpdateSettings,
  onReset,
  onNavigateTab
}) => {
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'RIGHT' | 'WRONG' | 'UNATTENDED'>('ALL');
  const [filterSubject, setFilterSubject] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Editing state for manual correction modal
  const [editingQuestion, setEditingQuestion] = useState<EvaluatedQuestion | null>(null);
  const [tempStudentChoice, setTempStudentChoice] = useState<StudentOptionChoice>('Not Attempted');
  const [tempCorrectChoice, setTempCorrectChoice] = useState<QuestionOption>('Option 1');

  // Exam Settings editing
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempCorrectMarks, setTempCorrectMarks] = useState<number>(report.settings.correctMarks);
  const [tempNegativeMarks, setTempNegativeMarks] = useState<number>(report.settings.negativeMarks);

  const openEditModal = (q: EvaluatedQuestion) => {
    setEditingQuestion(q);
    setTempStudentChoice(q.studentAnswer);
    setTempCorrectChoice(q.correctAnswer === 'Unknown' ? 'Option 1' : q.correctAnswer);
  };

  const handleSaveCorrection = () => {
    if (!editingQuestion) return;
    onUpdateQuestion(editingQuestion.questionNumber, tempStudentChoice, tempCorrectChoice);
    setEditingQuestion(null);
  };

  const handleSaveSettings = () => {
    onUpdateSettings({
      correctMarks: Number(tempCorrectMarks) || 1.0,
      negativeMarks: Number(tempNegativeMarks) || 0.3333,
    });
    setIsSettingsOpen(false);
  };

  // Filter questions
  const filteredQuestions = report.questions.filter((q) => {
    if (filterStatus !== 'ALL' && q.status !== filterStatus) return false;
    if (filterSubject !== 'ALL' && q.subject !== filterSubject) return false;
    if (searchQuery.trim()) {
      const qText = `Q${q.questionNumber} ${q.questionId} ${q.subject} ${q.questionText || ''}`.toLowerCase();
      if (!qText.includes(searchQuery.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95">
      {/* 1. TOP HEADER SUMMARY & CANDIDATE BANNER */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0c2a5a] via-[#0d3b66] to-[#04193d] text-white shadow-xl border border-blue-900/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 px-3 py-0.5 rounded-full bg-blue-500/30 border border-blue-400/30 text-[11px] font-bold text-blue-200 uppercase tracking-wider">
              <span>{report.examName}</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Roll No: {report.rollNumber}
            </h3>
            <p className="text-xs text-blue-200 font-medium">
              Candidate: <strong>{report.candidateName}</strong> • Shift: <strong>{report.shiftDate}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="px-3.5 py-2 rounded-xl bg-blue-900/70 hover:bg-blue-800 text-blue-100 text-xs font-bold flex items-center space-x-1.5 border border-blue-400/30 transition-colors cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Exam Settings (Marks: +{report.settings.correctMarks}/-{report.settings.negativeMarks.toFixed(2)})</span>
            </button>

            <button
              type="button"
              onClick={onReset}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Check Another</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save Scorecard</span>
            </button>
          </div>
        </div>

        {/* Exam Scoring Settings Accordion Panel */}
        {isSettingsOpen && (
          <div className="mt-4 p-4 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md animate-in fade-in">
            <h5 className="text-xs font-black uppercase tracking-wider text-amber-300 mb-3 flex items-center space-x-2">
              <Sliders className="w-4 h-4" />
              <span>Configure Negative Marking & Correct Marks Scheme</span>
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="text-[11px] font-bold text-blue-100 block mb-1">
                  Marks per Right Answer (+):
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  value={tempCorrectMarks}
                  onChange={(e) => setTempCorrectMarks(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white text-slate-900 rounded-xl font-bold text-sm border border-slate-300 focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-blue-100 block mb-1">
                  Negative Penalty per Wrong Answer (-):
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={tempNegativeMarks}
                  onChange={(e) => setTempNegativeMarks(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white text-slate-900 rounded-xl font-bold text-sm border border-slate-300 focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex-1"
                >
                  Apply & Recalculate
                </button>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-3 py-2.5 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. TOP 5 SUMMARY CARDS: Right, Wrong, Unattended, Total Attempted, Score */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: Right Count */}
        <div className="p-4 rounded-3xl bg-emerald-50 border-2 border-emerald-200 text-center space-y-1 shadow-xs hover:border-emerald-300 transition-all">
          <div className="inline-flex items-center space-x-1 text-emerald-700 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="uppercase tracking-wider">Right</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-950 font-mono">
            {report.rightCount}
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold block">
            +{report.positiveMarks.toFixed(2)} Marks
          </span>
        </div>

        {/* Card 2: Wrong Count */}
        <div className="p-4 rounded-3xl bg-red-50 border-2 border-red-200 text-center space-y-1 shadow-xs hover:border-red-300 transition-all">
          <div className="inline-flex items-center space-x-1 text-red-700 font-bold text-xs">
            <XCircle className="w-4 h-4 text-red-600" />
            <span className="uppercase tracking-wider">Wrong</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-red-950 font-mono">
            {report.wrongCount}
          </div>
          <span className="text-[11px] text-red-700 font-semibold block">
            -{report.negativeMarks.toFixed(2)} Marks
          </span>
        </div>

        {/* Card 3: Unattended Count */}
        <div className="p-4 rounded-3xl bg-slate-50 border-2 border-slate-200 text-center space-y-1 shadow-xs hover:border-slate-300 transition-all">
          <div className="inline-flex items-center space-x-1 text-slate-600 font-bold text-xs">
            <MinusCircle className="w-4 h-4 text-slate-400" />
            <span className="uppercase tracking-wider">Unattended</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-800 font-mono">
            {report.unattendedCount}
          </div>
          <span className="text-[11px] text-slate-500 font-semibold block">
            0 Marks (No Penalty)
          </span>
        </div>

        {/* Card 4: Total Attempted */}
        <div className="p-4 rounded-3xl bg-purple-50 border-2 border-purple-200 text-center space-y-1 shadow-xs hover:border-purple-300 transition-all">
          <div className="inline-flex items-center space-x-1 text-purple-700 font-bold text-xs">
            <Layers className="w-4 h-4 text-purple-600" />
            <span className="uppercase tracking-wider">Total Attempted</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-950 font-mono">
            {report.attempted} <span className="text-sm font-normal text-purple-700">/ {report.totalQuestions}</span>
          </div>
          <span className="text-[11px] text-purple-700 font-semibold block">
            {report.accuracy}% Accuracy
          </span>
        </div>

        {/* Card 5: Net Score */}
        <div className="p-4 rounded-3xl bg-blue-600 border-2 border-blue-700 text-center space-y-1 text-white shadow-lg col-span-2 sm:col-span-1">
          <div className="inline-flex items-center space-x-1 text-blue-100 font-bold text-xs">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span className="uppercase tracking-wider">Net Score</span>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-white font-mono">
            {report.netScore}
          </div>
          <span className="text-[11px] text-blue-100 font-medium block">
            Normalized: ~{report.predictedNormalizedScore}
          </span>
        </div>
      </div>

      {/* 3. SUBJECT-WISE PERFORMANCE ANALYSIS TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-md">
        <div className="p-4 bg-slate-900 text-white font-bold text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <span>Subject-Wise Performance & Accuracy Breakdown</span>
          </div>
          <span className="text-[11px] text-amber-300 font-mono bg-white/10 px-2.5 py-0.5 rounded-full">
            {report.subjectBreakdown.length} Subjects Evaluated
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-3 text-center">Total Questions</th>
                <th className="py-3 px-3 text-center">Attempted</th>
                <th className="py-3 px-3 text-center text-emerald-700">Right</th>
                <th className="py-3 px-3 text-center text-red-700">Wrong</th>
                <th className="py-3 px-3 text-center text-slate-600">Unattended</th>
                <th className="py-3 px-3 text-center">Accuracy</th>
                <th className="py-3 px-4 text-right text-blue-900">Subject Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white font-medium">
              {report.subjectBreakdown.map((sb) => (
                <tr key={sb.subject} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{sb.subject}</td>
                  <td className="py-3 px-3 text-center font-mono">{sb.totalQuestions}</td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">{sb.attempted}</td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-emerald-600">+{sb.right}</td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-red-600">-{sb.wrong}</td>
                  <td className="py-3 px-3 text-center font-mono text-slate-500">{sb.unattended}</td>
                  <td className="py-3 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      sb.accuracy >= 80 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : sb.accuracy >= 60 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {sb.accuracy}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-black text-blue-950 text-sm">
                    {sb.score}
                  </td>
                </tr>
              ))}
              {/* Grand Total Footer Row */}
              <tr className="bg-slate-100/80 font-black text-slate-900 border-t-2 border-slate-300">
                <td className="py-3 px-4">Grand Total</td>
                <td className="py-3 px-3 text-center font-mono">{report.totalQuestions}</td>
                <td className="py-3 px-3 text-center font-mono">{report.attempted}</td>
                <td className="py-3 px-3 text-center font-mono text-emerald-700">+{report.rightCount}</td>
                <td className="py-3 px-3 text-center font-mono text-red-700">-{report.wrongCount}</td>
                <td className="py-3 px-3 text-center font-mono text-slate-600">{report.unattendedCount}</td>
                <td className="py-3 px-3 text-center font-bold text-blue-700">{report.accuracy}%</td>
                <td className="py-3 px-4 text-right font-mono text-blue-700 text-base">
                  {report.netScore}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. QUESTION-WISE RESULTS SECTION WITH FILTERS */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-md space-y-5">
        {/* Controls and Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h4 className="text-lg font-black text-slate-900 tracking-tight flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>Question-Wise Answer Verification List</span>
            </h4>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Verified by comparing Student Chosen Option vs Official Master Key with 1-click manual edit.
            </p>
          </div>

          {/* Search box */}
          <div className="relative w-full lg:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Q#, Subject, ID..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Questions ({report.totalQuestions})
            </button>

            <button
              type="button"
              onClick={() => setFilterStatus('RIGHT')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                filterStatus === 'RIGHT'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Right ({report.rightCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterStatus('WRONG')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                filterStatus === 'WRONG'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-red-50 text-red-800 hover:bg-red-100 border border-red-200'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Wrong ({report.wrongCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterStatus('UNATTENDED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                filterStatus === 'UNATTENDED'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <MinusCircle className="w-3.5 h-3.5" />
              <span>Unattended ({report.unattendedCount})</span>
            </button>
          </div>

          {/* Subject Filter Dropdown */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-500">Subject:</span>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 cursor-pointer focus:ring-2 focus:ring-blue-400"
            >
              <option value="ALL">All Subjects</option>
              {report.subjectBreakdown.map((s) => (
                <option key={s.subject} value={s.subject}>
                  {s.subject} ({s.totalQuestions})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Questions Grid List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
          {filteredQuestions.length === 0 ? (
            <div className="col-span-2 text-center py-10 text-slate-500 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              No questions found matching your filter.
            </div>
          ) : (
            filteredQuestions.map((q) => {
              const isRight = q.status === 'RIGHT';
              const isWrong = q.status === 'WRONG';
              const isUnattended = q.status === 'UNATTENDED';

              return (
                <div
                  key={q.questionNumber}
                  className={`p-4 rounded-2xl border-2 transition-all space-y-3 relative ${
                    isRight
                      ? 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-300'
                      : isWrong
                      ? 'bg-red-50/40 border-red-200 hover:border-red-300'
                      : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Top line: Q# and Status Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-8 h-8 rounded-xl bg-white font-mono font-black text-xs text-slate-900 border border-slate-200 flex items-center justify-center shadow-2xs">
                        Q{q.questionNumber}
                      </span>
                      <div>
                        <span className="text-[11px] font-bold text-slate-700 block leading-tight">
                          {q.subject}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          ID: {q.questionId}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2.5 py-1 rounded-xl text-xs font-black flex items-center space-x-1 ${
                          isRight
                            ? 'bg-emerald-600 text-white'
                            : isWrong
                            ? 'bg-red-600 text-white'
                            : 'bg-slate-300 text-slate-800'
                        }`}
                      >
                        {isRight && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {isWrong && <XCircle className="w-3.5 h-3.5" />}
                        {isUnattended && <MinusCircle className="w-3.5 h-3.5" />}
                        <span>
                          {isRight ? 'RIGHT ✅ (+1.0)' : isWrong ? 'WRONG ❌ (-0.33)' : 'UNATTENDED ⚪ (0)'}
                        </span>
                      </span>

                      {/* Manual Edit Button */}
                      <button
                        type="button"
                        onClick={() => openEditModal(q)}
                        title="Edit question answer"
                        className="p-1.5 rounded-lg bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Question Answers Comparison Card (Student vs Official) */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {/* Student Answer */}
                    <div className={`p-2.5 rounded-xl border ${
                      isRight 
                        ? 'bg-emerald-100/50 border-emerald-200 text-emerald-950' 
                        : isWrong 
                        ? 'bg-red-100/50 border-red-200 text-red-950' 
                        : 'bg-slate-100 border-slate-200 text-slate-700'
                    }`}>
                      <span className="text-[10px] font-bold block text-slate-500 uppercase">
                        Student Answer:
                      </span>
                      <strong className="text-xs font-black">
                        {q.studentAnswer}
                      </strong>
                    </div>

                    {/* Official Correct Answer */}
                    <div className="p-2.5 rounded-xl bg-emerald-100/50 border border-emerald-300 text-emerald-950">
                      <span className="text-[10px] font-bold block text-emerald-800 uppercase flex items-center space-x-1">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Official Correct:</span>
                      </span>
                      <strong className="text-xs font-black text-emerald-900">
                        {q.correctAnswer}
                      </strong>
                    </div>
                  </div>

                  {q.confidenceLow && (
                    <div className="flex items-center space-x-1 text-[11px] text-amber-700 font-semibold bg-amber-50 p-2 rounded-lg border border-amber-200">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Unable to confidently detect answer. Click Edit to verify.</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 5. MANUAL CORRECTION MODAL */}
      {editingQuestion && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-base font-black text-slate-900 flex items-center space-x-2">
                  <Edit3 className="w-4 h-4 text-blue-600" />
                  <span>Manual Question Correction (Q{editingQuestion.questionNumber})</span>
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  Update chosen option or master key. Recalculates instantly.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-medium">
              {/* Field 1: Student Answer */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">
                  Student's Selected Answer:
                </label>
                <select
                  value={tempStudentChoice}
                  onChange={(e) => setTempStudentChoice(e.target.value as StudentOptionChoice)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-400"
                >
                  <option value="Not Attempted">Not Attempted / Blank (Unattended)</option>
                  <option value="Option 1">Option 1</option>
                  <option value="Option 2">Option 2</option>
                  <option value="Option 3">Option 3</option>
                  <option value="Option 4">Option 4</option>
                </select>
              </div>

              {/* Field 2: Official Correct Answer */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">
                  Official Correct Answer (Master Key Green Tick):
                </label>
                <select
                  value={tempCorrectChoice}
                  onChange={(e) => setTempCorrectChoice(e.target.value as QuestionOption)}
                  className="w-full px-3 py-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-950 focus:ring-2 focus:ring-emerald-400"
                >
                  <option value="Option 1">Option 1</option>
                  <option value="Option 2">Option 2</option>
                  <option value="Option 3">Option 3</option>
                  <option value="Option 4">Option 4</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={handleSaveCorrection}
                className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save & Recalculate Score</span>
              </button>
              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
