import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Briefcase, 
  GraduationCap, 
  LayoutDashboard, 
  User, 
  Code2, 
  ArrowRight, 
  Check, 
  Sun, 
  Moon, 
  Send, 
  Layers, 
  Palette, 
  CheckCircle2, 
  Copy,
  Sparkles,
  Smartphone,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

interface ProjectTemplate {
  id: string;
  title: string;
  hindiTitle: string;
  category: string;
  description: string;
  features: string[];
  recommendedPages: string[];
  accentColor: string;
}

const TEMPLATES: ProjectTemplate[] = [
  {
    id: 'ecommerce',
    title: 'E-Commerce & Online Store',
    hindiTitle: 'ऑनलाइन शॉपिंग स्टोर',
    category: 'Retail & Store',
    description: 'Modern product catalog with category filters, shopping cart, checkout flow, customer reviews, and order tracking.',
    features: ['Product Catalog & Search', 'Cart & Instant Checkout', 'Filter by Price & Category', 'Customer Reviews & Ratings'],
    recommendedPages: ['Home', 'Shop / Catalog', 'Product Details', 'Cart & Checkout', 'Contact & Support'],
    accentColor: 'from-amber-500 to-orange-500'
  },
  {
    id: 'business',
    title: 'Agency & Business Website',
    hindiTitle: 'कंपनी एवं व्यापारिक वेबसाइट',
    category: 'Corporate & Services',
    description: 'High-converting business presence with hero banner, service offerings, case studies, team profiles, and inquiry forms.',
    features: ['Service Breakdown Cards', 'Interactive Case Studies', 'Client Testimonials', 'Lead Capture & WhatsApp Contact'],
    recommendedPages: ['Home', 'About Us', 'Services', 'Portfolio / Work', 'Contact Us'],
    accentColor: 'from-blue-500 to-indigo-600'
  },
  {
    id: 'coaching',
    title: 'Coaching & Education Portal',
    hindiTitle: 'कोचिंग एवं शिक्षण संस्थान',
    category: 'EdTech & Learning',
    description: 'Comprehensive educational platform with course listings, online registration, quiz/test portal, notices, and study material.',
    features: ['Course & Batch Catalog', 'Student Enrollment Form', 'Study Materials / Notes', 'Interactive Quiz & Test Module'],
    recommendedPages: ['Home', 'Courses & Fees', 'Online Test / Quiz', 'Study Material', 'Admissions'],
    accentColor: 'from-emerald-500 to-teal-600'
  },
  {
    id: 'saas',
    title: 'SaaS Tool & Admin Dashboard',
    hindiTitle: 'डैशबोर्ड एवं वेब सॉफ्टवेयर',
    category: 'Software & Data',
    description: 'Production-ready dashboard layout with metric KPIs, real-time data tables, chart analytics, user settings, and permissions.',
    features: ['Interactive Analytics Cards', 'Sortable & Searchable Data Table', 'Dark / Light Mode Workspace', 'User Profile & Settings'],
    recommendedPages: ['Overview', 'Analytics', 'Data Records', 'Reports', 'Settings'],
    accentColor: 'from-violet-500 to-purple-600'
  },
  {
    id: 'portfolio',
    title: 'Personal Portfolio & Brand',
    hindiTitle: 'पर्सनल पोर्टफोलियो एवं प्रोफाइल',
    category: 'Personal & Creative',
    description: 'Sleek personal portfolio highlighting skills, featured projects, biography, resume download, and direct hire contact.',
    features: ['Interactive Project Showcase', 'Skill Badges & Experience Timeline', 'Resume / CV Download', 'Direct Inquiry Form'],
    recommendedPages: ['Hero / Bio', 'Featured Projects', 'Skills & Stack', 'Experience', 'Contact Me'],
    accentColor: 'from-rose-500 to-pink-600'
  },
  {
    id: 'custom',
    title: 'Custom Web Application',
    hindiTitle: 'कस्टम वेब ऐप (अपनी पसंद का)',
    category: 'Custom Architecture',
    description: 'Build any custom idea: directory, blog, community hub, real estate portal, booking platform, or specialized tool.',
    features: ['Tailored to Your Exact Prompt', 'Interactive Client-Side Logic', 'Responsive Mobile & Desktop Design', 'Clean Modular Code'],
    recommendedPages: ['Custom Structure defined by your prompt'],
    accentColor: 'from-cyan-500 to-blue-500'
  }
];

export default function App() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('ecommerce');
  const [siteName, setSiteName] = useState<string>('My New Site');
  const [siteTagline, setSiteTagline] = useState<string>('Welcome to our brand new web experience');
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'builder' | 'preview'>('overview');

  // Sync theme
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const currentTemplate = TEMPLATES.find((t) => t.id === selectedTemplate) || TEMPLATES[0];

  const handleCopyPrompt = () => {
    const textToCopy = `Create a ${currentTemplate.title} named "${siteName}". Tagline: "${siteTagline}". ${userPrompt ? `Requirements: ${userPrompt}` : ''}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 3000);
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Top Bar Contract: 3 zones separated by gap-8 (Brand Wordmark, Nav Links, Primary CTA) */}
      <header className={`sticky top-0 z-50 border-b backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between gap-8 ${isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center space-x-3 whitespace-nowrap shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-400 to-amber-500 flex items-center justify-center text-slate-950 font-black text-sm shadow-sm">
            N
          </div>
          <span className="text-base sm:text-lg font-bold tracking-tight">
            {siteName || 'New Site Studio'}
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs sm:text-sm font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${activeTab === 'overview' ? (isDarkMode ? 'text-amber-400 font-semibold' : 'text-amber-600 font-semibold') : (isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')}`}
          >
            Templates
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('builder')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${activeTab === 'builder' ? (isDarkMode ? 'text-amber-400 font-semibold' : 'text-amber-600 font-semibold') : (isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')}`}
          >
            Customize
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${activeTab === 'preview' ? (isDarkMode ? 'text-amber-400 font-semibold' : 'text-amber-600 font-semibold') : (isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')}`}
          >
            Live Preview
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action + Theme Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${isDarkMode ? 'border-slate-800 text-slate-300 hover:bg-slate-900' : 'border-slate-200 text-slate-600 hover:bg-slate-100'}`}
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('builder')}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-lg transition-all shadow-sm cursor-pointer whitespace-nowrap shrink-0 flex items-center space-x-1.5"
          >
            <span>Start Building</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col">
        {/* Status Notification Banner */}
        <div className={`p-4 rounded-xl border mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${isDarkMode ? 'bg-amber-950/20 border-amber-500/30 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-xs sm:text-sm font-bold">पुराना सारा डेटा और साइट सफलतापूर्वक हटा दी गई है (Old site removed completely).</p>
              <p className="text-[11px] sm:text-xs opacity-80">अब आप अपनी पसंद की नई वेबसाइट शुरू कर सकते हैं। नीचे से प्रकार चुनें या चैट में बताएं।</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('builder')}
            className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shrink-0 cursor-pointer shadow-xs"
          >
            नई साइट डिज़ाइन करें
          </button>
        </div>

        {/* Tab 1: Overview & Template Selection */}
        {activeTab === 'overview' && (
          <div className="space-y-10">
            {/* Hero Heading */}
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
                आप किस प्रकार की <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent">नई साइट</span> बनाना चाहते हैं?
              </h1>
              <p className={`text-sm sm:text-base leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Choose a starter template or describe your vision. All previous templates and data have been wiped clean for your fresh project.
              </p>
            </div>

            {/* Template Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {TEMPLATES.map((tmpl) => {
                const isSelected = selectedTemplate === tmpl.id;
                return (
                  <div
                    key={tmpl.id}
                    onClick={() => {
                      setSelectedTemplate(tmpl.id);
                      if (tmpl.id === 'ecommerce') setSiteName('Aura Retail Store');
                      else if (tmpl.id === 'business') setSiteName('Vanguard Consulting');
                      else if (tmpl.id === 'coaching') setSiteName('Apex Academy');
                      else if (tmpl.id === 'saas') setSiteName('Pulse Analytics');
                      else if (tmpl.id === 'portfolio') setSiteName('Maan Singh | Developer');
                      else setSiteName('NextGen Studio');
                    }}
                    className={`rounded-2xl p-6 border transition-all cursor-pointer flex flex-col justify-between text-left ${isSelected ? (isDarkMode ? 'bg-slate-900 border-amber-400 ring-2 ring-amber-400/30' : 'bg-white border-amber-500 ring-2 ring-amber-500/20 shadow-lg') : (isDarkMode ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs')}`}
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-center justify-between mb-4">
                        <span className={`text-[11px] font-semibold tracking-wider uppercase ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                          {tmpl.category}
                        </span>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold mb-1">{tmpl.title}</h3>
                      <p className={`text-xs font-medium mb-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {tmpl.hindiTitle}
                      </p>

                      <p className={`text-xs leading-relaxed mb-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        {tmpl.description}
                      </p>

                      {/* Feature Checklist */}
                      <div className="space-y-1.5 pt-3 border-t border-slate-800/40 dark:border-slate-800">
                        {tmpl.features.map((feat, idx) => (
                          <div key={idx} className="flex items-center space-x-2 text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                            <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Action */}
                    <div className="mt-6 pt-4 border-t border-slate-800/40 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">
                        {tmpl.recommendedPages.length} Core Sections
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTemplate(tmpl.id);
                          setActiveTab('builder');
                        }}
                        className={`text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-colors ${isSelected ? 'text-amber-400' : 'text-slate-400 hover:text-white'}`}
                      >
                        <span>Customize</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Customization & Vision Input */}
        {activeTab === 'builder' && (
          <div className="max-w-3xl mx-auto w-full space-y-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-2">अपनी नई साइट की जानकारी भरें</h2>
              <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Configure the title, tagline, and details for your new website.
              </p>
            </div>

            <div className={`p-6 sm:p-8 rounded-2xl border space-y-6 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              {/* Selected Type */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  चयनित श्रेणी (Selected Type)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => setSelectedTemplate(tmpl.id)}
                      className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer ${selectedTemplate === tmpl.id ? (isDarkMode ? 'border-amber-400 bg-amber-400/10 text-amber-300' : 'border-amber-500 bg-amber-50 text-amber-900 font-bold') : (isDarkMode ? 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100')}`}
                    >
                      <div className="truncate">{tmpl.title.split('&')[0]}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Site Name Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  वेबसाइट का नाम (Website Name)
                </label>
                <input
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="e.g. Acme Tech, Modern Store, Krishna Academy"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'}`}
                />
              </div>

              {/* Tagline Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  टैगलाइन या मुख्य संदेश (Tagline / Catchphrase)
                </label>
                <input
                  type="text"
                  value={siteTagline}
                  onChange={(e) => setSiteTagline(e.target.value)}
                  placeholder="e.g. Premium shopping for everyone / Best coaching in your city"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'}`}
                />
              </div>

              {/* Special Features / Prompts */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  विशिष्ट सुविधाएं या आवश्यकताएं (Special Requirements / Features)
                </label>
                <textarea
                  rows={4}
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder="अपनी पसंद के पेज, रंग, प्रोडक्ट्स या कोई विशेष फीचर यहाँ लिखें... (e.g. Add dark theme, WhatsApp chat button, testimonials section, contact form, pricing table)"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'}`}
                />
              </div>

              {/* Actions */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className={`w-full sm:w-auto px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${isDarkMode ? 'border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300' : 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                >
                  {copiedNotification ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">कॉपी हो गया! (Copied)</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>प्रॉम्प्ट कॉपी करें (Copy Prompt)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md cursor-pointer flex items-center justify-center space-x-2"
                >
                  <span>लाइव पूर्वावलोकन देखें (View Preview)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Interactive Live Preview Container */}
        {activeTab === 'preview' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">लाइव पूर्वावलोकन (Live Blueprint Preview)</h2>
                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  This is the starting foundation for {siteName}. Tell us in chat to implement full content or pages!
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('builder')}
                  className="px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer border-slate-700 hover:bg-slate-800 text-slate-300"
                >
                  Edit Details
                </button>
              </div>
            </div>

            {/* Simulated Live Site Frame */}
            <div className={`rounded-2xl border overflow-hidden shadow-2xl ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              {/* Fake Browser Toolbar */}
              <div className={`px-4 py-2.5 border-b flex items-center justify-between ${isDarkMode ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                </div>
                <div className={`text-[11px] font-mono px-3 py-0.5 rounded-md ${isDarkMode ? 'bg-slate-900 text-slate-400' : 'bg-white text-slate-500 border border-slate-200'}`}>
                  https://{siteName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'mysite'}.studio.app
                </div>
                <div className="text-[11px] font-medium text-amber-400">
                  Live Scaffolding
                </div>
              </div>

              {/* Preview Content Body */}
              <div className="p-8 sm:p-14 space-y-12">
                {/* Hero Section */}
                <div className="text-center max-w-2xl mx-auto space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    {currentTemplate.title}
                  </span>
                  <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
                    {siteName}
                  </h1>
                  <p className={`text-sm sm:text-base leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    {siteTagline}
                  </p>
                  <div className="pt-2 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
                    >
                      Explore Features
                    </button>
                    <button
                      type="button"
                      className={`px-5 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer ${isDarkMode ? 'border-slate-800 hover:bg-slate-800 text-white' : 'border-slate-300 hover:bg-slate-100 text-slate-900'}`}
                    >
                      Contact Us
                    </button>
                  </div>
                </div>

                {/* Simulated Feature Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
                  {currentTemplate.features.slice(0, 3).map((feature, i) => (
                    <div
                      key={i}
                      className={`p-5 rounded-xl border text-left ${isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-400/10 text-amber-400 flex items-center justify-center font-bold text-xs mb-3">
                        0{i + 1}
                      </div>
                      <h4 className="text-sm font-bold mb-1">{feature}</h4>
                      <p className="text-xs text-slate-500">
                        Tailored module engineered for high performance and responsiveness.
                      </p>
                    </div>
                  ))}
                </div>

                {/* Section Structure Roadmap */}
                <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50/80 border-slate-200'}`}>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Recommended Site Architecture
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {currentTemplate.recommendedPages.map((page, idx) => (
                      <span
                        key={idx}
                        className={`text-xs px-3 py-1 rounded-lg border font-medium ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}
                      >
                        {page}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className={`border-t py-6 text-xs ${isDarkMode ? 'border-slate-800/80 bg-slate-950 text-slate-500' : 'border-slate-200 bg-white text-slate-500'}`}>
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p>© {new Date().getFullYear()} {siteName}. All previous data removed successfully.</p>
          <p className="text-[11px] text-slate-500">
            Tell me in chat what specific site and pages you want, and I will build it immediately.
          </p>
        </div>
      </footer>
    </div>
  );
}
