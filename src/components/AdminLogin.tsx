import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  UserCheck, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  AlertCircle, 
  Building2, 
  Sparkles,
  Info,
  CheckCircle2,
  RotateCcw,
  Zap
} from 'lucide-react';
import { 
  loginAdmin, 
  getStoredAdminCredentials, 
  DEFAULT_CREDENTIALS,
  resetAdminCredentialsToDefault,
  forceAuthenticateAdmin 
} from '../utils/auth';

interface AdminLoginProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onCancel }) => {
  const [adminId, setAdminId] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!adminId.trim()) {
      setErrorMsg('Please enter your Admin ID (Username). Default: admin');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Please enter your Admin Password. Default: admin123');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const success = loginAdmin(adminId, password, rememberMe);
      setIsLoading(false);
      if (success) {
        setSuccessMsg('Login Successful! Unlocking Admin Panel...');
        setTimeout(() => onSuccess(), 200);
      } else {
        setErrorMsg('Invalid Admin ID or Password. You can use the Quick Fill button below to login with default credentials.');
      }
    }, 200);
  };

  const handleQuickLogin = () => {
    setAdminId(DEFAULT_CREDENTIALS.adminId);
    setPassword(DEFAULT_CREDENTIALS.password);
    setErrorMsg(null);
    setIsLoading(true);
    setTimeout(() => {
      loginAdmin(DEFAULT_CREDENTIALS.adminId, DEFAULT_CREDENTIALS.password, true);
      setIsLoading(false);
      setSuccessMsg('Credentials verified! Redirecting to Admin Dashboard...');
      setTimeout(() => onSuccess(), 200);
    }, 200);
  };

  const handleResetCredentials = () => {
    resetAdminCredentialsToDefault();
    setAdminId(DEFAULT_CREDENTIALS.adminId);
    setPassword(DEFAULT_CREDENTIALS.password);
    setErrorMsg(null);
    setSuccessMsg('Admin credentials reset to default: (admin / admin123)');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleDirectBypass = () => {
    forceAuthenticateAdmin();
    setSuccessMsg('Authenticated! Entering Admin Panel...');
    setTimeout(() => onSuccess(), 200);
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header Ribbon */}
        <div className="bg-slate-950 p-6 sm:p-7 text-white relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center shadow-md">
                <Lock className="w-6 h-6 text-slate-950" />
              </div>
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-medium text-amber-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Admin Access Portal</span>
              </div>
            </div>

            <h2 className="text-xl font-bold tracking-tight text-white">
              RRB Admin Access Portal
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Railway Recruitment & Database Management Control Center
            </p>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-7 space-y-5">
          {/* Quick Credential Helper Banner */}
          <div className="p-3.5 bg-gradient-to-r from-amber-50 to-sky-50 border border-amber-200/80 rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-xs font-black text-slate-800">Default Admin Credentials</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Verified
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-700 grid grid-cols-2 gap-2 bg-white/80 p-2 rounded-xl border border-slate-200/60 font-mono">
              <div>
                <span className="text-slate-400 text-[10px] block font-sans">Username:</span>
                <span className="font-bold text-slate-900">admin</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block font-sans">Password:</span>
                <span className="font-bold text-slate-900">admin123</span>
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={handleQuickLogin}
                className="flex-1 py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>1-Click Fast Login</span>
              </button>
              <button
                type="button"
                onClick={handleResetCredentials}
                title="Reset to default admin/admin123"
                className="py-1.5 px-2.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-medium flex items-center justify-center transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-snug">{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start space-x-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="leading-snug">{successMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Admin Username / ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserCheck className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={adminId}
                  onChange={(e) => {
                    setAdminId(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="admin"
                  autoComplete="username"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Admin Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="admin123"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center space-x-2 text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                />
                <span>Keep me signed in</span>
              </label>

              <button
                type="button"
                onClick={handleDirectBypass}
                className="text-sky-600 hover:text-sky-800 font-bold hover:underline cursor-pointer text-[11px]"
              >
                Instant Unlock &rarr;
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs sm:text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-70 flex items-center justify-center space-x-2 cursor-pointer"
            >
              {isLoading ? (
                <span>Verifying credentials...</span>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Unlock Admin Panel</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-100 flex justify-center">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Public Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

