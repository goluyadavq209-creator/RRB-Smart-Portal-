import React, { useState } from 'react';
import { 
  Award, 
  Search, 
  Filter, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Download, 
  ExternalLink, 
  Users, 
  Calendar, 
  Plus, 
  ArrowRight,
  Sparkles,
  SearchCode,
  Sun,
  Copy,
  Check,
  X,
  ListFilter
} from 'lucide-react';
import { FullRRBDatabase, ResultItem, ResultType, TabView } from '../types';
import { PdfViewerModal } from './PdfViewerModal';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [activePdfPreview, setActivePdfPreview] = useState<{ title: string; source: string; text?: string } | null>(null);
  const [activeRollModalResult, setActiveRollModalResult] = useState<ResultItem | null>(null);
  const [rollModalSearch, setRollModalSearch] = useState('');
  const [copiedRoll, setCopiedRoll] = useState<string | null>(null);
  
  // Roll Number Search State
  const [rollNumberQuery, setRollNumberQuery] = useState('');
  const [rollSearchResult, setRollSearchResult] = useState<{
    searched: boolean;
    foundIn: { result: ResultItem; roll: string }[];
  }>({ searched: false, foundIn: [] });

  const resultTypes: { label: string; value: string }[] = [
    { label: 'All Results', value: 'ALL' },
    { label: 'Merit List PDF', value: 'Merit List PDF' },
    { label: 'Scorecard Link', value: 'Individual Scorecard Link' },
    { label: 'DV Shortlist', value: 'DV Schedule & Shortlist' },
    { label: 'Provisional Panel', value: 'Final Provisional Panel' },
    { label: 'Replacement Panel', value: 'Replacement Panel' },
  ];

  // Helper to highlight search match in golden morning yellow (सुबह का रंग)
  const renderHighlightedText = (text: string, query: string, isRollBadge = false) => {
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

  const filteredResults = database.results.filter((res) => {
    const activeSearch = searchQuery.toLowerCase().trim();
    const activeRoll = rollNumberQuery.toLowerCase().trim();

    const matchesSearch =
      !activeSearch ||
      res.examTitle.toLowerCase().includes(activeSearch) ||
      res.cenNumber.toLowerCase().includes(activeSearch) ||
      res.zoneName.toLowerCase().includes(activeSearch) ||
      res.stage.toLowerCase().includes(activeSearch) ||
      (res.rollNumbersSample && res.rollNumbersSample.some((r) => r.toLowerCase().includes(activeSearch)));

    const matchesRollQuery =
      !activeRoll ||
      (res.rollNumbersSample && res.rollNumbersSample.some((r) => r.toLowerCase().includes(activeRoll)));

    const matchesType = selectedType === 'ALL' || res.type === selectedType;

    const matchesZone =
      selectedZoneFilter === 'ALL' || res.zoneCode === selectedZoneFilter;

    return matchesSearch && matchesType && matchesZone && (rollSearchResult.searched ? matchesRollQuery : true);
  });

  const handleRollSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRoll = rollNumberQuery.trim();
    if (!cleanRoll) {
      setRollSearchResult({ searched: false, foundIn: [] });
      return;
    }

    const matches: { result: ResultItem; roll: string }[] = [];
    database.results.forEach((res) => {
      if (res.rollNumbersSample && res.rollNumbersSample.length > 0) {
        const found = res.rollNumbersSample.find(
          (r) => r.toLowerCase() === cleanRoll.toLowerCase() || r.includes(cleanRoll)
        );
        if (found) {
          matches.push({ result: res, roll: found });
        }
      }
    });

    setRollSearchResult({ searched: true, foundIn: matches });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-100">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-950">
                RRB Examination Results & Provisional Panels
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Official shortlist merit lists, document verification schedules, and replacement panels
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setCurrentTab('admin')}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-all shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Upload / Manage Results</span>
        </button>
      </div>

      {/* Roll Number Shortlist Checker Tool */}
      <div className="bg-slate-900 rounded-2xl p-5 sm:p-6 text-white border border-slate-800 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
            <SearchCode className="w-4 h-4" />
            <span>Direct Roll Number Verification Tool</span>
          </div>
          <span className="text-[11px] font-semibold text-yellow-300 bg-yellow-950/80 border border-yellow-500/50 px-2.5 py-0.5 rounded-full flex items-center space-x-1">
            <Sun className="w-3 h-3 text-yellow-400" />
            <span>Morning Sun Highlight Active</span>
          </span>
        </div>
        <p className="text-xs text-slate-300 mb-4 max-w-2xl">
          Check if your RRB roll number has been shortlisted. Matching numbers will be highlighted in bright morning sunlight golden color.
        </p>

        <form onSubmit={handleRollSearch} className="flex flex-col sm:flex-row gap-2 max-w-xl">
          <input
            type="text"
            value={rollNumberQuery}
            onChange={(e) => {
              setRollNumberQuery(e.target.value);
              if (rollSearchResult.searched) {
                setRollSearchResult({ searched: false, foundIn: [] });
              }
            }}
            placeholder="Enter your Roll Number (e.g. 191191190234561)..."
            className="flex-1 bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-2 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <button
            type="submit"
            className="px-5 py-2 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center space-x-1.5"
          >
            <Search className="w-4 h-4" />
            <span>Check Status</span>
          </button>
        </form>

        {/* Verification Result Feedback */}
        {rollSearchResult.searched && (
          <div className="mt-4 pt-4 border-t border-slate-800 animate-in fade-in">
            {rollSearchResult.foundIn.length > 0 ? (
              <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs sm:text-sm space-y-3">
                <div className="flex items-center space-x-2 font-bold text-emerald-300 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>Congratulations! Roll Number Found in Shortlist Panel</span>
                </div>

                {rollSearchResult.foundIn.map(({ result, roll }, i) => (
                  <div key={i} className="p-3 bg-slate-900/90 rounded-xl border border-slate-700/80 text-xs space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-white font-semibold">
                        <strong>Exam:</strong> {result.examTitle} ({result.cenNumber})
                      </div>
                      <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                        {result.publishDate}
                      </span>
                    </div>

                    <div className="text-slate-300">
                      <strong>Board:</strong> {result.zoneName} • <strong>Stage:</strong> {result.stage} • <strong>Type:</strong> {result.type}
                    </div>

                    {/* Matched Number Highlighted in Morning Golden Yellow */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800">
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-400 text-xs">Matched Shortlist Number:</span>
                        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-400 text-slate-950 font-mono font-extrabold border-2 border-yellow-500 shadow-md ring-2 ring-yellow-400/50 animate-pulse">
                          <Sun className="w-4 h-4 text-amber-900" />
                          <span>{renderHighlightedText(roll, rollNumberQuery)}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleCopy(roll)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[11px] font-medium flex items-center space-x-1 transition-colors cursor-pointer"
                        >
                          {copiedRoll === roll ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Number</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveRollModalResult(result)}
                          className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-[11px] font-medium flex items-center space-x-1 transition-colors cursor-pointer"
                        >
                          <ListFilter className="w-3.5 h-3.5" />
                          <span>View Full Panel</span>
                        </button>
                      </div>
                    </div>

                    {result.instructions && (
                      <p className="text-slate-300 text-[11px] mt-1 bg-slate-950/60 p-2 rounded">
                        {result.instructions}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 text-xs flex items-center space-x-3">
                <XCircle className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <div className="font-semibold text-white">
                    Roll Number "{rollNumberQuery}" not found in current loaded panels.
                  </div>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Ensure the correct RRB panel is selected or check all regional boards.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by CEN, exam, zone, roll number..."
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Zone Selector */}
          <div className="w-full sm:w-64">
            <select
              value={selectedZoneFilter}
              onChange={(e) => setSelectedZoneFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All Regional RRB Boards</option>
              {database.zones.map((z) => (
                <option key={z.id} value={z.code}>
                  {z.name} ({z.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Result Type Filters */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
          {resultTypes.map((t) => (
            <button
              key={t.value}
              onClick={() => setSelectedType(t.value)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedType === t.value
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Feed List */}
      {filteredResults.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center mx-auto mb-3">
            <Award className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-base sm:text-lg text-slate-900">
            {database.results.length === 0 ? 'Zero Results Uploaded' : 'No Results Found For This Filter'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1">
            {database.results.length === 0
              ? 'No fake scorecards are loaded. Upload your official RRB merit panels via JSON or PDF in Admin Panel.'
              : 'Try clearing your search query or selecting "All Results".'}
          </p>

          <div className="mt-5 flex justify-center gap-3">
            <button
              onClick={() => setCurrentTab('admin')}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-xs"
            >
              Open Admin Panel
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredResults.map((result) => {
            const activeSearchTerm = searchQuery.trim() || rollNumberQuery.trim();
            const hasMatchedRoll = Boolean(
              activeSearchTerm &&
              result.rollNumbersSample &&
              result.rollNumbersSample.some((r) => r.toLowerCase().includes(activeSearchTerm.toLowerCase()))
            );

            return (
              <div
                key={result.id}
                className={`p-5 rounded-2xl bg-white border transition-all flex flex-col justify-between ${
                  hasMatchedRoll
                    ? 'border-yellow-400 ring-2 ring-yellow-400/40 shadow-md bg-yellow-50/10'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                <div>
                  {/* Match Banner if Roll Number Matched */}
                  {hasMatchedRoll && (
                    <div className="mb-3 px-3 py-1.5 rounded-lg bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-400 text-slate-950 font-bold text-xs flex items-center justify-between border border-yellow-500 shadow-xs">
                      <span className="flex items-center space-x-1.5">
                        <Sun className="w-4 h-4 text-amber-900" />
                        <span>Matching Roll Number Found in this Panel!</span>
                      </span>
                      <span className="text-[10px] bg-slate-950 text-yellow-300 px-1.5 py-0.2 rounded font-mono font-extrabold">
                        MATCH
                      </span>
                    </div>
                  )}

                  {/* Header Pills */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-1.5">
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-slate-100 text-slate-800 border border-slate-200">
                        {result.cenNumber}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-semibold uppercase rounded bg-purple-50 text-purple-800 border border-purple-100">
                        {result.type}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">
                      {result.publishDate}
                    </span>
                  </div>

                  {/* Exam Title & Stage */}
                  <h3 className="font-bold text-base text-slate-950 leading-snug">
                    {renderHighlightedText(result.examTitle, searchQuery)}
                  </h3>
                  <div className="flex items-center space-x-2 text-xs text-slate-500 mt-1">
                    <span className="font-medium text-slate-700">{result.zoneName}</span>
                    <span>•</span>
                    <span className="text-slate-600 font-medium">{result.stage}</span>
                  </div>

                  {/* Candidate Count */}
                  {typeof result.totalSelectedCandidates === 'number' && (
                    <div className="mt-3 inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100 text-xs font-semibold">
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{result.totalSelectedCandidates} Candidates Empanelled</span>
                    </div>
                  )}

                  {/* Instructions */}
                  {result.instructions && (
                    <p className="mt-3 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                      {renderHighlightedText(result.instructions, searchQuery)}
                    </p>
                  )}

                  {/* Sample Roll Numbers Tag with Morning Sunlight Highlighting */}
                  {result.rollNumbersSample && result.rollNumbersSample.length > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center space-x-1">
                          <SearchCode className="w-3 h-3 text-amber-600" />
                          <span>Shortlisted Roll Numbers:</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveRollModalResult(result);
                            setRollModalSearch(searchQuery.trim() || rollNumberQuery.trim());
                          }}
                          className="text-[11px] font-bold text-amber-700 hover:text-amber-900 cursor-pointer flex items-center space-x-0.5"
                        >
                          <span>View All ({result.rollNumbersSample.length})</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {result.rollNumbersSample.slice(0, 5).map((r, i) => {
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
                              className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200"
                            >
                              {r}
                            </span>
                          );
                        })}

                        {result.rollNumbersSample.length > 5 && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveRollModalResult(result);
                              setRollModalSearch(searchQuery.trim() || rollNumberQuery.trim());
                            }}
                            className="text-[10px] font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded border border-slate-200 cursor-pointer transition-colors"
                          >
                            +{result.rollNumbersSample.length - 5} more
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Link */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Official RRB Release</span>
                  <div className="flex items-center space-x-2">
                    {result.rollNumbersSample && result.rollNumbersSample.length > 0 && (
                      <button
                        onClick={() => {
                          setActiveRollModalResult(result);
                          setRollModalSearch(searchQuery.trim() || rollNumberQuery.trim());
                        }}
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold text-xs transition-colors cursor-pointer border border-amber-200"
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
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-purple-600" />
                          <span>PDF</span>
                        </button>
                        <a
                          href={result.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors shadow-xs"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </>
                    ) : (
                      <span className="text-xs text-slate-500 font-medium">Published</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Roll Number Search & Explorer Modal */}
      {activeRollModalResult && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div 
            className="relative bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh]"
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
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={rollModalSearch}
                  onChange={(e) => setRollModalSearch(e.target.value)}
                  placeholder="Instant roll number filter (e.g. 19119...)"
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs font-mono"
                  autoFocus
                />
              </div>

              <div className="flex items-center space-x-2 text-xs text-slate-600 shrink-0">
                <span className="inline-flex items-center space-x-1 bg-yellow-100 text-yellow-900 border border-yellow-300 px-2 py-1 rounded-lg font-semibold">
                  <Sun className="w-3.5 h-3.5 text-amber-700" />
                  <span>Highlight: Morning Sunlight</span>
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
                className="px-4 py-1.5 bg-white hover:bg-slate-200 border border-slate-300 rounded-lg text-slate-700 font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
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
