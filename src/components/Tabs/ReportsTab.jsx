import React from 'react';
import { 
  FileText, CheckCircle, Zap, Calendar, Shield, Activity 
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, Area 
} from 'recharts';
import CountUp from '../UI/CountUp';

const ReportsTab = ({ stats, vouchers }) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#151D2F] border border-white/[0.05] rounded-3xl p-6 shadow-xl">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Total Pendapatan</p>
          <h3 className="text-3xl font-black text-white tracking-tight mb-2">
            <CountUp end={stats?.revenue?.total || 0} prefix="Rp " />
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 text-[10px] font-black tracking-widest">+12.5%</span>
            <span className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">Dari Bulan Lalu</span>
          </div>
        </div>
        <div className="bg-[#151D2F] border border-white/[0.05] rounded-3xl p-6 shadow-xl">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Voucher Terjual</p>
          <h3 className="text-3xl font-black text-white tracking-tight mb-2">
            <CountUp end={vouchers.length || 0} />
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-blue-400 text-[10px] font-black tracking-widest">+42 Unit</span>
            <span className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">Hari Ini</span>
          </div>
        </div>
        <div className="bg-[#151D2F] border border-white/[0.05] rounded-3xl p-6 shadow-xl">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Rata-rata Order</p>
          <h3 className="text-3xl font-black text-white tracking-tight mb-2">
            <CountUp end={Math.round((stats?.revenue?.total || 0) / (vouchers.length || 1))} prefix="Rp " />
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">Per Transaksi</span>
          </div>
        </div>
        <div className="bg-[#151D2F] border border-white/[0.05] rounded-3xl p-6 shadow-xl">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Efisiensi Jaringan</p>
          <h3 className="text-3xl font-black text-white tracking-tight mb-2">
            <CountUp end={98.8} decimals={1} suffix="%" />
          </h3>
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle size={12} />
            <span className="text-[10px] font-black tracking-widest uppercase">Excellent</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[#151D2F] border border-white/[0.05] rounded-[2.5rem] p-8 lg:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5">
            <FileText size={120} />
          </div>
          <div className="flex items-center justify-between mb-10 relative z-10">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight mb-1">Tren Pendapatan Mingguan</h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Analisis performa 7 hari terakhir</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest">
                Actual Revenue
              </div>
            </div>
          </div>

          <div className="h-[350px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.revenueVsTarget || []}>
                <defs>
                  <linearGradient id="revenueReport" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#26314A" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }}
                  dy={15}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }}
                  tickFormatter={(val) => `Rp ${val / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0D1526',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area
                  type="monotone"
                  dataKey="actual"
                  stroke="#3b82f6"
                  strokeWidth={4}
                  fill="url(#revenueReport)"
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#151D2F] border border-white/[0.05] rounded-[2.5rem] p-8 lg:p-10 shadow-2xl flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight mb-1">Paket Populer</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-10">Persentase Penjualan Paket</p>

            <div className="space-y-6">
              {[
                { name: '1 Hour', color: 'bg-blue-500', icon: Zap },
                { name: '1 Day', color: 'bg-emerald-500', icon: Calendar },
                { name: '1 Week', color: 'bg-indigo-500', icon: Shield },
              ].map((p) => {
                const total = vouchers.length || 1;
                const count = vouchers.filter(v => v.pack === p.name).length;
                const percent = Math.round((count / total) * 100);

                return (
                  <div key={p.name} className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${p.color}`} />
                        <span className="text-white">{p.name}</span>
                      </div>
                      <span className="text-slate-500">{percent}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${p.color} rounded-full transition-all duration-1000`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-10 p-6 bg-blue-500/10 border border-blue-500/20 rounded-3xl">
            <p className="text-xs text-blue-400 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
              <Activity size={12} /> Insight Hari Ini
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
              Paket <strong className="text-white">1 Hour</strong> tetap menjadi pilihan utama dengan volume penjualan tertinggi di jam makan siang.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-[#151D2F] border border-white/[0.05] rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="p-8 lg:p-10 border-b border-white/[0.05] flex justify-between items-center bg-[#1A233A]/30">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Riwayat Penjualan Terbaru</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Daftar transaksi sinkronisasi POS</p>
          </div>
          <button className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all">
            Lihat Semua
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-black/20 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-white/[0.05]">
                <th className="px-10 py-6">ID Order</th>
                <th className="px-10 py-6">Customer</th>
                <th className="px-10 py-6">Item / Paket</th>
                <th className="px-10 py-6">Pendapatan</th>
                <th className="px-10 py-6 text-right">Metode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {vouchers.slice(0, 5).map((v, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-10 py-6 font-mono text-xs text-blue-400 font-bold tracking-wider">
                    {v.details?.orderNo || 'POS-OFFLINE'}
                  </td>
                  <td className="px-10 py-6 text-xs text-white font-bold uppercase tracking-tight">
                    {v.details?.customer || 'Guest User'}
                  </td>
                  <td className="px-10 py-6">
                    <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {v.pack}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-xs text-white font-black">
                    {v.price}
                  </td>
                  <td className="px-10 py-6 text-right">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">
                      {v.details?.payment || 'CASH'}
                    </span>
                  </td>
                </tr>
              ))}
              {vouchers.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-10 py-20 text-center opacity-30">
                    <Activity size={40} className="mx-auto mb-4" />
                    <p className="text-xs font-black uppercase tracking-widest">Belum Ada Data Laporan</p>
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

export default ReportsTab;
