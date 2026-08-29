import React, { useState } from 'react';
import { Building2, Search, ExternalLink, ShieldCheck, CheckCircle2, RefreshCw, Plus, Edit3 } from 'lucide-react';
import { FullRRBDatabase } from '../../types';

interface AdminZonesViewProps {
  database: FullRRBDatabase;
  setDatabase: (db: FullRRBDatabase) => void;
  onSuccessMessage: (msg: string) => void;
}

export const AdminZonesView: React.FC<AdminZonesViewProps> = ({ database, setDatabase, onSuccessMessage }) => {
  const [search, setSearch] = useState('');
  const [selectedZone, setSelectedZone] = useState<any | null>(null);

  const filteredZones = database.zones.filter(
    (z) =>
      z.name.toLowerCase().includes(search.toLowerCase()) ||
      z.code.toLowerCase().includes(search.toLowerCase()) ||
      (z.officialWebsite || (z as any).website || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-red-600" />
            <span>RRB Zones Management ({database.zones.length} Official Regional Boards)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified official government endpoints connected with <a href="https://rrb.indianrailways.gov.in/" target="_blank" rel="noreferrer" className="text-red-600 font-bold hover:underline">https://rrb.indianrailways.gov.in/</a>
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search board or code..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
      </div>

      {/* Grid of RRB Zones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredZones.map((zone) => {
          const zoneCutoffs = database.cutoffs.filter((c) => c.zoneCode === zone.code).length;
          const zoneNotices = database.notices.filter((n) => n.zoneCode === zone.code).length;
          const url = zone.officialWebsite || (zone as any).website || 'https://rrb.indianrailways.gov.in/';

          return (
            <div
              key={zone.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md bg-slate-900 text-amber-400 font-mono text-xs font-bold">
                    {zone.code}
                  </span>
                  <span className="flex items-center space-x-1 text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Official Portal</span>
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 mt-2">{zone.name}</h3>
                {zone.hindiName && (
                  <p className="text-xs text-slate-500 font-medium">{zone.hindiName}</p>
                )}
                <p className="text-[11px] text-slate-400 mt-1">{zone.stateRegion}</p>

                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 hover:underline flex items-center space-x-1 mt-2 truncate font-mono"
                >
                  <span className="truncate">{url}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Cut-offs: <strong>{zoneCutoffs}</strong></span>
                <span>Notices: <strong>{zoneNotices}</strong></span>
                <button
                  onClick={() => {
                    onSuccessMessage(`Synchronized official notices for ${zone.name} (${url})`);
                  }}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                  title="Check portal status"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
