import React, { useState } from 'react';
import { Settings, Save, Shield, Database, Cpu, Globe, Sliders } from 'lucide-react';
import { FullRRBDatabase } from '../../types';

interface AdminSettingsViewProps {
  database: FullRRBDatabase;
  onSuccessMessage: (msg: string) => void;
}

export const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({ database, onSuccessMessage }) => {
  const [portalTitle, setPortalTitle] = useState('Railway Recruitment Board (RRB) Portal');
  const [defaultLanguage, setDefaultLanguage] = useState<'hi' | 'en'>('hi');
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(true);
  const [aiAnalysisEnabled, setAiAnalysisEnabled] = useState(true);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onSuccessMessage('System settings saved successfully');
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-lg font-black text-slate-900 flex items-center space-x-2">
          <Settings className="w-5 h-5 text-red-600" />
          <span>System Settings & Configuration</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure portal preferences, AI parameters, language defaults & scraper intervals
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 text-xs">
        <div>
          <label className="block font-bold text-slate-800 mb-1.5">Portal Display Title</label>
          <input
            type="text"
            value={portalTitle}
            onChange={(e) => setPortalTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-800 mb-1.5">Default Interface Language</label>
            <select
              value={defaultLanguage}
              onChange={(e) => setDefaultLanguage(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
            >
              <option value="hi">हिंदी (Hindi - Official)</option>
              <option value="en">English (Official)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1.5">OCR / AI Parser Mode</label>
            <select className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900">
              <option>Gemini NLP + Regex Heuristics (High Precision)</option>
              <option>Strict Regex Rules Only (Offline Mode)</option>
            </select>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={autoUpdateEnabled}
              onChange={(e) => setAutoUpdateEnabled(e.target.checked)}
              className="w-4 h-4 rounded text-red-600 focus:ring-red-500"
            />
            <div>
              <span className="font-bold text-slate-900 block">Enable Automated Regional Web Crawling</span>
              <span className="text-[11px] text-slate-500">
                Periodically check 21 regional RRB portals for new cutoff notices and application alerts.
              </span>
            </div>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={aiAnalysisEnabled}
              onChange={(e) => setAiAnalysisEnabled(e.target.checked)}
              className="w-4 h-4 rounded text-red-600 focus:ring-red-500"
            />
            <div>
              <span className="font-bold text-slate-900 block">Enable Smart RRB AI Candidate Assistant</span>
              <span className="text-[11px] text-slate-500">
                Allow candidates to interact with the bilingual AI avatar for cut-off queries & syllabus guidance.
              </span>
            </div>
          </label>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-md flex items-center space-x-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
