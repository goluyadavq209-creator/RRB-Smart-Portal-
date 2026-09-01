import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ChevronDown,
  Check,
  Sparkles,
  Clock,
  ExternalLink,
  AlertCircle,
  Building2,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { CutoffRecord, FullRRBDatabase, TabView, RRBZone } from '../types';
import { RailwayLogo } from './RailwayLogo';

interface CutoffSectionProps {
  database: FullRRBDatabase;
  selectedZoneFilter: string;
  setSelectedZoneFilter: (zone: string) => void;
  setCurrentTab: (tab: TabView) => void;
}

// Ashoka Emblem Vector (State Emblem of India)
const AshokaEmblemSvg = ({ className = "w-12 h-14 sm:w-14 sm:h-16 text-slate-800" }: { className?: string }) => (
  <svg viewBox="0 0 100 120" className={className} fill="currentColor">
    {/* Ashoka Stambh Lions Outline Silhouette */}
    <path d="M50 10 C42 10 38 16 38 24 C38 29 42 34 46 36 C43 38 40 42 40 48 C40 54 44 58 50 60 C56 58 60 54 60 48 C60 42 57 38 54 36 C58 34 62 29 62 24 C62 16 58 10 50 10 Z" />
    <circle cx="32" cy="30" r="8" opacity="0.9" />
    <circle cx="68" cy="30" r="8" opacity="0.9" />
    {/* Abacus Base & Bull/Horse Base */}
    <rect x="25" y="66" width="50" height="8" rx="2" fill="currentColor" />
    {/* Central Dharma Chakra Wheel */}
    <circle cx="50" cy="70" r="5" fill="#ffffff" />
    <circle cx="50" cy="70" r="2" fill="currentColor" />
    {/* Lotus Base */}
    <path d="M22 76 Q50 96 78 76 Q50 86 22 76 Z" />
    {/* Satyameva Jayate Banner */}
    <rect x="18" y="92" width="64" height="6" rx="2" fill="currentColor" opacity="0.8" />
    <text x="50" y="112" textAnchor="middle" fontSize="9" fontWeight="bold" fill="currentColor" fontFamily="sans-serif">
      सत्यमेव जयते
    </text>
  </svg>
);

// Standard Known Column Priority Order for Logical Table Display
const COLUMN_PRIORITY_ORDER: string[] = [
  // Primary identifier columns
  'CAT_NO', 'CATNO', 'CAT_NUM', 'CATEGORY_NO', 'POST', 'POST_NAME', 'ZONE', 'STAGE',
  // Standard Community categories
  'UR', 'SC', 'ST', 'OBC', 'EWS',
  // Ex-Servicemen & Special
  'ESM', 'ExSM', 'EX_SM', 'CCAA', 'SPORTS', 'APPRENTICE',
  // Regular PwBD subcategories
  'R-VI', 'R_VI', 'R-HI', 'R_HI', 'R-LD', 'R_LD', 'R-OD', 'R_OD', 'R-MD', 'R_MD',
  // Backlog PwBD subcategories
  'B-VI', 'B_VI', 'B-HI', 'B_HI', 'B-LD', 'B_LD', 'B-OD', 'B_OD', 'B-MD', 'B_MD',
  // Generic PwBD
  'PWBD', 'PwBD', 'VH', 'HH', 'OH', 'MD', 'LD', 'VI', 'HI'
];

// Helper to normalize column keys for comparison
const normalizeKey = (k: string) => k.toUpperCase().replace(/[-_ ]/g, '');

export const CutoffSection: React.FC<CutoffSectionProps> = ({
  database,
  selectedZoneFilter,
  setSelectedZoneFilter,
  setCurrentTab,
}) => {
  // 1. Dynamic Extraction of Available Options from Database
  const availableExams = useMemo(() => {
    const set = new Set<string>();
    // Default standard list
    set.add('NTPC (Graduate)');
    set.add('NTPC (Under Graduate)');
    set.add('ALP (Assistant Loco Pilot)');
    set.add('Technician Gr I & III');
    set.add('RRB Group D (Level-1)');
    set.add('RRB JE (Junior Engineer)');
    set.add('RPF SI & Constable');

    // Add any from database.cutoffs
    database.cutoffs.forEach((c) => {
      if (c.examTitle) set.add(c.examTitle);
    });
    // Add any from database.exams
    database.exams.forEach((e) => {
      if (e.shortCode) set.add(e.shortCode);
    });
    return Array.from(set);
  }, [database.cutoffs, database.exams]);

  const availableYears = useMemo(() => {
    const set = new Set<string>();
    set.add('2025');
    set.add('2024');
    set.add('2022');
    set.add('2019');
    set.add('2018');
    database.cutoffs.forEach((c) => {
      if (c.year) set.add(String(c.year));
    });
    return Array.from(set).sort((a, b) => Number(b) - Number(a));
  }, [database.cutoffs]);

  const availableStages = useMemo(() => {
    const set = new Set<string>();
    set.add('CBT-1');
    set.add('CBT-2 (Part-A)');
    set.add('CBAT / Psycho');
    set.add('Typing Skill Test');
    set.add('Document Verification (DV)');
    database.cutoffs.forEach((c) => {
      if (c.stage) set.add(c.stage);
    });
    return Array.from(set);
  }, [database.cutoffs]);

  // 2. Filter State
  const [selectedExam, setSelectedExam] = useState<string>('NTPC (Graduate)');
  const [selectedYear, setSelectedYear] = useState<string>('2025');
  const [selectedStage, setSelectedStage] = useState<string>('CBT-1');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [selectedZone, setSelectedZone] = useState<string>(
    selectedZoneFilter && selectedZoneFilter !== 'ALL' ? selectedZoneFilter : 'GKP'
  );

  // 3. View Modes
  const isCompactView = false;

  // Synchronize zone selection when selectedZoneFilter changes from parent
  React.useEffect(() => {
    if (selectedZoneFilter && selectedZoneFilter !== 'ALL' && selectedZoneFilter !== selectedZone) {
      setSelectedZone(selectedZoneFilter);
    }
  }, [selectedZoneFilter]);

  // 5. Dynamic Query Matching: Find exact CutoffRecord(s) for the selection
  const exactMatchingRecords = useMemo(() => {
    return database.cutoffs.filter((c) => {
      const matchExam = selectedExam === 'ALL' || !selectedExam || 
        c.examTitle.toLowerCase().includes(selectedExam.toLowerCase()) ||
        selectedExam.toLowerCase().includes(c.examTitle.toLowerCase());
      
      const matchYear = !selectedYear || String(c.year) === selectedYear;
      
      const matchStage = !selectedStage || 
        c.stage.toLowerCase().includes(selectedStage.toLowerCase()) ||
        selectedStage.toLowerCase().includes(c.stage.toLowerCase());

      const matchZone = selectedZone === 'ALL' || c.zoneCode.toUpperCase() === selectedZone.toUpperCase();

      return matchExam && matchYear && matchStage && matchZone;
    });
  }, [database.cutoffs, selectedExam, selectedYear, selectedStage, selectedZone]);

  // Check if cut-off is actually uploaded & has scores
  const hasUploadedCutoff = useMemo(() => {
    if (exactMatchingRecords.length === 0) return false;
    const rec = exactMatchingRecords[0];
    if (rec.tableRows && rec.tableRows.length > 0) return true;
    if (rec.cutoffs && Object.keys(rec.cutoffs).length > 0) {
      return Object.values(rec.cutoffs).some(
        (v) => v !== undefined && v !== null && v !== '' && Number(v) > 0
      );
    }
    return false;
  }, [exactMatchingRecords]);

  // List of all zones that currently have active uploaded cut-off data
  const zonesWithAvailableCutoffs = useMemo(() => {
    const zoneCodesWithCutoffs = new Set<string>();
    database.cutoffs.forEach((c) => {
      if (
        (c.tableRows && c.tableRows.length > 0) ||
        (c.cutoffs && Object.values(c.cutoffs).some((v) => v !== undefined && v !== null && v !== ''))
      ) {
        zoneCodesWithCutoffs.add(c.zoneCode.toUpperCase());
      }
    });
    return database.zones.filter((z) => zoneCodesWithCutoffs.has(z.code.toUpperCase()));
  }, [database.cutoffs, database.zones]);

  // Primary active record
  const primaryRecord = exactMatchingRecords[0] || null;

  // Active Zone metadata
  const activeZoneObj = useMemo(() => {
    const found = database.zones.find((z) => z.code.toUpperCase() === selectedZone.toUpperCase());
    if (found) return found;
    if (primaryRecord) {
      return {
        id: `rrb-${primaryRecord.zoneCode.toLowerCase()}`,
        name: primaryRecord.zoneName || `RRB ${primaryRecord.zoneCode}`,
        hindiName: primaryRecord.hindiZoneName || `आरआरबी ${primaryRecord.zoneCode}`,
        code: primaryRecord.zoneCode,
        officialWebsite: 'https://rrb.indianrailways.gov.in',
        headquarters: primaryRecord.zoneName,
        stateRegion: 'Indian Railways',
      };
    }
    return database.zones[0] || {
      id: 'rrb-gkp',
      name: 'RRB Gorakhpur',
      hindiName: 'आरआरबी गोरखपुर',
      code: 'GKP',
      officialWebsite: 'https://www.rrbgkp.gov.in',
      headquarters: 'Gorakhpur',
      stateRegion: 'North Eastern Railway',
    };
  }, [database.zones, selectedZone, primaryRecord]);

  // 6. Dynamic Table Rows Engine: Build dynamic rows from dataset without hardcoding
  const dynamicTableRows = useMemo(() => {
    if (!primaryRecord) return [];

    // Mode A: Record has explicit tableRows array
    if (primaryRecord.tableRows && primaryRecord.tableRows.length > 0) {
      return primaryRecord.tableRows;
    }

    // Mode B: If multiple matching records (e.g. multi-post), convert each record into a table row
    if (exactMatchingRecords.length > 1) {
      return exactMatchingRecords.map((rec) => {
        const rowObj: Record<string, any> = {
          CAT_NO: rec.catNo || rec.postName || rec.id,
        };
        const cutoffsSource = rec.cutoffs;
        Object.entries(cutoffsSource).forEach(([k, val]) => {
          rowObj[k] = val !== undefined && val !== null ? String(val) : '';
        });
        return rowObj;
      });
    }

    // Mode C: Single record with a flat cutoffs dictionary
    const rowObj: Record<string, any> = {
      CAT_NO: primaryRecord.catNo || primaryRecord.postName || 'General / All Posts',
    };
    const cutoffsSource = primaryRecord.cutoffs;

    Object.entries(cutoffsSource).forEach(([k, val]) => {
      rowObj[k] = val !== undefined && val !== null ? String(val) : '';
    });

    return [rowObj];
  }, [primaryRecord, exactMatchingRecords]);

  // 7. Dynamic Column Discovery Engine: Extract ALL distinct keys present in the rows
  const dynamicColumns = useMemo(() => {
    if (dynamicTableRows.length === 0) return ['CAT_NO', 'UR', 'SC', 'ST', 'OBC', 'EWS', 'ESM'];

    const discoveredKeys = new Set<string>();
    dynamicTableRows.forEach((row) => {
      Object.keys(row).forEach((k) => discoveredKeys.add(k));
    });

    // If explicit customColumns declared on record, add them too
    if (primaryRecord?.customColumns) {
      primaryRecord.customColumns.forEach((c) => discoveredKeys.add(c));
    }

    const allKeys = Array.from(discoveredKeys);

    // Sort keys based on official standard priority, keeping unexpected new columns at the end
    return allKeys.sort((a, b) => {
      const idxA = COLUMN_PRIORITY_ORDER.findIndex((p) => normalizeKey(p) === normalizeKey(a));
      const idxB = COLUMN_PRIORITY_ORDER.findIndex((p) => normalizeKey(p) === normalizeKey(b));

      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [dynamicTableRows, primaryRecord]);

  // Filter columns if user selected a specific Category (e.g. UR, SC, OBC)
  const displayedColumns = useMemo(() => {
    if (selectedCategory === 'All Categories') return dynamicColumns;

    // Always keep identifier columns
    const idKeys = ['CAT_NO', 'CATNO', 'POST', 'POST_NAME', 'ZONE', 'STAGE'];
    return dynamicColumns.filter((col) => {
      if (idKeys.some((idk) => normalizeKey(idk) === normalizeKey(col))) return true;
      return normalizeKey(col) === normalizeKey(selectedCategory);
    });
  }, [dynamicColumns, selectedCategory]);

  // Format cell value helper: Never invent values, display "—" for missing/empty
  const renderCellValue = (val: any) => {
    if (val === undefined || val === null || val === '' || String(val).trim() === '') {
      return <span className="text-slate-300 font-normal select-none">—</span>;
    }
    const num = Number(val);
    if (!isNaN(num) && typeof val === 'number') {
      return num.toFixed(5).replace(/\.?0+$/, (match) => match.length > 5 ? '' : match);
    }
    return String(val);
  };

  // Handlers: Apply filter and smooth scroll to cut-off view table
  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (selectedZone !== 'ALL') {
      setSelectedZoneFilter(selectedZone);
    }
    // Smooth scroll down to the cut-off result view table
    setTimeout(() => {
      const el = document.getElementById('cutoff-result-view');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  return (
    <div className="space-y-6 pb-16 font-sans text-slate-900 animate-in fade-in">
      
      {/* 1. TOP TITLE HEADER */}
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
            RRB Cut-Off Explorer
          </h1>
          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-extrabold tracking-wide uppercase">
            Dynamic Engine
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 font-medium">
          Check official qualifying cut-off marks for all posts, all years and all 21 RRB zones
        </p>
      </div>

      {/* 2. TOP FILTER BAR CARD */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs">
        <form onSubmit={handleApplyFilter} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
          
          {/* 1. Select Post / Exam */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
              Select Post / Exam
            </label>
            <div className="relative">
              <select
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              >
                {availableExams.map((exam) => (
                  <option key={exam} value={exam}>{exam}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 2. Select Year */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
              Select Year
            </label>
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 3. Select Stage */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
              Select Stage
            </label>
            <div className="relative">
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              >
                {availableStages.map((stg) => (
                  <option key={stg} value={stg}>{stg}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 4. Select Category */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
              Select Category
            </label>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              >
                <option value="All Categories">All Categories</option>
                <option value="UR">UR (Unreserved)</option>
                <option value="SC">SC (Scheduled Caste)</option>
                <option value="ST">ST (Scheduled Tribe)</option>
                <option value="OBC">OBC (Non-Creamy Layer)</option>
                <option value="EWS">EWS (Economically Weaker)</option>
                <option value="ESM">ESM (Ex-Servicemen)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 5. Select RRB Zone */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
              RRB Zone
            </label>
            <div className="relative">
              <select
                value={selectedZone}
                onChange={(e) => {
                  setSelectedZone(e.target.value);
                  if (e.target.value !== 'ALL') {
                    setSelectedZoneFilter(e.target.value);
                  }
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              >
                {database.zones.map((zone) => (
                  <option key={zone.code} value={zone.code}>
                    {zone.name} ({zone.code})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 6. Action Blue Button */}
          <div>
            <button
              type="submit"
              className="w-full py-2.5 bg-[#0056b3] hover:bg-[#004494] active:bg-[#003366] text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              <span>View Cut-Off</span>
            </button>
          </div>

        </form>
      </div>

      {/* 3. MAIN CUTOFF VIEW AREA (Official Gazette or Colorful Coming Soon) */}
      <div id="cutoff-result-view" className="scroll-mt-6">
        {hasUploadedCutoff ? (
          /* OFFICIAL GAZETTE PAPER / NOTIFICATION DOCUMENT */
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-8 bg-[#fafafa]">
              <div className="bg-white rounded-2xl border border-slate-300 p-6 sm:p-8 shadow-sm space-y-6 text-slate-900 font-sans">
                
                {/* Document Top Government Header */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  {/* Left Ashoka Emblem */}
                  <div className="w-14 sm:w-16 flex justify-start">
                    <AshokaEmblemSvg />
                  </div>

                  {/* Center Government & Ministry Title */}
                  <div className="text-center space-y-1">
                    <h2 className="text-base sm:text-xl font-black text-slate-900 font-hindi">
                      भारत सरकार, रेल मंत्रालय
                    </h2>
                    <h3 className="text-xs sm:text-base font-bold text-slate-800 tracking-wide">
                      Government of India , Ministry of Railways
                    </h3>
                  </div>

                  {/* Right Railway Wheel Logo */}
                  <div className="w-14 sm:w-16 flex justify-end">
                    <RailwayLogo size="md" />
                  </div>
                </div>

                {/* Document Subject Banner (Grey Box) */}
                <div className="bg-slate-100 p-3 sm:p-4 rounded-xl border border-slate-200 text-center space-y-1.5">
                  <p className="text-xs sm:text-sm font-bold text-slate-900 font-hindi leading-relaxed">
                    सीईएन संख्या {primaryRecord?.cenNumber || '06/2025'}, {primaryRecord?.hindiZoneName || activeZoneObj.hindiName} के अंतर्गत {primaryRecord?.hindiExamTitle || `${selectedExam} (${selectedStage})`} के लिए शॉर्टलिस्टेड अभ्यर्थियों का कट-ऑफ मार्क्स । (100 अंकों में से)
                  </p>
                  <p className="text-[11px] sm:text-xs font-bold text-slate-800">
                    Cutoff Marks (out of 100) of Candidates shortlisted for {selectedExam} under {primaryRecord?.cenNumber || 'CEN Notice'}, {primaryRecord?.zoneName || activeZoneObj.name}
                  </p>
                </div>

                {/* THE DYNAMIC SCHEMA-AGNOSTIC OFFICIAL CUTOFF TABLE */}
                <div className="overflow-x-auto border border-slate-300 rounded-lg shadow-2xs">
                  <table className={`w-full text-center border-collapse text-slate-800 ${isCompactView ? 'text-[11px]' : 'text-xs'}`}>
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-900 divide-x divide-slate-300">
                        {displayedColumns.map((col) => {
                          const isCatNo = normalizeKey(col) === 'CATNO' || normalizeKey(col) === 'CATEGORYNO' || normalizeKey(col) === 'POST';
                          return (
                            <th 
                              key={col} 
                              className={`py-2.5 px-3 whitespace-nowrap ${isCatNo ? 'bg-slate-200/80 font-black' : 'min-w-[65px]'}`}
                            >
                              {col.replace(/_/g, '-')}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300 font-mono">
                      {dynamicTableRows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-blue-50/40 divide-x divide-slate-300 transition-colors">
                          {displayedColumns.map((col) => {
                            const isCatNo = normalizeKey(col) === 'CATNO' || normalizeKey(col) === 'CATEGORYNO' || normalizeKey(col) === 'POST';
                            
                            // Find value by checking exact key, or fuzzy normalized key match
                            let val = row[col];
                            if (val === undefined) {
                              const matchingKey = Object.keys(row).find((k) => normalizeKey(k) === normalizeKey(col));
                              if (matchingKey) val = row[matchingKey];
                            }

                            return (
                              <td 
                                key={col} 
                                className={`py-2.5 px-2.5 ${isCatNo ? 'font-sans font-bold bg-slate-50 text-slate-900 whitespace-nowrap' : 'font-medium'}`}
                              >
                                {renderCellValue(val)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Document Metadata Footer Signature */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between text-xs font-bold text-slate-800 gap-2 border-t border-slate-200">
                  <div>
                    <span>Centralised Employment Notice ({primaryRecord?.cenNumber || 'CEN No. 06/2025'})</span>
                  </div>
                  <div>
                    <span>Date : {primaryRecord?.dateStr || '27/Aug/2026'}</span>
                  </div>
                  <div>
                    <span>{primaryRecord?.chairmanSign || `Chairman/${activeZoneObj.code || 'RRB'}`}</span>
                  </div>
                </div>

                {/* Abbreviations Footnote Box */}
                <div className="pt-3 text-[11px] text-slate-700 leading-relaxed border-t border-slate-200 font-sans">
                  <p>
                    <strong>शब्द-संक्षेप / Abbreviations:</strong> Cat. No. = Category Number, UR = Unreserved, SC = Scheduled Caste, ST = Scheduled Tribe, OBC = Other Backward Class (Non-creamy Layer), EWS=Economically Weaker Sections, ESM = Ex-Servicemen, R-VI = Regular vacancies of Visually Impaired, R-HI = Regular vacancies of Hearing Impaired, R-LD = Regular vacancies of Locomotor Disability, R-MD = Regular vacancies of Multiple Disabilities, B-VI = Backlog vacancies of Visually Impaired, B-HI = Backlog vacancies of Hearing Impaired, B-LD = Backlog vacancies of Locomotor Disability, B-OD = Backlog vacancies of Other Disabilities, B-MD = Backlog vacancies of Multiple Disabilities
                  </p>
                </div>

              </div>
            </div>
          </div>
        ) : (
          /* VIBRANT & COLORFUL COMING SOON CARD */
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-white p-6 sm:p-10 border-2 border-indigo-500/40 shadow-2xl space-y-8 animate-in fade-in zoom-in-95">
            
            {/* Colorful Decorative Glow Circles */}
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-gradient-to-br from-pink-500/30 to-purple-500/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-gradient-to-tr from-cyan-500/30 to-blue-500/30 rounded-full blur-3xl pointer-events-none" />
            
            {/* Top Badge & Header */}
            <div className="relative z-10 space-y-4 text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-500 text-slate-950 font-black text-xs uppercase tracking-widest shadow-lg shadow-rose-500/30 animate-pulse">
                <Sparkles className="w-4 h-4 text-amber-200 fill-amber-200" />
                <span>COMING SOON • जल्द जारी होगा</span>
                <Sparkles className="w-4 h-4 text-amber-200 fill-amber-200" />
              </div>

              <h2 className="text-2xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-yellow-200 via-pink-200 to-cyan-200 bg-clip-text text-transparent">
                कट-ऑफ जल्द जारी होगा (Coming Soon)
              </h2>

              <p className="text-sm sm:text-base text-indigo-200/90 font-medium leading-relaxed">
                <strong className="text-white font-bold">{selectedExam} ({selectedStage})</strong> के लिए <strong className="text-yellow-300 font-bold">{activeZoneObj.name} ({activeZoneObj.code})</strong> का आधिकारिक कट-ऑफ रेलवे भर्ती बोर्ड द्वारा अभी अपलोड/घोषित किया जाना शेष है।
              </p>
            </div>

            {/* Selected Query Chips Bar */}
            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-xs">
              <div className="space-y-0.5">
                <span className="text-[11px] text-indigo-300 font-semibold block">Post / Exam</span>
                <span className="font-extrabold text-white text-sm">{selectedExam}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] text-indigo-300 font-semibold block">Year</span>
                <span className="font-extrabold text-yellow-300 text-sm">{selectedYear}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] text-indigo-300 font-semibold block">Stage</span>
                <span className="font-extrabold text-cyan-300 text-sm">{selectedStage}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] text-indigo-300 font-semibold block">Selected RRB Zone</span>
                <span className="font-extrabold text-emerald-300 text-sm">{activeZoneObj.name} ({activeZoneObj.code})</span>
              </div>
            </div>

            {/* Status Information Box */}
            <div className="relative z-10 bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-indigo-500/15 border border-amber-400/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 mt-0.5 border border-amber-400/30">
                  <Clock className="w-5 h-5 animate-spin" style={{ animationDuration: '8s' }} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-amber-200 text-sm flex items-center space-x-2">
                    <span>आधिकारिक घोषणा की प्रतीक्षा है / Official Notice Awaited</span>
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    रेलवे बोर्ड द्वारा इस ज़ोन के परिणाम व कट-ऑफ पीडीएफ जारी होते ही यहाँ लाइव गजट तालिका स्वतः अपडेट हो जाएगी।
                  </p>
                </div>
              </div>

              <a
                href={activeZoneObj.officialWebsite}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white font-bold text-xs border border-white/20 transition-all flex items-center space-x-1.5 shrink-0 shadow-sm"
              >
                <span>RRB {activeZoneObj.code} Official Portal</span>
                <ExternalLink className="w-3.5 h-3.5 text-cyan-300" />
              </a>
            </div>

            {/* Quick Switch to Available Zones */}
            {zonesWithAvailableCutoffs.length > 0 && (
              <div className="relative z-10 space-y-3 pt-2 border-t border-white/10">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-300">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <span>वर्तमान में अपलोड किए गए कट-ऑफ देखें (View Available Cut-Off Zones):</span>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {zonesWithAvailableCutoffs.map((zone) => (
                    <button
                      key={zone.code}
                      type="button"
                      onClick={() => {
                        setSelectedZone(zone.code);
                        setSelectedZoneFilter(zone.code);
                        setSelectedExam('NTPC (Graduate)');
                        setSelectedStage('CBT-1');
                        setSelectedYear('2025');
                        setTimeout(() => {
                          const el = document.getElementById('cutoff-result-view');
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 100);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600/30 to-teal-600/30 hover:from-emerald-600/50 hover:to-teal-600/50 border border-emerald-400/40 text-emerald-200 hover:text-white text-xs font-extrabold transition-all cursor-pointer flex items-center space-x-1.5 shadow-xs"
                    >
                      <span>{zone.name} ({zone.code})</span>
                      <ArrowRight className="w-3 h-3 text-emerald-300" />
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* 4. BOTTOM TRUST BADGES STRIP */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 border border-slate-200 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-bold text-slate-800 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          
          {/* 1 */}
          <div className="flex items-center space-x-2.5 sm:px-3 pt-2 sm:pt-0">
            <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <span>All 21 RRB Zones Included</span>
          </div>

          {/* 2 */}
          <div className="flex items-center space-x-2.5 sm:px-3 pt-2 sm:pt-0">
            <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <span>Official Data from RRB Websites</span>
          </div>

          {/* 3 */}
          <div className="flex items-center space-x-2.5 sm:px-3 pt-2 sm:pt-0">
            <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <span>Official Qualifying Score Data</span>
          </div>

          {/* 4 */}
          <div className="flex items-center space-x-2.5 sm:px-3 pt-2 sm:pt-0">
            <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <span>Category-wise & Sub-Category Wise</span>
          </div>

        </div>
      </div>

    </div>
  );
};
