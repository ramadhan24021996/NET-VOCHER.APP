import React from 'react';
import { MessageSquare } from 'lucide-react';

const LoggingTab = ({ mtLogs }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">System Logging</h2>
          <p className="text-slate-500 text-sm font-medium">Log aktivitas sistem dan kejadian langsung dari router MikroTik</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            System Feed
          </div>
        </div>
      </div>

      <div className="bg-[#0B1320] border border-[#26314A] rounded-3xl overflow-hidden shadow-2xl">
        <div className="max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500/20">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-20">
              <tr className="bg-[#121929] text-slate-500 font-bold text-[10px] uppercase tracking-[0.15em] border-b border-[#26314A]">
                <th className="px-6 py-4 w-32">Waktu</th>
                <th className="px-6 py-4 w-40">Topics</th>
                <th className="px-6 py-4">Pesan / Aktivitas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#26314A]/40 font-mono text-[11px]">
              {mtLogs.length > 0 ? [...mtLogs].reverse().map((log, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-3 text-slate-500 whitespace-nowrap">{log.time}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                      log.topics.includes('error') ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      log.topics.includes('warning') ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                      {log.topics}
                    </span>
                  </td>
                  <td className={`px-6 py-3 ${
                    log.message.toLowerCase().includes('failed') || log.message.toLowerCase().includes('error') ? 'text-red-400/90' : 'text-slate-300'
                  }`}>
                    {log.message}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="3" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-30">
                      <MessageSquare size={48} className="text-slate-600" />
                      <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Belum ada log yang tersedia</p>
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

export default LoggingTab;
