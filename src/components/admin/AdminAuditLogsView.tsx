import React, { useState } from 'react';
import { ScrollText, ShieldCheck, Clock, User, CheckCircle2, Download } from 'lucide-react';

export const AdminAuditLogsView: React.FC = () => {
  const [logs] = useState([
    { id: '1', action: 'PDF Published', details: 'NTPC CBT-1 Cut-off 2025 (RRB Patna)', user: 'Admin User', time: '29 Aug 2025, 09:32 AM', ip: '10.0.4.12' },
    { id: '2', action: 'Notice Created', details: 'Group D Answer Key Notice', user: 'Data Admin', time: '28 Aug 2025, 04:15 PM', ip: '10.0.4.18' },
    { id: '3', action: 'Auto Update Synced', details: '21 RRB Regional Endpoints crawled', user: 'System Worker', time: '28 Aug 2025, 11:30 PM', ip: '127.0.0.1' },
    { id: '4', action: 'Cut-off Edited', details: 'ALP Stage-2 Normalized Marks', user: 'Admin User', time: '27 Aug 2025, 02:45 PM', ip: '10.0.4.12' },
    { id: '5', action: 'Admin Session Login', details: 'Super Admin authenticated', user: 'admin', time: '27 Aug 2025, 09:00 AM', ip: '10.0.4.12' },
  ]);

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center space-x-2">
            <ScrollText className="w-5 h-5 text-red-600" />
            <span>Audit Logs & Security Trails</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable log of all data uploads, modifications, deletions, authentication events & IP addresses
          </p>
        </div>

        <button
          onClick={() => alert('Exporting audit trail to CSV')}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center space-x-1.5 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Logs (.CSV)</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4">Initiated By</th>
                <th className="py-3 px-4 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">{log.time}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{log.details}</td>
                  <td className="py-3.5 px-4 text-slate-600">{log.user}</td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 text-right">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
