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
  Bell, 
  HardDrive,
  SearchCheck,
  Calculator
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

            {/* Answer Check (Rank & Score Calculator) */}
            <button
              onClick={() => {
                setCurrentTab('answer-check');
                setActiveDropdown(null);
              }}
              className={`px-3.5 py-2 rounded-full transition-all cursor-pointer flex items-center space-x-1.5 font-bold ${
                currentTab === 'answer-check'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Answer Check</span>
              <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.2 rounded-full font-black animate-pulse">
                New
              </span>
            </button>

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

            {/* Roll Number Check Link */}
            <button
              onClick={() => {
                setCurrentTab('roll-check');
                setActiveDropdown(null);
              }}
              className={`px-3.5 py-2 rounded-full transition-all cursor-pointer flex items-center space-x-1.5 font-bold ${
                currentTab === 'roll-check'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              <SearchCheck className="w-3.5 h-3.5" />
              <span>Roll Number Check</span>
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

            {/* Google Forms & Sheets Workspace Hub */}
            <button
              onClick={() => {
                setCurrentTab('workspace');
                setActiveDropdown(null);
              }}
              className={`px-3.5 py-2 rounded-full transition-all cursor-pointer flex items-center space-x-1.5 font-bold ${
                currentTab === 'workspace'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Forms & Sheets</span>
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
                    <span>{isAdminAuthenticated ? 'Admin Panel' : 'Admin Login'}</span>
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

          {/* Right Controls: Search Icon Button + Admin Login / Panel Button + Mobile Hamburger */}
          <div className="flex items-center space-x-3">
            {/* Search Circle Button */}
            <button
              onClick={onOpenSearch}
              className="w-10 h-10 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
              title="Search exams, cut-offs, notices & results"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Admin Login / Panel Red Button with Login Icon */}
            <button
              onClick={() => setCurrentTab('admin')}
              className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center space-x-2 cursor-pointer active:scale-95 ${
                currentTab === 'admin'
                  ? 'bg-[#a50f1a] text-white ring-2 ring-red-400'
                  : 'bg-[#c1121f] hover:bg-[#a50f1a] text-white shadow-red-600/20'
              }`}
            >
              {isAdminAuthenticated ? (
                <>
                  <Unlock className="w-4 h-4 text-amber-300" />
                  <span>Admin Panel</span>
                </>
              ) : (
                <>
                  <User className="w-4 h-4" />
                  <span>Admin Login</span>
                </>
              )}
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
              { id: 'answer-check' as TabView, label: 'Answer Check 🧮', badge: 'New Calculator' },
              { id: 'roll-check' as TabView, label: 'Roll Check 🔍', badge: 'Direct' },
              { id: 'workspace' as TabView, label: 'Google Forms & Sheets', badge: 'Drive Sync' },
              { id: 'cutoffs' as TabView, label: 'Cut-Off Finder', badge: database.cutoffs.length },
              { id: 'notices' as TabView, label: 'Answer Keys & Notices', badge: database.notices.length },
              { id: 'results' as TabView, label: 'Results & Panels', badge: database.results.length },
              { id: 'admin' as TabView, label: isAdminAuthenticated ? 'Admin Panel' : 'Admin Login', icon: isAdminAuthenticated ? Unlock : Lock },
            ].map((item, idx) => {
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
                      : item.id === 'answer-check'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : item.id === 'roll-check'
                      ? 'bg-blue-50 text-blue-800 border border-blue-200'
                      : 'bg-slate-50 text-slate-800 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  <span className="truncate">{item.label}</span>
                  {item.badge !== undefined && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : item.id === 'answer-check'
                        ? 'bg-white text-blue-700 font-bold'
                        : item.id === 'roll-check'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
