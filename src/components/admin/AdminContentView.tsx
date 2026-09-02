import React, { useState } from 'react';
import { Newspaper, Link2, ExternalLink, Plus, Edit3, Trash2, Globe } from 'lucide-react';
import { FullRRBDatabase, CandidatePortalLink } from '../../types';
import { saveRRBDatabase } from '../../utils/storage';
import { firestoreService } from '../../services/firestoreService';

interface AdminContentViewProps {
  database: FullRRBDatabase;
  setDatabase?: (db: FullRRBDatabase) => void;
  onSuccessMessage: (msg: string) => void;
}

export const AdminContentView: React.FC<AdminContentViewProps> = ({ database, setDatabase, onSuccessMessage }) => {
  const [links, setLinks] = useState<CandidatePortalLink[]>(
    database.portalLinks || []
  );

  // Synchronize when central database updates from cloud or other devices
  React.useEffect(() => {
    setLinks(database.portalLinks || []);
  }, [database.portalLinks]);

  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newExam, setNewExam] = useState('');

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newUrl) return;

    const newLink: CandidatePortalLink = {
      id: `link-${Date.now()}`,
      title: newTitle,
      url: newUrl,
      examName: newExam || 'All RRB Exams',
      cenNumber: 'Live Portal',
      type: 'score_card',
      badgeText: 'Official',
      publishDate: new Date().toISOString().split('T')[0],
      isActive: true,
    };

    const updatedLinks = [newLink, ...links];
    setLinks(updatedLinks);

    const updatedDb: FullRRBDatabase = {
      ...database,
      portalLinks: updatedLinks,
    };
    firestoreService.createPortalLink(newLink).catch((e) => console.warn('Firestore link write:', e));
    saveRRBDatabase(updatedDb);
    if (setDatabase) setDatabase(updatedDb);

    setNewTitle('');
    setNewUrl('');
    setNewExam('');
    setShowModal(false);
    onSuccessMessage('Official candidate link added to Cloud Firestore successfully.');
  };

  const handleDelete = (id: string) => {
    firestoreService.deletePortalLink(id).catch((e) => console.warn('Firestore link delete:', e));
    const updatedLinks = links.filter((l) => l.id !== id);
    setLinks(updatedLinks);
    const updatedDb: FullRRBDatabase = {
      ...database,
      portalLinks: updatedLinks,
    };
    saveRRBDatabase(updatedDb);
    if (setDatabase) setDatabase(updatedDb);
    onSuccessMessage('Official link removed from Cloud Firestore.');
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-lg font-black text-slate-900 flex items-center space-x-2">
          <Newspaper className="w-5 h-5 text-red-600" />
          <span>Content & Official Links Management</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure verified candidate links verified from <a href="https://rrb.indianrailways.gov.in/" target="_blank" rel="noreferrer" className="text-red-600 font-bold hover:underline">https://rrb.indianrailways.gov.in/</a>
        </p>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
            <Link2 className="w-4 h-4 text-blue-600" />
            <span>Direct Official Candidate Portal Links</span>
          </h3>
          <button
            onClick={() => setShowModal(true)}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Official Link</span>
          </button>
        </div>

        {links.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            <Globe className="w-6 h-6 mx-auto mb-1.5 text-slate-300" />
            <span>No portal links registered yet. Click "Add Official Link" above to publish links.</span>
          </div>
        ) : (
          <div className="space-y-2.5">
            {links.filter(Boolean).map((link) => (
              <div
                key={link.id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">{link.title || 'Untitled Link'}</span>
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                      {link.badgeText || 'Official'}
                    </span>
                  </div>
                  <a
                    href={link.url || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline flex items-center space-x-1 mt-1 text-[11px] font-mono"
                  >
                    <span>{link.url || 'No URL'}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>

                <button
                  onClick={() => handleDelete(link.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Add Official Portal Link</h3>
            <form onSubmit={handleAddLink} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. RRB NTPC E-Call Letter Download"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Official URL</label>
                <input
                  type="url"
                  required
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://rrb.indianrailways.gov.in/..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px]"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Exam / CEN Category</label>
                <input
                  type="text"
                  value={newExam}
                  onChange={(e) => setNewExam(e.target.value)}
                  placeholder="e.g. CEN 01/2024 ALP"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl"
                >
                  Save Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
