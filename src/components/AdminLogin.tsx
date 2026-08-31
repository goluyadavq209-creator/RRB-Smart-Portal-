import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2,
  ArrowRight,
  Shield
} from 'lucide-react';
import { loginAdmin } from '../utils/auth';

interface AdminLoginProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onCancel }) => {
  // Form State - Starts completely empty so admin fills it manually
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Status State
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanUser = usernameOrEmail.trim();
    const cleanPass = password.trim();

    if (!cleanUser) {
      setErrorMsg('Please enter your Admin Username or Email ID.');
      return;
    }
    if (!cleanPass) {
      setErrorMsg('Please enter your Admin Password.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const success = loginAdmin(cleanUser, cleanPass, rememberMe);
      setIsLoading(false);
      if (success) {
        setSuccessMsg('Authentication Successful! Redirecting to Admin Dashboard...');
        setTimeout(() => onSuccess(), 250);
      } else {
        setErrorMsg('Invalid Username / Email or Password. Please check your credentials.');
      }
    }, 250);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-2 sm:p-4 my-auto">
      <div className="w-full max-w-5xl bg-white rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 animate-in fade-in zoom-in-95 duration-200">
        
        {/* ================= LEFT COLUMN: HERO BANNER (5 Cols) ================= */}
        <div className="lg:col-span-5 relative bg-slate-950 min-h-[360px] lg:min-h-[560px] flex flex-col justify-between p-6 sm:p-8 text-white overflow-hidden">
          
          {/* Train Background Image with Vignette Overlay */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-45 mix-blend-luminosity scale-105 transform hover:scale-100 transition-transform duration-700"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1541427468627-a89a96e5ca1d?q=80&w=1200&auto=format&fit=crop')`
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-blue-950/80" />

          {/* Top Brand Block */}
          <div className="relative z-10 space-y-4">
            
            {/* Indian Railways Emblem Badge */}
            <div className="inline-flex items-center space-x-3">
              <div className="w-14 h-14 rounded-full bg-[#a3121f] border-2 border-white/80 flex items-center justify-center p-1.5 shadow-xl">
                <div className="w-full h-full rounded-full border border-amber-300 flex flex-col items-center justify-center text-center">
                  <div className="text-[7px] font-black text-amber-200 uppercase leading-none tracking-tighter">
                    भारतीय रेल
                  </div>
                  <div className="w-5 h-5 my-0.5 rounded-full border border-amber-300 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-amber-300" />
                  </div>
                  <div className="text-[6px] font-bold text-white uppercase leading-none tracking-tighter">
                    RAILWAYS
                  </div>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-amber-300 tracking-wider uppercase">
                  GOVERNMENT OF INDIA
                </div>
                <div className="text-xs font-semibold text-slate-300">
                  Ministry of Railways
                </div>
              </div>
            </div>

            {/* Big Typography matching screenshot */}
            <div className="pt-4 space-y-1">
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white font-sans">
                RRB
              </h1>
              <div className="text-xl sm:text-2xl font-bold tracking-widest text-slate-100 uppercase">
                ADMIN PORTAL
              </div>
              <div className="w-16 h-1 bg-red-600 rounded-full mt-2" />
              <p className="text-sm text-slate-300 pt-2 font-medium tracking-wide">
                Secure. Manage. Monitor.
              </p>
            </div>

          </div>

          {/* Bottom Overlay Card: "Secure Access" */}
          <div className="relative z-10 mt-8">
            <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 flex items-center space-x-3.5 shadow-xl">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>Secure Access</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <p className="text-xs text-slate-400 font-normal leading-snug mt-0.5">
                  This portal is for authorized administrators only.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onCancel}
              className="mt-3 text-xs text-slate-400 hover:text-white flex items-center space-x-1.5 transition-colors cursor-pointer py-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Public Result Portal</span>
            </button>
          </div>

        </div>


        {/* ================= RIGHT COLUMN: LOGIN FORM (7 Cols) ================= */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-12 flex flex-col justify-center">
          
          <div className="max-w-md w-full mx-auto space-y-6">
            
            {/* Header Shield & Titles */}
            <div className="text-center space-y-1.5">
              <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto mb-2 shadow-inner">
                <Shield className="w-8 h-8" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Admin Login
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Sign in with your Admin ID and Password to access RRB Admin Portal
              </p>
            </div>

            {/* Error Message Alert */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="leading-snug font-medium">{errorMsg}</div>
              </div>
            )}

            {/* Success Message Alert */}
            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start space-x-2.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="leading-snug font-medium">{successMsg}</div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Field 1: Username / Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Username / Email ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={usernameOrEmail}
                    onChange={(e) => {
                      setUsernameOrEmail(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="Enter your admin username or email"
                    autoComplete="off"
                    required
                    className="w-full pl-10 pr-3.5 py-3.5 bg-slate-50/80 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>

              {/* Field 2: Password (Hidden by default) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="Enter your password"
                    autoComplete="off"
                    required
                    className="w-full pl-10 pr-11 py-3.5 bg-slate-50/80 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:bg-white transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    tabIndex={-1}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Row: Remember Me */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center space-x-2 text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="font-medium">Remember this device</span>
                </label>
              </div>

              {/* Login Button (High contrast blue button) */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm transition-all shadow-md shadow-blue-600/20 hover:shadow-lg disabled:opacity-70 flex items-center justify-center space-x-2 cursor-pointer mt-2"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    <span>Login</span>
                  </>
                )}
              </button>

            </form>

            {/* Footer Tagline */}
            <div className="pt-4 text-center border-t border-slate-100">
              <div className="inline-flex items-center space-x-1.5 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Secure & Official Login Portal of Indian Railways</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
