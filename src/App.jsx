import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart
} from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';
import {
  Bell, Calendar, MoreHorizontal, Activity, Printer, Download, RefreshCw, Zap,
  Wifi, Shield, Server, ArrowUpRight, LayoutDashboard, Ticket, FileText, Settings,
  LogOut, Users, HelpCircle, Search, ChevronRight, AlertTriangle, WifiOff,
  CheckCircle, XCircle, Plus, Lock, Eye, EyeOff
} from 'lucide-react';

// --- CountUp Component for Animated Numbers ---
function CountUp({ end, prefix = '', suffix = '', decimals = 0, duration = 2000 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const current = progress * end;
      setCount(current);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  const formatted = decimals > 0
    ? count.toFixed(decimals)
    : Math.floor(count).toLocaleString();

  return <span>{prefix}{formatted}{suffix}</span>;
}

// ... existing code ...

export default function DashboardConcept3() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [stats, setStats] = useState(null);
  const [vouchers, setVouchers] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [notifList, setNotifList] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [lastSync, setLastSync] = useState(new Date().toLocaleTimeString());
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const [isTestingMikroTik, setIsTestingMikroTik] = useState(false);
  const [isTestingRunchise, setIsTestingRunchise] = useState(false);
  const [testResults, setTestResults] = useState({ mikrotik: null, runchise: null });
  const [mtConfig, setMtConfig] = useState({ ip: '', user: 'admin', pass: '' });
  const [rcConfig, setRcConfig] = useState({ apiKey: '', defaultPack: '1 Hour', defaultProfile: 'NV-1H', defaultSharedUsers: '1', mapping: [] });
  const [manualSyncData, setManualSyncData] = useState({ orderId: '', amount: '', customer: '', packKeyword: 'hour' });
  const [isSyncingOrder, setIsSyncingOrder] = useState(false);
  const [isGeneratingVoucher, setIsGeneratingVoucher] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printSelection, setPrintSelection] = useState([]);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [dhcpLeases, setDhcpLeases] = useState([]);
  const [mtInterfaces, setMtInterfaces] = useState([]);
  const [infraConfig, setInfraConfig] = useState({ accessPoints: [] });
  const [showInfraModal, setShowInfraModal] = useState(false);
  const [editingAP, setEditingAP] = useState({ name: '', ip: '', port: '', type: '' });
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [genPack, setGenPack] = useState('1 Hour');
  const [genShared, setGenShared] = useState('1');
  const [genRateLimit, setGenRateLimit] = useState('2M/2M');
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('nv_session') === 'active');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardSettings, setRewardSettings] = useState({
    buy10Get1: true,
    happyHour: false,
    prioritySpeed: false,
    broadcastPromo: false
  });
  const [customerSearch, setCustomerSearch] = useState('');

  const fetchConfig = async () => {
    try {
      const res = await axios.get(`http://${window.location.hostname}:3001/api/get-config`);
      if (res.data) {
        if (res.data.mikrotik) setMtConfig(res.data.mikrotik);
        if (res.data.runchise) setRcConfig(res.data.runchise);
        if (res.data.infrastructure) setInfraConfig(res.data.infrastructure);
      }
    } catch (err) {
      console.warn('Could not fetch initial config');
    }
  };

  const fetchAllData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const endpoints = [
        { key: 'vouchers', url: `/api/vouchers?filterDate=${filterDate}` },
        { key: 'stats', url: `/api/dashboard-stats?filterDate=${filterDate}` },
        { key: 'notifications', url: `/api/notifications` },
      ];

      if (activeTab === 'Log User Aktif' || activeTab === 'Customers') endpoints.push({ key: 'activeUsers', url: `/api/active-users` });
      if (activeTab === 'Access Point') {
        endpoints.push({ key: 'leases', url: `/api/dhcp-leases` });
        endpoints.push({ key: 'interfaces', url: `/api/mikrotik-interfaces` });
      }

      const results = await Promise.all(
        endpoints.map(e =>
          axios.get(`http://${window.location.hostname}:3001${e.url}`)
            .then(res => ({ key: e.key, data: res.data }))
            .catch(err => ({ key: e.key, data: null, error: true }))
        )
      );

      results.forEach(res => {
        if (res.key === 'vouchers' && Array.isArray(res.data)) setVouchers(res.data);
        if (res.key === 'stats' && res.data) setStats(res.data);
        if (res.key === 'notifications' && Array.isArray(res.data)) setNotifList(res.data);
        if (res.key === 'activeUsers' && Array.isArray(res.data)) setActiveUsers(res.data);
        if (res.key === 'leases' && Array.isArray(res.data)) setDhcpLeases(res.data.map(l => ({ ...l, activeId: `auto-${l.address}` })));
        if (res.key === 'interfaces' && Array.isArray(res.data)) setMtInterfaces(res.data);
      });

      setIsOffline(false);
    } catch (err) {
      console.warn('Network issue');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchAllData();

    const pollId = setInterval(() => fetchAllData(true), 12000);
    return () => clearInterval(pollId);
  }, [filterDate, activeTab]);

  const navItems = [
    { id: 'Overview', icon: LayoutDashboard, label: 'Overview' },
    { id: 'Vouchers', icon: Ticket, label: 'Vouchers' },
    { id: 'Customers', icon: Users, label: 'Users' },
    { id: 'Reports', icon: FileText, label: 'Reports' },
    { id: 'Access Point', icon: Wifi, label: 'Koneksi AP/Router' },
    { id: 'Settings', icon: Settings, label: 'Settings' },
    { id: 'Active Logs', icon: Activity, label: 'Log User Aktif' },
    { id: 'Support', icon: HelpCircle, label: 'Support' },
  ];

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await axios.post(`http://${window.location.hostname}:3001/api/sync`);
      setLastSync(new Date().toLocaleTimeString());
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExport = () => {
    alert('Generating report export... The download will start shortly.');
    // In real app: window.location.href = `http://${window.location.hostname}:3001/api/export`;
  };

  const handleSaveMikroTik = async () => {
    try {
      await axios.post(`http://${window.location.hostname}:3001/api/save-config`, { type: 'mikrotik', config: mtConfig });
      alert('MikroTik configuration saved successfully!');
    } catch (e) {
      alert('Failed to save MikroTik config.');
    }
  };

  const handleSaveRunchise = async () => {
    try {
      await axios.post(`http://${window.location.hostname}:3001/api/save-config`, { type: 'runchise', config: rcConfig });
      alert('Runchise API configuration saved!');
    } catch (e) {
      alert('Failed to save Runchise config.');
    }
  };

  const handleSetupRouter = async () => {
    if (!window.confirm('This will send a setup script to your MikroTik. Continue?')) return;
    setIsProvisioning(true);
    try {
      // Ensure config is saved first
      await axios.post(`http://${window.location.hostname}:3001/api/save-config`, { type: 'mikrotik', config: mtConfig });
      const res = await axios.post(`http://${window.location.hostname}:3001/api/setup-router`);
      alert(res.data.message);
    } catch (e) {
      alert('Provisioning failed. Check logs.');
    } finally {
      setIsProvisioning(false);
    }
  };

  const handleTestMikroTik = async () => {
    setIsTestingMikroTik(true);
    setTestResults(prev => ({ ...prev, mikrotik: 'testing' }));
    try {
      // First save current inputs before testing
      await axios.post(`http://${window.location.hostname}:3001/api/save-config`, { type: 'mikrotik', config: mtConfig });
      const res = await axios.post(`http://${window.location.hostname}:3001/api/test-mikrotik`);
      if (res.data.success) {
        setTestResults(prev => ({ ...prev, mikrotik: 'success' }));
        alert('✅ TERHUBUNG! Dashboard berhasil berkomunikasi dengan MikroTik di ' + mtConfig.ip);
      } else {
        setTestResults(prev => ({ ...prev, mikrotik: 'failed' }));
        alert('❌ GAGAL TERHUBUNG: ' + res.data.message + '\n\nPastikan:\n1. IP MikroTik Benar\n2. User/Pass Benar\n3. Fitur API di MikroTik aktif (IP > Service > API)');
      }
    } catch (e) {
      setTestResults(prev => ({ ...prev, mikrotik: 'failed' }));
      alert('⚠️ ERROR SISTEM: Antara Dashboard dan Server Backend terputus.');
    } finally {
      setIsTestingMikroTik(false);
    }
  };

  const handleTestRunchise = async () => {
    setIsTestingRunchise(true);
    setTestResults(prev => ({ ...prev, runchise: 'testing' }));
    try {
      // First save current inputs before testing
      await axios.post(`http://${window.location.hostname}:3001/api/save-config`, { type: 'runchise', config: rcConfig });
      const res = await axios.post(`http://${window.location.hostname}:3001/api/test-runchise`);
      if (res.data.success) {
        setTestResults(prev => ({ ...prev, runchise: 'success' }));
        alert('✅ API VALID! Runchise POS Berhasil Terintegrasi.');
      } else {
        setTestResults(prev => ({ ...prev, runchise: 'failed' }));
        alert('❌ API INVALID: ' + res.data.message + '\n\nSilakan periksa kembali API Key toko Anda di Dashboard Runchise.');
      }
    } catch (e) {
      setTestResults(prev => ({ ...prev, runchise: 'failed' }));
      alert('⚠️ ERROR API: Periksa koneksi internet server.');
    } finally {
      setIsTestingRunchise(false);
    }
  };

  const handleGenerateManual = async () => {
    if (isGeneratingVoucher) return;
    setIsGeneratingVoucher(true);
    try {
      const res = await axios.post(`http://${window.location.hostname}:3001/api/create-voucher`, {
        pack: genPack,
        sharedUsers: genShared,
        rateLimit: genRateLimit
      });
      if (res.data.success) {
        setShowGenerateModal(false);
        // Refresh vouchers
        const vRes = await axios.get(`http://${window.location.hostname}:3001/api/vouchers`);
        setVouchers(vRes.data);
        alert(`✅ VOUCHER BERHASIL DIBUAT!\nKode: ${res.data.voucher.code}\nLimit: ${genRateLimit}`);
      }
    } catch (e) {
      alert('Gagal membuat voucher. Pastikan Router MikroTik terhubung.');
    } finally {
      setIsGeneratingVoucher(false);
    }
  };

  const handleManualSync = async () => {
    if (!manualSyncData.orderId) return alert('Input Order ID!');
    setIsSyncingOrder(true);
    try {
      const res = await axios.post(`http://${window.location.hostname}:3001/api/manual-sync-order`, manualSyncData);
      if (res.data.success) {
        alert(res.data.message);
        window.location.reload(); // Refresh to see new voucher
      }
    } catch (err) {
      alert('Manual Sync Failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSyncingOrder(false);
    }
  };

  const updateMapping = (index, field, value) => {
    const newMapping = [...rcConfig.mapping];
    newMapping[index][field] = value;
    setRcConfig({ ...rcConfig, mapping: newMapping });
  };

  const addMapping = () => {
    setRcConfig({ ...rcConfig, mapping: [...rcConfig.mapping, { keyword: '', pack: '', profile: '', rateLimit: '' }] });
  };

  const removeMapping = (index) => {
    setRcConfig({ ...rcConfig, mapping: rcConfig.mapping.filter((_, i) => i !== index) });
  };

  const handleDateFilter = () => {
    setShowDatePicker(!showDatePicker);
  };

  const handleDateChange = (e) => {
    setFilterDate(e.target.value);
    // In a real app, we would fetch data for this date.
    // For this prototype, we'll alert the user.
    console.log(`Filtering for date: ${e.target.value}`);
  };

  const handleTogglePrintSelection = (code) => {
    setPrintSelection(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handlePrintSelected = () => {
    if (printSelection.length === 0) {
      alert('Pilih setidaknya satu voucher untuk diprint.');
      return;
    }
    window.print();
  };

  const handleSaveInfra = async (newConfig) => {
    try {
      const res = await axios.post(`http://${window.location.hostname}:3001/api/save-config`, {
        type: 'infrastructure',
        config: newConfig || infraConfig
      });
      if (res.data.success) {
        alert('Data Infrastructure Tersimpan!');
        setShowInfraModal(false);
      }
    } catch (err) {
      alert('Gagal menyimpan infrastruktur.');
    }
  };

  const addManualAP = () => {
    const newAP = { ...editingAP, id: Date.now() };
    const updated = { accessPoints: [...infraConfig.accessPoints, newAP] };
    setInfraConfig(updated);
    handleSaveInfra(updated);
    setEditingAP({ name: '', ip: '', port: '', type: '' });
  };

  const removeManualAP = (id) => {
    const updated = { accessPoints: infraConfig.accessPoints.filter(ap => ap.id !== id) };
    setInfraConfig(updated);
    handleSaveInfra(updated);
  };

  const handleEditManualAP = (ap) => {
    setEditingAP({ name: ap.name, ip: ap.ip, port: ap.port, type: ap.type });
    setInfraConfig({ accessPoints: infraConfig.accessPoints.filter(item => item.id !== ap.id) });
    setShowInfraModal(true);
    setActiveMenuId(null);
  };

  const handleRegisterAutoAP = (lease) => {
    setEditingAP({ name: lease['host-name'] || '', ip: lease.address, port: '', type: 'Auto' });
    setShowInfraModal(true);
    setActiveMenuId(null);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    await new Promise(resolve => setTimeout(resolve, 1200));

    if (loginForm.username === 'admin' && loginForm.password === 'admin123') {
      localStorage.setItem('nv_session', 'active');
      localStorage.setItem('nv_user', loginForm.username);
      setIsLoggedIn(true);
    } else {
      setLoginError('Username atau password salah!');
    }
    setIsLoggingIn(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('nv_session');
    localStorage.removeItem('nv_user');
    setIsLoggedIn(false);
    setLoginForm({ username: '', password: '' });
    setShowProfile(false);
  };

  // --- LOGIN PAGE ---
  if (!isLoggedIn) {
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
              <span className="text-[9px] font-bold text-blue-300 uppercase tracking-[0.2em]">System Online &amp; Secured</span>
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
                { icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10', title: 'Auto-Generate Voucher', desc: 'Langsung buat dan kirim saat order masuk dari POS' },
                { icon: Activity, color: 'text-blue-400', bg: 'bg-blue-500/10', title: 'Live Monitoring', desc: 'Lihat siapa yang online, seberapa banyak bandwidth terpakai' },
                { icon: Server, color: 'text-indigo-400', bg: 'bg-indigo-500/10', title: 'MikroTik Direct API', desc: 'Sinkronisasi langsung tanpa perantara' },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.025] border border-white/[0.06] hover:bg-white/[0.04] transition-colors group">
                  <div className={`w-8 h-8 rounded-lg ${f.bg} flex items-center justify-center flex-shrink-0`}>
                    <f.icon size={15} className={f.color} />
                  </div>
                  <div>
                    <p className="text-white/90 font-semibold text-xs">{f.title}</p>
                    <p className="text-slate-500 text-[10px]">{f.desc}</p>
                  </div>
                  <ChevronRight size={14} className="text-slate-700 ml-auto group-hover:text-slate-400 transition-colors" />
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-[10px] text-slate-700">&copy; 2026 NetVocher — All rights reserved</p>
        </div>

        {/* ── Vertical divider ── */}
        <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-white/[0.07] to-transparent self-stretch my-12 relative z-10 shrink-0" />

        {/* ══════════ RIGHT PANEL ══════════ */}
        <div className="flex-1 flex items-center justify-center p-6 relative z-10">
          {/* Mobile logo */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 lg:hidden">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-600/30">
              <Wifi size={22} className="text-white" />
            </div>
            <p className="text-white font-black text-lg">NetVocher</p>
          </div>

          <div className="w-full max-w-[380px]">
            {/* Card */}
            <div className="relative">
              {/* Glow border */}
              <div className="absolute -inset-[1px] bg-gradient-to-b from-white/[0.12] via-white/[0.05] to-white/0 rounded-2xl pointer-events-none" />
              <div className="relative bg-[#0E1729]/90 backdrop-blur-3xl border border-[#1E2D48] rounded-2xl p-7 shadow-2xl shadow-black/60">

                {/* Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-500/70" />
                      <span className="w-2 h-2 rounded-full bg-amber-500/70" />
                      <span className="w-2 h-2 rounded-full bg-emerald-500/70 animate-pulse" />
                    </div>
                    <div className="h-px flex-1 bg-white/[0.06]" />
                    <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">Secure Portal</span>
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight leading-none mb-1.5">Masuk ke Dashboard</h2>
                  <p className="text-xs text-slate-500">Gunakan kredensial yang diberikan administrator sistem</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  {/* Username */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1.5">Username</label>
                    <div className="relative group">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-400 transition-colors duration-200">
                        <Users size={15} />
                      </div>
                      <input
                        type="text"
                        value={loginForm.username}
                        onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                        placeholder="Masukkan username..."
                        className="w-full bg-[#080F1E] border border-[#1A2640] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-700 focus:border-blue-500/70 focus:bg-[#0B1525] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.08),inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition-all duration-200"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1.5">Password</label>
                    <div className="relative group">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-400 transition-colors duration-200">
                        <Lock size={15} />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        placeholder="••••••••••••"
                        className="w-full bg-[#080F1E] border border-[#1A2640] rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-slate-700 focus:border-blue-500/70 focus:bg-[#0B1525] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.08),inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition-all duration-200"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
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
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#070D1A] text-slate-300 font-sans selection:bg-blue-500/30 relative overflow-hidden">

      {/* Ambient background layers */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-5%] w-[35%] h-[35%] bg-indigo-600/5 rounded-full blur-[100px]" />
      </div>

      {/* Dot Grid */}
      <div className="pointer-events-none absolute inset-0 z-0" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(148,163,184,0.04) 1px, transparent 0)',
        backgroundSize: '40px 40px'
      }} />

      {/* TOP NAVBAR */}
      <header className="sticky top-0 z-40">
        {/* Animated Gradient Accent */}
        <div className="h-[2px] bg-gradient-to-r from-blue-600 via-cyan-400 to-indigo-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]"></div>

        <div className="bg-[#0D1526]/80 backdrop-blur-3xl border-b border-white/[0.05]">
          {isOffline && (
            <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-1.5 flex items-center justify-center gap-2 animate-pulse">
              <AlertTriangle size={12} className="text-red-500" />
              <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">System Connection Lost</span>
            </div>
          )}

          <div className="max-w-[1500px] mx-auto flex items-center justify-between px-5 md:px-8 py-3">
            {/* Logo Section */}
            <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setActiveTab('Overview')}>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/20 ring-1 ring-white/10 group-hover:scale-105 transition-transform duration-300">
                <Wifi size={20} className="text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-white font-black tracking-tight text-base leading-none">NetVocher</h1>
                <p className="text-[8px] text-blue-400/70 font-bold uppercase tracking-[0.3em] mt-0.5">Control Center</p>
              </div>
            </div>

            {/* Desktop Navigation (Segmented Control style) */}
            <nav className="hidden md:flex items-center gap-1 bg-black/30 border border-white/[0.06] rounded-2xl p-1.5 backdrop-blur-md">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black transition-all duration-300 ${activeTab === item.id
                    ? 'text-white'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]'
                    }`}
                >
                  {activeTab === item.id && (
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/80 to-indigo-600/80 rounded-xl shadow-lg shadow-blue-600/20 z-0"></div>
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <item.icon size={14} className={activeTab === item.id ? 'text-white' : 'text-slate-600 group-hover:text-slate-400'} />
                    <span className="hidden lg:inline uppercase tracking-widest">{item.label}</span>
                  </span>
                </button>
              ))}
            </nav>

            {/* Right Side Tools */}
            <div className="flex items-center gap-4">
              {/* Status & Date (Grouped) */}
              <div className="hidden lg:flex items-center gap-3 pr-4 border-r border-white/[0.08]">
                {/* Connection Dots */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/20 border border-white/[0.05] rounded-xl">
                  <div className={`w-1.5 h-1.5 rounded-full ${testResults.mikrotik === 'success' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-red-500'} animate-pulse`}></div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Live</span>
                </div>

                {/* Date Picker */}
                <div className="relative group">
                  <div className="flex items-center gap-2 bg-black/20 border border-white/[0.05] hover:border-blue-500/30 px-3 py-1.5 rounded-xl transition-all">
                    <Calendar size={13} className="text-blue-400" />
                    <input
                      type="date"
                      value={filterDate}
                      onChange={handleDateChange}
                      className="bg-transparent border-none text-[10px] text-white outline-none cursor-pointer font-black uppercase tracking-widest w-[110px]"
                    />
                  </div>
                </div>
              </div>

              {/* Action Icons */}
              <div className="flex items-center gap-2">
                {/* Notification */}
                <div className="relative">
                  <button
                    onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false); }}
                    className={`p-2.5 rounded-xl border border-white/[0.06] transition-all active:scale-95 group relative ${showNotifs ? 'bg-blue-600/20 border-blue-500/30' : 'bg-black/20 hover:bg-white/5'}`}
                  >
                    <Bell size={16} className={showNotifs ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'} />
                    {notifList.length > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#151D2F]"></span>
                    )}
                  </button>

                  {/* Redesigned Notification Dropdown */}
                  {showNotifs && (
                    <div className="absolute right-0 mt-3 w-80 bg-[#121929]/95 backdrop-blur-3xl border border-white/[0.08] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="p-4 bg-white/[0.03] border-b border-white/[0.05] flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Activity Center</span>
                        <button onClick={() => setNotifList([])} className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Clear All</button>
                      </div>
                      <div className="max-h-[350px] overflow-y-auto divide-y divide-white/[0.04]">
                        {notifList?.length > 0 ? notifList.map(n => (
                          <div key={n.id} className="p-4 hover:bg-white/[0.02] transition-colors cursor-pointer group">
                            <p className="text-xs text-slate-300 group-hover:text-white mb-1 leading-relaxed">{n?.text || 'System Update'}</p>
                            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">{n?.time || 'Just now'}</p>
                          </div>
                        )) : (
                          <div className="py-12 flex flex-col items-center justify-center opacity-30">
                            <Bell size={24} className="mb-3 text-slate-600" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">No New Tasks</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile */}
                <div className="relative">
                  <button
                    onClick={() => { setShowProfile(!showProfile); setShowNotifs(false); }}
                    className={`flex items-center gap-2 p-1 rounded-2xl border border-white/[0.06] transition-all active:scale-95 group ${showProfile ? 'bg-blue-600/20 border-blue-500/30' : 'bg-black/20 hover:bg-white/5'}`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg ring-1 ring-white/10 group-hover:shadow-blue-500/20">
                      <span className="text-white text-[10px] font-black">AD</span>
                    </div>
                    <div className="hidden lg:block text-right pr-2">
                      <p className="text-[9px] font-black text-white uppercase tracking-widest leading-none">Admin</p>
                      <p className="text-[8px] font-bold text-slate-500 mt-0.5">Master</p>
                    </div>
                  </button>

                  {/* Redesigned Profile Menu */}
                  {showProfile && (
                    <div className="absolute right-0 mt-3 w-56 bg-[#121929]/95 backdrop-blur-3xl border border-white/[0.08] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="p-5 bg-white/[0.03] border-b border-white/[0.05]">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                            <Shield size={18} className="text-blue-400" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-white uppercase tracking-tight">System Admin</p>
                            <p className="text-[9px] font-bold text-slate-500">Full Access Manager</p>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <div className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                            <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Active</span>
                          </div>
                          <div className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                            <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">V3.0.4</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-2 space-y-1">
                        <button
                          onClick={() => { setActiveTab('Settings'); setShowProfile(false); }}
                          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl hover:bg-white/[0.04] text-slate-300 hover:text-white transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <Settings size={14} className="text-slate-500 group-hover:text-blue-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Preferences</span>
                          </div>
                          <ChevronRight size={12} className="text-slate-700" />
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl hover:bg-red-500/10 text-red-400/80 hover:text-red-400 transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <LogOut size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Exit Session</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Tab Scroller */}
          <div className="flex md:hidden items-center gap-1.5 px-4 pb-3 overflow-x-auto bg-[#0D1526]/80 backdrop-blur-xl border-b border-white/[0.05] scrollbar-hide">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black whitespace-nowrap transition-all uppercase tracking-widest ${activeTab === item.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-500 bg-white/[0.03]'
                  }`}
              >
                <item.icon size={12} />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden relative">
        <div className="p-5 lg:p-7 max-w-[1400px] w-full mx-auto">


          {/* WELCOME BANNER SECTION */}
          {activeTab === 'Overview' && (
            <div className="relative mb-10 overflow-hidden rounded-[2.5rem] bg-[#0D1526]/40 border border-white/[0.05] p-1 shadow-2xl">
              {/* Gradient Backdrop */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-indigo-600/10" />
              <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-500/[0.03] to-transparent" />

              <div className="relative z-10 p-8 lg:p-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                      <span className="text-[10px] font-black text-blue-300 uppercase tracking-[0.2em]">System Overview</span>
                    </div>
                    <ChevronRight size={10} className="text-slate-700" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>

                  <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight mb-3">
                    Halo, <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Administrator!</span>
                  </h1>
                  <p className="text-slate-400 text-sm lg:text-base max-w-xl leading-relaxed font-medium">
                    Monitor real-time network revenue, sales performance, and active user capacity across all nodes. Sistem Anda berjalan optimal hari ini.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="bg-black/20 backdrop-blur-xl border border-white/[0.05] rounded-3xl p-5 flex items-center gap-5 pr-8">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                      <Zap size={24} className="text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Router Status</p>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-black text-lg">ONLINE</span>
                        <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse" />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="group relative px-8 py-5 bg-blue-600 border border-blue-500 rounded-3xl text-xs font-black text-white uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/30 overflow-hidden active:scale-95 transition-all disabled:opacity-50"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    <span className="relative flex items-center justify-center gap-3">
                      {isSyncing ? <RefreshCw size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                      {isSyncing ? 'Syncing...' : 'Sync Now'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PAGE HEADER SECTION (for other tabs) */}
          {activeTab !== 'Overview' && (
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div>
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Dashboard</span>
                  </div>
                  <ChevronRight size={10} className="text-slate-700" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    {activeTab}
                  </span>
                </div>

                {/* Title & Description */}
                <h1 className="text-4xl font-black text-white tracking-tight mb-2">
                  {activeTab === 'Vouchers' && 'Voucher Management'}
                  {activeTab === 'Customers' && 'User Directory'}
                  {activeTab === 'Reports' && 'Sales Reports'}
                  {activeTab === 'Settings' && 'System Settings'}
                  {activeTab === 'Support' && 'Help & Support'}
                  {activeTab === 'Access Point' && 'Infrastruktur Jaringan'}
                  {activeTab === 'Active Logs' && 'Real-time Traffic'}
                </h1>
                <p className="text-sm text-slate-500 max-w-lg leading-relaxed font-medium">
                  {activeTab === 'Vouchers' && 'Generate, track, and manage all hotspot vouchers. View batch history and automated print logs.'}
                  {activeTab === 'Customers' && 'Analyze user behavior, track session duration, and manage registered permanent customers.'}
                  {activeTab === 'Reports' && 'Analisis mendalam mengenai pendapatan, tren penjualan, dan performa paket WiFi Anda secara komprehensif.'}
                  {activeTab === 'Settings' && 'Konfigurasi integrasi API MikroTik, Runchise POS, dan aturan sinkronisasi hotspot otomatis.'}
                  {activeTab === 'Support' && 'Pusat bantuan teknis, panduan penggunaan, dan informasi pembaruan sistem NetVocher.'}
                  {activeTab === 'Access Point' && 'Kelola dan pantau semua Access Point (AP) atau Router yang terhubung ke jaringan utama.'}
                  {activeTab === 'Active Logs' && 'Pantau setiap perangkat yang sedang aktif mengonsumsi data secara langsung.'}
                </p>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  <Printer size={14} />
                  <span>Export Report</span>
                </button>
                <button
                  onClick={() => fetchAllData()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 border border-blue-500 rounded-2xl text-[11px] font-black text-white uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 active:scale-95 group"
                >
                  <RefreshCw size={14} className={`${isLoading ? 'animate-spin' : ''}`} />
                  <span>{isLoading ? 'Loading...' : 'Refresh Page'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'Overview' ? (
            !stats && isLoading ? (
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
            ) : (
              <>
                {/* STATUS SUMMARY CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

                  {/* Card 1: Monthly Revenue */}
                  <div className="relative group overflow-hidden bg-[#0D1526]/40 backdrop-blur-3xl border border-white/[0.06] hover:border-blue-500/30 rounded-3xl p-6 transition-all duration-300">
                    <div className="absolute top-0 right-0 p-8 text-white/[0.03] pointer-events-none group-hover:text-blue-500/[0.05] transition-colors">
                      <FileText size={80} />
                    </div>

                    <div className="relative z-10 h-full flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Monthly Revenue</p>
                          <h2 className="text-3xl font-black text-white tracking-tight">
                            <CountUp end={stats?.revenue?.total || 0} prefix="Rp " />
                          </h2>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black rounded-lg">
                            +{stats?.revenue?.growth || 0}%
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 h-[60px] relative -mx-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={(stats?.revenue?.chartData || []).map((v, i) => ({ n: i, v }))}>
                            <defs>
                              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="v" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Daily Sales */}
                  <div className="relative group overflow-hidden bg-[#0D1526]/40 backdrop-blur-3xl border border-white/[0.06] hover:border-indigo-500/30 rounded-3xl p-6 transition-all duration-300">
                    <div className="absolute top-0 right-0 p-8 text-white/[0.03] pointer-events-none group-hover:text-indigo-500/[0.05] transition-colors">
                      <Ticket size={80} />
                    </div>

                    <div className="relative z-10 h-full flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Today Sales</p>
                          <h2 className="text-3xl font-black text-white tracking-tight">
                            <CountUp end={stats?.sales?.today || 0} />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Vouchers</span>
                          </h2>
                        </div>
                        <button className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
                          <MoreHorizontal size={14} className="text-slate-600" />
                        </button>
                      </div>

                      <div className="mt-4 h-[60px] relative -left-1">
                        <ResponsiveContainer width="105%" height="100%">
                          <BarChart data={(stats?.sales?.chartData || []).map((v, i) => ({ n: i, v }))}>
                            <Bar dataKey="v" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={8} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="flex justify-between items-center mt-2 px-1">
                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-tighter">Peak: {Math.max(...(stats?.sales?.chartData || [0]))}</span>
                        <div className="flex gap-1">
                          {[1, 2, 3].map(i => <div key={i} className="w-1 h-1 bg-white/10 rounded-full" />)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Active Users */}
                  <div className="relative group overflow-hidden bg-[#0D1526]/40 backdrop-blur-3xl border border-white/[0.06] hover:border-cyan-500/30 rounded-3xl p-6 transition-all duration-300">
                    <div className="absolute top-0 right-0 p-8 text-white/[0.03] pointer-events-none group-hover:text-cyan-500/[0.05] transition-colors">
                      <Users size={80} />
                    </div>

                    <div className="relative z-10 h-full flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Network Load</p>
                          <h2 className="text-3xl font-black text-white tracking-tight leading-none">
                            <CountUp end={stats?.users?.active || 0} />
                            <span className="text-xs text-slate-600 mx-1">/</span>
                            <span className="text-xs text-slate-600">{stats?.users?.capacity || 100}</span>
                          </h2>
                        </div>
                        <div className="flex flex-col items-center">
                          <svg viewBox="0 0 36 36" className="w-12 h-12 transform -rotate-90">
                            <path className="text-white/5" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                            <path
                              className="text-cyan-400"
                              strokeDasharray={`${((stats?.users?.active || 0) / (stats?.users?.capacity || 1)) * 100}, 100`}
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"
                            />
                          </svg>
                          <span className="absolute mt-[18px] text-[8px] font-black text-white">{Math.round(((stats?.users?.active || 0) / (stats?.users?.capacity || 1)) * 100)}%</span>
                        </div>
                      </div>

                      <div className="mt-8 space-y-2">
                        <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase tracking-widest">
                          <span>Utilization Profile</span>
                        </div>
                        <div className="w-full bg-black/30 h-1.5 rounded-full overflow-hidden border border-white/[0.05]">
                          <div
                            className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                            style={{ width: `${((stats?.users?.active || 0) / (stats?.users?.capacity || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 4: System Health */}
                  <div className="relative group overflow-hidden bg-[#0D1526]/40 backdrop-blur-3xl border border-white/[0.06] hover:border-emerald-500/30 rounded-3xl p-6 transition-all duration-300">
                    <div className="absolute top-0 right-0 p-8 text-white/[0.03] pointer-events-none group-hover:text-emerald-500/[0.05] transition-colors">
                      <Activity size={80} />
                    </div>

                    <div className="relative z-10 h-full flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">System Status</p>
                          <h2 className="text-3xl font-black text-white tracking-tight">
                            <CountUp end={stats?.system?.health || 100} suffix="%" />
                          </h2>
                        </div>
                        <div className="flex items-center gap-1.5 h-6">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Optimum</span>
                        </div>
                      </div>

                      <div className="mt-6 h-[40px] w-full relative flex items-center px-1">
                        <svg width="100%" height="30" viewBox="0 0 200 40" preserveAspectRatio="none">
                          <path d="M0,20 L30,20 L35,5 L45,35 L55,10 L65,25 L75,15 L80,20 L120,20 L125,5 L135,35 L145,10 L155,25 L165,15 L170,20 L200,20"
                            fill="none"
                            stroke={(stats?.system?.health || 100) > 90 ? "#34d399" : "#f59e0b"}
                            strokeWidth="2.5"
                            strokeLinejoin="round" />
                        </svg>
                      </div>

                      <div className="flex items-center gap-3 mt-4">
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between text-[8px] font-bold text-slate-600 uppercase tracking-widest">
                            <span>API Sync Latency: {stats?.system?.latency || '24ms'}</span>
                          </div>
                          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500/40 w-[30%] shadow-[0_0_5px_rgba(16,185,129,0.3)]" />
                          </div>
                        </div>
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
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={Array.from({ length: 24 }, (_, i) => ({ hour: i.toString().padStart(2, '0'), users: 0 }))}>
                          <PolarGrid stroke="#26314A" />
                          <PolarAngleAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 10 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 50]} tick={false} axisLine={false} />
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

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] uppercase font-bold text-slate-500 w-24">CPU usage</span>
                        <div className="flex-1 h-8">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={(stats?.system?.cpu || []).map((v, i) => ({ n: i, v }))}>
                              <YAxis domain={[0, 100]} hide={true} />
                              <Line type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] uppercase font-bold text-slate-500 w-24">RAM usage</span>
                        <div className="flex-1 h-8">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={(stats?.system?.ram || []).map((v, i) => ({ n: i, v }))}>
                              <YAxis domain={[0, 100]} hide={true} />
                              <Line type="monotone" dataKey="v" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] uppercase font-bold text-slate-500 w-24">Connections</span>
                        <div className="flex-1 h-8">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={(stats?.system?.connections || []).map((v, i) => ({ n: i, v }))}>
                              <YAxis domain={[0, 'dataMax + 10']} hide={true} />
                              <Line type="monotone" dataKey="v" stroke="#6366f1" strokeWidth={2} dot={false} isAnimationActive={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-[#151D2F] border border-[#26314A] rounded-xl p-6">
                    <h3 className="text-base font-medium text-white mb-5">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-3 h-[180px]">
                      <button
                        onClick={() => setShowGenerateModal(true)}
                        className="flex flex-col items-center justify-center gap-2 bg-[#1A233A] border border-[#2A344D] hover:bg-[#2A344D] hover:border-blue-500/50 rounded-xl transition-all active:scale-95 group shadow-lg shadow-black/10"
                      >
                        <Zap size={22} className="text-slate-300 group-hover:text-yellow-400 group-hover:drop-shadow-[0_0_8px_rgba(250,204,21,0.5)] transition-all" />
                        <span className="text-xs text-slate-300 font-bold">Generate</span>
                      </button>
                      <button
                        onClick={() => {
                          setPrintSelection(vouchers.slice(0, 10).map(v => v.code)); // pre-select up to 10
                          setShowPrintModal(true);
                        }}
                        className="flex flex-col items-center justify-center gap-2 bg-[#1A233A] border border-[#2A344D] hover:bg-[#2A344D] hover:border-blue-500/50 rounded-xl transition-all active:scale-95 group shadow-lg shadow-black/10"
                      >
                        <Printer size={22} className="text-slate-300 group-hover:text-blue-400 transition-all" />
                        <span className="text-xs text-slate-300 font-bold">Print Batch</span>
                      </button>
                      <button
                        onClick={handleExport}
                        className="flex flex-col items-center justify-center gap-2 bg-[#1A233A] border border-[#2A344D] hover:bg-[#2A344D] hover:border-blue-500/50 rounded-xl transition-all active:scale-95 group shadow-lg shadow-black/10"
                      >
                        <Download size={22} className="text-slate-300 group-hover:text-emerald-400 transition-all" />
                        <span className="text-xs text-slate-300 font-bold">Export Report</span>
                      </button>
                      <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className={`flex flex-col items-center justify-center gap-2 bg-[#1A233A] border border-[#2A344D] hover:bg-[#2A344D] hover:border-blue-500/50 rounded-xl transition-all active:scale-95 group shadow-lg shadow-black/10 ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
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
                      </defs>

                      {/* Left side connections */}
                      <path d="M 50% 50% Q 40% 30% 25% 30%" fill="none" stroke="url(#linkDark)" strokeWidth="1.5" />
                      <circle cx="25%" cy="30%" r="4" fill="#3b82f6" className="animate-pulse" />

                      <path d="M 50% 50% Q 35% 50% 20% 50%" fill="none" stroke="url(#linkDark)" strokeWidth="1.5" />
                      <circle cx="20%" cy="50%" r="6" fill="#0ea5e9" className="animate-pulse" style={{ animationDelay: '0.2s' }} />

                      <path d="M 50% 50% Q 40% 70% 30% 80%" fill="none" stroke="url(#linkDark)" strokeWidth="1.5" />
                      <circle cx="30%" cy="80%" r="5" fill="#10b981" className="animate-pulse" style={{ animationDelay: '0.5s' }} />

                      <path d="M 50% 50% Q 45% 20% 35% 15%" fill="none" stroke="url(#linkDark)" strokeWidth="1.5" />
                      <circle cx="35%" cy="15%" r="3" fill="#3b82f6" className="animate-pulse" style={{ animationDelay: '0.7s' }} />

                      <path d="M 50% 50% Q 35% 65% 25% 65%" fill="none" stroke="url(#linkDark)" strokeWidth="1.5" />
                      <circle cx="25%" cy="65%" r="4" fill="#0ea5e9" className="animate-pulse" style={{ animationDelay: '0.1s' }} />

                      {/* Right side connections */}
                      <defs>
                        <linearGradient id="linkRight" x1="1" y1="0" x2="0" y2="0">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.1" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
                        </linearGradient>
                      </defs>

                      <path d="M 50% 50% Q 60% 20% 75% 15%" fill="none" stroke="url(#linkRight)" strokeWidth="1.5" />
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
            )
          ) : activeTab === 'Vouchers' ? (
            <div className="bg-[#151D2F] border border-[#26314A] rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-[#26314A] flex justify-between items-center bg-[#1A233A]/50">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Active Vouchers</h2>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Daftar voucher wifi yang masih berlaku</p>
                </div>
                <button
                  onClick={() => setShowGenerateModal(true)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-2xl transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 active:scale-95"
                >
                  <Plus size={18} />
                  GENERATE NEW
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-black/20 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-[#26314A]">
                      <th className="px-10 py-6">ID Voucher</th>
                      <th className="px-10 py-6">Durasi / Paket</th>
                      <th className="px-10 py-6">Pendapatan</th>
                      <th className="px-10 py-6 text-center">Tgl Terbit</th>
                      <th className="px-10 py-6 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#26314A]/30">
                    {vouchers.filter(v => v.status === 'Active' || v.status === 'ACTIVE' || !v.status).length > 0 ? (
                      vouchers
                        .filter(v => v.status === 'Active' || v.status === 'ACTIVE' || !v.status)
                        .slice(0, 50)
                        .map((v, i) => (
                          <tr key={v.code || i} className="hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => setSelectedVoucher(v)}>
                            <td className="px-10 py-6">
                              <div className="flex items-center gap-4">
                                <div className="p-1.5 bg-white rounded-xl shadow-lg ring-1 ring-black/10">
                                  <QRCodeSVG value={v.magicLink || v.code || 'NULL'} size={32} />
                                </div>
                                <div>
                                  <p className="font-mono text-xs text-blue-400 font-black tracking-widest leading-none mb-1">{v.code}</p>
                                  <p className="text-[9px] text-slate-600 font-bold uppercase">ID: {v.details?.orderNo || 'MANUAL'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-10 py-6">
                              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {v.pack || 'STANDARD'}
                              </span>
                            </td>
                            <td className="px-10 py-6 text-xs text-white font-black">{v.price || 'Rp 0'}</td>
                            <td className="px-10 py-6 text-center text-[11px] text-slate-500 font-bold">{v.date && v.date.includes('T') ? new Date(v.date).toLocaleString('id-ID') : v.date}</td>
                            <td className="px-10 py-6 text-right">
                              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ring-1 ring-inset bg-emerald-500/10 text-emerald-400 ring-emerald-500/20`}>
                                {v.status || 'Active'}
                              </span>
                            </td>
                          </tr>
                        ))) : (
                      <tr>
                        <td colSpan="5" className="px-10 py-32 text-center opacity-30">
                          <Ticket size={48} className="mx-auto mb-4" />
                          <p className="text-xs font-black uppercase tracking-widest">Belum Ada Voucher Aktif</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* VOUCHER DETAIL MODAL / PREVIEW - COMPACTED */}
              {selectedVoucher && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedVoucher(null)}>
                  <div className="bg-[#151D2F] border border-[#26314A] rounded-[2.5rem] w-full max-w-[320px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                    {/* Header: More compact blue section */}
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-center relative">
                      <button
                        onClick={() => setSelectedVoucher(null)}
                        className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors p-1"
                      >
                        <MoreHorizontal size={20} />
                      </button>

                      <div className="inline-block bg-white p-3 rounded-2xl shadow-xl mb-3">
                        <QRCodeSVG value={selectedVoucher.magicLink || selectedVoucher.code} size={110} />
                      </div>
                      <h3 className="text-white font-black text-xl tracking-tighter leading-none mb-1">{selectedVoucher.code}</h3>
                      <p className="text-blue-100/60 text-[10px] font-bold uppercase tracking-[0.2em]">{selectedVoucher.pack}</p>
                    </div>

                    {/* Body: Reduced padding and component sizes */}
                    <div className="p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-[#0B1320] rounded-xl border border-[#26314A]">
                          <p className="text-[9px] text-slate-500 font-bold uppercase mb-0.5">Status</p>
                          <p className={`font-bold text-[12px] ${selectedVoucher.status === 'Active' ? 'text-emerald-400' : 'text-blue-400'}`}>{selectedVoucher.status || 'Active'}</p>
                        </div>
                        <div className="p-3 bg-[#0B1320] rounded-xl border border-[#26314A]">
                          <p className="text-[9px] text-slate-500 font-bold uppercase mb-0.5">Price</p>
                          <p className="text-white font-bold text-[12px]">{selectedVoucher.price}</p>
                        </div>
                      </div>

                      {selectedVoucher.details ? (
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-slate-500 font-bold uppercase tracking-widest">Order #</span>
                            <span className="text-slate-300 font-mono">{selectedVoucher.details.orderNo}</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-slate-500 font-bold uppercase tracking-widest">Customer</span>
                            <span className="text-slate-300">{selectedVoucher.details.customer}</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-slate-500 font-bold uppercase tracking-widest">Payment</span>
                            <span className="text-slate-300">{selectedVoucher.details.payment}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/10">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Shield size={12} className="text-blue-400" />
                            <p className="text-[9px] text-blue-400 font-bold uppercase tracking-wider">Seamless Auto-Login</p>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-tight">
                            Scan and login automatically. MAC binding secured.
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                          onClick={() => window.print()}
                        >
                          <Printer size={16} />
                          Print
                        </button>
                        <button className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-xl transition-all active:scale-95">
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* GENERATE NEW VOUCHER MODAL */}
              {showGenerateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setShowGenerateModal(false)}>
                  <div className="bg-[#151D2F] border border-[#26314A] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
                    <div className="p-8 border-b border-[#26314A] bg-[#1A233A]/50 flex justify-between items-center">
                      <div>
                        <h3 className="text-2xl font-black text-white tracking-tight">Generate Voucher</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Manual Hotspot Creation</p>
                      </div>
                      <button onClick={() => setShowGenerateModal(false)} className="text-slate-500 hover:text-white transition-colors">
                        <XCircle size={24} />
                      </button>
                    </div>

                    <div className="p-8 space-y-8">
                      {/* Package Selection */}
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Pilih Paket Durasi</label>
                        <div className="grid grid-cols-3 gap-3">
                          {['1 Hour', '1 Day', '1 Week'].map((p) => (
                            <button
                              key={p}
                              onClick={() => setGenPack(p)}
                              className={`py-4 rounded-2xl border-2 transition-all font-bold text-sm ${genPack === p
                                ? 'bg-blue-600/10 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                                : 'bg-[#0B1320] border-[#26314A] text-slate-500 hover:border-slate-700'
                                }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Shared Users */}
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Shared Users (Limit Device)</label>
                          <span className="bg-blue-500/10 text-blue-400 text-xs font-black px-2 py-1 rounded-md">{genShared} Devices</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          step="1"
                          value={genShared}
                          onChange={(e) => setGenShared(e.target.value)}
                          className="w-full h-2 bg-[#0B1320] rounded-lg appearance-none cursor-pointer accent-blue-500 border border-[#26314A]"
                        />
                        <div className="flex justify-between text-[10px] text-slate-600 font-bold mt-2 px-1">
                          <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span><span>10</span>
                        </div>
                      </div>

                      {/* Rate Limit Selection */}
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Limit Kecepatan (Upload/Download)</label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { label: 'Hemat (1 Mbps)', val: '1M/1M' },
                            { label: 'Standar (3 Mbps)', val: '3M/3M' },
                            { label: 'Turbo (5 Mbps)', val: '5M/5M' },
                            { label: 'Extreme (10 Mbps)', val: '10M/10M' }
                          ].map((r) => (
                            <button
                              key={r.val}
                              onClick={() => setGenRateLimit(r.val)}
                              className={`py-3 px-2 rounded-xl border-2 transition-all font-bold text-[11px] ${genRateLimit === r.val
                                ? 'bg-emerald-600/10 border-emerald-500 text-emerald-400'
                                : 'bg-[#0B1320] border-[#26314A] text-slate-500 hover:border-slate-700'
                                }`}
                            >
                              {r.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4">
                        <button
                          onClick={handleGenerateManual}
                          disabled={isGeneratingVoucher}
                          className="w-full mt-6 py-4 bg-blue-600 rounded-2xl font-black text-[10px] text-white uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          {isGeneratingVoucher ? (
                            <RefreshCw size={16} className="animate-spin" />
                          ) : (
                            <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
                          )}
                          {isGeneratingVoucher ? 'MEMPROSES...' : 'GENERATE SEKARANG'}
                        </button>
                        <p className="text-[10px] text-center text-slate-500 mt-4 leading-relaxed px-4">
                          Voucher akan otomatis didaftarkan ke MikroTik dan muncul di tabel riwayat secara real-time.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}


              <div className="p-4 text-center bg-[#1A233A]/20">
                <button className="text-xs text-slate-500 hover:text-white transition-colors font-medium">View all vouchers →</button>
              </div>
            </div>
          ) : activeTab === 'Settings' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-[#151D2F] border border-[#26314A] rounded-2xl p-8 shadow-xl">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg transition-colors ${testResults.mikrotik === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                      <Server size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">MikroTik Router Config</h2>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Hardware & Network Interface</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-tighter transition-all duration-500 ${testResults.mikrotik === 'success' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-[#0B1320] text-slate-500 border border-[#26314A]'}`}>
                    <div className={`w-2 h-2 rounded-full ${testResults.mikrotik === 'success' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}></div>
                    {testResults.mikrotik === 'success' ? 'Live & Connected' : 'Offline / Pending'}
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Router Address</label>
                    <input
                      type="text"
                      value={mtConfig.ip}
                      onChange={(e) => setMtConfig({ ...mtConfig, ip: e.target.value })}
                      className="w-full bg-[#0B1320] border border-[#26314A] rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Username</label>
                      <input
                        type="text"
                        value={mtConfig.user}
                        onChange={(e) => setMtConfig({ ...mtConfig, user: e.target.value })}
                        className="w-full bg-[#0B1320] border border-[#26314A] rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={mtConfig.pass}
                        onChange={(e) => setMtConfig({ ...mtConfig, pass: e.target.value })}
                        className="w-full bg-[#0B1320] border border-[#26314A] rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleTestMikroTik}
                      disabled={isTestingMikroTik}
                      className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      {isTestingMikroTik ? <RefreshCw size={18} className="animate-spin" /> : <Activity size={18} />}
                      Test Network
                    </button>
                    <button
                      onClick={handleSaveMikroTik}
                      className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]"
                    >
                      Save Config
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-[#151D2F] border border-[#26314A] rounded-2xl p-8 shadow-xl">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg transition-colors ${testResults.runchise === 'success' ? 'bg-pink-500/20 text-pink-400' : 'bg-pink-500/10 text-pink-400'}`}>
                      <Zap size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Runchise POS Integration</h2>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Webhook & API Key System</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-tighter transition-all duration-500 ${testResults.runchise === 'success' ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' : 'bg-[#0B1320] text-slate-500 border border-[#26314A]'}`}>
                    <div className={`w-2 h-2 rounded-full ${testResults.runchise === 'success' ? 'bg-pink-400 animate-pulse' : 'bg-slate-600'}`}></div>
                    {testResults.runchise === 'success' ? 'API Valid & Authorized' : 'Waiting for Auth'}
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
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Default Pack (Beli Makanan/Tiket)</label>
                      <input
                        type="text"
                        placeholder="e.g. 1 Hour"
                        value={rcConfig.defaultPack}
                        onChange={(e) => setRcConfig({ ...rcConfig, defaultPack: e.target.value })}
                        className="w-full bg-[#0B1320] border border-[#26314A] rounded-xl px-4 py-3 text-sm focus:border-pink-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Default Profile (MikroTik)</label>
                      <input
                        type="text"
                        placeholder="e.g. NV-1H"
                        value={rcConfig.defaultProfile}
                        onChange={(e) => setRcConfig({ ...rcConfig, defaultProfile: e.target.value })}
                        className="w-full bg-[#0B1320] border border-[#26314A] rounded-xl px-4 py-3 text-sm focus:border-pink-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Max Shared Devices (Per Voucher)</label>
                    <input
                      type="number"
                      placeholder="e.g. 1"
                      min="1"
                      max="10"
                      value={rcConfig.defaultSharedUsers}
                      onChange={(e) => setRcConfig({ ...rcConfig, defaultSharedUsers: e.target.value })}
                      className="w-full bg-[#0B1320] border border-[#26314A] rounded-xl px-4 py-3 text-sm focus:border-pink-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Webhook URL</label>
                    <input type="text" value="https://api.netvocher.com/v1/webhook" readOnly className="w-full bg-[#0B1320]/50 border border-[#26314A] rounded-xl px-4 py-3 text-sm text-slate-500 cursor-not-allowed" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleTestRunchise}
                      disabled={isTestingRunchise}
                      className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      {isTestingRunchise ? <RefreshCw size={18} className="animate-spin" /> : <Activity size={18} />}
                      Test API
                    </button>
                    <button
                      onClick={handleSaveRunchise}
                      className="flex-[2] py-4 bg-[#E11D48] hover:bg-[#F43F5E] text-white font-bold rounded-xl transition-all shadow-lg shadow-pink-500/20 active:scale-[0.98]"
                    >
                      Apply Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* VOUCHER MAPPING RULES */}
              <div className="bg-[#151D2F] border border-[#26314A] rounded-2xl p-8 shadow-xl">
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
                      <div className="col-span-3">
                        <label className="text-[9px] font-bold text-slate-500 uppercase mb-1 block">Kata Kunci Item</label>
                        <input
                          type="text"
                          placeholder="e.g. jam, hour"
                          value={map.keyword}
                          onChange={(e) => updateMapping(idx, 'keyword', e.target.value)}
                          className="w-full bg-[#151D2F] border border-[#26314A] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="text-[9px] font-bold text-slate-500 uppercase mb-1 block">Nama Paket (UI)</label>
                        <input
                          type="text"
                          placeholder="e.g. 1 Hour"
                          value={map.pack}
                          onChange={(e) => updateMapping(idx, 'pack', e.target.value)}
                          className="w-full bg-[#151D2F] border border-[#26314A] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="text-[9px] font-bold text-slate-500 uppercase mb-1 block">MikroTik Profile</label>
                        <input
                          type="text"
                          placeholder="e.g. NV-1H"
                          value={map.profile}
                          onChange={(e) => updateMapping(idx, 'profile', e.target.value)}
                          className="w-full bg-[#151D2F] border border-[#26314A] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[9px] font-bold text-slate-500 uppercase mb-1 block">Limit Kec.</label>
                        <input
                          type="text"
                          placeholder="2M/2M"
                          value={map.rateLimit}
                          onChange={(e) => updateMapping(idx, 'rateLimit', e.target.value)}
                          className="w-full bg-[#151D2F] border border-[#26314A] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="col-span-1">
                        <button onClick={() => removeMapping(idx)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                          <XCircle size={18} />
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={addMapping}
                    className="w-full py-3 border border-dashed border-[#26314A] hover:border-blue-500/50 rounded-xl text-xs font-bold text-slate-500 hover:text-blue-400 transition-all flex items-center justify-center gap-2"
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
              <div className="bg-[#151D2F] border border-[#26314A] rounded-2xl p-8 shadow-xl">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                    <RefreshCw size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Validasi Order Manual (Darurat)</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Gunakan jika webhook otomatis gagal/error</p>
                  </div>
                </div>

                <div className="space-y-4 bg-amber-500/5 border border-amber-500/10 p-6 rounded-2xl relative overflow-hidden">
                  <div className="relative z-10 space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-amber-400/70 uppercase mb-1.5 block">Order ID Runchise</label>
                      <input
                        type="text"
                        placeholder="Masukkan Order ID (e.g. ORD-123...)"
                        value={manualSyncData.orderId}
                        onChange={(e) => setManualSyncData({ ...manualSyncData, orderId: e.target.value })}
                        className="w-full bg-[#0B1320] border border-amber-500/20 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500 outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-amber-400/70 uppercase mb-1.5 block">Customer Name</label>
                        <input
                          type="text"
                          placeholder="Guest"
                          value={manualSyncData.customer}
                          onChange={(e) => setManualSyncData({ ...manualSyncData, customer: e.target.value })}
                          className="w-full bg-[#0B1320] border border-amber-500/20 rounded-xl px-4 py-3 text-sm text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-amber-400/70 uppercase mb-1.5 block">Keyword Item</label>
                        <select
                          value={manualSyncData.packKeyword}
                          onChange={(e) => setManualSyncData({ ...manualSyncData, packKeyword: e.target.value })}
                          className="w-full bg-[#0B1320] border border-amber-500/20 rounded-xl px-4 py-3 text-sm text-white outline-none"
                        >
                          {rcConfig.mapping?.map(m => (
                            <option key={m.keyword} value={m.keyword}>{m.pack} ({m.profile})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={handleManualSync}
                      disabled={isSyncingOrder}
                      className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-[#0B1320] font-black rounded-xl transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      {isSyncingOrder ? <RefreshCw className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                      VALIDASI & GENERATE SEKARANG
                    </button>
                  </div>
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <AlertTriangle size={120} />
                  </div>
                </div>
              </div>

              {/* FULL-WIDTH AUTO PROVISIONING CARD */}
              <div className="lg:col-span-2 bg-gradient-to-br from-[#151D2F] to-[#1A253E] border border-[#26314A] rounded-2xl p-8 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg"><Zap size={20} className="text-emerald-400" /></div>
                    <div>
                      <h2 className="text-xl font-bold text-white">One-Click Router Provisioning</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Kirim konfigurasi otomatis ke MikroTik Anda dalam 1 klik</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="p-4 bg-[#0B1320] rounded-xl border border-[#26314A] flex items-start gap-3">
                    <CheckCircle size={18} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-white">Enable API Service</p>
                      <p className="text-[10px] text-slate-500 mt-1">Mengaktifkan layanan API di port 8728 secara otomatis</p>
                    </div>
                  </div>
                  <div className="p-4 bg-[#0B1320] rounded-xl border border-[#26314A] flex items-start gap-3">
                    <CheckCircle size={18} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-white">Create Hotspot Profile</p>
                      <p className="text-[10px] text-slate-500 mt-1">Membuat profil "NetVocher-Profile" dengan batas 1 user per voucher</p>
                    </div>
                  </div>
                  <div className="p-4 bg-[#0B1320] rounded-xl border border-[#26314A] flex items-start gap-3">
                    <CheckCircle size={18} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-white">Auto-Create Vouchers</p>
                      <p className="text-[10px] text-slate-500 mt-1">Setiap pembayaran Runchise → hotspot user otomatis terdaftar di router</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={handleSetupRouter}
                    disabled={isProvisioning}
                    className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isProvisioning ? <RefreshCw size={20} className="animate-spin" /> : <Zap size={20} />}
                    {isProvisioning ? 'Sending Configuration...' : 'Setup Router Otomatis'}
                  </button>
                  <div className="flex items-start gap-2 p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl flex-1">
                    <AlertTriangle size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-[10px] text-amber-300/70 leading-relaxed">
                      <strong className="text-amber-400">Perhatian:</strong> Pastikan IP, Username dan Password MikroTik sudah benar dan tersimpan sebelum menekan tombol ini. Fitur API di MikroTik harus sudah aktif.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'Active Logs' ? (
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
                              Connected
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
          ) : activeTab === 'Access Point' ? (
            <div className="space-y-6 animate-in slide-in-from-right duration-500">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Koneksi AP / Router</h2>
                  <p className="text-slate-500 text-sm font-medium">Monitoring Access Point dan Router tambahan yang terhubung ke MikroTik</p>
                </div>
                <button
                  onClick={() => setShowInfraModal(!showInfraModal)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center gap-2"
                >
                  <Plus size={20} />
                  Tambah Unit Manual
                </button>
              </div>

              {/* MANUAL AP CONFIGURATION FORM (Collapsible) */}
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

              {/* MANUAL INFRASTRUCTURE LIST */}
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
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Deteksi Otomatis (Live)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dhcpLeases.length > 0 ? dhcpLeases.map((lease, idx) => (
                    <div key={idx} className="bg-[#151D2F] border border-[#26314A] rounded-3xl p-6 hover:border-blue-500/30 transition-all group relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Wifi size={80} />
                      </div>
                      <div className="flex items-center gap-4 mb-4 relative z-10">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${lease.status === 'bound' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'}`}>
                          <Server size={24} />
                        </div>
                        <div>
                          <h3 className="text-white font-bold text-lg">{lease['host-name'] || 'Unknown Device'}</h3>
                          <p className="text-xs text-slate-500 font-medium">Status: <span className={lease.status === 'bound' ? 'text-emerald-400' : 'text-amber-400'}>{lease.status}</span></p>
                        </div>
                        <div className="ml-auto relative">
                          <button
                            onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === lease.activeId ? null : lease.activeId) }}
                            className="p-2 text-slate-500 hover:text-white"
                          >
                            <MoreHorizontal size={18} />
                          </button>
                          {activeMenuId === lease.activeId && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-[#1A233A] border border-[#26314A] rounded-xl shadow-2xl overflow-hidden py-1 z-30">
                              <button onClick={() => handleRegisterAutoAP(lease)} className="w-full px-4 py-2 text-left text-xs text-blue-400 hover:bg-blue-600 hover:text-white transition-colors flex items-center gap-2">
                                <Plus size={12} /> Daftarkan Unit
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3 relative z-10">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500">IP Address</span>
                          <span className="text-white font-mono font-bold bg-[#0B1320] px-2 py-1 rounded">{lease.address}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500">MAC Address</span>
                          <span className="text-slate-400 font-mono">{lease['mac-address']}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500">Expires In</span>
                          <span className="text-blue-400 font-bold">{lease['expires-after'] || 'N/A'}</span>
                        </div>
                        {lease.comment && (
                          <div className="mt-4 pt-4 border-t border-[#26314A]">
                            <p className="text-[10px] text-slate-500 uppercase font-black mb-1">Catatan</p>
                            <p className="text-xs text-slate-300 italic">{lease.comment}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )) : (
                    <div className="col-span-full py-20 bg-[#151D2F] border border-[#26314A] border-dashed rounded-3xl text-center">
                      <div className="inline-flex w-16 h-16 rounded-full bg-slate-800 items-center justify-center mb-4">
                        <WifiOff size={32} className="text-slate-500" />
                      </div>
                      <h3 className="text-white font-bold text-lg">Tidak Ada AP Terdeteksi</h3>
                      <p className="text-slate-500 text-sm">Pastikan Access Point atau Router sudah terhubung ke Port LAN MikroTik.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === 'Reports' ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
              {/* Report Header Metrics */}
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

              {/* Main Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Trend Chart */}
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

                {/* Package Distribution Map */}
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

              {/* Transactions History Table */}
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
          ) : activeTab === 'Customers' ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
              {/* User Directory Metrics */}
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
                    <Shield size={80} />
                  </div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Quality Score</p>
                  <h3 className="text-3xl font-black text-white tracking-tight mb-2">
                    <CountUp end={9.8} decimals={1} />
                  </h3>
                  <span className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">Rating Sistem WiFi</span>
                </div>
              </div>

              {/* User Directory Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* User List Table */}
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
                                  <p className="text-[11px] text-slate-400 font-medium">{lastVoucher?.date || 'N/A'}</p>
                                </td>
                                <td className="px-10 py-6">
                                  <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[10px] font-black text-blue-400">
                                    {userVouchers.length} Transaksi
                                  </span>
                                </td>
                                <td className="px-10 py-6">
                                  <span className="text-xs text-slate-300 font-bold">{lastVoucher?.pack || 'N/A'}</span>
                                </td>
                                <td className="px-10 py-6 text-right">
                                  <button className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-blue-600 transition-all opacity-0 group-hover:opacity-100">
                                    <ChevronRight size={16} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        {vouchers.length === 0 && (
                          <tr>
                            <td colSpan="5" className="px-10 py-24 text-center">
                              <div className="flex flex-col items-center gap-4 opacity-30">
                                <Users size={48} className="text-slate-500" />
                                <div>
                                  <p className="text-white font-black uppercase tracking-widest text-sm">Database Kosong</p>
                                  <p className="text-slate-500 text-[10px] font-bold uppercase mt-1">Belum ada pelanggan yang tersinkronisasi</p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-8 border-t border-white/[0.05] bg-black/10 flex justify-center">
                    <button className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-[0.2em] transition-colors">
                      Lihat Semua Database Pelanggan
                    </button>
                  </div>
                </div>

                {/* Top Spenders & Insights */}
                <div className="space-y-8">
                  <div className="bg-[#151D2F] border border-white/[0.05] rounded-[2.5rem] p-8 lg:p-10 shadow-2xl relative overflow-hidden">
                    <div className="relative z-10">
                      <h3 className="text-xl font-black text-white tracking-tight mb-2">Top Customers</h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-8">Pelanggan dengan loyalitas tertinggi</p>

                      <div className="space-y-6">
                        {Array.from(new Set(vouchers.map(v => v.details?.customer || 'Guest User')))
                          .map(name => {
                            const userVouchers = vouchers.filter(v => (v.details?.customer || 'Guest User') === name);
                            const totalSpend = userVouchers.reduce((acc, v) => acc + (parseInt(v.price.replace(/[^\d]/g, '')) || 0), 0);
                            return { name, count: userVouchers.length, totalSpend };
                          })
                          .sort((a, b) => b.totalSpend - a.totalSpend)
                          .slice(0, 4)
                          .map((customer, i) => {
                            return (
                              <div key={i} className="flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-white/5 flex items-center justify-center overflow-hidden">
                                    <div className="w-full h-full bg-gradient-to-tr from-blue-600/40 to-indigo-600/40" />
                                  </div>
                                  <div>
                                    <p className="text-xs text-white font-black uppercase">{customer.name}</p>
                                    <p className="text-[9px] text-slate-500 font-bold uppercase">{customer.count} Pesanan</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-[11px] text-emerald-400 font-black">Rp {customer.totalSpend.toLocaleString()}</p>
                                  <div className="h-1 w-12 bg-emerald-500/20 rounded-full mt-1 overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '80%' }} />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-600 border border-blue-500 rounded-[2.5rem] p-8 lg:p-10 shadow-2xl relative overflow-hidden group cursor-pointer">
                    <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform duration-500">
                      <Zap size={100} />
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-xl font-black text-white tracking-tight mb-2">Loyalty Program</h3>
                      <p className="text-[11px] text-blue-100/70 font-bold uppercase tracking-widest mb-6">Berikan reward ke pelanggan setia</p>
                      <ul className="space-y-3 mb-8">
                        <li className="flex items-center gap-2 text-[10px] text-white font-bold uppercase">
                          <CheckCircle size={14} className="text-cyan-300" /> Diskon Paket 24 Jam
                        </li>
                        <li className="flex items-center gap-2 text-[10px] text-white font-bold uppercase">
                          <CheckCircle size={14} className="text-cyan-300" /> Akses Prioritas Speed
                        </li>
                      </ul>
                      <button
                        onClick={() => setShowRewardModal(true)}
                        className="w-full py-4 bg-white text-blue-600 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:bg-blue-50 transition-all active:scale-95"
                      >
                        Kelola Reward
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'Support' ? (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
              <div className="bg-gradient-to-br from-[#151D2F] to-[#1A253E] border border-blue-500/20 rounded-[2.5rem] p-10 lg:p-14 text-center relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-20 h-20 rounded-3xl bg-blue-600/10 flex items-center justify-center mb-8 ring-1 ring-blue-500/30">
                    <HelpCircle size={40} className="text-blue-400" />
                  </div>
                  <h2 className="text-4xl font-black text-white tracking-tight mb-4">Butuh Bantuan Teknis?</h2>
                  <p className="text-slate-400 text-lg font-medium max-w-xl mx-auto leading-relaxed">
                    Tim support kami siap membantu Anda mengoptimalkan penggunaan <span className="text-blue-400">NetVocher Dashboard</span> untuk bisnis Anda.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-12">
                    <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer" className="flex items-center gap-6 p-6 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/20 rounded-3xl transition-all group">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                        <Zap size={24} />
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">WhatsApp Support</p>
                        <p className="text-white font-bold">Respon Cepat (24/7)</p>
                      </div>
                      <ChevronRight className="ml-auto text-slate-600 group-hover:text-emerald-400 transition-colors" />
                    </a>
                    <div className="flex items-center gap-6 p-6 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 rounded-3xl transition-all group cursor-pointer">
                      <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                        <FileText size={24} />
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Dokumentasi</p>
                        <p className="text-white font-bold">Panduan Penggunaan</p>
                      </div>
                      <ChevronRight className="ml-auto text-slate-600 group-hover:text-blue-400 transition-colors" />
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-24 -right-24 opacity-5 pointer-events-none">
                  <HelpCircle size={300} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#151D2F] border border-white/[0.05] rounded-3xl p-8 shadow-xl">
                  <h4 className="text-white font-black uppercase tracking-widest text-[10px] mb-4">Versi Aplikasi</h4>
                  <p className="text-2xl font-black text-white">v3.2.0-PRO</p>
                  <span className="text-emerald-400 text-[9px] font-black uppercase tracking-tighter bg-emerald-500/10 px-2 py-0.5 rounded-md mt-2 inline-block">Latest Stable</span>
                </div>
                <div className="bg-[#151D2F] border border-white/[0.05] rounded-3xl p-8 shadow-xl">
                  <h4 className="text-white font-black uppercase tracking-widest text-[10px] mb-4">Sistem Status</h4>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <p className="text-xl font-bold text-white">All Systems Go</p>
                  </div>
                </div>
                <div className="bg-[#151D2F] border border-white/[0.05] rounded-3xl p-8 shadow-xl">
                  <h4 className="text-white font-black uppercase tracking-widest text-[10px] mb-4">Lisensi</h4>
                  <p className="text-xl font-bold text-blue-400 uppercase">Enterprise Plan</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#151D2F] border border-[#26314A] rounded-2xl p-12 text-center flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-2">
                <Activity size={32} className="text-slate-500" />
              </div>
              <h2 className="text-xl font-bold text-white">Modul Sedang Dikembangkan</h2>
              <p className="text-slate-400 max-w-sm">
                Fungsi menu <span className="text-blue-400">"{activeTab}"</span> masih dalam tahap integrasi sistem. Dashboard Concept 3 fokus pada visualisasi data real-time.
              </p>
              <button
                onClick={() => setActiveTab('Overview')}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Kembali ke Dashboard
              </button>
            </div>
          )}
        </div>
      </div>

      {/* PRINT BATCH MODAL */}
      {
        showPrintModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm print:hidden">
            <div className="bg-[#151D2F] border border-[#26314A] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-[#26314A] flex justify-between items-center bg-[#1A233A]">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Printer size={20} className="text-blue-400" /> Print Batch Manager
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Pilih voucher yang ingin dicetak secara massal.</p>
                </div>
                <button onClick={() => setShowPrintModal(false)} className="text-slate-500 hover:text-white transition-colors bg-[#26314A]/50 p-2 rounded-lg">
                  <XCircle size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm text-slate-300">
                    <span className="font-bold text-white">{printSelection.length}</span> voucher dipilih
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setPrintSelection(vouchers.map(v => v.code))} className="text-xs font-medium text-blue-400 hover:text-blue-300 px-3 py-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10">Select All</button>
                    <button onClick={() => setPrintSelection([])} className="text-xs font-medium text-slate-400 hover:text-slate-300 px-3 py-1.5 rounded-lg border border-[#26314A] hover:bg-white/5">Clear</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vouchers.map(v => (
                    <div
                      key={v.code}
                      onClick={() => handleTogglePrintSelection(v.code)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-4 ${printSelection.includes(v.code) ? 'bg-blue-600/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)] relative' : 'bg-[#1A233A] border-[#2A344D] hover:border-slate-500 hover:bg-[#2A344D]'}`}
                    >
                      {printSelection.includes(v.code) && (
                        <div className="absolute top-2 right-2 text-blue-400 rounded-full bg-[#1A233A]">
                          <CheckCircle size={16} className="fill-blue-500 text-white" />
                        </div>
                      )}
                      <div className="p-1.5 bg-white rounded-lg shrink-0">
                        <QRCodeSVG value={v.magicLink || v.code} size={40} />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <h4 className="font-mono text-white font-bold text-sm tracking-wider truncate">{v.code}</h4>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">{v.pack}</span>
                          <span className="text-xs text-emerald-400 font-medium">{v.price}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {vouchers.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-500 border border-dashed border-[#26314A] rounded-xl flex flex-col items-center gap-3">
                      <Ticket size={32} className="opacity-50" />
                      <p>Tidak ada voucher yang tersedia untuk dicetak.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-[#26314A] bg-[#1A233A]/80 flex justify-end gap-3">
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-slate-300 hover:bg-white/5 border border-transparent hover:border-[#26314A] transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handlePrintSelected}
                  disabled={printSelection.length === 0}
                  className={`px-6 py-2.5 rounded-xl font-bold text-white flex items-center gap-2 shadow-lg transition-all ${printSelection.length > 0 ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/30' : 'bg-slate-700 text-slate-400 cursor-not-allowed hidden'}`}
                >
                  <Printer size={18} /> Print {printSelection.length} Voucher
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* REWARD RULES MODAL */}
      {showRewardModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#0D1526] border border-white/10 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600" />

            <div className="p-8 lg:p-10">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      <Zap size={20} className="text-blue-400" />
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tight">Reward Strategy</h2>
                  </div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Konfigurasi otomatisasi loyalitas pelanggan</p>
                </div>
                <button
                  onClick={() => setShowRewardModal(false)}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-500 hover:text-white transition-all"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                {/* Rule Item 1 */}
                <div
                  onClick={() => setRewardSettings(p => ({ ...p, buy10Get1: !p.buy10Get1 }))}
                  className={`p-6 border rounded-3xl group transition-all cursor-pointer ${rewardSettings.buy10Get1 ? 'bg-blue-900/10 border-blue-500/30' : 'bg-[#151D2F] border-white/[0.05] hover:border-slate-500/30'}`}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className={`p-3 rounded-2xl ${rewardSettings.buy10Get1 ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>
                      <Ticket size={24} />
                    </div>
                    <div className={`flex h-6 w-11 items-center rounded-full p-1 transition-colors ${rewardSettings.buy10Get1 ? 'bg-blue-600/30' : 'bg-slate-800'}`}>
                      <div className={`h-4 w-4 rounded-full shadow-sm transition-transform ${rewardSettings.buy10Get1 ? 'bg-blue-500 translate-x-5' : 'bg-slate-500'}`} />
                    </div>
                  </div>
                  <h4 className="text-white font-black text-sm uppercase mb-2">Buy 10 Get 1 Free</h4>
                  <p className="text-slate-500 text-[10px] font-bold leading-relaxed uppercase">Otomatis kirim voucher bonus setelah 10 kali transaksi terdeteksi di POS.</p>
                </div>

                {/* Rule Item 2 (Advanced Feature - Locked) */}
                <div
                  className="p-6 bg-[#151D2F] border border-white/[0.05] rounded-3xl opacity-50 grayscale cursor-not-allowed"
                  onClick={() => alert('Fitur ini eksklusif untuk lisensi Enterprise.')}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400">
                      <ArrowUpRight size={24} />
                    </div>
                    <div className="flex h-6 w-11 items-center rounded-full bg-slate-800 p-1">
                      <div className="h-4 w-4 rounded-full bg-slate-600 shadow-sm" />
                    </div>
                  </div>
                  <h4 className="text-white font-black text-sm uppercase mb-2">Priority Speed Up <Lock size={12} className="inline ml-1 mb-1" /></h4>
                  <p className="text-slate-500 text-[10px] font-bold leading-relaxed uppercase">Pindahkan pelanggan Top 5 ke profil speed lebih tinggi secara otomatis.</p>
                </div>

                {/* Rule Item 3 */}
                <div
                  onClick={() => setRewardSettings(p => ({ ...p, happyHour: !p.happyHour }))}
                  className={`p-6 border rounded-3xl group transition-all cursor-pointer ${rewardSettings.happyHour ? 'bg-amber-900/10 border-amber-500/30' : 'bg-[#151D2F] border-white/[0.05] hover:border-slate-500/30'}`}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className={`p-3 rounded-2xl ${rewardSettings.happyHour ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500'}`}>
                      <Calendar size={24} />
                    </div>
                    <div className={`flex h-6 w-11 items-center rounded-full p-1 transition-colors ${rewardSettings.happyHour ? 'bg-amber-600/30' : 'bg-slate-800'}`}>
                      <div className={`h-4 w-4 rounded-full shadow-sm transition-transform ${rewardSettings.happyHour ? 'bg-amber-500 translate-x-5' : 'bg-slate-500'}`} />
                    </div>
                  </div>
                  <h4 className="text-white font-black text-sm uppercase mb-2">Happy Hour Discount</h4>
                  <p className="text-slate-500 text-[10px] font-bold leading-relaxed uppercase">Diskon otomatis untuk pembelian di jam sepi (21:00 - 06:00).</p>
                </div>

                {/* Rule Item 4 (Advanced Feature - Locked) */}
                <div
                  className="p-6 bg-[#151D2F] border border-white/[0.05] rounded-3xl opacity-50 grayscale cursor-not-allowed"
                  onClick={() => alert('Fitur ini eksklusif untuk lisensi Enterprise.')}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400">
                      <Bell size={24} />
                    </div>
                    <div className="flex h-6 w-11 items-center rounded-full bg-slate-800 p-1">
                      <div className="h-4 w-4 rounded-full bg-slate-600 shadow-sm" />
                    </div>
                  </div>
                  <h4 className="text-white font-black text-sm uppercase mb-2">Broadcast Promo <Lock size={12} className="inline ml-1 mb-1" /></h4>
                  <p className="text-slate-500 text-[10px] font-bold leading-relaxed uppercase">Kirim notifikasi promo khusus ke pelanggan yang belum kembali {">"} 7 hari.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowRewardModal(false)}
                  className="w-1/3 py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-[10px] text-white uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Tutup
                </button>
                <button
                  onClick={() => { alert('Strategi Reward Berhasil Disimpan!'); setShowRewardModal(false); }}
                  className="w-2/3 py-4 bg-blue-600 rounded-2xl font-black text-[10px] text-white uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20"
                >
                  Simpan Strategi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRINT-ONLY CSS SECTION (HIDDEN ON SCREEN, VISIBLE ON PRINT) */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          body > * { display: none !important; }
          .print-container {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 20px !important;
            padding: 20px !important;
            background: white !important;
            width: 100% !important;
            height: auto !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
          }
          .print-card {
            border: 2px dashed #cbd5e1 !important;
            padding: 16px !important;
            border-radius: 12px !important;
            display: flex !important;
            align-items: center !important;
            gap: 16px !important;
            page-break-inside: avoid !important;
            color: black !important;
          }
          .print-qr svg {
            width: 80px !important;
            height: 80px !important;
          }
          @page { margin: 1cm; size: auto; }
        }
      `}} />

      {/* ACTUAL PRINT-ONLY RENDER */}
      <div className="hidden print-container w-full min-h-screen bg-white text-black">
        {vouchers.filter(v => printSelection.includes(v.code)).map(v => (
          <div key={`print-${v.code}`} className="print-card w-full mb-4">
            <div className="print-qr p-2 bg-white rounded-lg border border-slate-200 shadow-sm shrink-0">
              <QRCodeSVG value={v.magicLink || v.code} size={80} viewBox="0 0 80 80" />
            </div>
            <div className="flex-1 ml-4 min-w-0">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Wi-Fi Access Voucher</p>
              <h2 className="text-2xl font-black font-mono tracking-widest mb-2 whitespace-nowrap overflow-hidden text-ellipsis">{v.code}</h2>
              <div className="flex gap-3">
                <div className="bg-slate-100 px-3 py-1 rounded border border-slate-200">
                  <span className="text-xs text-slate-500 font-medium block leading-none">Package</span>
                  <span className="text-sm font-bold text-slate-800 leading-tight">{v.pack}</span>
                </div>
                <div className="bg-slate-100 px-3 py-1 rounded border border-slate-200">
                  <span className="text-xs text-slate-500 font-medium block leading-none">Price</span>
                  <span className="text-sm font-bold text-slate-800 leading-tight">{v.price}</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-3 font-medium">Scan QR to Auto-Login or input Code above.</p>
            </div>
          </div>
        ))}
      </div>
      {/* STATUS BAR FOOTER */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-[#0D1526]/80 backdrop-blur-2xl border-t border-white/[0.05] px-6 py-2">
        <div className="max-w-[1500px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Router Online</span>
            </div>
            <div className="hidden md:flex items-center gap-2 border-l border-white/5 pl-6">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">MikroTik IP:</span>
              <span className="text-[9px] font-black text-blue-400 tracking-wider font-mono">{mtConfig.ip || 'Not Configured'}</span>
            </div>
            <div className="hidden lg:flex items-center gap-2 border-l border-white/5 pl-6">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Last Sync:</span>
              <span className="text-[9px] font-black text-white tracking-widest uppercase">{lastSync}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
              <span className="text-[8px] font-black text-blue-400 uppercase tracking-[0.2em]">NetVocher v3.0.4 Premium</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
