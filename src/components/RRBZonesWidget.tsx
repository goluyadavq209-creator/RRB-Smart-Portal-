import React, { useState } from 'react';
import { Building2, Search, MapPin, ExternalLink, Check } from 'lucide-react';
import { FullRRBDatabase, TabView } from '../types';

interface RRBZonesWidgetProps {
  database: FullRRBDatabase;
  selectedZoneFilter: string;
  setSelectedZoneFilter: (zone: string) => void;
  setCurrentTab: (tab: TabView) => void;
}

export const RRBZonesWidget: React.FC<RRBZonesWidgetProps> = ({
  database,
  selectedZoneFilter,
  setSelectedZoneFilter,
  setCurrentTab,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllModal, setShowAllModal] = useState(false);

  // Filter 21 RRB Zones
  const filteredZones = database.zones.filter((z) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      z.name.toLowerCase().includes(q) ||
      z.code.toLowerCase().includes(q) ||
      z.headquarters.toLowerCase().includes(q) ||
      z.stateRegion.toLowerCase().includes(q)
    );
  });

  const handleSelectZone = (code: string) => {
    setSelectedZoneFilter(code);
    setShowAllModal(false);
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <Building2 className="w-5 h-5 text-[#c1121f]" />
          <h3 className="font-extrabold text-base sm:text-lg text-slate-950">
            RRB Zones
          </h3>
        </div>
        <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
          21 Boards
        </span>
      </div>

      {/* Search Zone Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search Zone..."
          className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#c1121f]/30 focus:border-[#c1121f] transition-all font-medium"
        />
      </div>

      {/* 2-Column Grid of Zone Pills */}
      <div className="grid grid-cols-2 gap-1.5 max-h-[300px] overflow-y-auto pr-1">
        {filteredZones.slice(0, 16).map((zone) => {
          const isSelected = selectedZoneFilter === zone.code;
          const cleanName = zone.name.replace('RRB ', '');
          return (
            <button
              key={zone.id}
              onClick={() => handleSelectZone(zone.code)}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all text-left truncate cursor-pointer ${
                isSelected
                  ? 'bg-[#c1121f] text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200/70'
              }`}
              title={`${zone.name} (${zone.code}) - ${zone.stateRegion}`}
            >
              <MapPin className={`w-3 h-3 shrink-0 ${isSelected ? 'text-amber-200' : 'text-[#c1121f]'}`} />
              <span className="truncate">{cleanName}</span>
            </button>
          );
        })}
      </div>

      {/* View All Zones Red Outline Button */}
      <button
        onClick={() => setShowAllModal(true)}
        className="w-full py-2.5 rounded-xl border border-[#c1121f] text-[#c1121f] hover:bg-[#c1121f]/5 font-bold text-xs transition-colors flex items-center justify-center space-x-1 cursor-pointer"
      >
        <span>View All Zones</span>
      </button>

      {/* All 21 Zones Full Modal */}
      {showAllModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-[#c1121f]" />
                <h3 className="font-extrabold text-lg text-slate-900">
                  All 21 Official RRB Regional Boards
                </h3>
              </div>
              <button
                onClick={() => setShowAllModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto pr-1 space-y-2 flex-1">
              <button
                onClick={() => handleSelectZone('ALL')}
                className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                  selectedZoneFilter === 'ALL'
                    ? 'bg-[#c1121f] text-white border-[#c1121f]'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-900 border-slate-200'
                }`}
              >
                <div>
                  <div className="font-bold text-sm">All 21 Regional Boards (Default)</div>
                  <div className={`text-xs ${selectedZoneFilter === 'ALL' ? 'text-white/80' : 'text-slate-500'}`}>
                    Show recruitment updates and cut-offs from all boards
                  </div>
                </div>
                {selectedZoneFilter === 'ALL' && <Check className="w-5 h-5 text-white" />}
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {database.zones.map((zone) => {
                  const isSelected = selectedZoneFilter === zone.code;
                  return (
                    <div
                      key={zone.id}
                      onClick={() => handleSelectZone(zone.code)}
                      className={`p-3 rounded-2xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#c1121f] text-white border-[#c1121f]'
                          : 'bg-slate-50 hover:bg-white text-slate-900 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-1.5">
                          <MapPin className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-[#c1121f]'}`} />
                          <span className="font-bold text-xs sm:text-sm truncate">{zone.name}</span>
                          <span className={`text-[10px] font-mono px-1 py-0.2 rounded font-bold ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {zone.code}
                          </span>
                        </div>
                        <div className={`text-[11px] mt-0.5 ${isSelected ? 'text-white/80' : 'text-slate-500'} truncate`}>
                          HQ: {zone.headquarters} • {zone.stateRegion}
                        </div>
                      </div>

                      {zone.officialWebsite && (
                        <a
                          href={zone.officialWebsite}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className={`ml-2 p-1.5 rounded-lg ${
                            isSelected ? 'hover:bg-white/20 text-white' : 'hover:bg-slate-200 text-slate-400 hover:text-slate-700'
                          } transition-colors`}
                          title="Open official portal"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowAllModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
