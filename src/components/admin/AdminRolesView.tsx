import React, { useState } from 'react';
import { Shield, Lock, Key, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import { updateAdminCredentials, getStoredAdminCredentials } from '../../utils/auth';

interface AdminRolesViewProps {
  onSuccessMessage: (msg: string) => void;
}

export const AdminRolesView: React.FC<AdminRolesViewProps> = ({ onSuccessMessage }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newAdminId, setNewAdminId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const creds = getStoredAdminCredentials();

    if (newPassword && newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    const updatedId = newAdminId.trim() || creds.adminId;
    const updatedPass = newPassword.trim() || currentPassword;

    setIsSaving(true);
    try {
      const ok = await updateAdminCredentials(updatedId, updatedPass, undefined, undefined, currentPassword);
      if (ok) {
        setCurrentPassword('');
        setNewAdminId('');
        setNewPassword('');
        setConfirmPassword('');
        onSuccessMessage('Admin credentials saved to PostgreSQL Cloud SQL successfully across all devices.');
      } else {
        setError('Failed to update credentials. Please check your current password.');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with database server.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-lg font-black text-slate-900 flex items-center space-x-2">
          <Shield className="w-5 h-5 text-red-600" />
          <span>Admin Security, Roles & Authentication</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Update administrator access credentials, session timeout policies & encryption keys
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs max-w-xl space-y-4 text-xs">
        <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
          <Lock className="w-4 h-4 text-amber-500" />
          <span>Change Administrator Credentials</span>
        </h3>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleUpdate} autoComplete="off" className="space-y-3.5">
          <div>
            <label className="block font-bold text-slate-800 mb-1">Current Password *</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current active password"
              autoComplete="off"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block font-bold text-slate-800 mb-1">New Admin Username</label>
              <input
                type="text"
                value={newAdminId}
                onChange={(e) => setNewAdminId(e.target.value)}
                placeholder="Leave blank to keep existing"
                autoComplete="off"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                autoComplete="new-password"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-type new password"
              autoComplete="new-password"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-md flex items-center space-x-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Update Credentials</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
