import React, { useState, useMemo } from 'react';
import { 
  Award, 
  Search, 
  Filter, 
  FileText, 
  CheckCircle2, 
  Download, 
  ExternalLink, 
  Users, 
  Calendar, 
  ArrowRight,
  Sun,
  Copy,
  Check,
  X,
  ListFilter,
  SearchCode,
  Sparkles,
  Building2,
  RefreshCw,
  Layers,
  FileCheck2,
  ChevronDown
} from 'lucide-react';
import { FullRRBDatabase, ResultItem, ResultType, TabView } from '../types';
import { PdfViewerModal } from './PdfViewerModal';
import { RailwayLogo } from './RailwayLogo';

interface ResultsSectionProps {
  database: FullRRBDatabase;
  selectedZoneFilter: string;
  setSelectedZoneFilter: (zone: string) => void;
  setCurrentTab: (tab: TabView) => void;
}

export const ResultsSection: React.FC<ResultsSectionProps> = ({
  database,
  selectedZoneFilter,
  setSelectedZoneFilter,
  setCurrentTab,
}) => {
  // 1. Dynamic Extraction of Available Options from Database
  const availableExams = useMemo(() => {
    const set = new Set<string>();
    set.add('All Exams');
    set.add('NTPC (Graduate)');
    set.add('NTPC (Under Graduate)');
    set.add('ALP (Assistant Loco Pilot)');
    set.add('Technician Gr I & III');
    set.add('RRB Group D (Level-1)');
    set.add('RRB JE (Junior Engineer)');
    set.add('RPF SI & Constable');
    set.add('Paramedical Categories');

    database.results.forEach((r) => {
      if (r.examTitle) set.add(r.examTitle);
    });
    database.exams.forEach((e) => {
      if (e.shortCode) set.add(e.shortCode);
      if (e.title) set.add(e.title.split('-')[0].trim());
    });
    return Array.from(set);
  }, [database.results, database.exams]);

  const availableYears = useMemo(() => {
    const set = new Set<string>();
    set.add('All Years');
    set.add('2025');
    set.add('2024');
    set.add('2022');
    set.add('2019');
    set.add('2018');

    database.results.forEach((r) => {
      if (r.publishDate) {
        const yr = r.publishDate.match(/\b(20\d\d)\b/);
        if (yr) set.add(yr[1]);
      }
    });
    return Array.from(set);
  }, [database.results]);

  const availableStages = useMemo(() => {
    const set = new Set<string>();
    set.add('All Stages');
    set.add('CBT-1 Merit List');
    set.add('CBT-2 (Part-A)');
    set.add('CBAT / Psycho Test');
    set.add('Typing Skill Test');
    set.add('Document Verification (DV)');
    set.add('Final Provisional Panel');
    set.add('Replacement Panel');

    database.results.forEach((r) => {
      if (r.stage) set.add(r.stage);
    });
    return Array.from(set);
  }, [database.results]);

  // 2. Filter States
  const [selectedExam, setSelectedExam] = useState<string>('All Exams');
  const [selectedYear, setSelectedYear] = useState<string>('All Years');
  const [selectedStage, setSelectedStage] = useState<string>('All Stages');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedZone, setSelectedZone] = useState<string>(
    selectedZoneFilter && selectedZoneFilter !== 'ALL' ? selectedZoneFilter : 'ALL'
  );
  const [searchQuery, setSearchQuery] = useState('');

  // 3. Modals & UI States
  const [activePdfPreview, setActivePdfPreview] = useState<{ title: string; source: string; text?: string } | null>(null);
  const [activeRollModalResult, setActiveRollModalResult] = useState<ResultItem | null>(null);
  const [rollModalSearch, setRollModalSearch] = useState('');
  const [copiedRoll, setCopiedRoll] = useState<string | null>(null);

  // Synchronize zone selection when selectedZoneFilter changes from parent
  React.useEffect(() => {
    if (selectedZoneFilter && selectedZoneFilter !== selectedZone) {
      setSelectedZone(selectedZoneFilter);
    }
  }, [selectedZoneFilter]);

  const resultTypes: { label: string; value: string }[] = [
    { label: 'All Results', value: 'ALL' },
    { label: 'Merit List PDF', value: 'Merit List PDF' },
    { label: 'Scorecard Link', value: 'Individual Scorecard Link' },
    { label: 'DV Shortlist', value: 'DV Schedule & Shortlist' },
    { label: 'Provisional Panel', value: 'Final Provisional Panel' },
    { label: 'Replacement Panel', value: 'Replacement Panel' },
  ];

  // Helper to highlight search match in golden morning yellow
  const renderHighlightedText = (text: string, query: string) => {
    if (!query || !query.trim()) {
      return <span>{text}</span>;
    }
    const cleanQ = query.trim();
    const index = text.toLowerCase().indexOf(cleanQ.toLowerCase());
    if (index === -1) {
      return <span>{text}</span>;
    }
    const before = text.substring(0, index);
    const match = text.substring(index, index + cleanQ.length);
    const after = text.substring(index + cleanQ.length);

    return (
      <span>
        {before}
        <mark className="bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-400 text-slate-950 font-extrabold px-1.5 py-0.5 rounded border border-yellow-500 shadow-xs ring-2 ring-yellow-300/80 animate-pulse inline-block">
          {match}
        </mark>
        {after}
      </span>
    );
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRoll(text);
    setTimeout(() => setCopiedRoll(null), 2000);
  };

  // 4. Dynamic Filter Engine Logic
  const filteredResults = useMemo(() => {
    return database.results.filter((res) => {
      const activeSearch = searchQuery.toLowerCase().trim();

      // Search matching across multiple fields (CEN, Exam Title, Zone Name, Stage, Roll Numbers)
      const matchesSearch =
        !activeSearch ||
        res.examTitle.toLowerCase().includes(activeSearch) ||
        res.cenNumber.toLowerCase().includes(activeSearch) ||
        res.zoneName.toLowerCase().includes(activeSearch) ||
        res.stage.toLowerCase().includes(activeSearch) ||
        (res.rollNumbersSample && res.rollNumbersSample.some((r) => r.toLowerCase().includes(activeSearch)));

      // Exam Filter
      const matchesExam =
        selectedExam === 'All Exams' ||
        res.examTitle.toLowerCase().includes(selectedExam.toLowerCase()) ||
        selectedExam.toLowerCase().includes(res.examTitle.toLowerCase());

      // Year Filter
      const matchesYear =
        selectedYear === 'All Years' ||
        Boolean(res.publishDate && res.publishDate.includes(selectedYear));

      // Stage Filter
      const matchesStage =
        selectedStage === 'All Stages' ||
        res.stage.toLowerCase().includes(selectedStage.toLowerCase()) ||
        selectedStage.toLowerCase().includes(res.stage.toLowerCase());

      // Type Filter
      const matchesType = selectedType === 'ALL' || res.type === selectedType;

      // Zone Filter
      const matchesZone = selectedZone === 'ALL' || res.zoneCode === selectedZone;

      return matchesSearch && matchesExam && matchesYear && matchesStage && matchesType && matchesZone;
    });
  }, [database.results, searchQuery, selectedExam, selectedYear, selectedStage, selectedType, selectedZone]);

  // Selected Zone metadata for header info card
  const activeZoneMeta = useMemo(() => {
    if (!selectedZone || selectedZone === 'ALL') return null;
    return database.zones.find((z) => z.code === selectedZone) || null;
  }, [database.zones, selectedZone]);

  const handleResetFilters = () => {
    setSelectedExam('All Exams');
    setSelectedYear('All Years');
    setSelectedStage('All Stages');
    setSelectedType('ALL');
    setSelectedZone('ALL');
    setSelectedZoneFilter('ALL');
    setSearchQuery('');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedZone !== 'ALL') {
      setSelectedZoneFilter(selectedZone);
    }
    const el = document.getElementById('results-feed-list');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Count active filters
  const activeFiltersCount = [
    selectedExam !== 'All Exams',
    selectedYear !== 'All Years',
    selectedStage !== 'All Stages',
    selectedType !== 'ALL',
    selectedZone !== 'ALL',
    Boolean(searchQuery.trim()),
  ].filter(Boolean).length;

  return (
    <div className="space-y-6 pb-16 font-sans text-slate-900 animate-in fade-in">
      
      {/* 1. TOP TITLE HEADER */}
      <div className="space-y-1">
        <div className="flex items-center space-x-2.5">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
            RRB Results & Merit List Explorer
          </h1>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold tracking-wide uppercase flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            <span>Dynamic Engine</span>
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 font-medium">
          Official Merit Lists, Document Verification (DV) Shortlists, Provisional Panels & Scorecards across all 21 RRB Regional Boards
        </p>
      </div>

      {/* 2. DYNAMIC FILTER ENGINE CARD (Just like Cut-Off Explorer) */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <form onSubmit={handleFormSubmit} className="space-y-4">
          
          {/* Row 1: Select Post/Exam, Select Year, Select Zone, Select Stage, Select Result Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            
            {/* 1. Select Post / Exam */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5 flex items-center space-x-1">
                <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Select Post / Exam</span>
              </label>
              <div className="relative">
                <select
                  value={selectedExam}
                  onChange={(e) => setSelectedExam(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                >
                  {availableExams.map((exam) => (
                    <option key={exam} value={exam}>
                      {exam}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 2. Select Year */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-orange-600" />
                <span>Select Year</span>
              </label>
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                >
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 3. Select Zone */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5 flex items-center space-x-1">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Select Zone / RRB Board</span>
              </label>
              <div className="relative">
                <select
                  value={selectedZone}
                  onChange={(e) => {
                    setSelectedZone(e.target.value);
                    setSelectedZoneFilter(e.target.value);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                >
                  <option value="ALL">All Regional RRB Boards</option>
                  {database.zones.map((z) => (
                    <option key={z.id} value={z.code}>
                      {z.name} ({z.code})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 4. Select Stage */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5 flex items-center space-x-1">
                <Layers className="w-3.5 h-3.5 text-purple-600" />
                <span>Select Stage</span>
              </label>
              <div className="relative">
                <select
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                >
                  {availableStages.map((stg) => (
                    <option key={stg} value={stg}>
                      {stg}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 5. Select Result Document Type */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5 flex items-center space-x-1">
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                <span>Document Type</span>
              </label>
              <div className="relative">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                >
                  {resultTypes.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

          </div>

          {/* Row 2: Search Bar & Action Buttons */}
          <div className="pt-2 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Input Bar */}
            <div className="relative w-full md:flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Roll Number, CEN No, Candidate Name, or Post..."
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center space-x-2 w-full md:w-auto shrink-0">
              <button
                type="submit"
                className="flex-1 md:flex-none px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Search Results</span>
              </button>

              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center space-x-1 cursor-pointer"
                  title="Reset all search filters"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Result Type Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center space-x-1">
              <ListFilter className="w-3 h-3" />
              <span>Quick Types:</span>
            </span>
            {resultTypes.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setSelectedType(t.value)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedType === t.value
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

        </form>
      </div>

      {/* 3. REGIONAL RRB BOARD BADGE (When a specific zone is selected) */}
      {activeZoneMeta && (
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50/50 to-white rounded-2xl p-4 border border-blue-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white shadow-xs flex items-center justify-center p-1.5 border border-blue-200 shrink-0">
              <RailwayLogo className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                  {activeZoneMeta.name} ({activeZoneMeta.code})
                </h3>
                {activeZoneMeta.hindiName && (
                  <span className="text-xs text-blue-800 font-semibold bg-blue-100 px-2 py-0.2 rounded-md">
                    {activeZoneMeta.hindiName}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Headquarters: {activeZoneMeta.headquarters} • Region: {activeZoneMeta.stateRegion}
              </p>
            </div>
          </div>

          <a
            href={activeZoneMeta.officialWebsite}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold transition-colors shadow-2xs"
          >
            <span>Official Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* 4. RESULTS MATCH COUNT STRIP */}
      <div id="results-feed-list" className="flex items-center justify-between px-1">
        <div className="flex items-center space-x-2">
          <Award className="w-4 h-4 text-emerald-600" />
          <h2 className="text-sm sm:text-base font-bold text-slate-900">
            Official Declared Results ({filteredResults.length})
          </h2>
        </div>
        {searchQuery.trim() && (
          <span className="text-xs text-slate-500">
            Matching keyword: <strong className="text-slate-900">"{searchQuery}"</strong>
          </span>
        )}
      </div>

      {/* 5. RESULTS LIST GRID */}
      {filteredResults.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3 shadow-2xs">
            <Award className="w-7 h-7" />
          </div>
          <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
            {database.results.length === 0 ? 'No Results or Provisional Panels Uploaded Yet' : 'No Results Found For This Filter'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
            {database.results.length === 0
              ? 'Official provisional panels, document verification lists, and merit lists will appear here dynamically once uploaded via Admin Panel.'
              : 'Try clearing your search query or selecting "All Regional RRB Boards" and "All Exams".'}
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setCurrentTab('admin')}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-xs"
            >
              Open Admin Panel (Upload Data)
            </button>
            {activeFiltersCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm transition-all cursor-pointer"
              >
                Reset All Filters
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {filteredResults.map((result) => {
            const activeSearchTerm = searchQuery.trim();
            const hasMatchedRoll = Boolean(
              activeSearchTerm &&
              result.rollNumbersSample &&
              result.rollNumbersSample.some((r) => r.toLowerCase().includes(activeSearchTerm.toLowerCase()))
            );

            return (
              <div
                key={result.id}
                className={`p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border transition-all flex flex-col justify-between ${
                  hasMatchedRoll
                    ? 'border-yellow-400 ring-2 ring-yellow-400/40 shadow-md bg-yellow-50/10'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div>
                  {/* Match Banner if Roll Number Matched */}
                  {hasMatchedRoll && (
                    <div className="mb-3 px-3 py-1.5 rounded-xl bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-400 text-slate-950 font-bold text-xs flex items-center justify-between border border-yellow-500 shadow-xs">
                      <span className="flex items-center space-x-1.5">
                        <Sun className="w-4 h-4 text-amber-900" />
                        <span>Matching Roll Number Found in this Panel!</span>
                      </span>
                      <span className="text-[10px] bg-slate-950 text-yellow-300 px-1.5 py-0.2 rounded font-mono font-extrabold">
                        MATCH
                      </span>
                    </div>
                  )}

                  {/* Header Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center space-x-1.5">
                      <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                        {result.cenNumber}
                      </span>
                      <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {result.type}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">
                      {result.publishDate}
                    </span>
                  </div>

                  {/* Exam Title & Stage */}
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-950 leading-snug">
                    {renderHighlightedText(result.examTitle, searchQuery)}
                  </h3>
                  <div className="flex items-center space-x-2 text-xs text-slate-500 mt-1 font-medium">
                    <span className="font-bold text-slate-700">{result.zoneName}</span>
                    <span>•</span>
                    <span className="text-slate-600">{result.stage}</span>
                  </div>

                  {/* Candidate Count */}
                  {typeof result.totalSelectedCandidates === 'number' && (
                    <div className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{result.totalSelectedCandidates.toLocaleString()} Candidates Empanelled</span>
                    </div>
                  )}

                  {/* Instructions */}
                  {result.instructions && (
                    <p className="mt-3 text-xs text-slate-600 bg-slate-50/80 p-3 rounded-xl border border-slate-200 leading-relaxed font-normal">
                      {renderHighlightedText(result.instructions, searchQuery)}
                    </p>
                  )}

                  {/* Sample Roll Numbers Tag with Golden Highlighting */}
                  {result.rollNumbersSample && result.rollNumbersSample.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] text-slate-500 uppercase font-bold flex items-center space-x-1">
                          <SearchCode className="w-3.5 h-3.5 text-amber-600" />
                          <span>Shortlisted Roll Numbers:</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveRollModalResult(result);
                            setRollModalSearch(searchQuery.trim());
                          }}
                          className="text-[11px] font-bold text-amber-700 hover:text-amber-900 cursor-pointer flex items-center space-x-0.5"
                        >
                          <span>View All ({result.rollNumbersSample.length})</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {result.rollNumbersSample.slice(0, 4).map((r, i) => {
                          const isMatched = Boolean(
                            activeSearchTerm && r.toLowerCase().includes(activeSearchTerm.toLowerCase())
                          );

                          return isMatched ? (
                            <span
                              key={i}
                              className="font-mono text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-400 text-slate-950 border-2 border-yellow-500 ring-2 ring-yellow-400/50 shadow-xs animate-pulse inline-flex items-center space-x-1"
                              title="Matched Roll Number"
                            >
                              <Sun className="w-3 h-3 text-amber-950" />
                              <span>{renderHighlightedText(r, activeSearchTerm)}</span>
                            </span>
                          ) : (
                            <span
                              key={i}
                              className="font-mono text-[11px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200"
                            >
                              {r}
                            </span>
                          );
                        })}

                        {result.rollNumbersSample.length > 4 && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveRollModalResult(result);
                              setRollModalSearch(searchQuery.trim());
                            }}
                            className="text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg border border-slate-200 cursor-pointer transition-colors"
                          >
                            +{result.rollNumbersSample.length - 4} more
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Links */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">Official Railway Release</span>
                  <div className="flex items-center space-x-2">
                    {result.rollNumbersSample && result.rollNumbersSample.length > 0 && (
                      <button
                        onClick={() => {
                          setActiveRollModalResult(result);
                          setRollModalSearch(searchQuery.trim());
                        }}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs transition-colors cursor-pointer border border-amber-200"
                      >
                        <SearchCode className="w-3.5 h-3.5 text-amber-700" />
                        <span>Search Numbers</span>
                      </button>
                    )}

                    {result.fileUrl ? (
                      <>
                        <button
                          onClick={() =>
                            setActivePdfPreview({
                              title: `${result.examTitle} (${result.zoneName}) - ${result.type}`,
                              source: result.fileUrl!,
                              text: result.instructions,
                            })
                          }
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer border border-slate-200"
                        >
                          <FileText className="w-3.5 h-3.5 text-purple-600" />
                          <span>PDF</span>
                        </button>
                        <a
                          href={result.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-xs"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </>
                    ) : (
                      <span className="text-xs text-slate-500 font-medium">Official Panel</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. FULL ROLL NUMBER SEARCH & EXPLORER MODAL */}
      {activeRollModalResult && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div 
            className="relative bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 flex items-center justify-center text-slate-950 font-bold shadow-xs">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-snug">
                    {activeRollModalResult.examTitle}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {activeRollModalResult.zoneName} • {activeRollModalResult.stage} • {activeRollModalResult.type}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveRollModalResult(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-96">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={rollModalSearch}
                  onChange={(e) => setRollModalSearch(e.target.value)}
                  placeholder="Instant roll number filter (e.g. 19119...)"
                  className="w-full pl-10 pr-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs font-mono"
                  autoFocus
                />
              </div>

              <div className="flex items-center space-x-2 text-xs text-slate-600 shrink-0">
                <span className="inline-flex items-center space-x-1 bg-yellow-100 text-yellow-900 border border-yellow-300 px-2 py-1 rounded-lg font-bold">
                  <Sun className="w-3.5 h-3.5 text-amber-700" />
                  <span>Highlight: Active Match</span>
                </span>
                <span className="font-medium">
                  Total: <strong>{activeRollModalResult.rollNumbersSample?.length || 0}</strong>
                </span>
              </div>
            </div>

            {/* Roll Numbers Grid */}
            <div className="flex-1 overflow-y-auto p-5">
              {(() => {
                const rolls = activeRollModalResult.rollNumbersSample || [];
                const searchClean = rollModalSearch.trim().toLowerCase();
                const matchedRolls = searchClean
                  ? rolls.filter((r) => r.toLowerCase().includes(searchClean))
                  : rolls;

                if (rolls.length === 0) {
                  return (
                    <div className="py-12 text-center text-slate-500">
                      No roll numbers listed in this record.
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {searchClean && (
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-700 bg-slate-100 p-2.5 rounded-xl border border-slate-200">
                        <span>
                          Showing <strong>{matchedRolls.length}</strong> matched roll numbers for "{rollModalSearch}"
                        </span>
                        {matchedRolls.length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleCopy(matchedRolls.join('\n'))}
                            className="text-amber-800 hover:text-amber-950 underline font-bold cursor-pointer"
                          >
                            Copy All Matched ({matchedRolls.length})
                          </button>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {matchedRolls.map((roll, idx) => {
                        const isMatch = Boolean(searchClean && roll.toLowerCase().includes(searchClean));

                        return (
                          <div
                            key={idx}
                            onClick={() => handleCopy(roll)}
                            className={`p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer group ${
                              isMatch
                                ? 'bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-400 border-2 border-yellow-500 text-slate-950 shadow-md ring-2 ring-yellow-400/50'
                                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                            }`}
                            title="Click to copy roll number"
                          >
                            <div className="flex items-center space-x-2 min-w-0">
                              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                isMatch ? 'bg-slate-950 text-yellow-300 font-bold' : 'bg-slate-200 text-slate-600'
                              }`}>
                                #{idx + 1}
                              </span>
                              <span className="font-mono text-xs sm:text-sm font-bold truncate">
                                {renderHighlightedText(roll, rollModalSearch)}
                              </span>
                            </div>

                            <button
                              type="button"
                              className={`p-1 rounded-lg transition-colors ${
                                isMatch ? 'text-slate-950 hover:bg-yellow-400' : 'text-slate-400 group-hover:text-slate-700'
                              }`}
                            >
                              {copiedRoll === roll ? (
                                <Check className="w-3.5 h-3.5 text-emerald-700" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <span>Click on any roll number card to copy to clipboard</span>
              <button
                type="button"
                onClick={() => setActiveRollModalResult(null)}
                className="px-4 py-1.5 bg-white hover:bg-slate-200 border border-slate-300 rounded-xl text-slate-700 font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. PDF VIEWER MODAL */}
      {activePdfPreview && (
        <PdfViewerModal
          isOpen={true}
          onClose={() => setActivePdfPreview(null)}
          title={activePdfPreview.title}
          pdfSource={activePdfPreview.source}
          extractedText={activePdfPreview.text}
        />
      )}
    </div>
  );
};
