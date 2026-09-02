import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Upload, 
  Download, 
  ExternalLink, 
  Globe, 
  FileText, 
  Database,
  Heart,
  Lock,
  Sparkles,
  Bot
} from 'lucide-react';
import { FullRRBDatabase, TabView } from './types';
import { loadRRBDatabase, saveRRBDatabase, exportEmptySchemaJson } from './utils/storage';
import { dbService } from './services/dbService';
import { firestoreService, FirestoreServiceStatus } from './services/firestoreService';
import { checkAdminSession, logoutAdmin } from './utils/auth';
import { TopGovBar } from './components/TopGovBar';
import { Navbar } from './components/Navbar';
import { HomeDashboard } from './components/HomeDashboard';
import { ExamsSection } from './components/ExamsSection';
import { CutoffSection } from './components/CutoffSection';
import { NoticesSection } from './components/NoticesSection';
import { ResultsSection } from './components/ResultsSection';
import { RollNumberCheckPage } from './components/RollNumberCheckPage';
import { AnswerCheckPage } from './components/AnswerCheckPage';
import { AdminPanel } from './components/AdminPanel';
import { AdminLogin } from './components/AdminLogin';
import { ComingSoonPage } from './components/ComingSoonPage';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { NotificationToastContainer } from './components/NotificationToastContainer';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { RailwayLogo } from './components/RailwayLogo';
import { GoogleWorkspaceHub } from './components/GoogleWorkspaceHub';

export default function App() {
  const [database, setDatabase] = useState<FullRRBDatabase>(loadRRBDatabase);
  const [currentTab, setCurrentTab] = useState<TabView>('home');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>('ALL');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => checkAdminSession());
  const [language, setLanguage] = useState<'hi' | 'en'>('hi');
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [firestoreStatus, setFirestoreStatus] = useState<FirestoreServiceStatus>(() => firestoreService.getStatus());
  const [dismissErrorBanner, setDismissErrorBanner] = useState(false);

  // Real-time synchronization from Cloud Firestore
  useEffect(() => {
    // 1. Subscribe to real-time Firestore collection updates via onSnapshot
    const unsubscribeDb = firestoreService.subscribe((newDb) => {
      setDatabase(newDb);
    });

    // 2. Track Firestore connection & permission status
    const unsubscribeStatus = firestoreService.subscribeStatus((status) => {
      setFirestoreStatus(status);
      if (!status.error) {
        setDismissErrorBanner(false);
      }
    });

    // 3. Listen to local broadcast events
    const handleCustomDbEvent = (e: any) => {
      if (e.detail?.database) {
        setDatabase(e.detail.database);
      }
    };
    window.addEventListener('rrb_database_updated', handleCustomDbEvent);

    return () => {
      unsubscribeDb();
      unsubscribeStatus();
      window.removeEventListener('rrb_database_updated', handleCustomDbEvent);
    };
  }, []);

  // Central Database mutation handler for Admin actions
  const handleDatabaseUpdate = (newDb: FullRRBDatabase) => {
    setDatabase(newDb);
    saveRRBDatabase(newDb);
    firestoreService.saveFullDatabaseToFirestore(newDb).catch((e) => console.warn('Firestore database sync:', e));
  };

  // Support direct URL hash (#admin) or query parameter (?admin) for administrator access
  useEffect(() => {
    const checkAdminHash = () => {
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      if (hash === '#admin' || search.includes('admin=true') || search.includes('admin=1')) {
        setCurrentTab('admin');
      }
    };
    checkAdminHash();
    window.addEventListener('hashchange', checkAdminHash);
    return () => window.removeEventListener('hashchange', checkAdminHash);
  }, []);

  // Keyboard shortcut Ctrl+Shift+A or Cmd+Shift+A to toggle admin mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setCurrentTab((prev) => (prev === 'admin' ? 'home' : 'admin'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Scroll to top whenever currentTab changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [currentTab]);

  // Navigate helper to change tab and scroll to top immediately
  const handleNavigate = (tab: TabView) => {
    setCurrentTab(tab);
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  const handleAdminLogout = () => {
    logoutAdmin();
    setIsAdminAuthenticated(false);
  };

  const fontSizeClass = fontSize === 'lg' ? 'text-[17px]' : fontSize === 'sm' ? 'text-[14px]' : 'text-[15px]';

  const isWebsiteLive = database.settings?.isWebsiteLive !== false;

  // When website is OFF (Coming Soon Mode), public users see Coming Soon page
  if (!isWebsiteLive && currentTab !== 'admin') {
    return (
      <ComingSoonPage
        database={database}
        onOpenAdminLogin={() => handleNavigate('admin')}
      />
    );
  }

  if (currentTab === 'answer-check') {
    return (
      <div className={`min-h-screen flex flex-col font-sans ${fontSizeClass}`}>
        <TopGovBar
          currentLanguage={language}
          onLanguageChange={setLanguage}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        />
        <AnswerCheckPage
          database={database}
          onNavigateTab={handleNavigate}
        />
        {/* Global Universal Search Modal */}
        <GlobalSearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          database={database}
          onNavigate={handleNavigate}
        />
        {/* Real-time Notification Center Modal */}
        <NotificationCenterModal
          isOpen={isNotificationOpen}
          onClose={() => setIsNotificationOpen(false)}
          onNavigate={handleNavigate}
          zones={database.zones}
        />
        {/* Floating Notifications */}
        <NotificationToastContainer onNavigate={handleNavigate} />
        {/* Mobile Nav */}
        <MobileBottomNav
          currentTab={currentTab}
          setCurrentTab={handleNavigate}
          onOpenSearch={() => setIsSearchOpen(true)}
        />
      </div>
    );
  }

  if (currentTab === 'roll-check') {
    return (
      <div className={`min-h-screen flex flex-col font-sans ${fontSizeClass}`}>
        <TopGovBar
          currentLanguage={language}
          onLanguageChange={setLanguage}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        />
        <RollNumberCheckPage
          database={database}
          onNavigateTab={handleNavigate}
        />
        {/* Global Universal Search Modal */}
        <GlobalSearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          database={database}
          onNavigate={handleNavigate}
        />
        {/* Real-time Notification Center Modal */}
        <NotificationCenterModal
          isOpen={isNotificationOpen}
          onClose={() => setIsNotificationOpen(false)}
          onNavigate={handleNavigate}
          zones={database.zones}
        />
        {/* Floating Notifications */}
        <NotificationToastContainer onNavigate={handleNavigate} />
        {/* Mobile Nav */}
        <MobileBottomNav
          currentTab={currentTab}
          setCurrentTab={handleNavigate}
          onOpenSearch={() => setIsSearchOpen(true)}
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#f4f6f9] flex flex-col font-sans text-slate-900 selection:bg-[#c1121f] selection:text-white ${fontSizeClass}`}>
      {/* 1. Official Government of India Top Header Bar */}
      <TopGovBar
        currentLanguage={language}
        onLanguageChange={setLanguage}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
      />

      {/* 2. Main Navigation Bar with RRB SMART PORTAL Branding */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={handleNavigate}
        database={database}
        selectedZoneFilter={selectedZoneFilter}
        setSelectedZoneFilter={setSelectedZoneFilter}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenNotifications={() => setIsNotificationOpen(true)}
        isAdminAuthenticated={isAdminAuthenticated}
        onAdminLogout={handleAdminLogout}
      />

      {/* Cloud Firestore Status & Friendly Error Alert */}
      {firestoreStatus.error && !dismissErrorBanner && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900 shadow-xs">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span className="font-semibold">Cloud Firestore Connection Notice:</span>
              <span className="text-amber-800">{firestoreStatus.error}</span>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => firestoreService.refreshAllListeners()}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] cursor-pointer"
              >
                Retry Sync
              </button>
              <button
                onClick={() => setDismissErrorBanner(true)}
                className="text-amber-600 hover:text-amber-800 p-1 text-sm font-bold cursor-pointer"
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        {firestoreStatus.isLoading && !database.exams.length ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4 text-center">
            <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-red-600 animate-spin"></div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800">Connecting to Cloud Firestore...</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Fetching official Railway Recruitment Board examination schedules, cutoffs, and circulars.
              </p>
            </div>
          </div>
        ) : (
          <>
            {currentTab === 'home' && (
              <HomeDashboard
                database={database}
                setCurrentTab={handleNavigate}
                selectedZoneFilter={selectedZoneFilter}
                setSelectedZoneFilter={setSelectedZoneFilter}
                onOpenGlobalSearch={() => setIsSearchOpen(true)}
              />
            )}

        {currentTab === 'exams' && (
          <ExamsSection
            exams={database.exams}
            setCurrentTab={handleNavigate}
          />
        )}

        {currentTab === 'cutoffs' && (
          <CutoffSection
            database={database}
            selectedZoneFilter={selectedZoneFilter}
            setSelectedZoneFilter={setSelectedZoneFilter}
            setCurrentTab={handleNavigate}
          />
        )}

        {currentTab === 'notices' && (
          <NoticesSection
            database={database}
            selectedZoneFilter={selectedZoneFilter}
            setSelectedZoneFilter={setSelectedZoneFilter}
            setCurrentTab={handleNavigate}
          />
        )}

        {currentTab === 'results' && (
          <ResultsSection
            database={database}
            selectedZoneFilter={selectedZoneFilter}
            setSelectedZoneFilter={setSelectedZoneFilter}
            setCurrentTab={handleNavigate}
          />
        )}

        {currentTab === 'workspace' && (
          <GoogleWorkspaceHub onClose={() => handleNavigate('home')} />
        )}

        {currentTab === 'admin' && (
          !isAdminAuthenticated ? (
            <AdminLogin
              onSuccess={() => setIsAdminAuthenticated(true)}
              onCancel={() => handleNavigate('home')}
            />
          ) : (
            <AdminPanel
              database={database}
              setDatabase={handleDatabaseUpdate}
              setCurrentTab={handleNavigate}
              onLogout={handleAdminLogout}
            />
          )
        )}
          </>
        )}
      </main>

      {/* Global Universal Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        database={database}
        onNavigate={handleNavigate}
      />

      {/* Real-time Notification Center Modal & Drawer */}
      <NotificationCenterModal
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        onNavigate={handleNavigate}
        zones={database.zones}
      />

      {/* Floating In-App Live Notification Toasts */}
      <NotificationToastContainer onNavigate={handleNavigate} />

      {/* Mobile Bottom Navigation Bar with Answer Check Master */}
      <MobileBottomNav
        currentTab={currentTab}
        setCurrentTab={handleNavigate}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Official Government of India / RRB Footer */}
      <footer className="bg-[#0b1329] border-t border-slate-800 text-slate-400 text-xs mt-auto pb-16 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Col 1: Portal Summary */}
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center space-x-3 text-white font-bold text-base">
                <RailwayLogo size="sm" />
                <span>RRB SMART PORTAL • Your Journey to a Government Career</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-xs max-w-md">
                Official Information System for Centralized Employment Notifications (CEN), qualifying cut-off score tracking, candidate merit lists, and 21 regional board portals.
              </p>
              <div className="flex items-center space-x-2 text-[11px] text-amber-400/90 font-medium">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>100% Authentic Official Data Guarantee</span>
              </div>
            </div>

            {/* Col 2: Quick Links */}
            <div>
              <h4 className="font-bold text-white uppercase tracking-wider text-xs mb-3">
                Quick Navigation
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    onClick={() => handleNavigate('exams')}
                    className="hover:text-amber-400 transition-colors"
                  >
                    Active CEN Exams ({database.exams.length})
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigate('cutoffs')}
                    className="hover:text-amber-400 transition-colors"
                  >
                    Cut-Off Marks Table ({database.cutoffs.length})
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigate('notices')}
                    className="hover:text-amber-400 transition-colors"
                  >
                    Employment Notices ({database.notices.length})
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigate('results')}
                    className="hover:text-amber-400 transition-colors"
                  >
                    Results & Merit Panels ({database.results.length})
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setIsAIModalOpen(true)}
                    className="hover:text-cyan-400 transition-colors font-bold text-cyan-400 flex items-center space-x-1"
                  >
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Ask RRB AI Assistant</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Data Management & Schema */}
            <div>
              <h4 className="font-bold text-white uppercase tracking-wider text-xs mb-3">
                Data Hub Utilities
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    onClick={() => exportEmptySchemaJson()}
                    className="hover:text-amber-400 transition-colors flex items-center space-x-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Blank Schema (.json)</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigate('admin')}
                    className="hover:text-amber-400 transition-colors flex items-center space-x-1 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Official CEN Data</span>
                  </button>
                </li>
                <li>
                  <a
                    href="https://rrb.digialm.com"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-amber-400 transition-colors flex items-center space-x-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Centralized DigiALM Login</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright & Disclaimer */}
          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-3">
            <div>
              © {new Date().getFullYear()} RRB SMART PORTAL • Official Indian Railways Recruitment Information System.
            </div>
            <div className="text-slate-400">
              Government of India • Ministry of Railways
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Sticky Bottom Nav with AI button */}
      <MobileBottomNav
        currentTab={currentTab}
        setCurrentTab={handleNavigate}
        onOpenAIModal={() => setIsAIModalOpen(true)}
      />
    </div>
  );
}
