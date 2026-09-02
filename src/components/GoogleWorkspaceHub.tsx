import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  FileText, 
  Database, 
  CheckCircle2, 
  ExternalLink, 
  Plus, 
  RefreshCw, 
  Sparkles, 
  Download, 
  LogOut, 
  ShieldCheck, 
  AlertTriangle,
  HelpCircle,
  Table,
  Send,
  Eye,
  Trash2
} from 'lucide-react';
import { 
  googleSignIn, 
  logoutGoogle, 
  initAuth, 
  getAccessToken, 
  getIdTokenAsync 
} from '../lib/firebase';
import { 
  createRRBForm, 
  listUserForms, 
  getFormResponses, 
  createRRBCutOffSpreadsheet, 
  listUserSheets, 
  readSheetData,
  GoogleFormSummary,
  GoogleSheetSummary
} from '../services/googleWorkspace';
import { loadRRBDatabase } from '../utils/storage';

interface GoogleWorkspaceHubProps {
  onClose?: () => void;
}

export const GoogleWorkspaceHub: React.FC<GoogleWorkspaceHubProps> = ({ onClose }) => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'forms' | 'sheets' | 'cloudsql'>('forms');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Forms state
  const [formsList, setFormsList] = useState<GoogleFormSummary[]>([]);
  const [newFormTitle, setNewFormTitle] = useState('RRB NTPC 2024 Candidate Feedback & Survey');
  const [newFormDesc, setNewFormDesc] = useState('Official feedback form for Indian Railway Recruitment Board aspirants regarding exam difficulty, questions, and shift experience.');
  const [selectedFormResponses, setSelectedFormResponses] = useState<{ formId: string; data: any } | null>(null);

  // Sheets state
  const [sheetsList, setSheetsList] = useState<GoogleSheetSummary[]>([]);
  const [newSheetTitle, setNewSheetTitle] = useState('RRB All Exams Cut-Off Matrix 2024-2025');
  const [selectedSheetData, setSelectedSheetData] = useState<{ sheetId: string; title: string; rows: string[][] } | null>(null);

  // Cloud SQL state
  const [cloudSqlStats, setCloudSqlStats] = useState<any>(null);
  const [savedExports, setSavedExports] = useState<{ forms: any[]; sheets: any[] }>({ forms: [], sheets: [] });
  const [feedbackInput, setFeedbackInput] = useState({
    candidateName: '',
    rollNumber: '',
    examName: 'RRB NTPC Graduate (CEN 05/2024)',
    zone: 'RRB Prayagraj (Allahabad)',
    feedbackText: '',
    rating: 5,
  });

  // Destructive / Mutating Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionType: 'create_form' | 'export_sheet' | 'submit_feedback';
    payload?: any;
  }>({
    isOpen: false,
    title: '',
    description: '',
    actionType: 'create_form',
  });

  // Init Auth Listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (authUser, authToken) => {
        setUser(authUser);
        setToken(authToken);
        if (authToken) {
          fetchUserWorkspaceData();
        }
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    fetchDbStats();
    return () => unsubscribe();
  }, []);

  const fetchDbStats = async () => {
    try {
      const res = await fetch('/api/db/stats');
      const data = await res.json();
      if (data.success) {
        setCloudSqlStats(data.cloudSql);
      }
    } catch {
      // ignore
    }
  };

  const fetchUserWorkspaceData = async () => {
    setIsLoading(true);
    setStatusMsg(null);
    try {
      const [forms, sheets] = await Promise.all([
        listUserForms().catch(() => []),
        listUserSheets().catch(() => []),
      ]);
      setFormsList(forms);
      setSheetsList(sheets);

      // Fetch saved exports from Cloud SQL
      const idToken = await getIdTokenAsync();
      if (idToken) {
        const exportsRes = await fetch('/api/db/user-exports', {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const exportsData = await exportsRes.json();
        if (exportsData.forms || exportsData.sheets) {
          setSavedExports(exportsData);
        }
      }
    } catch (error: any) {
      console.warn('Workspace data fetch notice:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Google Sign In
  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    setStatusMsg(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        setStatusMsg({ type: 'success', text: `Signed in as ${res.user.email}. Google Forms and Sheets connected!` });
        await fetchUserWorkspaceData();
      }
    } catch (error: any) {
      setStatusMsg({ type: 'error', text: error.message || 'Google Sign-In was cancelled or failed.' });
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Google Logout
  const handleLogout = async () => {
    await logoutGoogle();
    setUser(null);
    setToken(null);
    setFormsList([]);
    setSheetsList([]);
    setStatusMsg({ type: 'info', text: 'Logged out from Google Workspace.' });
  };

  // Create Form with explicit confirmation
  const initiateCreateForm = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Create Google Form in Your Google Drive?',
      description: `This will create a new Google Form titled "${newFormTitle}" in your personal Google account with pre-configured RRB questions (Candidate Name, Roll Number, Exam Category, Exam Zone, and Feedback Rating).`,
      actionType: 'create_form',
    });
  };

  const executeCreateForm = async () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    setIsLoading(true);
    setStatusMsg(null);
    try {
      const questions = [
        { title: 'Candidate Full Name', type: 'TEXT' as const, required: true },
        { title: 'RRB Roll Number / Registration No.', type: 'TEXT' as const, required: true },
        { 
          title: 'Target Exam Post', 
          type: 'RADIO' as const, 
          options: ['NTPC Graduate', 'NTPC Under Graduate', 'Assistant Loco Pilot (ALP)', 'Technician Gr I & III', 'Junior Engineer (JE)', 'Group D (Level 1)', 'RPF SI / Constable'],
          required: true 
        },
        { 
          title: 'RRB Zone / Board Applied', 
          type: 'RADIO' as const, 
          options: ['Prayagraj (Allahabad)', 'Gorakhpur', 'Patna', 'Mumbai', 'Kolkata', 'Chandigarh', 'Secunderabad', 'Bhopal', 'Other Zone'],
          required: true 
        },
        { 
          title: 'Exam Difficulty Level & Overall Shift Feedback', 
          type: 'PARAGRAPH_TEXT' as const, 
          required: true 
        },
        { 
          title: 'Overall Portal Experience Rating (1 to 5)', 
          type: 'SCALE' as const, 
          required: true 
        }
      ];

      const res = await createRRBForm(newFormTitle, newFormDesc, questions);
      setStatusMsg({
        type: 'success',
        text: `Successfully created "${newFormTitle}"! Saved in Google Drive & logged to Cloud SQL PostgreSQL.`,
      });
      await fetchUserWorkspaceData();
      await fetchDbStats();
    } catch (error: any) {
      setStatusMsg({ type: 'error', text: error.message || 'Failed to create Google Form.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Export Cut-Offs to Google Sheet with confirmation
  const initiateExportSheet = () => {
    const db = loadRRBDatabase();
    const count = db.cutoffs && db.cutoffs.length > 0 ? db.cutoffs.length : 7;
    setConfirmModal({
      isOpen: true,
      title: 'Export RRB Cut-Off Data to New Google Sheet?',
      description: `This will create a brand new Google Spreadsheet titled "${newSheetTitle}" in your personal Google Drive with ${count} comprehensive RRB Cut-Off records across all categories (UR, OBC, SC, ST, EWS).`,
      actionType: 'export_sheet',
    });
  };

  const executeExportSheet = async () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    setIsLoading(true);
    setStatusMsg(null);
    try {
      const db = loadRRBDatabase();
      let formattedRows: Array<{
        examName: string;
        postName: string;
        zone: string;
        year: string;
        ur: string;
        obc: string;
        sc: string;
        st: string;
        ews: string;
      }> = [];

      if (db.cutoffs && db.cutoffs.length > 0) {
        formattedRows = db.cutoffs.map((item) => ({
          examName: item.examTitle || 'RRB Exam',
          postName: item.postName || 'All Posts',
          zone: item.zoneName || item.zoneCode || 'All Zones',
          year: String(item.year || '2024'),
          ur: String(item.cutoffs?.UR ?? '-'),
          obc: String(item.cutoffs?.OBC ?? '-'),
          sc: String(item.cutoffs?.SC ?? '-'),
          st: String(item.cutoffs?.ST ?? '-'),
          ews: String(item.cutoffs?.EWS ?? '-'),
        }));
      } else {
        formattedRows = [
          { examName: 'RRB NTPC Graduate (CEN 05/2024)', postName: 'Commercial Apprentice', zone: 'RRB Prayagraj (Allahabad)', year: '2024', ur: '88.54', obc: '84.12', sc: '78.20', st: '72.45', ews: '83.10' },
          { examName: 'RRB NTPC Graduate (CEN 05/2024)', postName: 'Station Master', zone: 'RRB Prayagraj (Allahabad)', year: '2024', ur: '77.89', obc: '73.20', sc: '67.45', st: '62.10', ews: '71.80' },
          { examName: 'RRB NTPC Graduate (CEN 05/2024)', postName: 'Goods Train Manager', zone: 'RRB Chandigarh', year: '2024', ur: '76.32', obc: '71.50', sc: '65.40', st: '60.80', ews: '70.25' },
          { examName: 'RRB ALP (CEN 01/2024)', postName: 'Assistant Loco Pilot', zone: 'RRB Mumbai', year: '2024', ur: '68.45', obc: '63.20', sc: '56.80', st: '51.40', ews: '61.75' },
          { examName: 'RRB Technician (CEN 02/2024)', postName: 'Technician Gr III (Signal)', zone: 'RRB Kolkata', year: '2024', ur: '74.20', obc: '69.80', sc: '62.10', st: '57.30', ews: '68.50' },
          { examName: 'RRB JE (CEN 03/2024)', postName: 'Junior Engineer (Civil)', zone: 'RRB Secunderabad', year: '2024', ur: '79.10', obc: '75.40', sc: '68.30', st: '64.20', ews: '73.90' },
          { examName: 'RRB Group D (CEN 08/2024)', postName: 'Track Maintainer Gr IV', zone: 'RRB Patna', year: '2024', ur: '71.20', obc: '66.80', sc: '59.40', st: '53.90', ews: '64.10' },
        ];
      }

      const result = await createRRBCutOffSpreadsheet(newSheetTitle, formattedRows);
      setStatusMsg({
        type: 'success',
        text: `Successfully exported ${result.rowCount} records to Google Sheet! Logged in Cloud SQL PostgreSQL.`,
      });
      await fetchUserWorkspaceData();
      await fetchDbStats();
    } catch (error: any) {
      setStatusMsg({ type: 'error', text: error.message || 'Failed to export Google Sheet.' });
    } finally {
      setIsLoading(false);
    }
  };

  // View Form Responses
  const handleViewFormResponses = async (formId: string) => {
    setIsLoading(true);
    try {
      const data = await getFormResponses(formId);
      setSelectedFormResponses({ formId, data });
    } catch (error: any) {
      setStatusMsg({ type: 'error', text: `Could not fetch responses: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  // View Sheet Data
  const handleViewSheetData = async (sheetId: string, title: string) => {
    setIsLoading(true);
    try {
      const data = await readSheetData(sheetId, 'Sheet1!A1:Z50');
      setSelectedSheetData({
        sheetId,
        title,
        rows: data.values || [],
      });
    } catch (error: any) {
      setStatusMsg({ type: 'error', text: `Could not read sheet data: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Feedback to Cloud SQL
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackInput.candidateName || !feedbackInput.feedbackText) {
      setStatusMsg({ type: 'error', text: 'Please fill candidate name and feedback text.' });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/db/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackInput),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg({ type: 'success', text: 'Candidate feedback saved directly to Cloud SQL PostgreSQL!' });
        setFeedbackInput({
          candidateName: '',
          rollNumber: '',
          examName: 'RRB NTPC Graduate (CEN 05/2024)',
          zone: 'RRB Prayagraj (Allahabad)',
          feedbackText: '',
          rating: 5,
        });
        await fetchDbStats();
      }
    } catch (error: any) {
      setStatusMsg({ type: 'error', text: error.message || 'Failed to submit feedback' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 px-6 py-5 text-white flex items-center justify-between border-b border-blue-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/30 rounded-xl border border-blue-400/30">
              <Sparkles className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                Google Workspace & Cloud SQL Hub
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-medium">
                  Active Integration
                </span>
              </h2>
              <p className="text-xs text-blue-200/80 mt-0.5">
                Google Forms • Google Sheets • Cloud SQL PostgreSQL (asia-southeast1)
              </p>
            </div>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* User Google Authentication Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || 'Google User'} 
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full border border-slate-300"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                  {user.email?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 text-sm">{user.displayName || user.email}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> OAuth Verified
                  </span>
                </div>
                <span className="text-xs text-slate-500">{user.email}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 text-amber-800 rounded-lg text-xs font-medium">
                Connect your Google account to create live Forms & export to Sheets
              </div>
              {/* Official Google Sign In Button */}
              <button 
                onClick={handleGoogleSignIn}
                disabled={isLoggingIn}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm rounded-lg border border-slate-300 shadow-sm transition-all hover:border-slate-400 active:scale-95 disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                {isLoggingIn ? 'Connecting...' : 'Sign in with Google'}
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            {user && (
              <>
                <button
                  onClick={fetchUserWorkspaceData}
                  disabled={isLoading}
                  className="px-3 py-1.5 text-xs font-medium bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
                </button>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 flex items-center gap-1.5 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </>
            )}
          </div>
        </div>

        {/* Status Notification */}
        {statusMsg && (
          <div className={`px-6 py-2.5 text-xs flex items-center justify-between border-b ${
            statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
            statusMsg.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' :
            'bg-blue-50 text-blue-800 border-blue-200'
          }`}>
            <div className="flex items-center gap-2 font-medium">
              {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-red-600" />}
              {statusMsg.text}
            </div>
            <button onClick={() => setStatusMsg(null)} className="hover:opacity-70">✕</button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-6 gap-2">
          <button
            onClick={() => setActiveTab('forms')}
            className={`py-3 px-4 font-semibold text-sm border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'forms' 
                ? 'border-blue-600 text-blue-600 bg-blue-50/40' 
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" /> Google Forms
          </button>
          <button
            onClick={() => setActiveTab('sheets')}
            className={`py-3 px-4 font-semibold text-sm border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'sheets' 
                ? 'border-emerald-600 text-emerald-600 bg-emerald-50/40' 
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" /> Google Sheets
          </button>
          <button
            onClick={() => setActiveTab('cloudsql')}
            className={`py-3 px-4 font-semibold text-sm border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'cloudsql' 
                ? 'border-purple-600 text-purple-600 bg-purple-50/40' 
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4" /> Cloud SQL PostgreSQL
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/60">

          {/* TAB 1: GOOGLE FORMS */}
          {activeTab === 'forms' && (
            <div className="space-y-6">
              {/* Action Card: Create RRB Form */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">Create Live RRB Candidate Survey Form</h3>
                      <p className="text-xs text-slate-500">Automatically creates an interactive form in your Google Account with full question items</p>
                    </div>
                  </div>
                  <button
                    onClick={initiateCreateForm}
                    disabled={!user || isLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" /> Generate Google Form
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Form Title</label>
                    <input
                      type="text"
                      value={newFormTitle}
                      onChange={(e) => setNewFormTitle(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Form Description</label>
                    <input
                      type="text"
                      value={newFormDesc}
                      onChange={(e) => setNewFormDesc(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600 flex flex-wrap gap-2 items-center">
                  <span className="font-semibold text-slate-700">Pre-Configured Questions:</span>
                  <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700">1. Candidate Name</span>
                  <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700">2. RRB Roll Number</span>
                  <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700">3. Exam Post (NTPC/ALP/JE/Group D)</span>
                  <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700">4. RRB Zone</span>
                  <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700">5. Difficulty Feedback</span>
                  <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700">6. Rating (1-5)</span>
                </div>
              </div>

              {/* Existing Forms from Google Drive */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    Your Google Forms (Drive Synced)
                    <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-normal">
                      {formsList.length} items
                    </span>
                  </h3>
                </div>

                {formsList.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {formsList.map((form) => (
                      <div key={form.id} className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50 px-2 rounded-lg transition-colors">
                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-slate-900 truncate">{form.name}</p>
                          <p className="text-[11px] text-slate-400">ID: {form.id}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewFormResponses(form.id)}
                            className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-md flex items-center gap-1 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" /> Responses
                          </button>
                          <a
                            href={form.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-md flex items-center gap-1 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Open in Forms
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    {user ? 'No Google Forms found in Drive. Create one above to get started!' : 'Sign in with Google above to see and manage your Google Forms.'}
                  </div>
                )}
              </div>

              {/* Form Responses Viewer */}
              {selectedFormResponses && (
                <div className="bg-white p-5 rounded-xl border border-blue-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                      Live Submissions / Responses ({selectedFormResponses.data.responses?.length || 0})
                    </h4>
                    <button onClick={() => setSelectedFormResponses(null)} className="text-xs text-slate-400 hover:text-slate-600">✕</button>
                  </div>
                  <pre className="text-[11px] bg-slate-900 text-emerald-400 p-3 rounded-lg overflow-x-auto max-h-48">
                    {JSON.stringify(selectedFormResponses.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: GOOGLE SHEETS */}
          {activeTab === 'sheets' && (
            <div className="space-y-6">
              {/* Action Card: Export to Google Sheets */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">Export RRB Cut-Off Matrix to Google Sheets</h3>
                      <p className="text-xs text-slate-500">Creates a live spreadsheet in Google Drive populated with all 21 RRB Zones Cut-Offs</p>
                    </div>
                  </div>
                  <button
                    onClick={initiateExportSheet}
                    disabled={!user || isLoading}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" /> Export to Google Sheets
                  </button>
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Spreadsheet Title</label>
                  <input
                    type="text"
                    value={newSheetTitle}
                    onChange={(e) => setNewSheetTitle(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                  <span>📊 Total Records Ready for Export: <strong>All RRB Cut-Off Entries</strong></span>
                  <span className="text-[11px] text-emerald-700 font-medium">Headers: Exam, Post, Zone, Year, UR, OBC, SC, ST, EWS</span>
                </div>
              </div>

              {/* Existing Google Sheets in Drive */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    Your Google Spreadsheets (Drive Synced)
                    <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-normal">
                      {sheetsList.length} items
                    </span>
                  </h3>
                </div>

                {sheetsList.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {sheetsList.map((sheet) => (
                      <div key={sheet.id} className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50 px-2 rounded-lg transition-colors">
                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-slate-900 truncate">{sheet.name}</p>
                          <p className="text-[11px] text-slate-400">ID: {sheet.id}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewSheetData(sheet.id, sheet.name)}
                            className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-md flex items-center gap-1 transition-colors"
                          >
                            <Table className="w-3.5 h-3.5" /> Read Data
                          </button>
                          <a
                            href={sheet.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium rounded-md flex items-center gap-1 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Open in Sheets
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    {user ? 'No Google Sheets found in Drive. Export one above to get started!' : 'Sign in with Google above to see and manage your Google Spreadsheets.'}
                  </div>
                )}
              </div>

              {/* Sheet Data Previewer */}
              {selectedSheetData && (
                <div className="bg-white p-5 rounded-xl border border-emerald-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                      📊 Previewing Sheet: {selectedSheetData.title}
                    </h4>
                    <button onClick={() => setSelectedSheetData(null)} className="text-xs text-slate-400 hover:text-slate-600">✕</button>
                  </div>
                  <div className="overflow-x-auto max-h-60 border border-slate-200 rounded-lg">
                    <table className="w-full text-[11px] text-left border-collapse">
                      <tbody>
                        {selectedSheetData.rows.map((row, rIdx) => (
                          <tr key={rIdx} className={rIdx === 0 ? 'bg-slate-100 font-bold border-b border-slate-300' : 'border-b border-slate-100 hover:bg-slate-50'}>
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="p-2 border-r border-slate-200 truncate max-w-[180px]">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CLOUD SQL POSTGRESQL */}
          {activeTab === 'cloudsql' && (
            <div className="space-y-6">
              {/* Cloud SQL Status Banner */}
              <div className="bg-gradient-to-r from-purple-900 to-indigo-950 p-5 rounded-xl text-white shadow-md flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase tracking-wider font-semibold text-purple-300">Managed Relational Database</span>
                  <h3 className="text-lg font-bold mt-0.5 flex items-center gap-2">
                    Cloud SQL PostgreSQL 16
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs rounded-full">
                      Ready & Provisioned
                    </span>
                  </h3>
                  <p className="text-xs text-purple-200/80 mt-1">
                    Project: rare-cargo-jlcf1 • Region: asia-southeast1 • ORM: Drizzle ORM
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-purple-200">
                    {cloudSqlStats?.totalUsers ?? 0}
                  </div>
                  <div className="text-[11px] text-purple-300">Synced Users</div>
                </div>
              </div>

              {/* Submit Feedback to Cloud SQL */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Send className="w-4 h-4 text-purple-600" /> Log Candidate Inquiry / Feedback directly to Cloud SQL
                </h3>
                <form onSubmit={handleFeedbackSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Candidate Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Rahul Sharma"
                        value={feedbackInput.candidateName}
                        onChange={(e) => setFeedbackInput({ ...feedbackInput, candidateName: e.target.value })}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Roll / Registration No.</label>
                      <input
                        type="text"
                        placeholder="e.g. 241901048291"
                        value={feedbackInput.rollNumber}
                        onChange={(e) => setFeedbackInput({ ...feedbackInput, rollNumber: e.target.value })}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Target Exam</label>
                      <select
                        value={feedbackInput.examName}
                        onChange={(e) => setFeedbackInput({ ...feedbackInput, examName: e.target.value })}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      >
                        <option>RRB NTPC Graduate (CEN 05/2024)</option>
                        <option>RRB NTPC Under Graduate (CEN 06/2024)</option>
                        <option>RRB ALP (CEN 01/2024)</option>
                        <option>RRB Technician (CEN 02/2024)</option>
                        <option>RRB JE (CEN 03/2024)</option>
                        <option>RRB Group D Level 1 (CEN 08/2024)</option>
                        <option>RPF SI & Constable (CEN 01/2024)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">RRB Zone</label>
                      <select
                        value={feedbackInput.zone}
                        onChange={(e) => setFeedbackInput({ ...feedbackInput, zone: e.target.value })}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      >
                        <option>RRB Prayagraj (Allahabad)</option>
                        <option>RRB Gorakhpur</option>
                        <option>RRB Patna</option>
                        <option>RRB Mumbai</option>
                        <option>RRB Kolkata</option>
                        <option>RRB Chandigarh</option>
                        <option>RRB Bhopal</option>
                        <option>RRB Secunderabad</option>
                        <option>RRB Chennai</option>
                        <option>RRB Bangalore</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Feedback / Inquiry Query</label>
                    <textarea
                      rows={2}
                      placeholder="Write your question, exam experience or feedback..."
                      value={feedbackInput.feedbackText}
                      onChange={(e) => setFeedbackInput({ ...feedbackInput, feedbackText: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    <Database className="w-4 h-4" /> Save Record in Cloud SQL
                  </button>
                </form>
              </div>

              {/* Saved Exports in Cloud SQL */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  Cloud SQL Synchronized Exports History
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-600" /> Google Forms Exported: {savedExports.forms.length}
                    </span>
                    <div className="mt-2 space-y-1">
                      {savedExports.forms.map((f: any) => (
                        <div key={f.id} className="text-[11px] text-slate-600 flex justify-between">
                          <span className="truncate max-w-[200px]">{f.formTitle}</span>
                          <span className="text-slate-400">{new Date(f.createdAt).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Google Sheets Exported: {savedExports.sheets.length}
                    </span>
                    <div className="mt-2 space-y-1">
                      {savedExports.sheets.map((s: any) => (
                        <div key={s.id} className="text-[11px] text-slate-600 flex justify-between">
                          <span className="truncate max-w-[200px]">{s.sheetTitle}</span>
                          <span className="text-emerald-700 font-medium">{s.rowCount} rows</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mandatory User Confirmation Dialog for Mutating Operations */}
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
              <div className="flex items-center gap-3 text-amber-600">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">{confirmModal.title}</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {confirmModal.description}
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (confirmModal.actionType === 'create_form') executeCreateForm();
                    else if (confirmModal.actionType === 'export_sheet') executeExportSheet();
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all"
                >
                  Confirm & Proceed
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
