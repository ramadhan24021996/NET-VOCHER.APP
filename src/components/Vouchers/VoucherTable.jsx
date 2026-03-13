import React from 'react';
import { Ticket, Search, Filter, Trash2, Printer, CheckCircle, RefreshCw } from 'lucide-react';

const VoucherTable = ({ vouchers, handleSync, isSyncing, lastSync, handleDeleteVoucher, setSelectedVoucher }) => {
  return (
    <div className="bg-[#151D2F] border border-[#26314A] rounded-3xl overflow-hidden shadow-2xl">
      <div className="p-8 border-b border-white/[0.05] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <Ticket className="text-blue-400" size={24} />
            DATABASE VOUCHER
          </h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
            Terakhir Sinkron: <span className="text-emerald-400 font-black">{lastSync || 'Never'}</span>
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">


          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className="flex-1 md:flex-none px-6 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-3"
          >
            {isSyncing ? <RefreshCw className="animate-spin" size={16} /> : <RefreshCw size={16} />}
            <span>Sync Now</span>
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0B1320]/50">
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Voucher Code</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Status</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Package</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Nominal</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {vouchers.map((v) => (
              <tr key={v.code} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-8 py-6">
                  <span className="font-mono text-white bg-white/5 px-2 py-1 rounded select-all">{v.code}</span>
                </td>
                <td className="px-8 py-6">
                   <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        v.status === 'Active' ? 'bg-emerald-400' : 
                        v.status === 'Used' ? 'bg-amber-400' :
                        v.status === 'Pending Router Sync' ? 'bg-blue-400 animate-pulse' :
                        'bg-red-400'
                      }`}></div>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${
                        v.status === 'Active' ? 'text-emerald-400' : 
                        v.status === 'Used' ? 'text-amber-400' :
                        v.status === 'Pending Router Sync' ? 'text-blue-400' :
                        'text-red-400'
                      }`}>
                        {v.status === 'Active' ? 'Aktif' : 
                         v.status === 'Used' ? 'Terpakai' :
                         v.status === 'Pending Router Sync' ? 'Pending' :
                         'Expired'}
                      </span>
                   </div>
                </td>
                <td className="px-8 py-6 text-[11px] font-black text-slate-300 uppercase">{v.pack}</td>
                <td className="px-8 py-6 text-[11px] font-bold text-white">{v.price}</td>
                <td className="px-8 py-6">
                   <div className="flex gap-2">
                     <button onClick={() => setSelectedVoucher(v)} className="p-2.5 bg-white/5 hover:bg-blue-600/20 text-slate-500 hover:text-blue-400 rounded-xl transition-all"><Printer size={16}/></button>
                     <button onClick={() => handleDeleteVoucher(v.code)} className="p-2.5 bg-white/5 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-xl transition-all"><Trash2 size={16}/></button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {vouchers.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center gap-4">
             <Ticket size={48} className="text-slate-700 opacity-20" />
             <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">No vouchers found in database.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoucherTable;
