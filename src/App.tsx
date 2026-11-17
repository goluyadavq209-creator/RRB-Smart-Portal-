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
import { checkAdminSession, logoutAdmin } from './utils/auth';
import { TopGovBar } from './components/TopGovBar';
import { Navbar } from './components/Navbar';
import { HomeDashboard } from './components/HomeDashboard';
import { ExamsSection } from './components/ExamsSection';
import { CutoffSection } from './components/CutoffSection';
import { NoticesSection } from './components/NoticesSection';
import { ResultsSection } from './components/ResultsSection';
import { AdminPanel } from './components/AdminPanel';
import { AdminLogin } from './components/AdminLogin';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { NotificationToastContainer } from './components/NotificationToastContainer';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { FloatingAIAvatar } from './components/FloatingAIAvatar';
import { RRBAIAssistantModal } from './components/RRBAIAssistantModal';
import { RailwayLogo } from './components/RailwayLogo';

export default function App() {
  const [database, setDatabase] = useState<FullRRBDatabase>(loadRRBDatabase);
  const [currentTab, setCurrentTab] = useState<TabView>('home');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>('ALL');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(checkAdminSession);
  const [language, setLanguage] = useState<'hi' | 'en'>('hi');
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Sync state to local storage if updated
  useEffect(() => {
    saveRRBDatabase(database);
  }, [database]);

  // Navigate helper from search/notification modal
  const handleNavigate = (tab: TabView) => {
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdminLogout = () => {
    logoutAdmin();
    setIsAdminAuthenticated(false);
  };

  const fontSizeClass = fontSize === 'lg' ? 'text-[17px]' : fontSize === 'sm' ? 'text-[14px]' : 'text-[15px]';

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
        setCurrentTab={setCurrentTab}
        database={database}
        selectedZoneFilter={selectedZoneFilter}
        setSelectedZoneFilter={setSelectedZoneFilter}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenNotifications={() => setIsNotificationOpen(true)}
        onOpenAIModal={() => setIsAIModalOpen(true)}
        isAdminAuthenticated={isAdminAuthenticated}
        onAdminLogout={handleAdminLogout}
      />

      {/* 3. Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        {currentTab === 'home' && (
          <HomeDashboard
            database={database}
            setCurrentTab={setCurrentTab}
            selectedZoneFilter={selectedZoneFilter}
            setSelectedZoneFilter={setSelectedZoneFilter}
            onOpenGlobalSearch={() => setIsSearchOpen(true)}
            isAIModalOpen={isAIModalOpen}
            onCloseAIModal={() => setIsAIModalOpen(false)}
            onOpenAIModal={() => setIsAIModalOpen(true)}
          />
        )}

        {currentTab === 'exams' && (
          <ExamsSection
            exams={database.exams}
            setCurrentTab={setCurrentTab}
          />
        )}

        {currentTab === 'cutoffs' && (
          <CutoffSection
            database={database}
            selectedZoneFilter={selectedZoneFilter}
            setSelectedZoneFilter={setSelectedZoneFilter}
            setCurrentTab={setCurrentTab}
          />
        )}

        {currentTab === 'notices' && (
          <NoticesSection
            database={database}
            selectedZoneFilter={selectedZoneFilter}
            setSelectedZoneFilter={setSelectedZoneFilter}
            setCurrentTab={setCurrentTab}
          />
        )}

        {currentTab === 'results' && (
          <ResultsSection
            database={database}
            selectedZoneFilter={selectedZoneFilter}
            setSelectedZoneFilter={setSelectedZoneFilter}
            setCurrentTab={setCurrentTab}
          />
        )}

        {currentTab === 'admin' && (
          !isAdminAuthenticated ? (
            <AdminLogin
              onSuccess={() => setIsAdminAuthenticated(true)}
              onCancel={() => setCurrentTab('home')}
            />
          ) : (
            <AdminPanel
              database={database}
              setDatabase={setDatabase}
              setCurrentTab={setCurrentTab}
              onLogout={handleAdminLogout}
            />
          )
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

      {/* Floating Bottom-Right RRB AI Avatar Button */}
      <FloatingAIAvatar onClick={() => setIsAIModalOpen(true)} />

      {/* Global RRB AI Assistant Dialog */}
      <RRBAIAssistantModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
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
                    onClick={() => setCurrentTab('exams')}
                    className="hover:text-amber-400 transition-colors"
                  >
                    Active CEN Exams ({database.exams.length})
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setCurrentTab('cutoffs')}
                    className="hover:text-amber-400 transition-colors"
                  >
                    Cut-Off Marks Table ({database.cutoffs.length})
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setCurrentTab('notices')}
                    className="hover:text-amber-400 transition-colors"
                  >
                    Employment Notices ({database.notices.length})
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setCurrentTab('results')}
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
                    className="hover:text-amber-400 transition-colors flex items-center space-x-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Blank Schema (.json)</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setCurrentTab('admin')}
                    className="hover:text-amber-400 transition-colors flex items-center space-x-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Official CEN Data</span>
                  </button>
                </li>
                <li>
                  <a
                    href="https://indianrailways.gov.in"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-amber-400 transition-colors flex items-center space-x-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Ministry of Railways</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright & Disclaimer */}
          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-3">
            <div>
              © {new Date().getFullYear()} RRB SMART PORTAL • Developed for official CEN record administration.
            </div>
            <div className="text-slate-400">
              AI-Powered Indian Railways Information Hub
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Sticky Bottom Nav with AI button */}
      <MobileBottomNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenAIModal={() => setIsAIModalOpen(true)}
      />
    </div>
  );
}
