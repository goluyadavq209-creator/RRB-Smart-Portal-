import React, { useState, useRef } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Zap, 
  Lock, 
  FileText, 
  CheckCircle2, 
  Bell, 
  Rocket, 
  Clock, 
  Headphones, 
  Users, 
  BarChart3, 
  Timer, 
  Phone, 
  Mail, 
  Calendar, 
  Building2, 
  Award, 
  Download, 
  Printer, 
  Share2, 
  X, 
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  HelpCircle,
  FileCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FullRRBDatabase, TabView, ResultItem } from '../types';
import { RailwayLogo } from './RailwayLogo';

interface RollNumberCheckPageProps {
  database: FullRRBDatabase;
  onNavigateTab: (tab: TabView) => void;
  onOpenAdmitCard?: () => void;
  onOpenHelpCenter?: () => void;
}

interface VerificationRecord {
  rollNumber: string;
  candidateName?: string;
  status: 'QUALIFIED' | 'NOT_QUALIFIED';
  zoneName: string;
  examName: string;
  cenNumber?: string;
}

export const RollNumberCheckPage: React.FC<RollNumberCheckPageProps> = ({
  database,
  onNavigateTab,
}) => {
  const [rollInput, setRollInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedResult, setVerifiedResult] = useState<VerificationRecord | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchedQuery, setSearchedQuery] = useState('');
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  const resultCardRef = useRef<HTMLDivElement>(null);

  // Trigger celebration confetti
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#059669', '#34d399', '#22c55e', '#16a34a'],
      });
    } catch {
      // ignore
    }
  };

  const handleVerify = (customRoll?: string) => {
    const targetRoll = (customRoll || rollInput).trim();
    if (!targetRoll) return;

    setIsVerifying(true);
    setHasSearched(true);
    setSearchedQuery(targetRoll);

    setTimeout(() => {
      // 1. Check in database candidateScorecards (uploaded via PDF/Admin)
      const customDbCandidate = database.candidateScorecards?.find(
        (c) => c.rollNumber === targetRoll || c.registrationNo === targetRoll
      );

      // 2. Check in database.results candidateRecords
      let foundInResultsRecord: any = null;
      let matchedResultPanel: any = null;
      for (const res of database.results) {
        const match = res.candidateRecords?.find(
          (c) => c.rollNumber === targetRoll || c.registrationNo === targetRoll
        );
        if (match) {
          foundInResultsRecord = match;
          matchedResultPanel = res;
          break;
        }
        if (
          res.rollNumbersSample?.includes(targetRoll) ||
          res.rollNumbersText?.includes(targetRoll)
        ) {
          matchedResultPanel = res;
          break;
        }
      }

      if (customDbCandidate) {
        const res: VerificationRecord = {
          rollNumber: customDbCandidate.rollNumber,
          candidateName: customDbCandidate.name,
          status: 'QUALIFIED',
          zoneName: customDbCandidate.zoneName || 'RRB Central Regional Zone',
          examName: customDbCandidate.examName || 'RRB Centralized Examination',
          cenNumber: customDbCandidate.cenNumber,
        };
        setVerifiedResult(res);
        triggerConfetti();
      } else if (foundInResultsRecord) {
        const res: VerificationRecord = {
          rollNumber: foundInResultsRecord.rollNumber,
          candidateName: foundInResultsRecord.name,
          status: 'QUALIFIED',
          zoneName: matchedResultPanel?.zoneName || foundInResultsRecord.zoneName || 'RRB Regional Board',
          examName: matchedResultPanel?.examTitle || foundInResultsRecord.examName || 'RRB Centralized Exam',
          cenNumber: matchedResultPanel?.cenNumber || foundInResultsRecord.cenNumber,
        };
        setVerifiedResult(res);
        triggerConfetti();
      } else if (matchedResultPanel) {
        const res: VerificationRecord = {
          rollNumber: targetRoll,
          status: 'QUALIFIED',
          zoneName: matchedResultPanel.zoneName || 'RRB Regional Zone',
          examName: matchedResultPanel.examTitle || 'RRB Centralized Examination',
          cenNumber: matchedResultPanel.cenNumber,
        };
        setVerifiedResult(res);
        triggerConfetti();
      } else {
        setVerifiedResult(null);
      }
      setIsVerifying(false);

      if (resultCardRef.current) {
        resultCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 400);
  };

  const handlePrintScorecard = () => {
    window.print();
  };

  const handleShareResult = () => {
    const text = `RRB Roll Number Check for: ${searchedQuery} - ${verifiedResult ? `You Selected (${verifiedResult.zoneName} - ${verifiedResult.examName})` : 'You Not Selected'}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 selection:bg-blue-600 selection:text-white">
      
      {/* 1. TOP NAVIGATION HEADER (Matching Screenshot - NO LOGIN OPTION) */}
      <header className="bg-[#0b2559] text-white sticky top-0 z-40 shadow-md border-b border-blue-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            
            {/* Left: RRB Portal Logo + Emblem */}
            <div 
              onClick={() => onNavigateTab('home')}
              className="flex items-center space-x-3 cursor-pointer group select-none"
            >
              <div className="w-10 h-10 rounded-full bg-white p-1 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                <RailwayLogo className="w-8 h-8" />
              </div>
              <div className="flex flex-col">
                <span className="text-base sm:text-lg font-black tracking-wider text-white uppercase flex items-center gap-1.5">
                  RRB PORTAL
                </span>
                <span className="text-[10px] text-blue-200 font-medium tracking-tight">
                  Railway Recruitment Board
                </span>
              </div>
            </div>

            {/* Center/Right Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1 sm:space-x-2">
              <button
                type="button"
                onClick={() => onNavigateTab('home')}
                className="px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-blue-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                Home
              </button>

              <button
                type="button"
                className="px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold text-white bg-blue-600/60 border-b-2 border-blue-400 cursor-default"
              >
                Roll Number Check
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('results')}
                className="px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-blue-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                Results
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('exams')}
                className="px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-blue-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                Admit Card
              </button>

              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-blue-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                Help Center
              </button>
            </nav>

            {/* Mobile Quick Home Link */}
            <div className="flex md:hidden items-center space-x-2">
              <button
                type="button"
                onClick={() => onNavigateTab('home')}
                className="text-xs bg-white/15 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-white/20 transition-colors cursor-pointer"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION WITH WATERMARK BACKGROUND & DUAL-COLUMN CARD */}
      <section className="relative overflow-hidden pt-8 pb-12 sm:pt-12 sm:pb-16 bg-gradient-to-b from-[#ebf3ff] via-[#f4f8ff] to-white border-b border-slate-200">
        
        {/* Background Train Silhouette Accent */}
        <div className="absolute right-0 top-0 w-1/2 h-full opacity-10 pointer-events-none hidden lg:block overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1596825205490-77a33a30364d?auto=format&fit=crop&w=1200&q=80" 
            alt="Indian Railways" 
            className="w-full h-full object-cover object-left filter grayscale"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Column (7 cols): Hero Headings, Hindi Subtitle & 3 Feature Badges */}
            <div className="lg:col-span-7 space-y-5 sm:space-y-6">
              
              {/* Pill Badge: Direct Verification */}
              <div className="inline-flex items-center space-x-2 bg-[#0b2559] text-white px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider uppercase shadow-xs">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>DIRECT VERIFICATION</span>
              </div>

              {/* Huge Headline: Roll Number Check */}
              <div className="space-y-1">
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-950">
                  Roll Number <span className="text-blue-600">Check</span>
                </h1>
                <p className="text-base sm:text-xl font-bold text-slate-600">
                  Direct Roll Number Verification
                </p>
              </div>

              {/* Hindi Prompt */}
              <p className="text-base sm:text-lg font-extrabold text-slate-800">
                अपना Roll Number डालें और तुरंत परिणाम देखें
              </p>

              {/* 3 Interactive Feature Pills */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2">
                
                {/* 1. Instant Result */}
                <div className="flex items-center space-x-2.5 bg-white/90 backdrop-blur-xs border border-blue-100 rounded-full py-2 px-4 shadow-2xs">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 fill-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-black text-slate-900 leading-tight">Instant Result</div>
                    <div className="text-[10px] text-slate-500 font-semibold">तुरंत परिणाम</div>
                  </div>
                </div>

                {/* 2. Secure & Safe */}
                <div className="flex items-center space-x-2.5 bg-white/90 backdrop-blur-xs border border-emerald-100 rounded-full py-2 px-4 shadow-2xs">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-black text-slate-900 leading-tight">Secure & Safe</div>
                    <div className="text-[10px] text-slate-500 font-semibold">100% सुरक्षित</div>
                  </div>
                </div>

                {/* 3. Private Data */}
                <div className="flex items-center space-x-2.5 bg-white/90 backdrop-blur-xs border border-purple-100 rounded-full py-2 px-4 shadow-2xs">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                    <Lock className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-black text-slate-900 leading-tight">Private Data</div>
                    <div className="text-[10px] text-slate-500 font-semibold">आपका डेटा सुरक्षित</div>
                  </div>
                </div>

              </div>

            </div>

            {/* Right Column (5 cols): The Clean White Roll Number Verification Card */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xl space-y-6 relative">
                
                {/* Header Icon + Titles */}
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white mx-auto flex items-center justify-center shadow-lg relative">
                    <FileText className="w-8 h-8" />
                    <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center shadow-xs">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900">
                      Enter Roll Number
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium">
                      Please enter your roll number to verify
                    </p>
                  </div>
                </div>

                {/* Form Input & Action Button */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleVerify();
                  }}
                  className="space-y-4"
                >
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Search className="w-5 h-5" />
                    </div>
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={rollInput}
                      onChange={(e) => {
                        const digitsOnly = e.target.value.replace(/\D/g, '');
                        setRollInput(digitsOnly);
                      }}
                      placeholder="Enter Roll Number (Digits only)"
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50/80 border border-slate-300 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100 rounded-xl text-slate-900 placeholder:text-slate-400 font-bold text-sm tracking-wide transition-all outline-hidden font-mono"
                      required
                      autoComplete="off"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isVerifying || !rollInput.trim()}
                    className="w-full py-4 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black text-sm tracking-wider uppercase shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center space-x-2"
                  >
                    {isVerifying ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>VERIFYING RECORD...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        <span>CHECK ROLL NUMBER</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Footer Safe Message */}
                <div className="pt-2 flex items-center justify-center space-x-1.5 text-xs text-slate-600 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Your information is safe with us</span>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. VERIFIED RESULT CARD DISPLAY (When candidate searches) */}
      {hasSearched && (
        <div ref={resultCardRef} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          {verifiedResult ? (
            <div className="bg-white rounded-3xl border-2 border-emerald-500 shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-300">
              
              {/* Top Row: Roll Number & Actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Roll Number:</span>
                  <span className="text-base sm:text-lg font-mono font-black text-slate-900">{verifiedResult.rollNumber}</span>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={handlePrintScorecard}
                    className="p-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleShareResult}
                    className="p-2.5 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                </div>
              </div>

              {/* Exact Requested Display: "You Selected" in GREEN + Zone Name & Exam Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                
                {/* 1. "You Selected" in GREEN colour */}
                <div className="bg-emerald-50 border-2 border-emerald-500 p-6 rounded-2xl flex flex-col items-center justify-center text-center shadow-xs">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-2 shadow-md">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
                    You Selected
                  </div>
                  <div className="text-xs font-bold text-emerald-700 mt-1">
                    Qualified for Next Stage
                  </div>
                </div>

                {/* 2. Zone Name & Exam Name (Uploaded details) */}
                <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex flex-col justify-center space-y-3.5 shadow-xs">
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Zone Name</span>
                    </div>
                    <div className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                      {verifiedResult.zoneName}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200/70">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>Exam Name</span>
                    </div>
                    <div className="text-base sm:text-lg font-black text-blue-900 mt-0.5">
                      {verifiedResult.examName}
                    </div>
                    {verifiedResult.cenNumber && (
                      <div className="text-xs font-semibold text-slate-500 mt-0.5">
                        {verifiedResult.cenNumber}
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          ) : (
            /* Exact Requested Display: "You Not Selected" in RED colour */
            <div className="bg-white rounded-3xl border-2 border-red-500 shadow-2xl p-8 text-center space-y-5 animate-in fade-in zoom-in-95 duration-300">
              
              <div className="bg-red-50 border-2 border-red-500 p-6 rounded-2xl flex flex-col items-center justify-center text-center shadow-xs max-w-lg mx-auto">
                <div className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center mb-3 shadow-md">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-red-600 tracking-tight">
                  You Not Selected
                </div>
                <div className="text-xs font-bold text-red-700 mt-1">
                  Roll Number: <span className="font-mono">{searchedQuery}</span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-md mx-auto">
                यह Roll Number चयनित सूची में उपलब्ध नहीं है। कृपया अपना रोल नंबर पुनः जांचें।
              </p>

              <div className="pt-2 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => onNavigateTab('results')}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-extrabold hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  View Zonal Results
                </button>
                <button
                  type="button"
                  onClick={() => setHasSearched(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. IMPORTANT NOTICE BANNER (Yellow Highlight Card from Screenshot) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <div className="bg-[#fffbeb] border border-[#fef08a] rounded-2xl p-4 sm:p-5 flex items-start sm:items-center space-x-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-full bg-[#fde047]/40 text-amber-700 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 fill-amber-500 text-amber-600" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-amber-900">
              Important Notice
            </h4>
            <p className="text-xs sm:text-sm font-semibold text-amber-800 mt-0.5">
              कृपया अपना सही Roll Number दर्ज करें। गलत Roll Number दर्ज करने पर परिणाम नहीं दिखेगा।
            </p>
          </div>
        </div>
      </section>

      {/* 5. "हमारी विशेषताएं" (OUR FEATURES) 4-CARD SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 w-full">
        
        {/* Decorative Centered Heading */}
        <div className="flex items-center justify-center space-x-4 mb-8 sm:mb-12">
          <div className="w-12 sm:w-20 h-px bg-slate-300" />
          <h3 className="text-lg sm:text-2xl font-black text-slate-900 tracking-wide">
            हमारी विशेषताएं
          </h3>
          <div className="w-12 sm:w-20 h-px bg-slate-300" />
        </div>

        {/* 4 Clean Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          
          {/* Card 1: Fast Verification */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 hover:border-emerald-300 hover:shadow-lg transition-all text-center flex flex-col items-center justify-center space-y-3 group">
            <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <Rocket className="w-7 h-7" />
            </div>
            <h4 className="font-black text-base text-slate-900">
              Fast Verification
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
              हमारी सिस्टम से सेकंडों में Roll Number Verify करें
            </p>
          </div>

          {/* Card 2: 100% Secure */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 hover:border-blue-300 hover:shadow-lg transition-all text-center flex flex-col items-center justify-center space-y-3 group">
            <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h4 className="font-black text-base text-slate-900">
              100% Secure
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
              आपकी जानकारी पूरी तरह से सुरक्षित और एन्क्रिप्टेड है
            </p>
          </div>

          {/* Card 3: 24x7 Available */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 hover:border-purple-300 hover:shadow-lg transition-all text-center flex flex-col items-center justify-center space-y-3 group">
            <div className="w-14 h-14 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <Clock className="w-7 h-7" />
            </div>
            <h4 className="font-black text-base text-slate-900">
              24x7 Available
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
              हमारी सेवा 24x7 उपलब्ध है, कभी भी इस्तेमाल करें
            </p>
          </div>

          {/* Card 4: Help Support */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 hover:border-orange-300 hover:shadow-lg transition-all text-center flex flex-col items-center justify-center space-y-3 group">
            <div className="w-14 h-14 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <Headphones className="w-7 h-7" />
            </div>
            <h4 className="font-black text-base text-slate-900">
              Help Support
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
              किसी भी समस्या के लिए हमारी सहायता टीम उपलब्ध है
            </p>
          </div>

        </div>
      </section>

      {/* 6. BLUE STATS STRIP (10M+ Students Verified, 99.9% Success Rate, etc.) */}
      <section className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white py-8 sm:py-10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            
            {/* Stat 1: 10M+ */}
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-white">10M+</div>
                <div className="text-xs text-blue-100 font-medium">Students Verified</div>
              </div>
            </div>

            {/* Stat 2: 99.9% */}
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-white">99.9%</div>
                <div className="text-xs text-blue-100 font-medium">Success Rate</div>
              </div>
            </div>

            {/* Stat 3: 2 Sec */}
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
                <Timer className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-white">2 Sec</div>
                <div className="text-xs text-blue-100 font-medium">Average Time</div>
              </div>
            </div>

            {/* Stat 4: 100% */}
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-white">100%</div>
                <div className="text-xs text-blue-100 font-medium">Secure & Safe</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 7. FULL FOOTER (Matching Screenshot Layout) */}
      <footer className="bg-[#0b1b3d] text-slate-300 pt-12 pb-8 border-t border-blue-950 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-12 border-b border-slate-800">
            
            {/* Col 1: Brand & Bio */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-white p-1 flex items-center justify-center">
                  <RailwayLogo className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-black text-white tracking-wider text-base uppercase">
                    RRB PORTAL
                  </h4>
                  <p className="text-[11px] text-blue-300">
                    Railway Recruitment Board
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                Official portal for roll number verification, examination notifications, cut-off marks, and candidate services across all 21 Regional Railway Recruitment Boards.
              </p>
            </div>

            {/* Col 2: Quick Links */}
            <div className="space-y-3">
              <h5 className="font-extrabold text-white text-xs uppercase tracking-wider">
                Quick Links
              </h5>
              <ul className="space-y-2 text-xs">
                <li>
                  <button 
                    type="button" 
                    onClick={() => onNavigateTab('home')}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Home
                  </button>
                </li>
                <li>
                  <span className="text-blue-400 font-bold">
                    Roll Number Check
                  </span>
                </li>
                <li>
                  <button 
                    type="button" 
                    onClick={() => onNavigateTab('results')}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Results
                  </button>
                </li>
                <li>
                  <button 
                    type="button" 
                    onClick={() => onNavigateTab('exams')}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Admit Card
                  </button>
                </li>
                <li>
                  <button 
                    type="button" 
                    onClick={() => onNavigateTab('notices')}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Answer Key
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Important Links */}
            <div className="space-y-3">
              <h5 className="font-extrabold text-white text-xs uppercase tracking-wider">
                Important Links
              </h5>
              <ul className="space-y-2 text-xs">
                <li>
                  <a 
                    href="https://rrb.indianrailways.gov.in" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                  >
                    <span>RRB Official Website</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </a>
                </li>
                <li>
                  <button 
                    type="button" 
                    onClick={() => onNavigateTab('exams')}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Exam Calendar
                  </button>
                </li>
                <li>
                  <button 
                    type="button" 
                    onClick={() => onNavigateTab('exams')}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Syllabus
                  </button>
                </li>
                <li>
                  <button 
                    type="button" 
                    onClick={() => onNavigateTab('notices')}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Latest Updates
                  </button>
                </li>
                <li>
                  <button 
                    type="button" 
                    onClick={() => setShowHelpModal(true)}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Help Center
                  </button>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom Copyright */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
            <div>
              © 2024 RRB Portal. All Rights Reserved.
            </div>
            <div className="text-slate-400">
              Made with <span className="text-red-500">❤️</span> for Students
            </div>
          </div>
        </div>
      </footer>

      {/* Help Center Dialog Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-lg text-slate-900">
                  RRB Candidate Help Center
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowHelpModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100">
                <span className="font-bold text-slate-900 block mb-1">रोल नंबर कहां मिलेगा?</span>
                आपका Roll Number आपके E-Admit Card / Hall Ticket पर 11 या 15 अंकों में मुद्रित होता है।
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">परिणाम नहीं दिख रहा है?</span>
                कृपया सुनिश्चित करें कि आपने वही रोल नंबर दर्ज किया है जो आपके संबंधित रेलवे भर्ती बोर्ड (RRB) जोन के प्रवेश पत्र पर दिया गया है।
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-extrabold text-xs uppercase cursor-pointer hover:bg-blue-700"
            >
              Close Help Center
            </button>
          </div>
        </div>
      )}

      {/* Share Toast */}
      {showShareToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Result Details Copied to Clipboard!</span>
        </div>
      )}

    </div>
  );
};
