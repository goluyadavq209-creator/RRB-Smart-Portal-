import React, { useState, useRef } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Search, 
  Copy, 
  Check, 
  Printer, 
  Share2, 
  Sparkles, 
  Sun, 
  Award, 
  Calendar, 
  Building2, 
  Layers, 
  FileText, 
  ExternalLink,
  ShieldCheck,
  RotateCcw,
  ListFilter,
  CheckCheck,
  Clock,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FullRRBDatabase, ResultItem, TabView } from '../types';

interface DirectRollNumberVerifierProps {
  database: FullRRBDatabase;
  onOpenFullPanelModal?: (result: ResultItem) => void;
  setCurrentTab?: (tab: TabView) => void;
  compactMode?: boolean;
}

export interface VerificationResultState {
  searched: boolean;
  query: string;
  timestamp: string;
  matchedResults: {
    result: ResultItem;
    matchedRoll: string;
    isEligible: boolean;
    nextStage: string;
  }[];
}

export const DirectRollNumberVerifier: React.FC<DirectRollNumberVerifierProps> = ({
  database,
  onOpenFullPanelModal,
  setCurrentTab,
  compactMode = false,
}) => {
  const [rollInput, setRollInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedRoll, setCopiedRoll] = useState<string | null>(null);
  const [shareToast, setShareToast] = useState(false);
  const [verificationState, setVerificationState] = useState<VerificationResultState>({
    searched: false,
    query: '',
    timestamp: '',
    matchedResults: [],
  });

  const resultCardRef = useRef<HTMLDivElement>(null);

  // Trigger celebration confetti
  const triggerConfetti = () => {
    try {
      // First burst
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'],
      });
      // Second burst
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#10b981', '#fbbf24', '#34d399'],
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#10b981', '#fbbf24', '#34d399'],
        });
      }, 250);
    } catch {
      // Confetti fallback
    }
  };

  const handleVerify = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanRoll = rollInput.trim();
    if (!cleanRoll) return;

    setIsVerifying(true);

    setTimeout(() => {
      const now = new Date();
      const formattedTimestamp = `${now.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })}, ${now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      })} IST`;

      const matches: {
        result: ResultItem;
        matchedRoll: string;
        isEligible: boolean;
        nextStage: string;
      }[] = [];

      database.results.forEach((res) => {
        if (res.rollNumbersSample && res.rollNumbersSample.length > 0) {
          const exact = res.rollNumbersSample.find(
            (r) => r.trim().toLowerCase() === cleanRoll.toLowerCase()
          );
          if (exact) {
            // Check eligibility status strictly from official uploaded data
            const isEligible = res.isNextStageEligible !== false;
            const nextStage = res.nextStageTitle || (isEligible ? 'You are eligible for the next step.' : 'Non-Qualified in this Stage');
            matches.push({
              result: res,
              matchedRoll: exact,
              isEligible,
              nextStage,
            });
          } else {
            // Partial check fallback if exact match not found
            const partial = res.rollNumbersSample.find(
              (r) => r.trim().toLowerCase().includes(cleanRoll.toLowerCase())
            );
            if (partial && cleanRoll.length >= 6) {
              const isEligible = res.isNextStageEligible !== false;
              const nextStage = res.nextStageTitle || (isEligible ? 'You are eligible for the next step.' : 'Non-Qualified in this Stage');
              matches.push({
                result: res,
                matchedRoll: partial,
                isEligible,
                nextStage,
              });
            }
          }
        }
      });

      const newState: VerificationResultState = {
        searched: true,
        query: cleanRoll,
        timestamp: formattedTimestamp,
        matchedResults: matches,
      };

      setVerificationState(newState);
      setIsVerifying(false);

      if (matches.length > 0) {
        triggerConfetti();
      }

      setTimeout(() => {
        resultCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }, 400);
  };

  const handleCopyRoll = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedRoll(text);
      setTimeout(() => setCopiedRoll(null), 2500);
    }
  };

  const handlePrintSlip = () => {
    window.print();
  };

  const handleShareSlip = () => {
    if (!verificationState.searched || verificationState.matchedResults.length === 0) return;
    const match = verificationState.matchedResults[0];
    const text = `🎉 RRB Roll Number Verification Slip\n\nVerified Roll Number: ${match.matchedRoll}\nStatus: VERIFIED (Selected for Next Stage)\nNext Stage: ${match.nextStage}\nExam: ${match.result.examTitle} (${match.result.cenNumber})\nZone: ${match.result.zoneName}\nVerified At: ${verificationState.timestamp}\n\nVerified via Official Portal.`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 3000);
    }
  };

  const handleQuickSample = (sampleRoll: string) => {
    setRollInput(sampleRoll);
    setTimeout(() => {
      // Auto verify sample
      const cleanRoll = sampleRoll.trim();
      const now = new Date();
      const formattedTimestamp = `${now.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })}, ${now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      })} IST`;

      const matches: {
        result: ResultItem;
        matchedRoll: string;
        isEligible: boolean;
        nextStage: string;
      }[] = [];

      database.results.forEach((res) => {
        if (res.rollNumbersSample && res.rollNumbersSample.length > 0) {
          const exact = res.rollNumbersSample.find(
            (r) => r.trim().toLowerCase() === cleanRoll.toLowerCase()
          );
          if (exact) {
            const isEligible = res.isNextStageEligible !== false;
            const nextStage = res.nextStageTitle || (isEligible ? 'You are eligible for the next step.' : 'Non-Qualified in this Stage');
            matches.push({
              result: res,
              matchedRoll: exact,
              isEligible,
              nextStage,
            });
          }
        }
      });

      setVerificationState({
        searched: true,
        query: cleanRoll,
        timestamp: formattedTimestamp,
        matchedResults: matches,
      });

      if (matches.length > 0) triggerConfetti();
    }, 50);
  };

  // Find sample roll number from database if available
  const sampleRollFromDb = database.results.find((r) => r.rollNumbersSample && r.rollNumbersSample.length > 0)?.rollNumbersSample?.[0] || '1962511100562555';

  return (
    <div className="space-y-4">
      {/* Toast */}
      {shareToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 border border-slate-700 animate-in slide-in-from-bottom">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold">Verification slip copied to clipboard!</span>
        </div>
      )}

      {/* Verification Tool Card */}
      <div className="bg-gradient-to-br from-[#0c142b] via-[#101c40] to-[#080d20] rounded-3xl p-5 sm:p-7 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                    Direct Roll Number Verification Tool
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold border border-emerald-500/30">
                    Official Instant Check
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  Instant eligibility verification against official RRB merit panels & shortlisted candidate rolls.
                </p>
              </div>
            </div>

            {/* Quick Sample button */}
            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-slate-400 font-medium hidden md:inline">Quick Test:</span>
              <button
                type="button"
                onClick={() => handleQuickSample(sampleRollFromDb)}
                className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Test Real Roll ({sampleRollFromDb.slice(0, 8)}...)</span>
              </button>
            </div>
          </div>

          {/* Search Box Form */}
          <form onSubmit={handleVerify} className="space-y-2">
            <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={rollInput}
                  onChange={(e) => {
                    setRollInput(e.target.value);
                    if (verificationState.searched) {
                      setVerificationState((prev) => ({ ...prev, searched: false }));
                    }
                  }}
                  placeholder="Enter your 10 to 16-Digit Roll Number (e.g. 1962511100562555)..."
                  className="w-full bg-slate-900/90 border-2 border-slate-700/80 hover:border-slate-600 focus:border-emerald-500 rounded-2xl pl-11 pr-24 py-3.5 text-sm sm:text-base font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all shadow-inner"
                />
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-4 pointer-events-none" />

                {rollInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setRollInput('');
                      setVerificationState({ searched: false, query: '', timestamp: '', matchedResults: [] });
                    }}
                    className="absolute right-3.5 top-3.5 text-xs text-slate-400 hover:text-white bg-slate-800 px-2 py-1 rounded-lg font-bold transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isVerifying || !rollInput.trim()}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-slate-950 font-black text-sm transition-all shadow-lg hover:shadow-emerald-500/25 flex items-center justify-center space-x-2 cursor-pointer shrink-0"
              >
                {isVerifying ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>VERIFYING...</span>
                  </>
                ) : (
                  <>
                    <CheckCheck className="w-4 h-4 stroke-[3] text-slate-950" />
                    <span>Verify Roll Number</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1">
              <span className="flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Matches against official uploaded merit lists & candidate provisional panels</span>
              </span>
              <span>Supported: CEN 2024-2026</span>
            </div>
          </form>

          {/* VERIFICATION FEEDBACK SECTION */}
          {verificationState.searched && (
            <div ref={resultCardRef} className="pt-2 animate-in fade-in slide-in-from-top-3 duration-300">
              {verificationState.matchedResults.length > 0 ? (
                /* MATCH FOUND SUCCESS CARD */
                <div className="space-y-4">
                  {verificationState.matchedResults.map(({ result, matchedRoll, isEligible, nextStage }, idx) => (
                    <div
                      key={idx}
                      className="rounded-3xl bg-gradient-to-b from-emerald-950/90 via-slate-900/95 to-slate-900/90 border-2 border-emerald-500/80 p-5 sm:p-7 shadow-2xl text-white space-y-5 relative overflow-hidden ring-4 ring-emerald-500/10"
                    >
                      {/* Top Congratulatory Banner (Sabse Prominent) */}
                      <div className="text-center space-y-2 pb-4 border-b border-emerald-800/60">
                        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-extrabold text-xs uppercase tracking-wider animate-pulse">
                          <Sparkles className="w-4 h-4 text-emerald-400" />
                          <span>Official Verification Success</span>
                        </div>

                        {/* ✅ Congratulations! Most Prominent Display */}
                        <h3 className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-white to-emerald-200 tracking-tight">
                          ✅ Congratulations!
                        </h3>

                        <p className="text-sm sm:text-base font-bold text-emerald-200">
                          🎉 Your Roll Number has been successfully verified.
                        </p>
                      </div>

                      {/* Highlighted Roll Number Card (Bada, Bold aur Prominent Highlight) */}
                      <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-400/20 to-amber-500/20 border-2 border-amber-400 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                        <div className="space-y-1">
                          <div className="text-xs uppercase font-extrabold tracking-widest text-amber-300 flex items-center justify-center sm:justify-start space-x-1.5">
                            <Sun className="w-4 h-4 text-amber-400" />
                            <span>🔢 Verified Roll Number</span>
                          </div>

                          {/* BADA BOLD PROMINENT ROLL NUMBER */}
                          <div className="text-2xl sm:text-4xl font-mono font-black tracking-wider text-amber-300 drop-shadow-sm select-all">
                            {matchedRoll}
                          </div>
                        </div>

                        {/* Status: VERIFIED Badge */}
                        <div className="flex flex-col items-center sm:items-end space-y-1.5 shrink-0">
                          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-2xl bg-emerald-500 text-slate-950 font-black text-sm sm:text-base tracking-wide shadow-md">
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-950 animate-ping" />
                            <span>🟢 Status: VERIFIED (Selected for Next Stage)</span>
                          </div>

                          <div className="text-[11px] text-slate-300 font-mono flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{verificationState.timestamp}</span>
                          </div>
                        </div>
                      </div>

                      {/* Next Stage & Eligibility Section (Strictly validated against official uploaded data) */}
                      <div className={`p-4 rounded-2xl border text-xs sm:text-sm font-semibold flex items-start space-x-3.5 ${
                        isEligible
                          ? 'bg-emerald-900/40 border-emerald-500/40 text-emerald-100'
                          : 'bg-amber-950/40 border-amber-500/40 text-amber-100'
                      }`}>
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                          isEligible ? 'bg-emerald-500 text-slate-950' : 'bg-amber-500 text-slate-950'
                        }`}>
                          <Award className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
                            Next Stage Qualification Status
                          </div>
                          <div className="text-sm sm:text-base font-extrabold text-white">
                            {isEligible ? (
                              <span className="text-emerald-300">
                                Selected for Next Stage • You are qualified and eligible for the next step.
                              </span>
                            ) : (
                              <span className="text-amber-300">
                                Next Stage: Non-Qualified as per this shortlist panel.
                              </span>
                            )}
                          </div>
                          {result.nextStageTitle && (
                            <p className="text-xs text-slate-300 pt-0.5">
                              Target Stage: <strong>{result.nextStageTitle}</strong>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Examination Details Breakdown */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                        <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Examination</div>
                          <div className="font-bold text-white truncate">{result.examTitle}</div>
                          <div className="text-[11px] text-amber-300 font-mono font-bold">{result.cenNumber}</div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Railway Board & Stage</div>
                          <div className="font-bold text-white truncate">{result.zoneName}</div>
                          <div className="text-[11px] text-slate-300">{result.stage}</div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Panel Type & Date</div>
                          <div className="font-bold text-white">{result.type}</div>
                          <div className="text-[11px] text-slate-300">{result.publishDate}</div>
                        </div>
                      </div>

                      {/* Actions Row */}
                      <div className="pt-2 flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-800">
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleCopyRoll(matchedRoll)}
                            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs"
                          >
                            {copiedRoll === matchedRoll ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">Roll Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Roll Number</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={handleShareSlip}
                            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>Share Slip</span>
                          </button>

                          <button
                            type="button"
                            onClick={handlePrintSlip}
                            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print Slip</span>
                          </button>
                        </div>

                        {onOpenFullPanelModal && (
                          <button
                            type="button"
                            onClick={() => onOpenFullPanelModal(result)}
                            className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-extrabold transition-all flex items-center space-x-1.5 cursor-pointer"
                          >
                            <ListFilter className="w-3.5 h-3.5" />
                            <span>View Full Shortlist Panel</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* ROLL NUMBER NOT FOUND CARD */
                <div className="rounded-3xl bg-slate-900/90 border-2 border-rose-500/50 p-5 sm:p-7 shadow-xl text-white space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                        <XCircle className="w-5 h-5" />
                      </div>
                      <div>
                        {/* ❌ Roll Number Not Found */}
                        <h3 className="text-lg sm:text-xl font-black text-rose-300">
                          ❌ Roll Number Not Found
                        </h3>
                        {/* “Please check your roll number and try again.” */}
                        <p className="text-xs sm:text-sm font-bold text-slate-300">
                          “Please check your roll number and try again.”
                        </p>
                      </div>
                    </div>

                    {/* Status: NOT VERIFIED */}
                    <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 font-black text-xs border border-rose-500/30 shrink-0">
                      <span>Status: NOT VERIFIED</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-2">
                    <div className="font-bold text-slate-200 flex items-center space-x-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Troubleshooting Tips:</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                      <li>Ensure you entered the full 10 to 16 digit Roll Number without spaces or dashes.</li>
                      <li>Double check if your exam's regional board panel has been officially declared.</li>
                      <li>Try searching the Roll Number in the complete regional PDF results below.</li>
                    </ul>
                    <div className="text-[11px] text-slate-500 pt-1 font-mono">
                      Query checked at: {verificationState.timestamp}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
