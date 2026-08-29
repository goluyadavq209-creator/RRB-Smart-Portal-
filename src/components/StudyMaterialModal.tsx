import React, { useState } from 'react';
import { BookOpen, X, Download, FileText, Search, ExternalLink, Check } from 'lucide-react';

interface StudyMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StudyMaterialModal: React.FC<StudyMaterialModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadedId, setDownloadedId] = useState<string | null>(null);

  const materials = [
    {
      id: 'mat-1',
      title: 'RRB NTPC Previous Year Solved Papers (2016-2022 All Shifts)',
      category: 'Previous Year Papers',
      size: '14.2 MB',
      downloads: '142K',
      format: 'PDF',
      url: 'https://rrbcdg.gov.in',
    },
    {
      id: 'mat-2',
      title: 'General Science 1000 Most Repeated MCQs (Physics, Chemistry, Biology)',
      category: 'General Science',
      size: '6.8 MB',
      downloads: '98K',
      format: 'PDF',
      url: 'https://rrbcdg.gov.in',
    },
    {
      id: 'mat-3',
      title: 'RRB Mathematics Formula & Short Tricks Handbook (Hindi & English)',
      category: 'Mathematics',
      size: '4.5 MB',
      downloads: '85K',
      format: 'PDF',
      url: 'https://rrbcdg.gov.in',
    },
    {
      id: 'mat-4',
      title: 'Indian Railways Complete History & Static GK Compilation',
      category: 'Railway GK',
      size: '5.1 MB',
      downloads: '110K',
      format: 'PDF',
      url: 'https://rrbcdg.gov.in',
    },
    {
      id: 'mat-5',
      title: 'RRB ALP & Technician Basic Science & Engineering Drawing Guide',
      category: 'Engineering & Trade',
      size: '18.4 MB',
      downloads: '72K',
      format: 'PDF',
      url: 'https://rrbcdg.gov.in',
    },
    {
      id: 'mat-6',
      title: 'General Intelligence & Reasoning 500 Practice Questions with Solutions',
      category: 'Reasoning',
      size: '8.3 MB',
      downloads: '64K',
      format: 'PDF',
      url: 'https://rrbcdg.gov.in',
    },
  ];

  const handleDownload = (id: string) => {
    setDownloadedId(id);
    setTimeout(() => setDownloadedId(null), 2500);
  };

  const filtered = materials.filter((m) =>
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-2xl max-h-[85vh] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#031435] via-[#072458] to-[#0c3a82] text-white p-5 flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-white">Study Material & PDFs</h3>
              <p className="text-xs text-slate-300">Free official exam preparation resources</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="bg-white rounded-2xl p-1.5 flex items-center border border-slate-200 shadow-2xs">
            <Search className="w-4 h-4 text-slate-400 ml-2.5 shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search previous papers, formula books, GK guides..."
              className="w-full bg-transparent px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-[10px] uppercase">
                    {item.category}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {item.size} • {item.downloads} downloads
                  </span>
                </div>
                <h4 className="font-extrabold text-sm text-slate-900">
                  {item.title}
                </h4>
              </div>

              <button
                type="button"
                onClick={() => handleDownload(item.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer shrink-0 ${
                  downloadedId === item.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#c1121f] hover:bg-[#a50f1a] text-white shadow-xs'
                }`}
              >
                {downloadedId === item.id ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Downloaded</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
