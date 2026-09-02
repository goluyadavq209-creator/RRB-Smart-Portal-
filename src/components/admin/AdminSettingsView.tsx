import React, { useState } from 'react';
import { Settings, Save, Shield, Database, Cpu, Globe, Sliders, AlertTriangle, Radio } from 'lucide-react';
import { FullRRBDatabase, SiteSettings } from '../../types';
import { saveRRBDatabase } from '../../utils/storage';
import { firestoreService } from '../../services/firestoreService';

interface AdminSettingsViewProps {
  database: FullRRBDatabase;
  setDatabase?: (db: FullRRBDatabase) => void;
  onSuccessMessage: (msg: string) => void;
}

export const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({ 
  database, 
  setDatabase,
  onSuccessMessage 
}) => {
  const [portalTitle, setPortalTitle] = useState('Railway Recruitment Board (RRB) Portal');
  const [defaultLanguage, setDefaultLanguage] = useState<'hi' | 'en'>('hi');
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(true);
  const [aiAnalysisEnabled, setAiAnalysisEnabled] = useState(true);

  // Maintenance / Website Live Settings
  const [isWebsiteLive, setIsWebsiteLive] = useState(database.settings?.isWebsiteLive !== false);
  const [maintenanceTitle, setMaintenanceTitle] = useState(database.settings?.maintenanceTitle || 'RRB Portal - Official Gateway Upgrade');
  const [maintenanceMessage, setMaintenanceMessage] = useState(database.settings?.maintenanceMessage || 'हम पोर्टल को और बेहतर और तीव्र बनाने के लिए तकनीकी अपडेट कर रहे हैं। जल्द ही सभी परीक्षा परिणाम, कट-ऑफ और उत्तर कुंजी उपलब्ध होंगे।');
  const [expectedLaunchDate, setExpectedLaunchDate] = useState(database.settings?.expectedLaunchDate || 'Coming Very Soon (जल्द आ रहे हैं)');
  const [supportContactEmail, setSupportContactEmail] = useState(database.settings?.supportContactEmail || 'helpdesk@rrb.gov.in');
  const [telegramChannelUrl, setTelegramChannelUrl] = useState(database.settings?.telegramChannelUrl || 'https://t.me/railway_recruitment_updates');

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const newSettings: SiteSettings = {
      isWebsiteLive,
      maintenanceTitle,
      maintenanceMessage,
      expectedLaunchDate,
      supportContactEmail,
      telegramChannelUrl,
    };

    const updatedDb: FullRRBDatabase = {
      ...database,
      settings: newSettings,
    };

    saveRRBDatabase(updatedDb);
    if (setDatabase) setDatabase(updatedDb);

    try {
      await firestoreService.updatePortalSettings(newSettings);
      onSuccessMessage(
        isWebsiteLive
          ? 'Settings saved to Cloud Firestore! Website is LIVE for all users.'
          : 'Settings saved to Cloud Firestore! Website is in OFF / Coming Soon Mode.'
      );
    } catch (err: any) {
      console.warn('Failed to save settings to Firestore:', err);
      onSuccessMessage('Settings saved locally. Firestore sync pending authorization.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center space-x-2">
            <Settings className="w-5 h-5 text-red-600" />
            <span>System Settings & Website Status Control</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage public website availability (Live vs Coming Soon mode), maintenance messages, and portal preferences
          </p>
        </div>

        {/* Quick Mode Status Badge */}
        <div className={`px-3.5 py-1.5 rounded-full text-xs font-black border flex items-center space-x-2 shrink-0 ${
          isWebsiteLive 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
            : 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
        }`}>
          <span className={`w-2 h-2 rounded-full ${isWebsiteLive ? 'bg-emerald-600' : 'bg-rose-600'}`} />
          <span>Status: {isWebsiteLive ? '🟢 LIVE (ON)' : '🔴 OFF (Coming Soon)'}</span>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
        {/* 1. MASTER WEBSITE ON/OFF SWITCH CARD */}
        <div className={`p-6 rounded-2xl border shadow-xs transition-all ${
          isWebsiteLive
            ? 'bg-white border-slate-200'
            : 'bg-rose-50/50 border-rose-200'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
            <div>
              <div className="flex items-center space-x-2">
                <Radio className={`w-4 h-4 ${isWebsiteLive ? 'text-emerald-600' : 'text-rose-600'}`} />
                <h3 className="text-sm font-black text-slate-900">
                  Master Website Mode (Live ON / Coming Soon OFF)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Toggle between active public website and the Coming Soon / Maintenance placeholder screen.
              </p>
            </div>

            {/* Toggle Switch */}
            <button
              type="button"
              onClick={() => setIsWebsiteLive(!isWebsiteLive)}
              className={`px-5 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer shadow-sm flex items-center space-x-2 shrink-0 ${
                isWebsiteLive
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-rose-600 hover:bg-rose-700 text-white'
              }`}
            >
              <span>{isWebsiteLive ? '🟢 Website is LIVE (Click to Turn OFF)' : '🔴 Website is OFF (Click to Turn ON)'}</span>
            </button>
          </div>

          {/* Maintenance / Coming Soon Options (Always visible for editing) */}
          <div className="mt-5 space-y-4">
            <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">
              Coming Soon / Maintenance Page Customization
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">Coming Soon Heading / Title</label>
                <input
                  type="text"
                  value={maintenanceTitle}
                  onChange={(e) => setMaintenanceTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1.5">Expected Launch Time</label>
                <input
                  type="text"
                  value={expectedLaunchDate}
                  onChange={(e) => setExpectedLaunchDate(e.target.value)}
                  placeholder="e.g., Coming Very Soon / 15 October 2025"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1.5">Maintenance Description / Notice Message</label>
              <textarea
                rows={3}
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">Support / Helpdesk Email</label>
                <input
                  type="email"
                  value={supportContactEmail}
                  onChange={(e) => setSupportContactEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1.5">Official Telegram Channel Link</label>
                <input
                  type="url"
                  value={telegramChannelUrl}
                  onChange={(e) => setTelegramChannelUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. GENERAL PORTAL SETTINGS */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
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
        </div>

        <div className="pt-3 flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-md flex items-center space-x-2 cursor-pointer transition-all hover:shadow-lg"
          >
            <Save className="w-4 h-4" />
            <span>Save All Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};

