import React from 'react';
import { 
  Shield, RefreshCw, Unlock, Lock, Eye, EyeOff, Users, Ticket, Zap, 
  Wifi, Activity, CheckCircle, AlertTriangle, XCircle, Plus 
} from 'lucide-react';
import axios from 'axios';

const SettingsTab = ({
  isSettingsUnlocked,
  handleSettingsLogin,
  settingsLoginForm,
  setSettingsLoginForm,
  showPassword,
  setShowPassword,
  settingsLoginError,
  isLoggingIn,
  handleSettingsLogout,
  adminAuth,
  setAdminAuth,
  mtConfig,
  setMtConfig,
  handleTestMikroTik,
  isTestingMikroTik,
  handleSaveMikroTik,
  setIsLoading,
  setIsProvisioning,
  wifiSettings,
  setWifiSettings,
  handleUpdateWifi,
  isUpdatingWifi,
  rcConfig,
  setRcConfig,
  handleTestRunchise,
  isTestingRunchise,
  handleSaveRunchise,
  updateMapping,
  removeMapping,
  addMapping,
  manualSyncData,
  setManualSyncData,
  handleManualSync,
  isSyncingOrder
}) => {
  if (!isSettingsUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-[#151D2F] border border-[#26314A] rounded-3xl shadow-xl max-w-lg mx-auto mt-20">
        <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mb-6">
          <Shield size={40} className="text-blue-500" />
        </div>
        <h2 className="text-2xl font-black text-white text-center mb-2">Akses Terkunci</h2>
        <p className="text-sm text-slate-500 text-center mb-8 font-medium">
          Halaman Pengaturan memerlukan verifikasi ulang untuk memastikan keamanan sistem. Silakan masukkan password administrator Anda.
        </p>

        <form onSubmit={handleSettingsLogin} className="w-full space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock size={18} className="text-slate-500" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={settingsLoginForm.password}
              onChange={(e) => setSettingsLoginForm({ password: e.target.value })}
              placeholder="Masukkan Password Admin"
              className="w-full bg-[#0B1320] border border-[#26314A] focus:border-blue-500 rounded-xl py-4 pl-12 pr-12 text-sm text-white outline-none transition-all shadow-inner"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {settingsLoginError && (
            <p className="text-red-400 text-xs font-bold text-center mt-2">{settingsLoginError}</p>
          )}

          <button
            type="submit"
            disabled={isLoggingIn || !settingsLoginForm.password}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white text-sm font-black rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98] flex items-center justify-center gap-3 mt-4"
          >
            {isLoggingIn ? <RefreshCw className="animate-spin" size={18} /> : <Unlock size={18} />}
            {isLoggingIn ? 'Memverifikasi...' : 'Buka Pengaturan'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-[#151D2F] border border-[#26314A] rounded-2xl p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">Sesi Pengaturan Aktif</span>
        </div>
        <button
          onClick={handleSettingsLogout}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2"
        >
          <Lock size={12} /> Kunci Kembali
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* CARD: DASHBOARD ADMIN LOGIN CONFIGURATION */}
        <div className="bg-[#151D2F] border border-[#26314A] rounded-2xl p-8 shadow-xl lg:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
                <Users size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Pengaturan Akses Login Dashboard</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Ubah Username dan Password Admin</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Username Administrator</label>
              <input
                type="text"
                placeholder="Contoh: kasir"
                value={adminAuth.username}
                onChange={(e) => setAdminAuth({ ...adminAuth, username: e.target.value })}
                className="w-full bg-[#0B1320] border border-[#26314A] rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Password Administrator</label>
              <input
                type="text"
                placeholder="Ubah Password"
                value={adminAuth.password}
                onChange={(e) => setAdminAuth({ ...adminAuth, password: e.target.value })}
                className="w-full bg-[#0B1320] border border-[#26314A] rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={async () => {
                try {
                  await axios.post(`http://${window.location.hostname}:3001/api/save-config`, {
                    type: 'adminAuth',
                    config: adminAuth
                  });
                  alert('✅ Berhasil menyimpan pengaturan login admin!');
                } catch (e) {
                  alert('❌ Gagal menyimpan pengaturan login.');
                }
              }}
              className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              <Users size={16} /> Update Login Admin
            </button>
          </div>
        </div>

        {/* CARD 1: HOTSPOT API LOGIN */}
        <div className="bg-[#151D2F] border border-[#26314A] rounded-2xl p-8 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                <Ticket size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Hotspot API Access</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Akun API User Group (Terbatas)</p>
              </div>
            </div>
            <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
              <span className="text-[9px] font-black text-blue-400 uppercase tracking-tighter">API Mode</span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Router Address (IP)</label>
                <input
                  type="text"
                  placeholder="192.168.88.1"
                  value={mtConfig.ip}
                  onChange={(e) => setMtConfig({ ...mtConfig, ip: e.target.value })}
                  className="w-full bg-[#0B1320] border border-[#26314A] rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">DNS Name (Hotspot URL)</label>
                <input
                  type="text"
                  placeholder="wifi.login"
                  value={mtConfig.dnsName}
                  onChange={(e) => setMtConfig({ ...mtConfig, dnsName: e.target.value })}
                  className="w-full bg-[#0B1320] border border-[#26314A] rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">User API (Restricted)</label>
                <input
                  type="text"
                  placeholder="e.g. api_vocher"
                  value={mtConfig.user}
                  onChange={(e) => setMtConfig({ ...mtConfig, user: e.target.value })}
                  className="w-full bg-[#0B1320] border border-[#26314A] rounded-xl px-4 py-3 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Password API</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={mtConfig.pass}
                  onChange={(e) => setMtConfig({ ...mtConfig, pass: e.target.value })}
                  className="w-full bg-[#0B1320] border border-[#26314A] rounded-xl px-4 py-3 text-sm text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Login Path (Magic Link Extension)</label>
              <input
                type="text"
                value={mtConfig.loginPath || '/login'}
                onChange={(e) => setMtConfig({ ...mtConfig, loginPath: e.target.value })}
                className="w-full bg-[#0B1320] border border-[#26314A] rounded-xl px-4 py-3 text-sm text-white"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={handleTestMikroTik}
                disabled={isTestingMikroTik}
                className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {isTestingMikroTik ? <RefreshCw className="animate-spin" size={16} /> : <Zap size={16} />}
                <span>{isTestingMikroTik ? 'Checking...' : 'Uji Koneksi API'}</span>
              </button>
              <button
                onClick={handleSaveMikroTik}
                className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all"
              >
                Simpan & Aktifkan
              </button>
            </div>
          </div>
        </div>

        {/* CARD 2: ROUTER MASTER MANAGER */}
        <div className="bg-[#0B1320] border-2 border-amber-500/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Shield size={120} />
          </div>

          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
              <Shield size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">WinBox Admin Login</h2>
              <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest mt-0.5">Master Manager (Full Admin Access)</p>
            </div>
          </div>

          <div className="space-y-6 relative z-10">
            <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4">
              <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                Masukkan akun <strong>Admin WinBox</strong> MikroTik Anda di sini untuk melakukan konfigurasi otomatis atau sinkronisasi profile.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">WinBox Username</label>
                <input
                  type="text"
                  placeholder="e.g. admin"
                  id="admin_user_temp"
                  className="w-full bg-[#151D2F] border border-amber-500/10 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">WinBox Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  id="admin_pass_temp"
                  className="w-full bg-[#151D2F] border border-amber-500/10 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500 outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={async () => {
                  const user = document.getElementById('admin_user_temp').value;
                  const pass = document.getElementById('admin_pass_temp').value;
                  if (!user || !pass) return alert('Masukkan Akun Admin Full MikroTik Anda!');

                  if (window.confirm('Sistem akan mencoba membuat akun API terbatas secara otomatis. Lanjutkan?')) {
                    setIsLoading(true);
                    try {
                      const res = await axios.post(`http://${window.location.hostname}:3001/api/setup-secure-user`, {
                        adminUser: user,
                        adminPass: pass,
                        user: 'api_vocher',
                        pass: 'vocher1234'
                      });
                      if (res.data.success) alert('✅ BERHASIL: User terbatas "api_vocher" telah dibuat.');
                    } catch (e) { alert('❌ GAGAL: Koneksi ditolak.'); } finally { setIsLoading(false); }
                  }
                }}
                className="w-full py-4 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-3"
              >
                <Plus size={16} />
                AUTO-CREATE USER TERBATAS
              </button>

              <button
                onClick={async () => {
                  const user = document.getElementById('admin_user_temp').value;
                  const pass = document.getElementById('admin_pass_temp').value;
                  if (!user || !pass) return alert('Masukkan Akun Admin Full MikroTik Anda!');
                  setIsProvisioning(true);
                  try {
                    await axios.post(`http://${window.location.hostname}:3001/api/setup-router-admin`, { adminUser: user, adminPass: pass });
                    alert('✅ Sinkronisasi Profile Hotspot Berhasil!');
                  } catch (e) { alert('❌ Gagal Sinkron.'); } finally { setIsProvisioning(false); }
                }}
                className="w-full py-4 border-2 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-black text-xs uppercase tracking-[0.2em] rounded-xl transition-all flex items-center justify-center gap-3"
              >
                <Zap size={16} />
                SINKRONKAN ROUTER & PROFILE
              </button>
            </div>
          </div>
        </div>

        {/* WIFI SETTINGS CONFIGURATION */}
        <div className="bg-[#151D2F] border border-[#26314A] rounded-2xl p-8 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                <Wifi size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">WiFi Identity Configuration</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">SSID & Signal Authentication</p>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">SSID Name (WiFi Name)</label>
              <input
                type="text"
                placeholder="e.g. NetVocher_Free"
                value={wifiSettings.ssid}
                onChange={(e) => setWifiSettings({ ...wifiSettings, ssid: e.target.value })}
                className="w-full bg-[#0B1320] border border-[#26314A] rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Global Password (Optional)</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Kosongkan jika Hotspot Terbuka"
                  value={wifiSettings.password}
                  onChange={(e) => setWifiSettings({ ...wifiSettings, password: e.target.value })}
                  className="w-full bg-[#0B1320] border border-[#26314A] rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all text-white pl-4 pr-12"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
            </div>
            <div className="p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
              <p className="text-[10px] text-indigo-400 font-bold uppercase mb-1">💡 INFO:</p>
              <p className="text-[10px] text-slate-500 leading-normal">
                Mengubah SSID akan menyebabkan router melakukan reset singkat pada modul wireless. Pastikan tidak ada transaksi aktif yang bergantung pada Wi-Fi utama.
              </p>
            </div>
            <button
              onClick={handleUpdateWifi}
              disabled={isUpdatingWifi}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isUpdatingWifi ? <RefreshCw className="animate-spin" size={18} /> : <Zap size={18} />}
              UPDATE IDENTITY
            </button>
          </div>
        </div>

        {/* RUNCHISE POS INTEGRATION */}
        <div className="bg-[#151D2F] border border-[#26314A] rounded-2xl p-8 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg transition-colors ${rcConfig.apiKey ? 'bg-pink-500/20 text-pink-400' : 'bg-pink-500/10 text-pink-400'}`}>
                <Zap size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Runchise POS Integration</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Webhook & API Key System</p>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">API Key</label>
              <input
                type="text"
                placeholder="sk_live_..."
                value={rcConfig.apiKey}
                onChange={(e) => setRcConfig({ ...rcConfig, apiKey: e.target.value })}
                className="w-full bg-[#0B1320] border border-[#26314A] rounded-xl px-4 py-3 text-sm focus:border-pink-500 outline-none transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Default Pack</label>
                <input
                  type="text"
                  placeholder="e.g. 1 Hour"
                  value={rcConfig.defaultPack}
                  onChange={(e) => setRcConfig({ ...rcConfig, defaultPack: e.target.value })}
                  className="w-full bg-[#0B1320] border border-[#26314A] rounded-xl px-4 py-3 text-sm focus:border-pink-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Default Profile</label>
                <input
                  type="text"
                  placeholder="e.g. NV-1H"
                  value={rcConfig.defaultProfile}
                  onChange={(e) => setRcConfig({ ...rcConfig, defaultProfile: e.target.value })}
                  className="w-full bg-[#0B1320] border border-[#26314A] rounded-xl px-4 py-3 text-sm focus:border-pink-500 outline-none transition-all"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Max Shared Devices</label>
                <input
                  type="number"
                  placeholder="e.g. 1"
                  value={rcConfig.defaultSharedUsers || ''}
                  onChange={(e) => setRcConfig({ ...rcConfig, defaultSharedUsers: e.target.value })}
                  className="w-full bg-[#0B1320] border border-[#26314A] rounded-xl px-4 py-3 text-sm focus:border-pink-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Min Order Bonus</label>
                <input
                  type="number"
                  placeholder="e.g. 50000"
                  value={rcConfig.minOrder || ''}
                  onChange={(e) => setRcConfig({ ...rcConfig, minOrder: e.target.value })}
                  className="w-full bg-[#0B1320] border border-[#26314A] rounded-xl px-4 py-3 text-sm focus:border-pink-500 outline-none transition-all"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleTestRunchise}
                disabled={isTestingRunchise}
                className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {isTestingRunchise ? <RefreshCw size={18} className="animate-spin" /> : <Activity size={18} />}
                Test API
              </button>
              <button
                onClick={handleSaveRunchise}
                className="flex-[2] py-4 bg-[#E11D48] hover:bg-[#F43F5E] text-white font-bold rounded-xl transition-all"
              >
                Apply Settings
              </button>
            </div>
          </div>
        </div>

        {/* VOUCHER MAPPING RULES */}
        <div className="bg-[#151D2F] border border-[#26314A] rounded-2xl p-8 shadow-xl lg:col-span-2">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <Ticket size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Pengaturan Otomatis (Mapping)</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Atur paket berdasarkan nama item di Runchise</p>
            </div>
          </div>

          <div className="space-y-4">
            {rcConfig.mapping?.map((map, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-3 items-end bg-[#0B1320] p-4 rounded-xl border border-[#26314A]">
                <div className="col-span-2">
                  <label className="text-[9px] font-bold text-slate-500 uppercase mb-1 block">Kata Kunci Item</label>
                  <input
                    type="text"
                    value={map.keyword}
                    onChange={(e) => updateMapping(idx, 'keyword', e.target.value)}
                    className="w-full bg-[#151D2F] border border-[#26314A] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[9px] font-bold text-slate-500 uppercase mb-1 block">Nama Paket (UI)</label>
                  <input
                    type="text"
                    value={map.pack}
                    onChange={(e) => updateMapping(idx, 'pack', e.target.value)}
                    className="w-full bg-[#151D2F] border border-[#26314A] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[9px] font-bold text-slate-500 uppercase mb-1 block">MikroTik Profile</label>
                  <input
                    type="text"
                    value={map.profile}
                    onChange={(e) => updateMapping(idx, 'profile', e.target.value)}
                    className="w-full bg-[#151D2F] border border-[#26314A] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[9px] font-bold text-slate-500 uppercase mb-1 block">Limit Kec.</label>
                  <input
                    type="text"
                    value={map.rateLimit}
                    onChange={(e) => updateMapping(idx, 'rateLimit', e.target.value)}
                    className="w-full bg-[#151D2F] border border-[#26314A] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div className="col-span-3">
                  <label className="text-[9px] font-bold text-slate-500 uppercase mb-1 block">Volume Limit</label>
                  <select
                    value={map.volumeLimit || '0'}
                    onChange={(e) => updateMapping(idx, 'volumeLimit', e.target.value)}
                    className="w-full bg-[#151D2F] border border-[#26314A] rounded-lg px-2 py-2 text-xs text-white"
                  >
                    <option value="0">Unlimited</option>
                    <option value="1073741824">1 GB</option>
                    <option value="2147483648">2 GB</option>
                    <option value="5368709120">5 GB</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <button onClick={() => removeMapping(idx)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg">
                    <XCircle size={18} />
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={addMapping}
              className="w-full py-3 border border-dashed border-[#26314A] rounded-xl text-xs font-bold text-slate-500 hover:text-blue-400 transition-all"
            >
              + Tambah Aturan Mapping Baru
            </button>

            <button
              onClick={handleSaveRunchise}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95 mt-4"
            >
              Simpan Seluruh Sinkronisasi
            </button>
          </div>
        </div>

        {/* EMERGENCY ORDER SYNC */}
        <div className="bg-[#151D2F] border border-[#26314A] rounded-2xl p-8 shadow-xl lg:col-span-2">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
              <RefreshCw size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Validasi Order Manual (Darurat)</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Webhook Error Recovery</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Order ID Runchise</label>
              <input
                type="text"
                placeholder="Ex: ORD-123456"
                value={manualSyncData.orderId}
                onChange={(e) => setManualSyncData({ ...manualSyncData, orderId: e.target.value })}
                className="w-full bg-[#0B1320] border border-[#26314A] rounded-xl px-4 py-3 text-sm text-white"
              />
            </div>
            <button
              onClick={handleManualSync}
              disabled={isSyncingOrder}
              className="md:col-span-2 w-full py-4 bg-amber-500 hover:bg-amber-600 text-[#0B1320] font-black rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {isSyncingOrder ? <RefreshCw className="animate-spin" size={20} /> : <CheckCircle size={20} />}
              GENERATE MANUALLY FROM POS ID
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;
