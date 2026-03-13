import React from 'react';
import { Users, Activity, Zap, FileText, Search, MessageSquare, ChevronRight } from 'lucide-react';
import CountUp from '../UI/CountUp';

const CustomersTab = ({ 
  vouchers, 
  activeUsers, 
  customerSearch, 
  setCustomerSearch,
  setSelectedCustomer,
  setShowCustomerModal
}) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#151D2F] border border-white/[0.05] rounded-3xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <Users size={80} />
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Total Pelanggan</p>
          <h3 className="text-3xl font-black text-white tracking-tight mb-2">
            <CountUp end={[...new Set(vouchers.map(v => v.details?.customer || 'Guest User'))].length} />
          </h3>
          <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
            Database Sinkronisasi POS
          </p>
        </div>
        <div className="bg-[#151D2F] border border-white/[0.05] rounded-3xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <Activity size={80} />
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">User Aktif</p>
          <h3 className="text-3xl font-black text-emerald-400 tracking-tight mb-2">
            <CountUp end={activeUsers.length} />
          </h3>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">Live Monitoring</span>
          </div>
        </div>
        <div className="bg-[#151D2F] border border-white/[0.05] rounded-3xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <Zap size={80} />
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Returning Rate</p>
          <h3 className="text-3xl font-black text-blue-400 tracking-tight mb-2">
            <CountUp end={
              (() => {
                const uniqueUsers = Array.from(new Set(vouchers.map(v => v.details?.customer || 'Guest User')));
                if (uniqueUsers.length === 0) return 0;
                const returners = uniqueUsers.filter(name => vouchers.filter(v => (v.details?.customer || 'Guest User') === name).length > 1);
                return Math.round((returners.length / uniqueUsers.length) * 100);
              })()
            } suffix="%" />
          </h3>
          <span className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">Kesetiaan Pelanggan</span>
        </div>
        <div className="bg-[#151D2F] border border-white/[0.05] rounded-3xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <FileText size={80} />
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Total Pendapatan</p>
          <h3 className="text-3xl font-black text-emerald-400 tracking-tight mb-2">
            <CountUp end={vouchers.reduce((acc, v) => acc + (parseInt(v.price.replace(/[^\d]/g, '')) || 0), 0)} prefix="Rp " />
          </h3>
          <span className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">Akumulasi Omset Pesanan</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[#151D2F] border border-white/[0.05] rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-white/[0.05] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#1A233A]/30">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Pelanggan Terdaftar</h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Daftar user berdasarkan transaksi POS</p>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="text"
                placeholder="Cari nama, kode voucher, atau ID order..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-xs text-white outline-none focus:border-blue-500/50 transition-all font-medium"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-black/20 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-white/[0.05]">
                  <th className="px-10 py-6">Customer Name</th>
                  <th className="px-10 py-6">Last Order</th>
                  <th className="px-10 py-6">Total Trx</th>
                  <th className="px-10 py-6">Last Pack</th>
                  <th className="px-10 py-6 text-center">Status</th>
                  <th className="px-10 py-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {Array.from(new Set(vouchers.map(v => v.details?.customer || 'Guest User')))
                  .filter(name => {
                    const search = customerSearch.toLowerCase();
                    const userVouchers = vouchers.filter(v => (v.details?.customer || 'Guest User') === name);
                    return name.toLowerCase().includes(search) ||
                      userVouchers.some(v =>
                        v.code.toLowerCase().includes(search) ||
                        (v.details?.orderNo && v.details.orderNo.toLowerCase().includes(search))
                      );
                  })
                  .slice(0, 10).map((name, i) => {
                    const userVouchers = vouchers.filter(v => (v.details?.customer || 'Guest User') === name);
                    const lastVoucher = userVouchers[0];
                    return (
                      <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-10 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 flex items-center justify-center border border-white/5 ring-1 ring-white/5">
                              <span className="text-blue-400 font-black text-[10px] uppercase">{name.substring(0, 2)}</span>
                            </div>
                            <div>
                              <p className="text-xs text-white font-black uppercase tracking-tight">{name}</p>
                              <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Verified Customer</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-6">
                          <p className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                            {lastVoucher?.date ? new Date(lastVoucher.date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
                          </p>
                        </td>
                        <td className="px-10 py-6">
                          <span className="inline-block whitespace-nowrap px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[10px] font-black text-blue-400">
                            {userVouchers.length} Transaksi
                          </span>
                        </td>
                        <td className="px-10 py-6">
                          <span className="text-xs text-slate-300 font-bold whitespace-nowrap">{lastVoucher?.pack || 'N/A'}</span>
                        </td>
                        <td className="px-10 py-6 text-center">
                          {lastVoucher ? (
                            <span className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest ${
                              lastVoucher.status === 'Expired' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {lastVoucher.status === 'Expired' ? 'Inactive' : 'Active'}
                            </span>
                          ) : (
                            <span className="text-slate-600 text-[9px] font-black uppercase tracking-widest">No Data</span>
                          )}
                        </td>
                        <td className="px-10 py-6 text-right">
                          <button onClick={() => { setSelectedCustomer({ name, vouchers: userVouchers, userVouchers }); setShowCustomerModal(true); }} className="p-2.5 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400 hover:text-white hover:bg-blue-600 transition-all shadow-lg active:scale-95 inline-flex items-center justify-center">
                            <span className="hidden xl:inline mr-2 text-[10px] font-black uppercase tracking-widest">Detail</span>
                            <ChevronRight size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                {vouchers.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-10 py-20 text-center opacity-30">
                      <MessageSquare size={40} className="mx-auto mb-4" />
                      <p className="text-xs font-black uppercase tracking-widest">Belum Ada Pelanggan</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomersTab;
