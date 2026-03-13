import React from 'react';
import { 
  Wifi, Activity, RefreshCw, Plus, Settings, MoreHorizontal, 
  XCircle, Server, ArrowUpRight, WifiOff 
} from 'lucide-react';

const AccessPointTab = ({
  handleDiscovery,
  showInfraModal,
  setShowInfraModal,
  editingAP,
  setEditingAP,
  mtInterfaces,
  addManualAP,
  infraConfig,
  activeMenuId,
  setActiveMenuId,
  handleEditManualAP,
  removeManualAP,
  infraStatus,
  discoveredDevices
}) => {
  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-500 pb-20">
      <div className="bg-[#151D2F] border border-[#26314A] rounded-[2.5rem] p-8 lg:p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5">
          <Wifi size={160} />
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl">
                <Activity size={24} />
              </div>
              <h2 className="text-3xl font-black text-white tracking-tight">Koneksi AP / Router</h2>
            </div>
            <p className="text-slate-500 text-sm font-medium max-w-xl leading-relaxed">
              Monitoring dan kelola infrastruktur jaringan Anda. Dashboard akan memantau status setiap perangkat secara real-time.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleDiscovery}
              className="px-8 py-4 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-emerald-600/20 transition-all flex items-center gap-3 active:scale-95 group shadow-lg shadow-emerald-500/5"
            >
              <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-700" />
              Discover Unit
            </button>
            <button
              onClick={() => setShowInfraModal(!showInfraModal)}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-blue-600/30 active:scale-95 flex items-center gap-3"
            >
              <Plus size={20} />
              Tambah Manual
            </button>
          </div>
        </div>
      </div>

      {showInfraModal && (
        <div className="bg-[#151D2F] border border-blue-500/30 rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg"><Settings size={20} /></div>
            <h3 className="text-lg font-bold text-white">Konfigurasi Unit Baru</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Nama / Nama Area</label>
              <input
                type="text"
                placeholder="Ex: AP Lobby, AP Lantai 2"
                value={editingAP.name}
                onChange={(e) => setEditingAP({ ...editingAP, name: e.target.value })}
                className="w-full bg-[#0B1320] border border-[#26314A] rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">IP Address Router</label>
              <input
                type="text"
                placeholder="Ex: 192.168.88.10"
                value={editingAP.ip}
                onChange={(e) => setEditingAP({ ...editingAP, ip: e.target.value })}
                className="w-full bg-[#0B1320] border border-[#26314A] rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Port Ether (MikroTik)</label>
              <select
                value={editingAP.port}
                onChange={(e) => setEditingAP({ ...editingAP, port: e.target.value })}
                className="w-full bg-[#0B1320] border border-[#26314A] rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none appearance-none"
              >
                <option value="">Pilih Port (Otomatis)</option>
                {mtInterfaces.map(iface => (
                  <option key={iface['.id']} value={iface.name}>{iface.name} ({iface.type})</option>
                ))}
                {mtInterfaces.length === 0 && (
                  <>
                    {[...Array(24)].map((_, i) => (
                      <option key={i} value={`ether${i + 1}`}>Ether {i + 1}</option>
                    ))}
                    <option value="wlan1">WLAN 1 (Internal)</option>
                  </>
                )}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={addManualAP}
                disabled={!editingAP.name || !editingAP.ip}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black rounded-xl transition-all"
              >
                Simpan Perangkat
              </button>
            </div>
          </div>
        </div>
      )}

      {infraConfig.accessPoints?.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Infrastruktur Terdaftar</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {infraConfig.accessPoints.map((ap) => (
              <div key={ap.id} className="bg-gradient-to-br from-[#1A253A] to-[#151D2F] border border-blue-500/20 rounded-3xl p-6 relative overflow-hidden group">
                <div className="absolute top-4 right-4 z-20">
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === ap.id ? null : ap.id) }}
                    className="p-2 text-slate-500 hover:text-white bg-[#0B1320]/50 rounded-lg backdrop-blur-sm transition-all"
                  >
                    <MoreHorizontal size={18} />
                  </button>
                  {activeMenuId === ap.id && (
                    <div className="absolute top-full right-0 mt-2 w-32 bg-[#1A233A] border border-[#26314A] rounded-xl shadow-2xl overflow-hidden py-1 z-30">
                      <button onClick={() => handleEditManualAP(ap)} className="w-full px-4 py-2 text-left text-xs text-white hover:bg-blue-600 transition-colors flex items-center gap-2">
                        <Settings size={12} /> Edit
                      </button>
                      <button onClick={() => removeManualAP(ap.id)} className="w-full px-4 py-2 text-left text-xs text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2">
                        <XCircle size={12} /> Hapus
                      </button>
                    </div>
                  )}
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
                  <Server size={24} />
                </div>
                <h4 className="text-white font-bold text-lg mb-1">{ap.name}</h4>
                <div className="flex items-center gap-1.5 mb-3">
                  {infraStatus.find(s => s.id === ap.id)?.online ? (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-tight">Terhubung</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      <span className="text-[10px] font-black text-red-400 uppercase tracking-tight">Terputus</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-500">IP ADDRESS</span>
                    <span className="text-blue-400 font-bold">{ap.ip}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-500">MIKROTIK PORT</span>
                    <span className="text-emerald-400 font-black uppercase">{ap.port || 'N/A'}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/5 flex gap-2">
                  <span className="px-2 py-1 bg-blue-600/10 text-blue-400 rounded text-[9px] font-bold uppercase">Manual Config</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Deteksi Infrastruktur LAN (Auto-Discovery)</h3>
            <p className="text-[10px] text-slate-600 mt-1 font-bold">Menampilkan perangkat yang terdeteksi pada Port Ethernet MikroTik.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Scanning Network...</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {discoveredDevices.length > 0 ? discoveredDevices.map((device, idx) => (
            <div key={idx} className="bg-[#151D2F] border border-[#26314A] rounded-3xl p-6 hover:border-blue-500/30 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Server size={80} />
              </div>
              <div className="flex items-center gap-4 mb-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <Wifi size={24} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <h3 className="text-white font-bold text-lg truncate">{device.name || 'Unknown Node'}</h3>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase rounded-md">Online</span>
                    <span className="text-[10px] text-slate-500 font-bold tracking-tight">{device.platform || 'General'}</span>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === device.activeId ? null : device.activeId) }}
                    className="p-2 text-slate-500 hover:text-white"
                  >
                    <MoreHorizontal size={18} />
                  </button>
                  {activeMenuId === device.activeId && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-[#1A233A] border border-[#26314A] rounded-xl shadow-2xl overflow-hidden py-1 z-30">
                      <button
                        onClick={() => {
                          setEditingAP({ name: device.name, ip: device.ip, port: device.port });
                          setShowInfraModal(true);
                          setActiveMenuId(null);
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-blue-400 hover:bg-blue-600 hover:text-white transition-colors flex items-center gap-2"
                      >
                        <Plus size={12} /> Daftarkan Unit
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 relative z-10">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">IP Link</span>
                  <span className="text-white font-mono font-bold bg-[#0B1320] px-2 py-1 rounded">{device.ip}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Physical Port</span>
                  <span className="text-emerald-400 font-black uppercase flex items-center gap-1.5">
                    <ArrowUpRight size={10} />
                    {device.port} (Ethernet)
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Identity MAC</span>
                  <span className="text-slate-400 font-mono text-[10px]">{device.mac}</span>
                </div>
                {device.version && (
                  <div className="mt-4 pt-4 border-t border-[#26314A]">
                    <p className="text-[10px] text-slate-500 uppercase font-black mb-1">Versi Perangkat</p>
                    <p className="text-xs text-slate-300 italic">{device.version}</p>
                  </div>
                )}
              </div>
            </div>
          )) : (
            <div className="col-span-full py-20 bg-[#151D2F] border border-[#26314A] border-dashed rounded-3xl text-center">
              <div className="inline-flex w-16 h-16 rounded-full bg-slate-800 items-center justify-center mb-4">
                <WifiOff size={32} className="text-slate-500" />
              </div>
              <h3 className="text-white font-bold text-lg">Tidak Ada Perangkat LAN Terdeteksi</h3>
              <p className="text-slate-500 text-sm">Sistem discovery sedang aktif. Pastikan Access Point dengan MNDP aktif terhubung ke Ethernet port.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccessPointTab;
