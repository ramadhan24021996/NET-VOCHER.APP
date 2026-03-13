import React from 'react';
import { Wifi, AlertTriangle, RefreshCw, Shield, EyeOff, Eye, Lock } from 'lucide-react';

const LoginPage = ({ 
  handleLogin, 
  loginForm, 
  setLoginForm, 
  loginError, 
  isLoggingIn, 
  showPassword, 
  setShowPassword 
}) => {
  return (
    <div className="h-screen bg-[#070D1A] flex overflow-hidden relative">

      {/* ── Ambient glow layers ── */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-1/3 -left-1/4 w-[70%] h-[70%] bg-blue-600/10 rounded-full blur-[160px]" style={{ animation: 'pulse 9s ease-in-out infinite' }} />
        <div className="absolute -bottom-1/4 -right-1/4 w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[140px]" style={{ animation: 'pulse 7s ease-in-out infinite', animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] bg-cyan-500/5 rounded-full blur-[100px]" style={{ animation: 'pulse 12s ease-in-out infinite', animationDelay: '5s' }} />
      </div>

      {/* ── Dot grid ── */}
      <div className="pointer-events-none absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(148,163,184,0.06) 1px, transparent 0)',
        backgroundSize: '36px 36px'
      }} />

      {/* ══════════ LEFT PANEL ══════════ */}
      <div className="hidden lg:flex w-[52%] flex-col justify-between px-12 py-10 relative z-10">

        {/* Logo top-left */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
            <Wifi size={20} className="text-white" />
          </div>
          <div>
            <p className="text-white font-black text-base tracking-tight leading-none">NetVocher</p>
            <p className="text-[8px] text-blue-400/50 font-bold uppercase tracking-[0.3em]">Dashboard v3.0</p>
          </div>
        </div>

        {/* Center hero */}
        <div className="max-w-[480px]">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[9px] font-bold text-blue-300 uppercase tracking-[0.2em]">System Online & Secured</span>
          </div>

          <h2 className="text-[2.6rem] xl:text-5xl font-black text-white leading-[1.1] tracking-tight mb-5">
            Satu Dashboard<br />
            untuk Semua{' '}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">Kebutuhan</span>
              <span className="absolute -bottom-1 left-0 w-full h-px bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400 opacity-50" />
            </span>{' '}
            WiFi Anda.
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-sm">
            Kelola voucher, pantau perangkat, dan kendalikan bandwidth langsung dari MikroTik — semuanya real-time.
          </p>

          {/* Stats row */}
          <div className="flex items-center gap-5 mb-10">
            {[
              { value: '10K+', label: 'Voucher Dibuat' },
              { value: '99.9%', label: 'Uptime' },
              { value: '<1s', label: 'Sync Speed' },
            ].map((s, i) => (
              <div key={i} className="flex flex-col">
                <span className="text-white font-black text-xl leading-none">{s.value}</span>
                <span className="text-slate-500 text-[10px] mt-0.5">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Feature list */}
          <div className="space-y-2.5">
            {[
              'Sinkronisasi API MikroTik Super Cepat',
              'Integrasi Otomatis Runchise POS',
              'Sistem Laporan Keuangan Real-time',
              'Manajemen Node Infrastruktur Jaringan'
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]"></div>
                </div>
                <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">
          &copy; 2024 NETVOCHER ECOSYSTEM. ALL RIGHTS RESERVED.
        </div>
      </div>

      {/* ══════════ RIGHT PANEL (LOGIN CARD) ══════════ */}
      <div className="w-full lg:w-[48%] flex items-center justify-center p-6 lg:p-12 relative z-10">
        <div className="w-full max-w-[420px] relative">
          
          {/* Card background with glassmorphism */}
          <div className="absolute inset-0 bg-white/[0.02] border border-white/[0.05] rounded-[2.5rem] backdrop-blur-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)]" />
          
          <div className="relative p-10 lg:p-12">
            
            {/* Header */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-blue-500/30" />
                <Lock size={14} className="text-blue-500" />
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-blue-500/30" />
              </div>
              <h1 className="text-2xl font-black text-white text-center tracking-tight mb-2">Selamat Datang</h1>
              <p className="text-[10px] text-slate-500 text-center font-bold uppercase tracking-[0.2em]">Sistem Verifikasi Terminal Admin</p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              
              <div className="space-y-5">
                {/* Username Input */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Username</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-400">
                      <Shield size={18} />
                    </div>
                    <input
                      type="text"
                      required
                      value={loginForm.username}
                      onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                      className="w-full bg-[#080F1E] border border-[#1A2640] focus:border-blue-500 rounded-xl py-3.5 pl-11 pr-5 text-sm text-white outline-none transition-all placeholder:text-slate-700"
                      placeholder="Input username..."
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-400">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      className="w-full bg-[#080F1E] border border-[#1A2640] focus:border-blue-500 rounded-xl py-3.5 pl-11 pr-12 text-sm text-white outline-none transition-all placeholder:text-slate-700"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Options row */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group/rem">
                  <input type="checkbox" className="w-3.5 h-3.5 rounded bg-[#080F1E] border border-[#1A2640] accent-blue-500 cursor-pointer" />
                  <span className="text-[11px] text-slate-500 group-hover/rem:text-slate-400 transition-colors">Ingat saya</span>
                </label>
                <button type="button" className="text-[11px] text-blue-400/60 hover:text-blue-400 transition-colors font-medium">
                  Lupa password?
                </button>
              </div>

              {/* Error */}
              {loginError && (
                <div className="flex items-center gap-3 p-3 bg-red-500/[0.08] border border-red-500/20 rounded-xl">
                  <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-xs font-medium">{loginError}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoggingIn}
                className="relative w-full py-3.5 rounded-xl font-black text-sm text-white overflow-hidden group/btn disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300 group-hover/btn:from-blue-500 group-hover/btn:to-indigo-500" />
                <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 blur-lg" />
                <span className="relative flex items-center justify-center gap-2.5">
                  {isLoggingIn ? (
                    <><RefreshCw size={16} className="animate-spin" />Memverifikasi...</>
                  ) : (
                    <><Shield size={16} />Masuk ke Dashboard</>
                  )}
                </span>
              </button>
            </form>

            {/* Footer */}
            <div className="mt-5 pt-4 border-t border-white/[0.05] flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <Shield size={11} className="text-emerald-400" />
              </div>
              <p className="text-[10px] text-slate-600 leading-snug">
                Dilindungi enkripsi SSL/TLS. Sesi otomatis berakhir setelah tidak aktif.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
