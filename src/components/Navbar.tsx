import React, { useState } from 'react';
import { 
  Search, 
  Menu, 
  X, 
  Home, 
  Lock, 
  Unlock, 
  ChevronDown, 
  User,
  Sparkles,
  Bell,
  HardDrive
} from 'lucide-react';
import { FullRRBDatabase, TabView, OFFICIAL_RRB_DIGIALM_LOGIN_URL } from '../types';
import { RailwayLogo } from './RailwayLogo';

interface NavbarProps {
  currentTab: TabView;
  setCurrentTab: (tab: TabView) => void;
  database: FullRRBDatabase;
  selectedZoneFilter: string;
  setSelectedZoneFilter: (zone: string) => void;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  onOpenAIModal: () => void;
  isAdminAuthenticated: boolean;
  onAdminLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  database,
  selectedZoneFilter,
  setSelectedZoneFilter,
  onOpenSearch,
  onOpenNotifications,
  onOpenAIModal,
  isAdminAuthenticated,
  onAdminLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const toggleDropdown = (name: string) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  return (
    <header className="sticky top-0 z-40 bg-white shadow-xs border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Left: Official Circular Emblem Logo + RRB SMART PORTAL */}
          <div
            onClick={() => setCurrentTab('home')}
            className="flex items-center space-x-3 cursor-pointer select-none group"
          >
            <RailwayLogo size="md" />
            <div>
              <div className="flex items-center space-x-1.5 leading-none">
                <span className="text-[#031435] font-black text-xl tracking-tight">RRB</span>
                <span className="text-[#0c3a82] font-black text-xl tracking-tight">SMART PORTAL</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                Your Journey to a Government Career
              </p>
            </div>
          </div>

          {/* Center Navigation Links matching Screenshot */}
          <nav className="hidden lg:flex items-center space-x-1 text-sm font-semibold">
            {/* Home */}
            <button
              onClick={() => {
                setCurrentTab('home');
                setActiveDropdown(null);
              }}
              className={`px-3.5 py-2 rounded-full transition-all cursor-pointer font-bold ${
                currentTab === 'home'
                  ? 'text-[#c1121f]'
                  : 'text-slate-700 hover:text-[#c1121f] hover:bg-slate-50'
              }`}
            >
              Home
            </button>

            {/* Exams with Dropdown arrow */}
            <div className="relative">
              <button
                onClick={() => {
                  setCurrentTab('exams');
                  toggleDropdown('exams');
                }}
                className={`px-3.5 py-2 rounded-full transition-all cursor-pointer flex items-center space-x-1 ${
                  currentTab === 'exams'
                    ? 'text-[#c1121f] font-bold'
                    : 'text-slate-700 hover:text-[#c1121f] hover:bg-slate-50'
                }`}
              >
                <span>Exams</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {activeDropdown === 'exams' && (
                <div className="absolute left-0 mt-1 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in">
                  {database.exams.slice(0, 5).map((e) => (
                    <button
                      key={e.id}
                      onClick={() => {
                        setCurrentTab('exams');
                        setActiveDropdown(null);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-red-50 hover:text-[#c1121f]"
                    >
                      {e.shortCode} - {e.title.split('-')[0]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cut Off with Dropdown arrow */}
            <button
              onClick={() => {
                setCurrentTab('cutoffs');
                setActiveDropdown(null);
              }}
              className={`px-3.5 py-2 rounded-full transition-all cursor-pointer flex items-center space-x-1 ${
                currentTab === 'cutoffs'
                  ? 'text-[#c1121f] font-bold'
                  : 'text-slate-700 hover:text-[#c1121f] hover:bg-slate-50'
              }`}
            >
              <span>Cut Off</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {/* Results with Dropdown arrow */}
            <button
              onClick={() => {
                setCurrentTab('results');
                setActiveDropdown(null);
              }}
              className={`px-3.5 py-2 rounded-full transition-all cursor-pointer flex items-center space-x-1 ${
                currentTab === 'results'
                  ? 'text-[#c1121f] font-bold'
                  : 'text-slate-700 hover:text-[#c1121f] hover:bg-slate-50'
              }`}
            >
              <span>Results</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {/* Notifications */}
            <button
              onClick={() => {
                setCurrentTab('notices');
                setActiveDropdown(null);
              }}
              className={`px-3.5 py-2 rounded-full transition-all cursor-pointer ${
                currentTab === 'notices'
                  ? 'text-[#c1121f] font-bold'
                  : 'text-slate-700 hover:text-[#c1121f] hover:bg-slate-50'
              }`}
            >
              Notifications
            </button>

            {/* Ask AI quick nav item */}
            <button
              onClick={onOpenAIModal}
              className="px-3.5 py-2 rounded-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all cursor-pointer flex items-center space-x-1 font-bold"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Ask AI</span>
            </button>

            {/* More */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('more')}
                className="px-3.5 py-2 rounded-full text-slate-700 hover:text-[#c1121f] hover:bg-slate-50 transition-all cursor-pointer flex items-center space-x-1"
              >
                <span>More</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {activeDropdown === 'more' && (
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in">
                  <button
                    onClick={() => {
                      setCurrentTab('admin');
                      setActiveDropdown(null);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-red-50 hover:text-[#c1121f] flex items-center space-x-2"
                  >
                    <HardDrive className="w-4 h-4" />
                    <span>Admin Management</span>
                  </button>
                  <button
                    onClick={() => {
                      onOpenNotifications();
                      setActiveDropdown(null);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-red-50 hover:text-[#c1121f] flex items-center space-x-2"
                  >
                    <Bell className="w-4 h-4" />
                    <span>Notice Center</span>
                  </button>
                </div>
              )}
            </div>
          </nav>

          {/* Right Controls: Search Icon Button + Login/Register Button + Mobile Hamburger */}
          <div className="flex items-center space-x-3">
            {/* Search Circle Button */}
            <button
              onClick={onOpenSearch}
              className="w-10 h-10 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
              title="Search exams, cut-offs, notices & results"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Login / Register Red Button */}
            <button
              onClick={() => setCurrentTab('admin')}
              className="px-4 sm:px-5 py-2.5 rounded-2xl bg-[#c1121f] hover:bg-[#a50f1a] text-white text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center space-x-2 cursor-pointer"
            >
              <User className="w-4 h-4" />
              <span>{isAdminAuthenticated ? 'Admin Panel' : 'Login / Register'}</span>
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-10 h-10 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-slate-200 px-4 py-5 space-y-4 animate-in fade-in max-w-7xl mx-auto">
          {/* Quick Zone Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Regional RRB Board:
            </label>
            <select
              value={selectedZoneFilter}
              onChange={(e) => setSelectedZoneFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#c1121f]"
            >
              <option value="ALL">All 21 RRB Regional Boards</option>
              {database.zones.map((zone) => (
                <option key={zone.id} value={zone.code}>
                  {zone.name} ({zone.code})
                </option>
              ))}
            </select>
          </div>

          {/* Navigation Links Grid */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            {[
              { id: 'home' as TabView, label: 'Home', icon: Home },
              { id: 'exams' as TabView, label: 'Exams & Syllabus', badge: database.exams.length },
              { id: 'cutoffs' as TabView, label: 'Cut-Off Finder', badge: database.cutoffs.length },
              { id: 'notices' as TabView, label: 'Answer Keys & Notices', badge: database.notices.length },
              { id: 'results' as TabView, label: 'Results & Panels', badge: database.results.length },
              { id: 'admin' as TabView, label: isAdminAuthenticated ? 'Admin Panel' : 'Admin Login', icon: isAdminAuthenticated ? Unlock : Lock },
            ].map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`p-3 rounded-2xl text-xs font-bold flex items-center justify-between cursor-pointer transition-all ${
                    isActive
                      ? 'bg-[#c1121f] text-white shadow-2xs'
                      : 'bg-slate-50 text-slate-800 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  <span className="truncate">{item.label}</span>
                  {item.badge !== undefined && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Ask AI Button in Mobile Menu */}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenAIModal();
            }}
            className="w-full p-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Ask RRB AI (आपका AI साथी)</span>
          </button>
        </div>
      )}
    </header>
  );
};
