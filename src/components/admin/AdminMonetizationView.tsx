import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Plus, 
  Trash2, 
  Edit3, 
  Calendar, 
  Monitor, 
  Smartphone, 
  ExternalLink, 
  HelpCircle, 
  Check, 
  X, 
  AlertCircle, 
  Layers, 
  PieChart as PieChartIcon, 
  Share2, 
  BookOpen, 
  Sparkles,
  Download,
  Info,
  ChevronDown
} from 'lucide-react';
import { FullRRBDatabase, AdPlacement, SponsoredPost, AffiliateProduct, MonetizationData } from '../../types';
import { DEFAULT_MONETIZATION_DATA } from '../../data/defaultData';

interface AdminMonetizationViewProps {
  database: FullRRBDatabase;
  setDatabase?: (db: FullRRBDatabase) => void;
  onSuccessMessage?: (msg: string) => void;
}

export const AdminMonetizationView: React.FC<AdminMonetizationViewProps> = ({
  database,
  setDatabase,
  onSuccessMessage,
}) => {
  // Active Monetization state (fallback to default if not yet populated)
  const monetization: MonetizationData = database.monetization || DEFAULT_MONETIZATION_DATA;

  // Selected date range filter
  const [dateRange, setDateRange] = useState<string>('01 Jun – 01 Jun 2025');
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  // Modals state
  const [isAddAdModalOpen, setIsAddAdModalOpen] = useState<boolean>(false);
  const [editingAd, setEditingAd] = useState<AdPlacement | null>(null);

  const [isAddSponsoredModalOpen, setIsAddSponsoredModalOpen] = useState<boolean>(false);
  const [editingSponsored, setEditingSponsored] = useState<SponsoredPost | null>(null);

  const [isAddAffiliateModalOpen, setIsAddAffiliateModalOpen] = useState<boolean>(false);
  const [editingAffiliate, setEditingAffiliate] = useState<AffiliateProduct | null>(null);

  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [showAllSponsored, setShowAllSponsored] = useState<boolean>(false);
  const [showAllAffiliate, setShowAllAffiliate] = useState<boolean>(false);

  // Helper to update database state
  const updateMonetizationData = (newData: Partial<MonetizationData>, successMsg?: string) => {
    if (!setDatabase) return;
    const updated: MonetizationData = {
      ...monetization,
      ...newData,
    };
    setDatabase({
      ...database,
      monetization: updated,
    });
    if (onSuccessMessage && successMsg) {
      onSuccessMessage(successMsg);
    }
  };

  // Toggle Ad Placement Status (ON / OFF)
  const handleToggleAdStatus = (adId: string) => {
    const updatedAds = monetization.adPlacements.map((ad) => {
      if (ad.id === adId) {
        return { ...ad, status: !ad.status };
      }
      return ad;
    });
    updateMonetizationData({ adPlacements: updatedAds }, 'Ad status updated successfully!');
  };

  // Delete Ad Placement
  const handleDeleteAd = (adId: string) => {
    if (window.confirm('Are you sure you want to remove this ad placement?')) {
      const updatedAds = monetization.adPlacements.filter((ad) => ad.id !== adId);
      updateMonetizationData({ adPlacements: updatedAds }, 'Ad placement deleted.');
    }
  };

  // Save / Edit Ad
  const handleSaveAd = (ad: AdPlacement) => {
    let updatedAds = [...monetization.adPlacements];
    const idx = updatedAds.findIndex((a) => a.id === ad.id);
    if (idx >= 0) {
      updatedAds[idx] = ad;
    } else {
      updatedAds.push(ad);
    }
    updateMonetizationData({ adPlacements: updatedAds }, 'Ad placement saved successfully.');
    setIsAddAdModalOpen(false);
    setEditingAd(null);
  };

  // Toggle Sponsored Post Status
  const handleToggleSponsoredStatus = (id: string) => {
    const updated = monetization.sponsoredPosts.map((sp) => {
      if (sp.id === id) {
        return { ...sp, status: (sp.status === 'Active' ? 'Inactive' : 'Active') as any };
      }
      return sp;
    });
    updateMonetizationData({ sponsoredPosts: updated }, 'Sponsored post status updated.');
  };

  // Delete Sponsored Post
  const handleDeleteSponsored = (id: string) => {
    if (window.confirm('Are you sure you want to delete this sponsored post?')) {
      const updated = monetization.sponsoredPosts.filter((sp) => sp.id !== id);
      updateMonetizationData({ sponsoredPosts: updated }, 'Sponsored post removed.');
    }
  };

  // Save / Edit Sponsored Post
  const handleSaveSponsored = (sp: SponsoredPost) => {
    let updated = [...monetization.sponsoredPosts];
    const idx = updated.findIndex((s) => s.id === sp.id);
    if (idx >= 0) {
      updated[idx] = sp;
    } else {
      updated.push(sp);
    }
    updateMonetizationData({ sponsoredPosts: updated }, 'Sponsored post saved.');
    setIsAddSponsoredModalOpen(false);
    setEditingSponsored(null);
  };

  // Toggle Affiliate Status
  const handleToggleAffiliateStatus = (id: string) => {
    const updated = monetization.affiliateProducts.map((aff) => {
      if (aff.id === id) {
        return { ...aff, status: (aff.status === 'Active' ? 'Inactive' : 'Active') as any };
      }
      return aff;
    });
    updateMonetizationData({ affiliateProducts: updated }, 'Affiliate product status updated.');
  };

  // Delete Affiliate
  const handleDeleteAffiliate = (id: string) => {
    if (window.confirm('Are you sure you want to delete this affiliate product?')) {
      const updated = monetization.affiliateProducts.filter((aff) => aff.id !== id);
      updateMonetizationData({ affiliateProducts: updated }, 'Affiliate product removed.');
    }
  };

  // Save / Edit Affiliate Product
  const handleSaveAffiliate = (aff: AffiliateProduct) => {
    let updated = [...monetization.affiliateProducts];
    const idx = updated.findIndex((a) => a.id === aff.id);
    if (idx >= 0) {
      updated[idx] = aff;
    } else {
      updated.push(aff);
    }
    updateMonetizationData({ affiliateProducts: updated }, 'Affiliate product saved.');
    setIsAddAffiliateModalOpen(false);
    setEditingAffiliate(null);
  };

  // Format currency helper
  const formatRupee = (num: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(num);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in font-sans">
      
      {/* 1. TOP HEADER STRIP & DATE FILTER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Monetization Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Manage your website earning sources and monetization.
          </p>
        </div>

        {/* Date Filter Dropdown */}
        <div className="relative self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 flex items-center space-x-2.5 cursor-pointer transition-colors"
          >
            <span>{dateRange}</span>
            <Calendar className="w-4 h-4 text-slate-500" />
          </button>

          {showDatePicker && (
            <div className="absolute right-0 mt-1.5 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-30 space-y-1 animate-in fade-in">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1 block">
                Quick Select
              </span>
              {[
                'Today (01 Jun 2025)',
                '01 Jun – 01 Jun 2025',
                'Last 7 Days',
                'This Month (June 2025)',
                'Last Month (May 2025)',
                'Year 2025 (YTD)',
              ].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setDateRange(opt.replace(/\(.*\)/, '').trim());
                    setShowDatePicker(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                    dateRange.includes(opt.split(' ')[0])
                      ? 'bg-blue-50 text-blue-600 font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. TOP 6 EARNING METRICS CARDS (With Sparklines & Percentage Change) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        
        {/* Card 1: Today's Earnings (Green) */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
              <DollarSign className="w-4 h-4 font-bold" />
            </div>
            <div>
              <span className="text-sm sm:text-base font-black text-slate-900 block leading-tight">
                ₹ {monetization.summary.todayEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 block">Today's Earnings</span>
            </div>
          </div>
          {/* Sparkline Curve */}
          <div className="h-7 w-full overflow-hidden">
            <svg viewBox="0 0 100 25" className="w-full h-full text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M0,18 Q15,22 30,15 T60,18 T85,6 T100,4" />
            </svg>
          </div>
          <div className="text-[10px] font-extrabold text-emerald-600 flex items-center space-x-1">
            <span>↑ {monetization.summary.todayGrowth}%</span>
            <span className="text-slate-400 font-normal">vs yesterday</span>
          </div>
        </div>

        {/* Card 2: This Month (Blue) */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-xs">
              <Layers className="w-4 h-4 font-bold" />
            </div>
            <div>
              <span className="text-sm sm:text-base font-black text-slate-900 block leading-tight">
                ₹ {monetization.summary.thisMonthEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 block">This Month</span>
            </div>
          </div>
          {/* Sparkline Curve */}
          <div className="h-7 w-full overflow-hidden">
            <svg viewBox="0 0 100 25" className="w-full h-full text-blue-500" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M0,20 Q20,24 40,16 T75,12 T100,5" />
            </svg>
          </div>
          <div className="text-[10px] font-extrabold text-blue-600 flex items-center space-x-1">
            <span>↑ {monetization.summary.thisMonthGrowth}%</span>
            <span className="text-slate-400 font-normal">vs last month</span>
          </div>
        </div>

        {/* Card 3: Ad Earnings (Purple) */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <Monitor className="w-4 h-4 font-bold" />
            </div>
            <div>
              <span className="text-sm sm:text-base font-black text-slate-900 block leading-tight">
                ₹ {monetization.summary.adEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 block">Ad Earnings</span>
            </div>
          </div>
          {/* Sparkline Curve */}
          <div className="h-7 w-full overflow-hidden">
            <svg viewBox="0 0 100 25" className="w-full h-full text-purple-600" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M0,19 Q25,23 50,14 T80,16 T100,6" />
            </svg>
          </div>
          <div className="text-[10px] font-extrabold text-purple-600 flex items-center space-x-1">
            <span>↑ {monetization.summary.adGrowth}%</span>
            <span className="text-slate-400 font-normal">vs last month</span>
          </div>
        </div>

        {/* Card 4: Sponsored Earnings (Orange) */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Share2 className="w-4 h-4 font-bold" />
            </div>
            <div>
              <span className="text-sm sm:text-base font-black text-slate-900 block leading-tight">
                ₹ {monetization.summary.sponsoredEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 block">Sponsored Earnings</span>
            </div>
          </div>
          {/* Sparkline Curve */}
          <div className="h-7 w-full overflow-hidden">
            <svg viewBox="0 0 100 25" className="w-full h-full text-amber-500" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M0,22 Q30,25 55,15 T85,10 T100,5" />
            </svg>
          </div>
          <div className="text-[10px] font-extrabold text-amber-600 flex items-center space-x-1">
            <span>↑ {monetization.summary.sponsoredGrowth}%</span>
            <span className="text-slate-400 font-normal">vs last month</span>
          </div>
        </div>

        {/* Card 5: Affiliate Earnings (Teal/Cyan) */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500 text-white flex items-center justify-center shadow-xs">
              <BookOpen className="w-4 h-4 font-bold" />
            </div>
            <div>
              <span className="text-sm sm:text-base font-black text-slate-900 block leading-tight">
                ₹ {monetization.summary.affiliateEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 block">Affiliate Earnings</span>
            </div>
          </div>
          {/* Sparkline Curve */}
          <div className="h-7 w-full overflow-hidden">
            <svg viewBox="0 0 100 25" className="w-full h-full text-teal-500" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M0,17 Q25,20 50,13 T80,15 T100,7" />
            </svg>
          </div>
          <div className="text-[10px] font-extrabold text-teal-600 flex items-center space-x-1">
            <span>↑ {monetization.summary.affiliateGrowth}%</span>
            <span className="text-slate-400 font-normal">vs last month</span>
          </div>
        </div>

        {/* Card 6: Total Earnings (Rose/Red) */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xs">
              <PieChartIcon className="w-4 h-4 font-bold" />
            </div>
            <div>
              <span className="text-sm sm:text-base font-black text-slate-900 block leading-tight">
                ₹ {monetization.summary.totalEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 block">Total Earnings</span>
            </div>
          </div>
          {/* Sparkline Curve */}
          <div className="h-7 w-full overflow-hidden">
            <svg viewBox="0 0 100 25" className="w-full h-full text-rose-500" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M0,21 Q20,24 45,17 T80,11 T100,4" />
            </svg>
          </div>
          <div className="text-[10px] font-extrabold text-rose-600 flex items-center space-x-1">
            <span>↑ {monetization.summary.totalGrowth}%</span>
            <span className="text-slate-400 font-normal">vs last month</span>
          </div>
        </div>

      </div>

      {/* 3. SECTION 1: ADS MANAGEMENT */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Section Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className="text-base sm:text-lg font-black text-slate-950">
                1. Ads Management
              </h2>
              <button
                type="button"
                onClick={() => setShowGuideModal(true)}
                className="px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-600 text-[10px] font-bold border border-blue-200 cursor-pointer flex items-center space-x-1"
              >
                <HelpCircle className="w-3 h-3" />
                <span>Guide</span>
              </button>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Manage all ad placements on your website
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingAd(null);
              setIsAddAdModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Ad Code</span>
          </button>
        </div>

        {/* Ads Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-3 px-4">Placement</th>
                <th className="py-3 px-4">Ad Type</th>
                <th className="py-3 px-4">Ad Code / ID</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Display On</th>
                <th className="py-3 px-4 text-center">Priority</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {monetization.adPlacements.map((ad) => (
                <tr key={ad.id} className="hover:bg-slate-50/60 transition-colors">
                  {/* Placement */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                        <Monitor className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-slate-900">{ad.placement}</span>
                    </div>
                  </td>

                  {/* Ad Type */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-1.5">
                      {ad.adType === 'Google AdSense' ? (
                        <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-900 font-semibold text-[11px]">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          <span>Google AdSense</span>
                        </div>
                      ) : ad.adType === 'Media.net' ? (
                        <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200 text-purple-900 font-semibold text-[11px]">
                          <span className="font-black text-xs font-mono">m</span>
                          <span>Media.net</span>
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                          {ad.adType}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Ad Code / ID */}
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                    <div className="space-y-0.5">
                      {ad.adCodeId.split('\n').map((line, lIdx) => (
                        <div key={lIdx} className={lIdx === 0 ? 'text-slate-800 font-bold' : 'text-slate-400'}>
                          {line}
                        </div>
                      ))}
                    </div>
                  </td>

                  {/* Status Toggle Switch */}
                  <td className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleAdStatus(ad.id)}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        ad.status ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                      title={ad.status ? 'Deactivate Ad' : 'Activate Ad'}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          ad.status ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </td>

                  {/* Display On Devices */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex items-center space-x-1 text-slate-500">
                      {ad.displayOn === 'desktop_mobile' && (
                        <>
                          <Monitor className="w-3.5 h-3.5 text-blue-500" />
                          <span className="text-[10px] text-slate-400">+</span>
                          <Smartphone className="w-3.5 h-3.5 text-blue-500" />
                        </>
                      )}
                      {ad.displayOn === 'mobile_only' && (
                        <Smartphone className="w-3.5 h-3.5 text-blue-500" />
                      )}
                      {ad.displayOn === 'desktop_only' && (
                        <Monitor className="w-3.5 h-3.5 text-blue-500" />
                      )}
                    </div>
                  </td>

                  {/* Priority */}
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-blue-50 text-blue-600 font-bold text-xs border border-blue-200">
                      {ad.priority}
                    </span>
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAd(ad);
                          setIsAddAdModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteAd(ad.id)}
                        className="px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Note strip */}
        <div className="p-3.5 bg-blue-50/70 border-t border-blue-100 text-[11px] text-blue-900 font-medium flex items-center space-x-2">
          <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>
            <strong>Note:</strong> Ad changes may take up to 10-15 minutes to reflect on the website.
          </span>
        </div>
      </div>

      {/* 4. SECTION 2 & 3: 2-COLUMN GRID (SPONSORED POSTS & AFFILIATE MARKETING) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* === LEFT: 2. SPONSORED POSTS === */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between overflow-hidden">
          <div>
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-black text-slate-950">
                  2. Sponsored Posts
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Manage sponsored posts and advertisements
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingSponsored(null);
                  setIsAddSponsoredModalOpen(true);
                }}
                className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-2xs transition-colors shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Sponsored Post</span>
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-3 px-4">Sponsored Post</th>
                    <th className="py-3 px-4">Company</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {(showAllSponsored ? monetization.sponsoredPosts : monetization.sponsoredPosts.slice(0, 4)).map((sp) => (
                    <tr key={sp.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Post Name & Logo */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-lg bg-slate-900 text-white font-black text-[10px] flex items-center justify-center uppercase shrink-0">
                            {sp.company.slice(0, 2)}
                          </div>
                          <span className="font-bold text-slate-900 truncate">{sp.title}</span>
                        </div>
                      </td>

                      {/* Company */}
                      <td className="py-3.5 px-4 text-slate-600 font-semibold">{sp.company}</td>

                      {/* Duration */}
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {sp.duration}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        ₹ {sp.amount.toLocaleString('en-IN')}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSponsoredStatus(sp.id)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                            sp.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                          }`}
                        >
                          {sp.status}
                        </button>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSponsored(sp);
                              setIsAddSponsoredModalOpen(true);
                            }}
                            className="p-1 rounded-md text-blue-600 hover:bg-blue-50 border border-blue-200 cursor-pointer"
                            title="Edit"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSponsored(sp.id)}
                            className="p-1 rounded-md text-rose-600 hover:bg-rose-50 border border-rose-200 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer View All Button */}
          <div className="p-4 border-t border-slate-100 flex justify-center bg-slate-50/40">
            <button
              type="button"
              onClick={() => setShowAllSponsored(!showAllSponsored)}
              className="px-5 py-2 rounded-xl bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs font-bold transition-colors cursor-pointer shadow-2xs flex items-center space-x-1.5"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{showAllSponsored ? 'Show Less' : 'View All Sponsored Posts'}</span>
            </button>
          </div>
        </div>

        {/* === RIGHT: 3. AFFILIATE MARKETING === */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between overflow-hidden">
          <div>
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-black text-slate-950">
                  3. Affiliate Marketing
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Manage affiliate products and links
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingAffiliate(null);
                  setIsAddAffiliateModalOpen(true);
                }}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-2xs transition-colors shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Affiliate Product</span>
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Commission</th>
                    <th className="py-3 px-4">Clicks</th>
                    <th className="py-3 px-4">Conversions</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {(showAllAffiliate ? monetization.affiliateProducts : monetization.affiliateProducts.slice(0, 4)).map((aff) => (
                    <tr key={aff.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Product Name & Icon */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
                            <BookOpen className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-bold text-slate-900 truncate">{aff.productName}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 text-slate-600 font-semibold">{aff.category}</td>

                      {/* Commission */}
                      <td className="py-3.5 px-4 font-bold text-emerald-600">{aff.commission}</td>

                      {/* Clicks */}
                      <td className="py-3.5 px-4 text-slate-700 font-mono text-[11px]">
                        {aff.clicks.toLocaleString()}
                      </td>

                      {/* Conversions */}
                      <td className="py-3.5 px-4 text-slate-900 font-bold font-mono text-[11px]">
                        {aff.conversions.toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleAffiliateStatus(aff.id)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                            aff.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                          }`}
                        >
                          {aff.status}
                        </button>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAffiliate(aff);
                              setIsAddAffiliateModalOpen(true);
                            }}
                            className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 border border-emerald-200 cursor-pointer"
                            title="Edit"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAffiliate(aff.id)}
                            className="p-1 rounded-md text-rose-600 hover:bg-rose-50 border border-rose-200 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer View All Button */}
          <div className="p-4 border-t border-slate-100 flex justify-center bg-slate-50/40">
            <button
              type="button"
              onClick={() => setShowAllAffiliate(!showAllAffiliate)}
              className="px-5 py-2 rounded-xl bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-xs font-bold transition-colors cursor-pointer shadow-2xs flex items-center space-x-1.5"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{showAllAffiliate ? 'Show Less' : 'View All Affiliate Products'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* 5. SECTION 4: EARNINGS ANALYTICS (3-COLUMN DETAILED CARDS) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-950">
              4. Earnings Analytics
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Detailed earnings breakdown and performance
            </p>
          </div>
        </div>

        {/* 3 Panels Grid */}
        <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Panel A: Revenue Sources Donut Chart (4 cols) */}
          <div className="lg:col-span-4 border border-slate-200/80 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Revenue Sources
            </h3>

            {/* SVG Donut Chart */}
            <div className="flex items-center justify-center py-2">
              <div className="relative w-36 h-36">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {/* Background Track */}
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#f1f5f9" strokeWidth="18" />
                  {/* Segment 1: Ad Earnings (39.4%) - Blue */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="18"
                    strokeDasharray="94.1 238.8"
                    strokeDashoffset="0"
                  />
                  {/* Segment 2: Sponsored Posts (37.8%) - Orange */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="18"
                    strokeDasharray="90.2 238.8"
                    strokeDashoffset="-94.1"
                  />
                  {/* Segment 3: Affiliate Marketing (22.8%) - Teal */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#14b8a6"
                    strokeWidth="18"
                    strokeDasharray="54.5 238.8"
                    strokeDashoffset="-184.3"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] text-slate-400 font-bold">TOTAL</span>
                  <span className="text-xs font-black text-slate-900">100%</span>
                </div>
              </div>
            </div>

            {/* Legend Breakdown */}
            <div className="space-y-2.5 text-xs">
              {/* Item 1 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="font-semibold text-slate-700">Ad Earnings</span>
                </div>
                <div className="text-right">
                  <span className="font-black text-slate-900">₹ 19,210.40</span>
                  <span className="text-[11px] text-slate-400 ml-1">(39.4%)</span>
                </div>
              </div>

              {/* Item 2 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="font-semibold text-slate-700">Sponsored Posts</span>
                </div>
                <div className="text-right">
                  <span className="font-black text-slate-900">₹ 18,450.00</span>
                  <span className="text-[11px] text-slate-400 ml-1">(37.8%)</span>
                </div>
              </div>

              {/* Item 3 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-teal-500" />
                  <span className="font-semibold text-slate-700">Affiliate Marketing</span>
                </div>
                <div className="text-right">
                  <span className="font-black text-slate-900">₹ 11,104.90</span>
                  <span className="text-[11px] text-slate-400 ml-1">(22.8%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Panel B: Earnings Overview Line Chart (4 cols) */}
          <div className="lg:col-span-4 border border-slate-200/80 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Earnings Overview
              </h3>
              <div className="flex items-center space-x-3 text-[10px] font-bold">
                <div className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <span className="text-slate-600">This Month</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <span className="text-slate-500">Last Month</span>
                </div>
              </div>
            </div>

            {/* Line Chart Canvas SVG */}
            <div className="relative h-44 w-full">
              {/* Y-Axis Guidelines */}
              <div className="absolute inset-0 flex flex-col justify-between text-[10px] text-slate-400 font-mono pointer-events-none">
                <div className="border-b border-slate-100 flex justify-between pb-0.5"><span>₹ 10K</span></div>
                <div className="border-b border-slate-100 flex justify-between pb-0.5"><span>₹ 8K</span></div>
                <div className="border-b border-slate-100 flex justify-between pb-0.5"><span>₹ 6K</span></div>
                <div className="border-b border-slate-100 flex justify-between pb-0.5"><span>₹ 4K</span></div>
                <div className="border-b border-slate-100 flex justify-between pb-0.5"><span>₹ 2K</span></div>
                <div className="flex justify-between"><span>₹ 0</span></div>
              </div>

              {/* Chart Paths */}
              <svg viewBox="0 0 300 130" className="w-full h-full overflow-visible">
                {/* Last Month Series (Grey) */}
                <path
                  d="M10,95 L65,80 L130,85 L195,105 L255,90 L290,75"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                />
                {/* Last Month Points */}
                {[[10, 95], [65, 80], [130, 85], [195, 105], [255, 90], [290, 75]].map(([cx, cy], i) => (
                  <circle key={i} cx={cx} cy={cy} r="3" fill="#94a3b8" />
                ))}

                {/* This Month Series (Blue) */}
                <path
                  d="M10,80 L65,55 L130,65 L195,50 L255,58 L290,35"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="3"
                />
                {/* This Month Points */}
                {[[10, 80], [65, 55], [130, 65], [195, 50], [255, 58], [290, 35]].map(([cx, cy], i) => (
                  <circle key={i} cx={cx} cy={cy} r="4" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />
                ))}
              </svg>
            </div>

            {/* X-Axis Dates */}
            <div className="flex justify-between text-[10px] text-slate-500 font-semibold pt-1 border-t border-slate-100">
              <span>1 Jun</span>
              <span>7 Jun</span>
              <span>14 Jun</span>
              <span>21 Jun</span>
              <span>28 Jun</span>
            </div>
          </div>

          {/* Panel C: Top Performing Pages (Ad Revenue) (4 cols) */}
          <div className="lg:col-span-4 border border-slate-200/80 rounded-2xl p-5 space-y-3.5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Top Performing Pages (Ad Revenue)
            </h3>

            <div className="space-y-3 pt-1">
              {monetization.topPagesRevenue.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{item.page}</span>
                    <span className="font-extrabold text-slate-900">
                      ₹ {item.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom Disclaimer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 text-center font-medium">
          <strong>Note:</strong> All earnings are estimated and may vary. Final payments will be processed as per respective platform policies.
        </div>
      </div>

      {/* ========================================================
          MODAL 1: ADD / EDIT AD PLACEMENT
      ======================================================== */}
      {isAddAdModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900">
                {editingAd ? 'Edit Ad Placement' : 'Add New Ad Code'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddAdModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const newAd: AdPlacement = {
                  id: editingAd ? editingAd.id : `ad-${Date.now()}`,
                  placement: (form.elements.namedItem('placement') as HTMLInputElement).value,
                  adType: (form.elements.namedItem('adType') as HTMLSelectElement).value as any,
                  adCodeId: (form.elements.namedItem('adCodeId') as HTMLInputElement).value,
                  status: true,
                  displayOn: (form.elements.namedItem('displayOn') as HTMLSelectElement).value as any,
                  priority: Number((form.elements.namedItem('priority') as HTMLInputElement).value) || 1,
                  codeSnippet: (form.elements.namedItem('codeSnippet') as HTMLTextAreaElement).value,
                };
                handleSaveAd(newAd);
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">Ad Placement Name *</label>
                <input
                  name="placement"
                  defaultValue={editingAd?.placement || ''}
                  required
                  placeholder="e.g. Header Ad (728x90) or Result Page Ad"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ad Network / Type *</label>
                  <select
                    name="adType"
                    defaultValue={editingAd?.adType || 'Google AdSense'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold bg-white"
                  >
                    <option value="Google AdSense">Google AdSense</option>
                    <option value="Media.net">Media.net</option>
                    <option value="Custom Banner">Custom Banner</option>
                    <option value="Direct HTML / Script">Direct HTML / Script</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Display Device *</label>
                  <select
                    name="displayOn"
                    defaultValue={editingAd?.displayOn || 'desktop_mobile'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold bg-white"
                  >
                    <option value="desktop_mobile">Desktop + Mobile</option>
                    <option value="mobile_only">Mobile Only</option>
                    <option value="desktop_only">Desktop Only</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Ad Code / Client ID *</label>
                  <input
                    name="adCodeId"
                    defaultValue={editingAd?.adCodeId || ''}
                    required
                    placeholder="e.g. ca-pub-1234567890123456"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority (1-10)</label>
                  <input
                    type="number"
                    name="priority"
                    defaultValue={editingAd?.priority || 1}
                    min="1"
                    max="20"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ad HTML / Script Code Snippet</label>
                <textarea
                  name="codeSnippet"
                  defaultValue={editingAd?.codeSnippet || ''}
                  rows={3}
                  placeholder='<ins class="adsbygoogle" ...></ins>'
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-[11px]"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddAdModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                >
                  {editingAd ? 'Update Ad Placement' : 'Add Ad Placement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: ADD / EDIT SPONSORED POST
      ======================================================== */}
      {isAddSponsoredModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900">
                {editingSponsored ? 'Edit Sponsored Post' : 'Add Sponsored Post'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddSponsoredModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const sp: SponsoredPost = {
                  id: editingSponsored ? editingSponsored.id : `sp-${Date.now()}`,
                  title: (form.elements.namedItem('title') as HTMLInputElement).value,
                  company: (form.elements.namedItem('company') as HTMLInputElement).value,
                  duration: (form.elements.namedItem('duration') as HTMLInputElement).value,
                  amount: Number((form.elements.namedItem('amount') as HTMLInputElement).value) || 0,
                  status: (form.elements.namedItem('status') as HTMLSelectElement).value as any,
                  targetUrl: (form.elements.namedItem('targetUrl') as HTMLInputElement).value,
                };
                handleSaveSponsored(sp);
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">Post Title / Campaign *</label>
                <input
                  name="title"
                  defaultValue={editingSponsored?.title || ''}
                  required
                  placeholder="e.g. Testbook Pass Pro 2025"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Company / Brand *</label>
                  <input
                    name="company"
                    defaultValue={editingSponsored?.company || ''}
                    required
                    placeholder="e.g. Testbook"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    name="amount"
                    defaultValue={editingSponsored?.amount || 5000}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Campaign Duration *</label>
                <input
                  name="duration"
                  defaultValue={editingSponsored?.duration || '01 Jun – 30 Jun 2025'}
                  required
                  placeholder="e.g. 01 Jun – 15 Jun 2025"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    name="status"
                    defaultValue={editingSponsored?.status || 'Active'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Scheduled">Scheduled</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target URL</label>
                  <input
                    name="targetUrl"
                    defaultValue={editingSponsored?.targetUrl || ''}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddSponsoredModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                >
                  Save Sponsored Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: ADD / EDIT AFFILIATE PRODUCT
      ======================================================== */}
      {isAddAffiliateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900">
                {editingAffiliate ? 'Edit Affiliate Product' : 'Add Affiliate Product'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddAffiliateModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const aff: AffiliateProduct = {
                  id: editingAffiliate ? editingAffiliate.id : `aff-${Date.now()}`,
                  productName: (form.elements.namedItem('productName') as HTMLInputElement).value,
                  category: (form.elements.namedItem('category') as HTMLInputElement).value,
                  commission: (form.elements.namedItem('commission') as HTMLInputElement).value,
                  clicks: Number((form.elements.namedItem('clicks') as HTMLInputElement).value) || 0,
                  conversions: Number((form.elements.namedItem('conversions') as HTMLInputElement).value) || 0,
                  status: (form.elements.namedItem('status') as HTMLSelectElement).value as any,
                  affiliateUrl: (form.elements.namedItem('affiliateUrl') as HTMLInputElement).value,
                };
                handleSaveAffiliate(aff);
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">Product Name *</label>
                <input
                  name="productName"
                  defaultValue={editingAffiliate?.productName || ''}
                  required
                  placeholder="e.g. Lucent GK Hindi Book"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category *</label>
                  <input
                    name="category"
                    defaultValue={editingAffiliate?.category || ''}
                    required
                    placeholder="e.g. General Knowledge"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Commission % *</label>
                  <input
                    name="commission"
                    defaultValue={editingAffiliate?.commission || '10%'}
                    required
                    placeholder="e.g. 15%"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Clicks</label>
                  <input
                    type="number"
                    name="clicks"
                    defaultValue={editingAffiliate?.clicks || 0}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Conversions</label>
                  <input
                    type="number"
                    name="conversions"
                    defaultValue={editingAffiliate?.conversions || 0}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Affiliate / Amazon Link</label>
                <input
                  name="affiliateUrl"
                  defaultValue={editingAffiliate?.affiliateUrl || ''}
                  placeholder="https://amzn.to/..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status</label>
                <select
                  name="status"
                  defaultValue={editingAffiliate?.status || 'Active'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddAffiliateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                >
                  Save Affiliate Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 4: AD INTEGRATION GUIDE
      ======================================================== */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900 flex items-center space-x-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                <span>AdSense & Monetization Setup Guide</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-3.5 leading-relaxed max-h-96 overflow-y-auto pr-1">
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-blue-900 space-y-1">
                <span className="font-bold block">1. Google AdSense Setup:</span>
                <p>
                  Place your Publisher ID (`ca-pub-XXXXXXXXXXXXXXXX`) in the ad placements above. You can toggle each slot ON or OFF in real-time.
                </p>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 space-y-1">
                <span className="font-bold block">2. High-Performing Placements:</span>
                <ul className="list-disc pl-4 space-y-1 text-[11px]">
                  <li><strong>Header Banner (728x90):</strong> Placed below the top navigation bar.</li>
                  <li><strong>In-Content / Result Ads (336x280):</strong> High CTR on cutoff and roll number result pages.</li>
                  <li><strong>Mobile Sticky Banner (320x50):</strong> Stays pinned at the bottom for mobile traffic.</li>
                </ul>
              </div>

              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-900 space-y-1">
                <span className="font-bold block">3. Sponsored & Affiliate Earnings:</span>
                <p>
                  Partner with coaching institutes (Testbook, Adda247, PW) for direct monthly banners, and add Amazon affiliate links for exam preparation books to earn up to 20% commission per sale.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
