import React from 'react';
import { Wifi } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, navItems, testResults }) => {
  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#070D1A]/80 backdrop-blur-3xl border-r border-[#26314A]/60 fixed h-full z-[60] overflow-y-auto">
      {/* Sidebar Top: Logo */}
      <div className="p-6 border-b border-white/[0.05]">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setActiveTab('Overview')}>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/20 ring-1 ring-white/10 group-hover:scale-105 transition-transform duration-300">
            <Wifi size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 font-black tracking-tight text-base leading-none drop-shadow-sm">NetVocher</h1>
            <p className="text-[8px] text-blue-400 font-bold uppercase tracking-[0.3em] mt-0.5 tracking-widest">Control Center</p>
          </div>
        </div>
      </div>

      {/* Sidebar Nav Items */}
      <nav className="flex-1 p-4 space-y-2 mt-4">
        <div className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4 px-4 px-4 overflow-hidden text-ellipsis whitespace-nowrap">Main Navigation</div>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`relative w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[11px] font-black transition-all group overflow-hidden ${activeTab === item.id
              ? 'text-white shadow-2xl shadow-blue-500/10'
              : 'text-slate-500 hover:text-white hover:bg-white/[0.03]'
              }`}
          >
            {activeTab === item.id && (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-indigo-600/90 backdrop-blur-md ring-1 ring-white/10 z-0"></div>
            )}
            <span className="relative z-10 flex items-center gap-3">
              <item.icon size={18} className={activeTab === item.id ? 'text-white' : 'text-slate-500 group-hover:text-blue-400 group-hover:scale-110 transition-all duration-300'} />
              <span className="uppercase tracking-[0.2em]">{item.label}</span>
            </span>
            {activeTab === item.id && (
              <div className="absolute right-0 w-1.5 h-6 bg-white rounded-l-full z-10 opacity-50 blur-[0.5px]"></div>
            )}
          </button>
        ))}
      </nav>

      {/* Sidebar Footer Link */}
      <div className="p-4 border-t border-white/[0.05]">
        <div className="px-4 py-3 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Status Nodes</p>
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${testResults.mikrotik === 'success' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-red-500'} animate-pulse`}></div>
            <span className="text-[9px] font-black text-white">{testResults.mikrotik === 'success' ? 'ROUTER ONLINE' : 'ROUTER OFFLINE'}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
