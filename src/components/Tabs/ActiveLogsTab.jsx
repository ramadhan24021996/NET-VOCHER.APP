import React from 'react';
import { Users, RefreshCw, WifiOff } from 'lucide-react';

const ActiveLogsTab = ({ activeUsers, vouchers }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Log User Aktif</h2>
          <p className="text-slate-500 text-sm font-medium">Monitoring perangkat yang sedang terhubung ke WiFi secara real-time</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            Live Monitoring
          </div>
        </div>
      </div>

      <div className="bg-[#151D2F] border border-[#26314A] rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1A233A]/50 text-slate-500 font-bold text-[10px] uppercase tracking-[0.15em] border-b border-[#26314A]">
                <th className="px-6 py-5">User / Voucher</th>
                <th className="px-6 py-5">IP Address</th>
                <th className="px-6 py-5">Mac Address</th>
                <th className="px-6 py-5">Uptime</th>
                <th className="px-6 py-5">Bytes Out</th>
                <th className="px-6 py-5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#26314A]/50">
              {activeUsers.length > 0 ? activeUsers.map((user, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-400">
                        <Users size={16} />
                      </div>
                      <div>
                        <p className="font-mono text-sm text-white font-bold tracking-wider">{user.user}</p>
                        {vouchers.find(v => v.code === user.user)?.details?.customer && (
                          <p className="text-[10px] text-blue-400 font-bold uppercase truncate max-w-[150px]">
                            {vouchers.find(v => v.code === user.user).details.customer}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-500 font-medium">Server: {user.server}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-300 text-sm font-medium">{user.address}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-500 text-[11px] font-mono tracking-wider">{user['mac-address']}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <RefreshCw size={12} className="text-emerald-400 animate-spin-slow" />
                      <span className="text-emerald-400 text-sm font-bold">{user.uptime}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-400 text-[11px] font-bold">{(parseInt(user['bytes-out']) / 1024 / 1024).toFixed(2)} MB</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-tighter">
                      Terhubung
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-30">
                      <WifiOff size={48} className="text-slate-500" />
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Tidak ada user yang sedang aktif</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ActiveLogsTab;
