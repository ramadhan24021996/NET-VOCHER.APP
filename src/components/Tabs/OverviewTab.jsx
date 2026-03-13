import React from 'react';
import { 
  ChevronRight, Zap, RefreshCw, Server, BarChart3, Ticket, Users, Activity, 
  Printer, Download, MoreHorizontal 
} from 'lucide-react';
import { 
  ResponsiveContainer, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, 
  Area, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, 
  AreaChart 
} from 'recharts';
import CountUp from '../UI/CountUp';

const OverviewTab = ({ 
  stats, 
  isLoading, 
  isSyncing, 
  handleSync, 
  handleExport, 
  setActiveTab, 
  mtConfig, 
  rcConfig, 
  lastSync, 
  testResults, 
  vouchers,
  setShowGenerateModal,
  setShowPrintModal,
  setPrintSelection
}) => {
  if (!stats && isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-44 bg-[#0D1526]/50 backdrop-blur-xl border border-white/[0.05] rounded-3xl p-6 flex flex-col justify-between overflow-hidden animate-pulse">
            <div className="space-y-3">
              <div className="h-3 w-1/3 bg-white/5 rounded-full" />
              <div className="h-8 w-2/3 bg-white/10 rounded-xl" />
            </div>
            <div className="h-12 w-full bg-white/[0.03] rounded-2xl" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* CONNECTION DIAGNOSTIC PANEL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* PANEL: MIKROTIK CONNECTIVITY */}
        <div className="bg-[#0D1526]/60 backdrop-blur-3xl border border-white/[0.06] rounded-[2.5rem] p-5 flex items-center justify-between group hover:border-blue-500/20 transition-all shadow-2xl">
          <div className="flex items-center gap-5">
            <div className={`w-14 h-14 rounded-2xl ${stats?.system?.health > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-500'} flex items-center justify-center ring-1 ring-white/5`}>
              <Server size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none mb-1.5">MikroTik Connectivity</p>
              <p className="text-white font-black text-lg tracking-tight">
                {stats?.system?.health > 0 ? 'Router Online & Responsive' : 'Router Connection Failed'}
              </p>
              <p className="text-[10px] text-slate-500 font-bold mt-1">IP Address: {mtConfig.ip || 'Not Set'} • {mtConfig.user || 'System'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-0.5">Latency</p>
              <p className="text-blue-400 font-mono text-sm font-black">{stats?.system?.latency || '0ms'}</p>
            </div>
            <div className={`w-3 h-3 rounded-full ${stats?.system?.health > 0 ? 'bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`} />
          </div>
        </div>

        {/* PANEL: POS INTEGRATION */}
        <div className="bg-[#0D1526]/60 backdrop-blur-3xl border border-white/[0.06] rounded-[2.5rem] p-5 flex items-center justify-between group hover:border-indigo-500/20 transition-all shadow-2xl">
          <div className="flex items-center gap-5">
            <div className={`w-14 h-14 rounded-2xl ${rcConfig.apiKey ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-500/10 text-slate-500'} flex items-center justify-center ring-1 ring-white/5`}>
              <Zap size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none mb-1.5">Runchise POS Sync</p>
              <p className="text-white font-black text-lg tracking-tight">
                {rcConfig.apiKey ? 'POS Integration Active' : 'Integration Standby'}
              </p>
              <p className="text-[10px] text-slate-500 font-bold mt-1">Webhook Status: Active • {rcConfig.locationName || 'Main Store'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-0.5">Push Rate</p>
              <p className="text-indigo-400 font-mono text-sm font-black">1.2s</p>
            </div>
            <div className={`w-3 h-3 rounded-full ${rcConfig.apiKey ? 'bg-indigo-400 animate-pulse shadow-[0_0_10px_rgba(129,140,248,0.8)]' : 'bg-slate-600'}`} />
          </div>
        </div>
      </div>

      {/* TOP ROW: MAIN METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Card 1: Monthly Revenue */}
        <div className="relative group overflow-hidden bg-gradient-to-br from-[#0D1526]/80 to-blue-900/10 backdrop-blur-3xl border border-white/[0.08] hover:border-blue-500/40 rounded-[2.5rem] p-7 transition-all duration-500 shadow-2xl">
          <div className="absolute top-0 right-0 p-8 text-blue-500/5 pointer-events-none group-hover:text-blue-500/10 group-hover:scale-110 transition-all duration-700">
            <BarChart3 size={100} />
          </div>
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all">
                <BarChart3 size={20} className="text-blue-400" />
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black rounded-xl backdrop-blur-sm">
                  +{stats?.revenue?.growth || 0}%
                </span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 leading-none">Net Revenue</p>
              <h2 className="text-3xl font-black text-white tracking-tight">
                <CountUp end={stats?.revenue?.total || 0} prefix="Rp " />
              </h2>
            </div>
          </div>
        </div>

        {/* Card 2: Daily Sales */}
        <div className="relative group overflow-hidden bg-gradient-to-br from-[#0D1526]/80 to-indigo-900/10 backdrop-blur-3xl border border-white/[0.08] hover:border-indigo-500/40 rounded-[2.5rem] p-7 transition-all duration-500 shadow-2xl">
          <div className="absolute top-0 right-0 p-8 text-indigo-500/5 pointer-events-none group-hover:text-indigo-500/10 group-hover:scale-110 transition-all duration-700">
            <Ticket size={100} />
          </div>
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all">
                <Ticket size={20} className="text-indigo-400" />
              </div>
              <button onClick={() => setActiveTab('Vouchers')} className="p-2 hover:bg-white/5 rounded-xl transition-all hover:scale-110" title="Manage Vouchers">
                <MoreHorizontal size={16} className="text-slate-500 hover:text-white" />
              </button>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 leading-none">Voucher Sales</p>
              <h2 className="text-3xl font-black text-white tracking-tight">
                <CountUp end={stats?.sales?.today || 0} />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter ml-2">Trans / Today</span>
              </h2>
            </div>
          </div>
        </div>

        {/* Card 3: Active Users */}
        <div className="relative group overflow-hidden bg-gradient-to-br from-[#0D1526]/80 to-cyan-900/10 backdrop-blur-3xl border border-white/[0.08] hover:border-cyan-500/40 rounded-[2.5rem] p-7 transition-all duration-500 shadow-2xl">
          <div className="absolute top-0 right-0 p-8 text-cyan-500/5 pointer-events-none group-hover:text-cyan-500/10 group-hover:scale-110 transition-all duration-700">
            <Users size={100} />
          </div>
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] transition-all">
                <Users size={20} className="text-cyan-400" />
              </div>
              <div className="flex flex-col items-center">
                <svg viewBox="0 0 36 36" className="w-10 h-10 transform -rotate-90">
                  <path className="text-white/5" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                  <path className="text-cyan-400" strokeDasharray={`${((stats?.users?.active || 0) / (stats?.users?.capacity || 1)) * 100}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 leading-none">Network Load</p>
              <h2 className="text-3xl font-black text-white tracking-tight">
                <CountUp end={stats?.users?.active || 0} />
                <span className="text-xs text-slate-500 mx-1">/</span>
                <span className="text-xs text-slate-500">{stats?.users?.capacity || 100}</span>
              </h2>
            </div>
          </div>
        </div>

        {/* Card 4: System Health */}
        <div className="relative group overflow-hidden bg-gradient-to-br from-[#0D1526]/80 to-emerald-900/10 backdrop-blur-3xl border border-white/[0.08] hover:border-emerald-500/40 rounded-[2.5rem] p-7 transition-all duration-500 shadow-2xl">
          <div className="absolute top-0 right-0 p-8 text-emerald-500/5 pointer-events-none group-hover:text-emerald-500/10 group-hover:scale-110 transition-all duration-700">
            <Activity size={100} />
          </div>
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 group-hover:shadow-[0_0_20px_rgba(52,211,153,0.2)] transition-all">
                <Activity size={20} className="text-emerald-400" />
              </div>
              <div className="flex items-center gap-1.5 h-6">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Live</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 leading-none">System Health</p>
              <h2 className="text-3xl font-black text-white tracking-tight">
                <CountUp end={stats?.system?.health || 100} suffix="%" />
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* MIDDLE ROW: Revenue vs Target & Peak Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Revenue vs Target */}
        <div className="bg-[#151D2F] border border-[#26314A] rounded-xl p-6 lg:col-span-2 relative">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-medium text-white">Revenue vs Target</h3>
            <div className="flex gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-3 h-3 rounded-sm bg-[#6366f1]"></span>
                Actual
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-3 h-[2px] rounded-full bg-pink-500"></span>
                Target
              </span>
            </div>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={stats?.revenueVsTarget || []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#26314A" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(val) => `Rp ${(val).toLocaleString()}`} />
                <Tooltip contentStyle={{ backgroundColor: '#1A233A', borderColor: '#26314A', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                <Area type="monotone" dataKey="actual" stroke="#6366f1" strokeWidth={2} fill="url(#splitColor)" />
                <Line type="stepAfter" dataKey="target" stroke="#ec4899" strokeWidth={1.5} strokeDasharray="6 6" dot={false} activeDot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Peak Hours (Radar) */}
        <div className="bg-[#151D2F] border border-[#26314A] rounded-xl p-6">
          <h3 className="text-base font-medium text-white mb-2">Peak Hours</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={Array.from({ length: 24 }, (_, i) => {
                const peakData = stats?.peakHours || [];
                const userCount = Array.isArray(peakData) && peakData[i]
                  ? (typeof peakData[i] === 'object' ? (peakData[i].users || 0) : (peakData[i] || 0))
                  : 0;
                return { hour: i.toString().padStart(2, '0'), users: userCount };
              })}>
                <PolarGrid stroke="#26314A" />
                <PolarAngleAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, Math.max(...(Array.isArray(stats?.peakHours) ? stats.peakHours.map(p => typeof p === 'object' ? (p.users || 0) : (p || 0)) : [0]), 5)]} tick={false} axisLine={false} />
                <Radar name="Users" dataKey="users" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
                <Tooltip contentStyle={{ backgroundColor: '#1A233A', borderColor: '#26314A', borderRadius: '8px', fontSize: '12px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* BOTTOM ROW: Inventory, Performance, Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Voucher Inventory Matrix */}
        <div className="bg-[#151D2F] border border-[#26314A] rounded-xl p-6">
          <h3 className="text-base font-medium text-white mb-5">Voucher Inventory Matrix</h3>
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-slate-400">
                <th className="font-normal pb-3 w-[25%]">Package</th>
                <th className="font-normal pb-3 text-center">Active</th>
                <th className="font-normal pb-3 text-center">Used</th>
                <th className="font-normal pb-3 text-center">Total</th>
              </tr>
            </thead>
            <tbody className="text-center font-medium">
              {['1 Hour', '1 Day', '1 Week'].map((pack) => {
                const count = vouchers.filter(v => v.pack === pack).length;
                const usedCount = vouchers.filter(v => v.pack === pack && v.status === 'Used').length;
                const activeCount = count - usedCount;
                return (
                  <tr key={pack}>
                    <td className="py-2 text-left text-slate-300">{pack}</td>
                    <td className="p-1"><div className={`py-1.5 rounded w-full ${activeCount > 10 ? 'bg-[#22c55e]' : activeCount > 0 ? 'bg-[#eab308]' : 'bg-[#ef4444]'} text-white`}>{activeCount}</div></td>
                    <td className="p-1"><div className="bg-blue-500/10 text-blue-400 py-1.5 rounded w-full border border-blue-500/20">{usedCount}</div></td>
                    <td className="p-1"><div className="bg-slate-800 text-slate-500 py-1.5 rounded w-full">{count}</div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Router Performance Timeline */}
        <div className="bg-[#151D2F] border border-[#26314A] rounded-xl p-6">
          <div className="flex justify-between items-baseline mb-4">
            <h3 className="text-base font-medium text-white">Router Performance Timeline</h3>
            <span className="text-[10px] text-slate-500 font-bold uppercase">Last 24 hours</span>
          </div>
          <div className="space-y-6">
            {/* CPU USAGE */}
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest">CPU usage</span>
                <span className="text-xs font-black text-blue-400">{Array.isArray(stats?.system?.cpu) ? (stats.system.cpu.slice(-1)[0] || 0) : (stats?.system?.cpu || 0)}%</span>
              </div>
              <div className="h-12 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={(Array.isArray(stats?.system?.cpu) ? stats.system.cpu : [stats?.system?.cpu || 0, 0, 0, 0, 0]).map((v, i) => ({ n: i, v }))}>
                    <defs>
                      <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCpu)" isAnimationActive={true} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* RAM USAGE */}
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest">RAM usage</span>
                <span className="text-xs font-black text-emerald-400">{Array.isArray(stats?.system?.ram) ? (stats.system.ram.slice(-1)[0] || 0) : (stats?.system?.ram || 0)}%</span>
              </div>
              <div className="h-12 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={(Array.isArray(stats?.system?.ram) ? stats.system.ram : [stats?.system?.ram || 0, 0, 0, 0, 0]).map((v, i) => ({ n: i, v }))}>
                    <defs>
                      <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="v" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRam)" isAnimationActive={true} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* CONNECTIONS */}
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Connections</span>
                <span className="text-xs font-black text-indigo-400">{Array.isArray(stats?.system?.connections) ? (stats.system.connections.slice(-1)[0] || 0) : (stats?.system?.connections || 0)} Active</span>
              </div>
              <div className="h-12 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={(Array.isArray(stats?.system?.connections) ? stats.system.connections : [stats?.system?.connections || 0, 0, 0, 0, 0]).map((v, i) => ({ n: i, v }))}>
                    <defs>
                      <linearGradient id="colorConn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="v" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorConn)" isAnimationActive={true} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-[#151D2F] border border-[#26314A] rounded-xl p-6">
          <h3 className="text-base font-medium text-white mb-5">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3 h-[180px]">
            <button onClick={() => setShowGenerateModal(true)} className="flex flex-col items-center justify-center gap-2 bg-[#1A233A] border border-[#2A344D] hover:bg-[#2A344D] hover:border-blue-500/50 rounded-xl transition-all active:scale-95 group shadow-lg shadow-black/10">
              <Zap size={22} className="text-slate-300 group-hover:text-yellow-400 group-hover:drop-shadow-[0_0_8px_rgba(250,204,21,0.5)] transition-all" />
              <span className="text-xs text-slate-300 font-bold">Generate</span>
            </button>
            <button onClick={() => { setPrintSelection(vouchers.slice(0, 10).map(v => v.code)); setShowPrintModal(true); }} className="flex flex-col items-center justify-center gap-2 bg-[#1A233A] border border-[#2A344D] hover:bg-[#2A344D] hover:border-blue-500/50 rounded-xl transition-all active:scale-95 group shadow-lg shadow-black/10">
              <Printer size={22} className="text-slate-300 group-hover:text-blue-400 transition-all" />
              <span className="text-xs text-slate-300 font-bold">Print Batch</span>
            </button>
            <button onClick={handleExport} className="flex flex-col items-center justify-center gap-2 bg-[#1A233A] border border-[#2A344D] hover:bg-[#2A344D] hover:border-blue-500/50 rounded-xl transition-all active:scale-95 group shadow-lg shadow-black/10">
              <Download size={22} className="text-slate-300 group-hover:text-emerald-400 transition-all" />
              <span className="text-xs text-slate-300 font-bold">Export Report</span>
            </button>
            <button onClick={handleSync} disabled={isSyncing} className={`flex flex-col items-center justify-center gap-2 bg-[#1A233A] border border-[#2A344D] hover:bg-[#2A344D] hover:border-blue-500/50 rounded-xl transition-all active:scale-95 group shadow-lg shadow-black/10 ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <RefreshCw size={22} className={`text-slate-300 group-hover:text-indigo-400 transition-all ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="text-xs text-slate-300 font-bold">{isSyncing ? 'Syncing...' : 'Sync Router'}</span>
            </button>
          </div>
          <div className="mt-4 text-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Last Sync: {lastSync}</p>
          </div>
        </div>
      </div>

      {/* BOTTOM MOST: Live Connection Map */}
      <div className="bg-[#151D2F] border border-[#26314A] rounded-xl p-6 mb-10 overflow-hidden relative">
        <h3 className="text-base font-medium text-white mb-6">Live Connection Map</h3>
        <div className="h-[200px] w-full flex items-center justify-center relative">
          {/* Center Router Node */}
          <div className="z-10 w-16 h-16 rounded-full bg-[#1A253D] border border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.4)] flex items-center justify-center animate-pulse-dot">
            <Server size={24} className="text-blue-400" />
          </div>
          {/* Simulated Nodes & Links */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <linearGradient id="linkDark" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
              </linearGradient>
              <linearGradient id="linkRight" x1="1" y1="0" x2="0" y2="0">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            <circle cx="75%" cy="15%" r="5" fill="#10b981" className="animate-pulse" style={{ animationDelay: '0.3s' }} />

            <path d="M 50% 50% Q 70% 40% 85% 35%" fill="none" stroke="url(#linkRight)" strokeWidth="1.5" />
            <circle cx="85%" cy="35%" r="4" fill="#0ea5e9" className="animate-pulse" style={{ animationDelay: '0.6s' }} />

            <path d="M 50% 50% Q 65% 50% 80% 50%" fill="none" stroke="url(#linkRight)" strokeWidth="1.5" />
            <circle cx="80%" cy="50%" r="6" fill="#3b82f6" className="animate-pulse" style={{ animationDelay: '0.8s' }} />

            <path d="M 50% 50% Q 60% 70% 70% 80%" fill="none" stroke="url(#linkRight)" strokeWidth="1.5" />
            <circle cx="70%" cy="80%" r="4" fill="#10b981" className="animate-pulse" style={{ animationDelay: '0.4s' }} />

            <path d="M 50% 50% Q 65% 85% 75% 95%" fill="none" stroke="url(#linkRight)" strokeWidth="1.5" />
            <circle cx="75%" cy="95%" r="3" fill="#0ea5e9" className="animate-pulse" style={{ animationDelay: '0.9s' }} />
          </svg>
        </div>
      </div>
    </>
  );
};

export default OverviewTab;
