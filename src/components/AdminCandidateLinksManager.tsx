import React, { useState } from 'react';
import { 
  Ticket, 
  FileSpreadsheet, 
  Award, 
  MapPin, 
  Plus, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles, 
  RotateCcw,
  Check,
  X,
  Link as LinkIcon,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { CandidatePortalLink, FullRRBDatabase, PortalLinkType, OFFICIAL_RRB_DIGIALM_LOGIN_URL } from '../types';
import { saveRRBDatabase } from '../utils/storage';
import { DEFAULT_CANDIDATE_PORTAL_LINKS } from '../data/defaultData';
import { dispatchNewDataNotification } from '../utils/notifications';

interface AdminCandidateLinksManagerProps {
  database: FullRRBDatabase;
  setDatabase: (db: FullRRBDatabase) => void;
  onSuccessMessage: (msg: string) => void;
}

export const AdminCandidateLinksManager: React.FC<AdminCandidateLinksManagerProps> = ({
  database,
  setDatabase,
  onSuccessMessage,
}) => {
  const portalLinks = database.portalLinks || [];

  const [filterType, setFilterType] = useState<'all' | PortalLinkType>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    title: string;
    examName: string;
    cenNumber: string;
    type: PortalLinkType;
    url: string;
    badgeText: string;
    isActive: boolean;
    notes: string;
  }>({
    title: '',
    examName: '',
    cenNumber: '',
    type: 'admit_card',
    url: OFFICIAL_RRB_DIGIALM_LOGIN_URL,
    badgeText: 'Active Now',
    isActive: true,
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      title: '',
      examName: '',
      cenNumber: '',
      type: 'admit_card',
      url: OFFICIAL_RRB_DIGIALM_LOGIN_URL,
      badgeText: 'Active Now',
      isActive: true,
      notes: '',
    });
    setEditingLinkId(null);
    setShowAddForm(false);
  };

  const handleStartEdit = (link: CandidatePortalLink) => {
    if (!link) return;
    setEditingLinkId(link.id);
    setFormData({
      title: link.title || '',
      examName: link.examName || '',
      cenNumber: link.cenNumber || '',
      type: link.type || 'admit_card',
      url: link.url || '',
      badgeText: link.badgeText || 'Active Now',
      isActive: link.isActive !== false,
      notes: link.notes || '',
    });
    setShowAddForm(true);
    window.scrollTo({ top: 250, behavior: 'smooth' });
  };

  const handleSaveLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Please enter a Title for this link.');
      return;
    }
    if (!formData.url.trim()) {
      alert('Please enter a valid URL.');
      return;
    }

    let updatedLinks: CandidatePortalLink[] = [];

    if (editingLinkId) {
      // Edit existing
      updatedLinks = portalLinks.map((item) =>
        item.id === editingLinkId
          ? {
              ...item,
              title: formData.title.trim(),
              examName: formData.examName.trim() || undefined,
              cenNumber: formData.cenNumber.trim() || undefined,
              type: formData.type,
              url: formData.url.trim(),
              badgeText: formData.badgeText.trim() || undefined,
              isActive: formData.isActive,
              notes: formData.notes.trim() || undefined,
            }
          : item
      );
      onSuccessMessage(`Updated direct link: "${formData.title}"`);
    } else {
      // Add new
      const newLink: CandidatePortalLink = {
        id: `link-${Date.now()}`,
        title: formData.title.trim(),
        examName: formData.examName.trim() || undefined,
        cenNumber: formData.cenNumber.trim() || undefined,
        type: formData.type,
        url: formData.url.trim(),
        badgeText: formData.badgeText.trim() || undefined,
        publishDate: new Date().toISOString().split('T')[0],
        isActive: formData.isActive,
        notes: formData.notes.trim() || undefined,
      };
      updatedLinks = [newLink, ...portalLinks];
      onSuccessMessage(`Added new direct link: "${formData.title}"`);
    }

    const updatedDb: FullRRBDatabase = {
      ...database,
      portalLinks: updatedLinks,
    };

    const notificationPayload = {
      title: `🔗 ${formData.title.trim()}`,
      message: `${formData.examName ? `[${formData.examName}] ` : ''}${formData.notes || 'Official Railway Candidate Portal link is now active.'}`,
      category: 'link' as const,
      targetTab: 'home' as const,
      linkUrl: formData.url.trim(),
    };

    saveRRBDatabase(updatedDb, notificationPayload);
    setDatabase(updatedDb);

    dispatchNewDataNotification({
      title: `🔗 ${formData.title.trim()}`,
      message: `${formData.examName ? `[${formData.examName}] ` : ''}${formData.notes || 'Official direct candidate link is now live on the portal.'}`,
      category: 'notice',
      targetTab: 'home',
      badgeText: formData.badgeText || 'Direct Link',
    });

    resetForm();
  };

  const handleDeleteLink = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to remove link: "${title}"?`)) {
      const updatedLinks = portalLinks.filter((l) => l.id !== id);
      const updatedDb: FullRRBDatabase = {
        ...database,
        portalLinks: updatedLinks,
      };
      saveRRBDatabase(updatedDb);
      setDatabase(updatedDb);
      onSuccessMessage(`Removed link: "${title}" from Home Screen.`);
    }
  };

  const handleToggleActive = (id: string) => {
    const updatedLinks = portalLinks.map((l) =>
      l.id === id ? { ...l, isActive: !l.isActive } : l
    );
    const updatedDb: FullRRBDatabase = {
      ...database,
      portalLinks: updatedLinks,
    };
    saveRRBDatabase(updatedDb);
    setDatabase(updatedDb);
    const target = updatedLinks.find((l) => l.id === id);
    onSuccessMessage(
      `Link "${target?.title}" is now ${target?.isActive ? 'ACTIVE on Home Screen' : 'HIDDEN'}.`
    );
  };

  const handleResetToDefaults = () => {
    if (
      window.confirm(
        'Reset all Candidate Direct Links back to the standard official default set (Admit Card, City Slip, Answer Key, Score Card)?'
      )
    ) {
      const updatedDb: FullRRBDatabase = {
        ...database,
        portalLinks: DEFAULT_CANDIDATE_PORTAL_LINKS,
      };
      saveRRBDatabase(updatedDb);
      setDatabase(updatedDb);
      onSuccessMessage('Candidate direct links reset to standard official presets.');
    }
  };

  const filteredLinks = filterType === 'all'
    ? portalLinks
    : portalLinks.filter((l) => l.type === filterType);

  const getTypeBadge = (type: PortalLinkType) => {
    switch (type) {
      case 'admit_card':
        return {
          label: 'Admit Card',
          bg: 'bg-rose-100 text-rose-800 border-rose-200',
          Icon: Ticket,
        };
      case 'answer_key':
        return {
          label: 'Answer Key',
          bg: 'bg-teal-100 text-teal-800 border-teal-200',
          Icon: FileSpreadsheet,
        };
      case 'score_card':
        return {
          label: 'Score Card',
          bg: 'bg-amber-100 text-amber-900 border-amber-300',
          Icon: Award,
        };
      case 'city_intimation':
      default:
        return {
          label: 'City Slip',
          bg: 'bg-blue-100 text-blue-800 border-blue-200',
          Icon: MapPin,
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
            <LinkIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-white">
              Candidate Direct Portals & Links Manager (Admit Card / Answer Key / Score Card)
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Add, edit, or remove direct links shown on the Home Screen for Answer Keys, Admit Cards, Scorecards, and Exam City Slips.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (showAddForm && !editingLinkId) {
                resetForm();
              } else {
                resetForm();
                setShowAddForm(true);
              }
            }}
            className="px-4 py-2 rounded-xl bg-[#c1121f] hover:bg-[#a50e1a] text-white font-bold text-xs shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddForm ? 'Close Form' : 'Add New Direct Link'}</span>
          </button>

          <button
            onClick={handleResetToDefaults}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold text-xs transition-all flex items-center space-x-1.5 cursor-pointer"
            title="Reset to default official portal links"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Add / Edit Form Card */}
      {showAddForm && (
        <div className="bg-white rounded-2xl border border-amber-300 p-5 sm:p-6 shadow-md animate-in fade-in space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#c1121f]"></span>
              <h4 className="font-black text-slate-900 text-sm sm:text-base">
                {editingLinkId ? 'Edit Candidate Direct Link' : 'Add New Candidate Direct Link'}
              </h4>
            </div>
            <button
              onClick={resetForm}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveLink} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Title */}
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-800 mb-1">
                  Link Title / Headline <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. RRB NTPC CEN 06/2025 CBT-2 Score Card & Marks Login"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Link Type */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Link Category / Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as PortalLinkType })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="admit_card">🎟️ Admit Card (E-Call Letter)</option>
                  <option value="answer_key">📝 Answer Key & Objections Tracker</option>
                  <option value="score_card">🏆 Score Card / Normalized Marks</option>
                  <option value="city_intimation">📍 Exam City & Date Intimation Slip</option>
                </select>
              </div>

              {/* Badge Text */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Badge / Status Pill Text
                </label>
                <input
                  type="text"
                  value={formData.badgeText}
                  onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
                  placeholder="e.g. Active Now, CBT-2 Live, Link Active"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Exam Name */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Target Exam Name
                </label>
                <input
                  type="text"
                  value={formData.examName}
                  onChange={(e) => setFormData({ ...formData, examName: e.target.value })}
                  placeholder="e.g. RRB NTPC Graduate / RRB ALP 2026"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* CEN Number */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  CEN Notification No.
                </label>
                <input
                  type="text"
                  value={formData.cenNumber}
                  onChange={(e) => setFormData({ ...formData, cenNumber: e.target.value })}
                  placeholder="e.g. CEN 06/2025 or All CENs"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Portal URL */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-800">
                    Official Login / Action Portal URL <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, url: OFFICIAL_RRB_DIGIALM_LOGIN_URL })}
                    className="text-[11px] font-bold text-amber-700 hover:text-amber-800 underline cursor-pointer"
                  >
                    Paste Official DigiALM URL
                  </button>
                </div>
                <input
                  type="url"
                  required
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://rrb.digialm.com/..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-[11px] focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Notes */}
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-800 mb-1">
                  Candidate Notes / Instructions (Optional)
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Login with Registration Number and User Password (DDMMYYYY)"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Active Toggle */}
              <div className="sm:col-span-2 flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                />
                <label htmlFor="isActiveToggle" className="font-bold text-slate-800 cursor-pointer">
                  Show and Activate this link on the Home Screen
                </label>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={resetForm}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2.5 px-6 bg-[#c1121f] hover:bg-[#a50e1a] text-white font-bold rounded-xl transition-all shadow-sm cursor-pointer flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{editingLinkId ? 'Update Link' : 'Save Direct Link to Database'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Tabs & Counter */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h4 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
              <span>Active Database Candidate Links ({portalLinks.length})</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              These links are rendered on the Home Screen for all visiting students and candidates.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: `All (${portalLinks.length})` },
              { id: 'admit_card', label: `Admit Cards (${portalLinks.filter((l) => l.type === 'admit_card').length})` },
              { id: 'answer_key', label: `Answer Keys (${portalLinks.filter((l) => l.type === 'answer_key').length})` },
              { id: 'score_card', label: `Score Cards (${portalLinks.filter((l) => l.type === 'score_card').length})` },
              { id: 'city_intimation', label: `City Slips (${portalLinks.filter((l) => l.type === 'city_intimation').length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterType === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Links Table/List */}
        {filteredLinks.length === 0 ? (
          <div className="py-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <LinkIcon className="w-6 h-6" />
            </div>
            <p className="text-xs text-slate-500 font-medium">
              No links found in this category. Click &ldquo;Add New Direct Link&rdquo; to add one.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLinks.map((item) => {
              const badge = getTypeBadge(item.type);
              const Icon = badge.Icon;

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    item.isActive
                      ? 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                      : 'bg-slate-100/60 border-dashed border-slate-300 opacity-60'
                  }`}
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${badge.bg}`}>
                        <Icon className="w-3 h-3" />
                        <span>{badge.label}</span>
                      </span>

                      {item.badgeText && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          {item.badgeText}
                        </span>
                      )}

                      {item.cenNumber && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-900 text-white text-[10px] font-mono font-bold">
                          {item.cenNumber}
                        </span>
                      )}

                      {!item.isActive && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-300 text-slate-700 text-[10px] font-bold">
                          HIDDEN
                        </span>
                      )}
                    </div>

                    <h5 className="font-extrabold text-sm text-slate-900">
                      {item.title}
                    </h5>

                    {item.examName && (
                      <p className="text-[11px] font-semibold text-slate-600">
                        Exam: {item.examName}
                      </p>
                    )}

                    <p className="text-[11px] text-slate-500 font-mono truncate max-w-xl">
                      URL: {item.url}
                    </p>

                    {item.notes && (
                      <p className="text-[11px] text-slate-500 italic">
                        Note: {item.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                    {/* Toggle Active Button */}
                    <button
                      onClick={() => handleToggleActive(item.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        item.isActive
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                      title={item.isActive ? 'Click to hide link from home' : 'Click to show link on home'}
                    >
                      {item.isActive ? 'Active (Live)' : 'Disabled'}
                    </button>

                    {/* Test Link Button */}
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                      title="Test URL in new tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>

                    {/* Edit Button */}
                    <button
                      onClick={() => handleStartEdit(item)}
                      className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors cursor-pointer"
                      title="Edit this link"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteLink(item.id, item.title)}
                      className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                      title="Delete / Remove this link"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
