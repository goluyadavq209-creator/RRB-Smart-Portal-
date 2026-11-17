import React, { useState } from 'react';
import { Search, TrendingUp, Tag, Plus, Trash2 } from 'lucide-react';

export const AdminSearchMgmtView: React.FC = () => {
  const [topSearches, setTopSearches] = useState<{ query: string; category: string }[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [newCategory, setNewCategory] = useState('Cut-off');

  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    setTopSearches([...topSearches, { query: newKeyword.trim(), category: newCategory }]);
    setNewKeyword('');
  };

  const handleRemoveKeyword = (idx: number) => {
    setTopSearches(topSearches.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-lg font-black text-slate-900 flex items-center space-x-2">
          <Search className="w-5 h-5 text-red-600" />
          <span>Search Management & Keyword Indexing</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure highlighted search keywords, candidate query tags, and fast search indexing
        </p>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-slate-900">Add Search Tag / Synonym</h3>
        <form onSubmit={handleAddKeyword} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="e.g., RRB NTPC Stage 1 Cut off"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            className="flex-1 px-3.5 py-2 text-xs border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-xl font-semibold bg-white cursor-pointer"
          >
            <option value="Cut-off">Cut-off</option>
            <option value="Notice">Notice</option>
            <option value="Admit Card">Admit Card</option>
            <option value="Result">Result</option>
            <option value="Answer Key">Answer Key</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center space-x-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Tag</span>
          </button>
        </form>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-slate-900">Active Search Tags & Directives</h3>

        {topSearches.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            <Search className="w-6 h-6 mx-auto mb-1.5 text-slate-300" />
            <span>No custom search keywords indexed yet. Add tags above to prioritize queries.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {topSearches.map((s, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
              >
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 rounded-md bg-white text-slate-700 font-bold flex items-center justify-center border border-slate-200 text-[11px]">
                    #{idx + 1}
                  </span>
                  <span className="font-bold text-slate-900">{s.query}</span>
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                    {s.category}
                  </span>
                </div>

                <button
                  onClick={() => handleRemoveKeyword(idx)}
                  className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                  title="Remove tag"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
