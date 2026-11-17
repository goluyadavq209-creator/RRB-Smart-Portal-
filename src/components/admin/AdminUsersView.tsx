import React, { useState } from 'react';
import { Users, Shield, Plus, Search, MoreVertical, CheckCircle2, Lock, UserCheck } from 'lucide-react';

interface AdminUsersViewProps {
  onSuccessMessage: (msg: string) => void;
}

export const AdminUsersView: React.FC<AdminUsersViewProps> = ({ onSuccessMessage }) => {
  const [search, setSearch] = useState('');

  const users = [
    {
      id: 'u-1',
      name: 'Super Admin',
      email: 'admin@rrb.gov.in',
      role: 'Super Administrator',
      roleBadge: 'bg-red-100 text-red-800 border-red-200',
      status: 'Active',
      lastLogin: 'Today, 09:32 AM',
    },
    {
      id: 'u-2',
      name: 'Patna Regional Officer',
      email: 'officer.patna@rrb.gov.in',
      role: 'Zone Editor (Patna)',
      roleBadge: 'bg-blue-100 text-blue-800 border-blue-200',
      status: 'Active',
      lastLogin: 'Yesterday, 04:15 PM',
    },
    {
      id: 'u-3',
      name: 'Kolkata Data Operator',
      email: 'operator.kolkata@rrb.gov.in',
      role: 'Data Contributor',
      roleBadge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      status: 'Active',
      lastLogin: '27 Aug 2025',
    },
    {
      id: 'u-4',
      name: 'Auditor User',
      email: 'audit@railnet.gov.in',
      role: 'Read-Only Auditor',
      roleBadge: 'bg-slate-100 text-slate-800 border-slate-200',
      status: 'Active',
      lastLogin: '24 Aug 2025',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center space-x-2">
            <Users className="w-5 h-5 text-red-600" />
            <span>User Management & Admin Privileges</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage authorized staff members, role assignments & login security
          </p>
        </div>

        <button
          onClick={() => alert('Invite staff member dialog opened.')}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Admin User</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Login</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">{u.name}</span>
                        <span className="text-[11px] text-slate-400 block">{u.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${u.roleBadge}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center space-x-1 text-emerald-600 font-bold text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>{u.status}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">{u.lastLogin}</td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onSuccessMessage(`Permissions updated for ${u.name}`)}
                      className="text-xs text-blue-600 hover:underline font-bold"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
