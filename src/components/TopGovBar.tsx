import React, { useState } from 'react';
import { Sun, Moon, Globe, ChevronDown } from 'lucide-react';

interface TopGovBarProps {
  currentLanguage: 'hi' | 'en';
  onLanguageChange: (lang: 'hi' | 'en') => void;
  fontSize: 'sm' | 'base' | 'lg';
  onFontSizeChange: (size: 'sm' | 'base' | 'lg') => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

export const TopGovBar: React.FC<TopGovBarProps> = ({
  currentLanguage,
  onLanguageChange,
  fontSize,
  onFontSizeChange,
  isDarkMode = false,
  onToggleTheme,
}) => {
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  return (
    <div className="bg-[#0f172a] text-slate-300 text-[11px] sm:text-xs py-1.5 px-4 sm:px-6 lg:px-8 border-b border-slate-800 select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Official Government of India Header */}
        <div className="flex items-center space-x-2 font-medium text-slate-300">
          <span>भारत सरकार, रेल मंत्रालय</span>
          <span className="text-slate-600">|</span>
          <span className="hidden sm:inline text-slate-400">
            Government of India, Ministry of Railways
          </span>
        </div>

        {/* Right: Language, Theme & Accessibility */}
        <div className="flex items-center space-x-4">
          {/* Language Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center space-x-1 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold">{currentLanguage === 'hi' ? 'हिंदी' : 'English'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {langDropdownOpen && (
              <div className="absolute right-0 mt-1 w-28 bg-white text-slate-800 rounded-xl shadow-lg border border-slate-200 py-1 z-50 animate-in fade-in">
                <button
                  type="button"
                  onClick={() => {
                    onLanguageChange('hi');
                    setLangDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 flex items-center justify-between font-medium ${
                    currentLanguage === 'hi' ? 'text-[#c1121f] font-bold bg-red-50' : ''
                  }`}
                >
                  <span>हिंदी</span>
                  {currentLanguage === 'hi' && <span>✓</span>}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onLanguageChange('en');
                    setLangDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 flex items-center justify-between font-medium ${
                    currentLanguage === 'en' ? 'text-[#c1121f] font-bold bg-red-50' : ''
                  }`}
                >
                  <span>English</span>
                  {currentLanguage === 'en' && <span>✓</span>}
                </button>
              </div>
            )}
          </div>

          {/* Theme Toggle (Sun/Moon) */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="text-slate-300 hover:text-amber-300 transition-colors cursor-pointer p-0.5"
            title="Toggle Contrast / Theme"
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {/* Accessibility Font Sizing (A+ A A-) */}
          <div className="flex items-center space-x-1.5 font-bold text-[10px] sm:text-[11px] text-slate-300">
            <button
              type="button"
              onClick={() => onFontSizeChange('lg')}
              className={`hover:text-white transition-colors px-1 rounded ${
                fontSize === 'lg' ? 'bg-slate-700 text-white' : ''
              }`}
              title="Increase Font Size"
            >
              A+
            </button>
            <button
              type="button"
              onClick={() => onFontSizeChange('base')}
              className={`hover:text-white transition-colors px-1 rounded ${
                fontSize === 'base' ? 'bg-slate-700 text-white' : ''
              }`}
              title="Default Font Size"
            >
              A
            </button>
            <button
              type="button"
              onClick={() => onFontSizeChange('sm')}
              className={`hover:text-white transition-colors px-1 rounded ${
                fontSize === 'sm' ? 'bg-slate-700 text-white' : ''
              }`}
              title="Decrease Font Size"
            >
              A-
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
