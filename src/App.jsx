import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

// UI & Layout Components
import Sidebar from './components/Sidebar/Sidebar';
import LoginPage from './components/Auth/LoginPage';
import OverviewTab from './components/Tabs/OverviewTab';
import VouchersTab from './components/Tabs/VouchersTab';
import CustomersTab from './components/Tabs/CustomersTab';
import ReportsTab from './components/Tabs/ReportsTab';
import AccessPointTab from './components/Tabs/AccessPointTab';
import SettingsTab from './components/Tabs/SettingsTab';
import LoggingTab from './components/Tabs/LoggingTab';
import ActiveLogsTab from './components/Tabs/ActiveLogsTab';
import SupportTab from './components/Tabs/SupportTab';

// Lucide Icons
import {
  Wifi, Ticket, Cpu, HardDrive, HelpCircle, Server, Zap, MoreHorizontal,
  XCircle, CheckCircle, RefreshCw, Printer, Activity, Lock, Search, ChevronRight, Bell,
  Gauge, Fingerprint, BarChart3, Network, Database, Settings, Shield, LogOut, AlertTriangle, Users
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';


const socket = io(`http://${window.location.hostname}:3001`);


function App() {
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#', '').replace(/%20/g, ' ');
    const validTabs = ['Overview', 'Vouchers', 'Customers', 'Reports', 'Access Point', 'Settings', 'Active Logs', 'Logging', 'Support'];
    return validTabs.includes(hash) ? hash : (localStorage.getItem('nv_active_tab') || 'Overview');
  });

  useEffect(() => {
    localStorage.setItem('nv_active_tab', activeTab);
    if (window.location.hash !== `#${activeTab}`) {
      window.location.hash = activeTab;
    }
  }, [activeTab]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').replace(/%20/g, ' ');
      const validTabs = ['Overview', 'Vouchers', 'Customers', 'Reports', 'Access Point', 'Settings', 'Active Logs', 'Logging', 'Support'];
      if (validTabs.includes(hash) && hash !== activeTab) {
        setActiveTab(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeTab]);

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
  const [adminAuth, setAdminAuth] = useState({ username: 'kepalatoko', password: 'rahasia123' });
  const [mtConfig, setMtConfig] = useState({ ip: '', user: 'admin', pass: '', dnsName: 'samsstudio.wifi', loginPath: '/login', userGroup: 'full' });
  const [rcConfig, setRcConfig] = useState({ apiKey: '', defaultPack: '1 Hour', defaultProfile: 'NV-1H', defaultSharedUsers: '1', mapping: [] });
  const [manualSyncData, setManualSyncData] = useState({ orderId: '', amount: '', customer: '', packKeyword: 'hour' });
  const [isSyncingOrder, setIsSyncingOrder] = useState(false);
  const [isGeneratingVoucher, setIsGeneratingVoucher] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printSelection, setPrintSelection] = useState([]);
  const [filterDate, setFilterDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [mtInterfaces, setMtInterfaces] = useState([]);
  const [infraConfig, setInfraConfig] = useState({ accessPoints: [] });
  const [showInfraModal, setShowInfraModal] = useState(false);
  const [editingAP, setEditingAP] = useState({ name: '', ip: '', port: '', type: '' });
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [mtLogs, setMtLogs] = useState([]);
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
  const [discoveredDevices, setDiscoveredDevices] = useState([]);
  const [showManualGen, setShowManualGen] = useState(false);
  const [manualGenQty, setManualGenQty] = useState(1);
  const [manualGenLimit, setManualGenLimit] = useState(1);
  const [isCustomManual, setIsCustomManual] = useState(false);
  const [manualGenDur, setManualGenDur] = useState(60);
  const [manualGenPrice, setManualGenPrice] = useState(2000);
  const [manualGenSpeed, setManualGenSpeed] = useState('2M/5M');
  const [manualGenCode, setManualGenCode] = useState('');
  const [manualGenLabel, setManualGenLabel] = useState('');
  const [orderIdInput, setOrderIdInput] = useState('');
  const [genVolumeLimit, setGenVolumeLimit] = useState('0');
  const [wifiSettings, setWifiSettings] = useState({ ssid: 'NetVocher_Free', password: '', status: 'unknown' });
  const [isUpdatingWifi, setIsUpdatingWifi] = useState(false);
  const [infraStatus, setInfraStatus] = useState([]);
  const [isSettingsUnlocked, setIsSettingsUnlocked] = useState(false);
  const [settingsLoginError, setSettingsLoginError] = useState('');
  const [settingsLoginForm, setSettingsLoginForm] = useState({ password: '' });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const fetchConfig = async () => {
    try {
      const res = await axios.get(`http://${window.location.hostname}:3001/api/get-config`);
      if (res.data) {
        if (res.data.adminAuth) setAdminAuth(res.data.adminAuth);
        if (res.data.mikrotik) setMtConfig(res.data.mikrotik);
        if (res.data.runchise) setRcConfig(res.data.runchise);
        if (res.data.infrastructure) setInfraConfig(res.data.infrastructure);
        if (res.data.wifi) setWifiSettings(res.data.wifi);
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
      if (activeTab === 'Logging') endpoints.push({ key: 'mikrotikLogs', url: `/api/mikrotik-logs` });
      if (activeTab === 'Access Point') {
        handleDiscovery();
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
        if (res.key === 'stats' && res.data) {
          setStats(res.data);
          if (res.data.system?.connected !== undefined) {
            setTestResults(prev => ({ ...prev, mikrotik: res.data.system.connected ? 'success' : 'failed' }));
          }
        }
        if (res.key === 'notifications' && Array.isArray(res.data)) setNotifList(res.data);
        if (res.key === 'activeUsers' && Array.isArray(res.data)) setActiveUsers(res.data);
        if (res.key === 'mikrotikLogs' && Array.isArray(res.data)) setMtLogs(res.data);

        if (res.key === 'interfaces' && Array.isArray(res.data)) setMtInterfaces(res.data);
      });

      setIsOffline(false);
    } catch (err) {
      console.warn('Network issue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscovery = async () => {
    try {
      const res = await axios.get(`http://${window.location.hostname}:3001/api/infrastructure-discover`);
      if (res.data.success) {
        if (res.data.devices) {
          setDiscoveredDevices(res.data.devices.map(d => ({ ...d, activeId: `disc-${d.mac}` })));
        }
        if (res.data.autoUpdated > 0) {
          // Refresh config to get new IPs
          fetchConfig();
          // Notify user
          const msg = `Auto-discovery: ${res.data.autoUpdated} perangkat telah diperbarui lokasinya secara otomatis.`;
          setNotifList(prev => [{ id: Date.now(), text: msg, type: 'info', time: 'Just now' }, ...prev]);
        }
      }
    } catch (err) {
      console.warn('Discovery failed');
    }
  };

  const checkInfraStatus = async () => {
    try {
      const res = await axios.get(`http://${window.location.hostname}:3001/api/infrastructure-status`);
      if (Array.isArray(res.data)) setInfraStatus(res.data);
    } catch (err) {
      console.warn('Status check failed');
    }
  };

  useEffect(() => {
    // --- SOCKET.IO REAL-TIME LISTENERS ---
    socket.on('connect', () => {
      console.log('[SOCKET] Connected to Live Sync Engine');
      setIsOffline(false);
    });

    socket.on('disconnect', () => {
      console.warn('[SOCKET] Disconnected from Sync Engine');
      setIsOffline(true);
    });

    socket.on('LIVE_UPDATE', (payload) => {
      const { type, data, timestamp } = payload;
      setLastSync(timestamp);

      if (type === 'STATS') {
        if (data.activeUsers) setActiveUsers(data.activeUsers);
        setStats(prev => ({ ...prev, ...data }));
        if (data.system?.connected !== undefined) {
          setTestResults(prev => ({ ...prev, mikrotik: data.system.connected ? 'success' : 'failed' }));
        }
      }
    });

    socket.on('systemAlert', (alert) => {
      setNotifList(prev => [{
        id: Date.now(),
        text: alert.message,
        type: alert.type || 'info',
        time: 'Just now'
      }, ...prev]);
    });

    // Initial parallel load
    Promise.all([fetchConfig(), fetchAllData()]);

    socket.on('NOTIF', (data) => {
      addToast(data.text, data.type);
      if (data.type === 'success') fetchAllData(true);
    });

    socket.on('HEALTH', (data) => {
      setStats(prev => prev ? { ...prev, system: data } : null);
    });

    const getPollInterval = () => {
      if (document.visibilityState === 'hidden') return 60000;
      if (activeTab === 'Overview' || activeTab === 'Vouchers') return 20000; // Slow down polling as we have Sockets now
      return 45000;
    };

    let pollId = setInterval(() => fetchAllData(true), getPollInterval());

    const handleVisibilityChange = () => {
      clearInterval(pollId);
      pollId = setInterval(() => fetchAllData(true), getPollInterval());
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    let statusId = null;
    if (activeTab === 'Access Point') {
      statusId = setInterval(checkInfraStatus, 10000);
      handleDiscovery();
      checkInfraStatus();
    }

    return () => {
      clearInterval(pollId);
      if (statusId) clearInterval(statusId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      socket.off('LIVE_UPDATE');
      socket.off('systemAlert');
      socket.off('connect');
      socket.off('disconnect');
      socket.off('NOTIF');
      socket.off('HEALTH');
    };
  }, [filterDate, activeTab]);

  const navItems = [
    { id: 'Overview', icon: Gauge, label: 'Dashboard' },
    { id: 'Vouchers', icon: Ticket, label: 'Manajemen Voucher' },
    { id: 'Customers', icon: Fingerprint, label: 'Database User' },
    { id: 'Reports', icon: BarChart3, label: 'Laporan Sales' },
    { id: 'Access Point', icon: Network, label: 'Node Jaringan' },
    { id: 'Logging', icon: Database, label: 'Log Aktivitas' },
    { id: 'Active Logs', icon: Activity, label: 'Traffic Live' },
    { id: 'Settings', icon: Settings, label: 'Pengaturan' },
    { id: 'Support', icon: HelpCircle, label: 'Pusat Bantuan' },
  ];

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await axios.post(`http://${window.location.hostname}:3001/api/sync`);
      setLastSync(new Date().toLocaleTimeString());
      if (res.data.success) {
        addToast(res.data.message, 'success');
        fetchAllData(true);
      } else {
        addToast(res.data.message, 'warning');
      }
    } catch (_err) {
      addToast('Gagal muat data terbaru.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteVoucher = async (code) => {
    if (!window.confirm(`⚠️ Apakah Anda yakin ingin menghapus voucher ${code}? Tindakan ini akan menghapus data dari sistem dan router MikroTik.`)) return;

    try {
      const res = await axios.post(`http://${window.location.hostname}:3001/api/delete-voucher`, { code });
      if (res.data.success) {
        setVouchers(prev => prev.filter(v => v.code !== code));
        setNotifList(prev => [{ id: Date.now(), text: `Voucher ${code} berhasil dihapus dari sistem.`, type: 'info', time: 'Just now' }, ...prev]);
      } else {
        alert(`❌ Gagal: ${res.data.message}`);
      }
    } catch (_err) {
      alert('❌ Gagal menghubungi server backend.');
    }
  };

  const handleExport = () => {
    const exportUrl = `http://${window.location.hostname}:3001/api/export?filterDate=${filterDate}`;
    // Create a temporary link and click it to trigger download
    const link = document.createElement('a');
    link.href = exportUrl;
    link.setAttribute('download', `NetVocher_Report_${filterDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveMikroTik = async () => {
    try {
      const res = await axios.post(`http://${window.location.hostname}:3001/api/save-config`, { type: 'mikrotik', config: mtConfig });
      if (res.data.success) {
        addToast('Konfigurasi MikroTik disimpan!', 'success');
        fetchAllData(true);
      } else {
        addToast(res.data.message, 'error');
      }
    } catch (_e) {
      addToast('Server Error: Gagal menyimpan config.', 'error');
    }
  };

  const handleRegisterAP = async () => {
    setIsProvisioning(true);
    try {
      await axios.post(`http://${window.location.hostname}:3001/api/save-config`, { type: 'infrastructure', config: infraConfig });
      addToast('AP Registered Successfully', 'success');
    } catch (_err) {
      addToast('Registration Failed', 'error');
    } finally {
      setIsProvisioning(false);
    }
  };

  const handleSaveRunchise = async () => {
    try {
      const res = await axios.post(`http://${window.location.hostname}:3001/api/save-config`, { type: 'runchise', config: rcConfig });
      if (res.data.success) {
        alert('✅ Runchise API konfigurasi berhasil disimpan!');
      } else {
        alert(`❌ Gagal menyimpan: ${res.data.message}`);
      }
    } catch (_e) {
      alert(`⚠️ Server Error: Gagal menyimpan konfigurasi Runchise. (${_e.message})`);
    }
  };

  const handleSetupRouter = async () => {
    if (!window.confirm('This will send a setup script to your MikroTik. Continue?')) return;
    setIsProvisioning(true);
    try {
      // Ensure config is saved first
      await axios.post(`http://${window.location.hostname}:3001/api/save-config`, { type: 'mikrotik', config: mtConfig });
      const res = await axios.post(`http://${window.location.hostname}:3001/api/setup-router`);
      if (res.data.success) {
        alert(`✅ ${res.data.message}`);
      } else {
        alert(`❌ Setup gagal: ${res.data.message}`);
      }
    } catch (e) {
      alert(`⚠️ Server Error: Tidak dapat menjalankan setup router. (${e.message})`);
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
        rateLimit: genRateLimit,
        volumeLimit: genVolumeLimit
      });
      if (res.data.success) {
        setShowGenerateModal(false);
        fetchAllData(true);
        addToast(`VOUCHER BERHASIL DIBUAT!\nKode: ${res.data.voucher.code}\nLimit: ${genRateLimit}`, 'success');
      }
    } catch (e) {
      const msg = e.response?.data?.message || e.message;
      alert('Gagal membuat voucher. Detail: ' + msg);
    } finally {
      setIsGeneratingVoucher(false);
    }
  };

  const handleManualSync = async () => {
    const targetOrderId = orderIdInput || manualSyncData.orderId;
    if (!targetOrderId) return alert('Input Order ID!');
    setIsSyncingOrder(true);
    try {
      const res = await axios.post(`http://${window.location.hostname}:3001/api/manual-sync-order`, {
        ...manualSyncData,
        orderId: targetOrderId
      });
      if (res.data.success) {
        setOrderIdInput('');
        fetchAllData(true);
        alert(res.data.message);
      }
    } catch (err) {
      alert('Manual Sync Failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSyncingOrder(false);
    }
  };

  const handlePremiumManualGen = async () => {
    if (isGeneratingVoucher) return;
    setIsGeneratingVoucher(true);
    try {
      const res = await axios.post(`http://${window.location.hostname}:3001/api/create-voucher`, {
        pack: manualGenLabel || (isCustomManual ? "Custom Plan" : manualGenDur.toString()),
        code: manualGenCode || undefined,
        sharedUsers: manualGenLimit.toString(),
        price: manualGenPrice.toString(),
        rateLimit: manualGenSpeed,
        volumeLimit: genVolumeLimit,
        qty: manualGenQty,
        duration: isCustomManual ? manualGenDur : undefined,
        comment: manualGenLabel || 'Manual Generate'
      });
      if (res.data.success) {
        setShowManualGen(false);
        setManualGenCode('');
        fetchAllData(true);
        addToast(`${res.data.vouchers?.length || 1} Voucher berhasil dibuat!`, 'success');
      }
    } catch (e) {
      const msg = e.response?.data?.message || e.message;
      addToast('Gagal membuat voucher: ' + msg, 'error');
    } finally {
      setIsGeneratingVoucher(false);
    }
  };

  const printVoucher = (v) => {
    setSelectedVoucher(v);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const handleUpdateWifi = async () => {
    setIsUpdatingWifi(true);
    try {
      const res = await axios.post(`http://${window.location.hostname}:3001/api/update-wifi`, wifiSettings);
      if (res.data.success) {
        alert('✅ SUCCESS: SSID Wi-Fi berhasil diperbarui pada MikroTik.');
      }
    } catch (e) {
      alert('❌ ERROR: Gagal memperbarui SSID Wi-Fi. Cek koneksi router.');
    } finally {
      setIsUpdatingWifi(false);
    }
  };

  const updateMapping = (index, field, value) => {
    const newMapping = [...rcConfig.mapping];
    newMapping[index][field] = value;
    setRcConfig({ ...rcConfig, mapping: newMapping });
  };

  const addMapping = () => {
    setRcConfig({ ...rcConfig, mapping: [...rcConfig.mapping, { keyword: '', pack: '', profile: '', rateLimit: '', volumeLimit: '0' }] });
  };

  const removeMapping = (index) => {
    setRcConfig({ ...rcConfig, mapping: rcConfig.mapping.filter((_, i) => i !== index) });
  };

  const handleDateFilter = () => {
    setShowDatePicker(!showDatePicker);
  };

  const handleDateChange = (e) => {
    setFilterDate(e.target.value);
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
    // Close the modal first, then trigger print after a brief delay
    setShowPrintModal(false);
    setTimeout(() => {
      window.print();
    }, 300);
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

    try {
      const res = await axios.post(`http://${window.location.hostname}:3001/api/admin-login`, {
        username: loginForm.username,
        password: loginForm.password
      });

      if (res.data.success) {
        localStorage.setItem('nv_session', 'active');
        localStorage.setItem('nv_user', loginForm.username);
        setIsLoggedIn(true);
      }
    } catch (err) {
      setLoginError('Username atau password salah!');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('nv_session');
    localStorage.removeItem('nv_user');
    setIsLoggedIn(false);
    setIsSettingsUnlocked(false);
    setLoginForm({ username: '', password: '' });
    setShowProfile(false);
    setActiveTab('Overview');
  };

  const handleSettingsLogin = async (e) => {
    e.preventDefault();
    setSettingsLoginError('');
    setIsLoggingIn(true);
    try {
      const res = await axios.post(`http://${window.location.hostname}:3001/api/admin-login`, {
        username: adminAuth.username,
        password: settingsLoginForm.password
      });

      if (res.data.success) {
        setIsSettingsUnlocked(true);
      }
    } catch (err) {
      setSettingsLoginError('Password administrator salah!');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSettingsLogout = () => {
    setIsSettingsUnlocked(false);
    setSettingsLoginForm({ password: '' });
  };

  // --- LOGIN PAGE ---
  if (!isLoggedIn) {
    return (
      <LoginPage
        handleLogin={handleLogin}
        loginForm={loginForm}
        setLoginForm={setLoginForm}
        loginError={loginError}
        isLoggingIn={isLoggingIn}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
      />
    );
  }

  return (
    <div className="flex min-h-screen bg-[#070D1A] text-slate-300 font-sans selection:bg-blue-500/30 relative overflow-hidden">

      {/* SIDEBAR (Desktop) */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        navItems={navItems} 
        testResults={testResults} 
      />

      {/* PAGE RIGHT CONTENT AREA */}
      <div className="flex-1 flex flex-col md:ml-64">

        {/* TOP NAVBAR */}
        <header className="fixed top-0 right-0 left-0 md:left-64 z-50">
          {/* Animated Gradient Accent */}
          <div className="h-[2px] bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500 shadow-[0_0_15px_rgba(56,189,248,0.5)]"></div>


          <div className="bg-[#070D1A]/70 backdrop-blur-3xl border-b border-[#26314A]/60 shadow-2xl px-6 py-2">
            {isOffline && (
              <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-1.5 flex items-center justify-center gap-2 animate-pulse">
                <AlertTriangle size={12} className="text-red-500" />
                <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">System Connection Lost</span>
              </div>
            )}

            <div className="max-w-[1500px] w-full mx-auto flex items-center justify-between">
              {/* Mobile Only: Small Logo */}
              <div className="flex md:hidden items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
                  <Wifi size={16} className="text-white" />
                </div>
                <span className="font-black text-sm text-white tracking-tighter">NV</span>
              </div>

              {/* Sync Status Indicator (Maksimal Sync) */}
              <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-white/[0.03] border border-white/10 rounded-2xl">
                <div className="relative">
                  <RefreshCw size={14} className={`text-blue-400 ${isLoading ? 'animate-spin' : ''}`} />
                  {isLoading && <span className="absolute inset-0 bg-blue-400/20 blur-sm rounded-full animate-pulse"></span>}
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">Sync Status</span>
                  <span className="text-[9px] font-black text-white uppercase tracking-tighter mt-0.5">
                    {isLoading ? 'Refreshing Data...' : `Live • ${lastSync}`}
                  </span>
                </div>
              </div>

              {/* Neural Live Sync (Visual Strength) */}
              <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-blue-500/5 border border-blue-500/20 rounded-2xl shadow-inner group">
                <div className="flex items-center gap-1">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className={`w-0.5 h-3 rounded-full transition-all duration-500 ${!isOffline ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]' : 'bg-slate-700'}`}
                      style={{
                        animation: !isOffline ? `neural-pulse 1.5s ease-in-out infinite` : 'none',
                        animationDelay: `${i * 0.2}s`
                      }}
                    ></div>
                  ))}
                </div>
                <div className="flex flex-col">
                  <span className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none">Socket Engine</span>
                  <span className={`text-[10px] font-black uppercase tracking-tighter mt-0.5 ${!isOffline ? 'text-cyan-400' : 'text-slate-500'}`}>
                    {!isOffline ? 'NEURAL SYNC ACTIVE' : 'RECONNECTING...'}
                  </span>
                </div>
              </div>

              {/* Tools on Right (Desktop & Mobile) */}
              <div className="flex items-center gap-4 ml-auto">


                {/* Action Icons */}
                <div className="flex items-center gap-2">
                  {/* Notification */}
                  <div className="relative">
                    <button
                      onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false); }}
                      className={`p-2.5 rounded-xl border transition-all active:scale-95 group relative shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] ${showNotifs ? 'bg-blue-600/20 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'bg-[#151D2F]/80 border-[#26314A]/60 hover:border-[#26314A] hover:bg-[#1A233A]'}`}
                    >
                      <Bell size={16} className={showNotifs ? 'text-blue-400' : 'text-slate-400 group-hover:text-white transition-colors'} />
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
                      className={`flex items-center gap-2 p-1 rounded-2xl border transition-all active:scale-95 group shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] ${showProfile ? 'bg-blue-600/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'bg-[#151D2F]/80 border-[#26314A]/60 hover:border-[#26314A] hover:bg-[#1A233A]'}`}
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

                          {/* System Stats Moved Here */}
                          <div className="space-y-2 mt-4">
                            <div className="flex items-center justify-between px-3 py-2 bg-white/[0.03] border border-white/10 rounded-xl">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Router Status</span>
                              <div className="flex items-center gap-1.5">
                                <div className={`w-1.5 h-1.5 rounded-full ${testResults.mikrotik === 'success' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'}`}></div>
                                <span className="text-[9px] font-black text-white uppercase tracking-widest">{testResults.mikrotik === 'success' ? 'ONLINE' : 'OFFLINE'}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between px-3 py-2 bg-white/[0.03] border border-white/10 rounded-xl">
                              <div className="flex items-center gap-2">
                                <Calendar size={12} className="text-blue-400" />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Filter Date</span>
                              </div>
                              <input
                                type="date"
                                value={filterDate}
                                onChange={handleDateChange}
                                className="bg-transparent border-none text-[9px] text-white outline-none cursor-pointer font-black uppercase text-right w-[100px]"
                              />
                            </div>
                          </div>

                          <div className="flex gap-1.5 mt-3">
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

        {/* MAIN CONTENT AREA CONTAINER */}
        <div className="flex-1 flex flex-col pt-[72px] overflow-y-auto overflow-x-hidden relative">

          {/* Ambient background layers inside content area */}
          <div className="pointer-events-none absolute inset-0 z-0">
            <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[30%] bg-blue-600/5 rounded-full blur-[100px]" />
            <div className="absolute bottom-[5%] right-[-5%] w-[25%] h-[25%] bg-indigo-600/5 rounded-full blur-[80px]" />
          </div>

          <div className="p-5 lg:p-7 max-w-[1400px] w-full mx-auto relative z-10">


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
                    {activeTab === 'Vouchers' && 'Manajemen Voucher'}
                    {activeTab === 'Customers' && 'Direktori Pelanggan'}
                    {activeTab === 'Reports' && 'Analisis Pendapatan'}
                    {activeTab === 'Settings' && 'Konfigurasi Sistem'}
                    {activeTab === 'Support' && 'Terminal Bantuan'}
                    {activeTab === 'Access Point' && 'Infrastruktur Jaringan'}
                    {activeTab === 'Active Logs' && 'Monitoring Traffic'}
                    {activeTab === 'Logging' && 'Catatan Aktivitas'}
                  </h1>
                  <p className="text-sm text-slate-500 max-w-lg leading-relaxed font-medium">
                    {activeTab === 'Vouchers' && 'Kelola, cetak, dan pantau seluruh voucher hotspot Anda dalam satu kendali terpusat.'}
                    {activeTab === 'Customers' && 'Pantau perilaku pengguna, durasi sesi, dan kelola data pelanggan WiFi permanen Anda.'}
                    {activeTab === 'Reports' && 'Analisis mendalam mengenai pendapatan harian, tren penjualan, dan performa paket secara real-time.'}
                    {activeTab === 'Settings' && 'Konfigurasi API MikroTik, integrasi POS, dan aturan sinkronisasi hotspot otomatis.'}
                    {activeTab === 'Support' && 'Pusat bantuan teknis, dokumentasi penggunaan, dan update sistem NetVocher.'}
                    {activeTab === 'Access Point' && 'Kelola dan kontrol seluruh Access Point (AP) yang terdaftar dalam infrastruktur jaringan.'}
                    {activeTab === 'Active Logs' && 'Pantau aktivitas perangkat yang sedang aktif mengonsumsi data secara langsung.'}
                    {activeTab === 'Logging' && 'Riwayat kejadian sistem dan catatan aktivitas router MikroTik secara mendetail.'}
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
              <OverviewTab
                stats={stats}
                isLoading={isLoading}
                isSyncing={isSyncing}
                handleSync={handleSync}
                handleExport={handleExport}
                setActiveTab={setActiveTab}
                mtConfig={mtConfig}
                rcConfig={rcConfig}
                lastSync={lastSync}
                testResults={testResults}
                vouchers={vouchers}
                setShowGenerateModal={setShowGenerateModal}
                setShowPrintModal={setShowPrintModal}
                setPrintSelection={setPrintSelection}
              />
            ) : activeTab === 'Vouchers' ? (
              <VouchersTab
                orderIdInput={orderIdInput}
                setOrderIdInput={setOrderIdInput}
                handleManualSync={handleManualSync}
                isSyncingOrder={isSyncingOrder}
                showManualGen={showManualGen}
                setShowManualGen={setShowManualGen}
                manualGenQty={manualGenQty}
                setManualGenQty={setManualGenQty}
                isCustomManual={isCustomManual}
                setIsCustomManual={setIsCustomManual}
                manualGenLabel={manualGenLabel}
                setManualGenLabel={setManualGenLabel}
                manualGenDur={manualGenDur}
                setManualGenDur={setManualGenDur}
                manualGenPrice={manualGenPrice}
                setManualGenPrice={setManualGenPrice}
                manualGenSpeed={manualGenSpeed}
                setManualGenSpeed={setManualGenSpeed}
                manualGenCode={manualGenCode}
                setManualGenCode={setManualGenCode}
                manualGenLimit={manualGenLimit}
                setManualGenLimit={setManualGenLimit}
                genVolumeLimit={genVolumeLimit}
                setGenVolumeLimit={setGenVolumeLimit}
                handlePremiumManualGen={handlePremiumManualGen}
                isGeneratingVoucher={isGeneratingVoucher}
                vouchers={vouchers}
                handleSync={handleSync}
                isSyncing={isSyncing}
                lastSync={lastSync}
                handleDeleteVoucher={handleDeleteVoucher}
                selectedVoucher={selectedVoucher}
                setSelectedVoucher={setSelectedVoucher}
                setShowPrintModal={setShowPrintModal}
                rcConfig={rcConfig}
              />
            ) : activeTab === 'Settings' ? (
              <SettingsTab
                isSettingsUnlocked={isSettingsUnlocked}
                handleSettingsLogin={handleSettingsLogin}
                settingsLoginForm={settingsLoginForm}
                setSettingsLoginForm={setSettingsLoginForm}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                settingsLoginError={settingsLoginError}
                isLoggingIn={isLoggingIn}
                handleSettingsLogout={handleSettingsLogout}
                adminAuth={adminAuth}
                setAdminAuth={setAdminAuth}
                mtConfig={mtConfig}
                setMtConfig={setMtConfig}
                handleTestMikroTik={handleTestMikroTik}
                isTestingMikroTik={isTestingMikroTik}
                handleSaveMikroTik={handleSaveMikroTik}
                setIsLoading={setIsLoading}
                setIsProvisioning={setIsProvisioning}
                wifiSettings={wifiSettings}
                setWifiSettings={setWifiSettings}
                handleUpdateWifi={handleUpdateWifi}
                isUpdatingWifi={isUpdatingWifi}
                rcConfig={rcConfig}
                setRcConfig={setRcConfig}
                handleTestRunchise={handleTestRunchise}
                isTestingRunchise={isTestingRunchise}
                handleSaveRunchise={handleSaveRunchise}
                updateMapping={updateMapping}
                removeMapping={removeMapping}
                addMapping={addMapping}
                manualSyncData={manualSyncData}
                setManualSyncData={setManualSyncData}
                handleManualSync={handleManualSync}
                isSyncingOrder={isSyncingOrder}
                handleSetupRouter={handleSetupRouter}
                isProvisioning={isProvisioning}
              />
            ) : activeTab === 'Active Logs' ? (
<ActiveLogsTab activeUsers={activeUsers} vouchers={vouchers} />
            ) : activeTab === 'Logging' ? (
<LoggingTab mtLogs={mtLogs} />
            ) : activeTab === 'Access Point' ? (
              <AccessPointTab
                showInfraModal={showInfraModal}
                setShowInfraModal={setShowInfraModal}
                handleDiscovery={handleDiscovery}
                discoveredDevices={discoveredDevices}
                infraConfig={infraConfig}
                infraStatus={infraStatus}
                mtInterfaces={mtInterfaces}
                editingAP={editingAP}
                setEditingAP={setEditingAP}
                addManualAP={addManualAP}
                removeManualAP={removeManualAP}
                handleEditManualAP={handleEditManualAP}
                activeMenuId={activeMenuId}
                setActiveMenuId={setActiveMenuId}
              />
            ) : activeTab === 'Reports' ? (
              <ReportsTab
                stats={stats}
                vouchers={vouchers}
              />
            ) : activeTab === 'Customers' ? (
              <CustomersTab
                vouchers={vouchers}
                activeUsers={activeUsers}
                customerSearch={customerSearch}
                setCustomerSearch={setCustomerSearch}
                setSelectedCustomer={setSelectedCustomer}
                setShowCustomerModal={setShowCustomerModal}
              />
            ) : activeTab === 'Support' ? (
<SupportTab />
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

        {/* GENERATE VOUCHERS MODAL (Premium Version) */}
        {
          showGenerateModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl overflow-y-auto py-10" onClick={() => setShowGenerateModal(false)}>
              <div className="bg-[#151D2F] border border-white/[0.08] w-full max-w-xl rounded-[2.5rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500" />
                <div className="p-10">
                  <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl">
                        <Ticket size={28} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">Generate Voucher</h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Manual Hotspot Creation System</p>
                      </div>
                    </div>
                    <button onClick={() => setShowGenerateModal(false)} className="p-2 text-slate-500 hover:text-white transition-all">
                      <XCircle size={24} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Pilih Paket WiFi</label>
                    <select
                      value={genPack && rcConfig.mapping?.find(m => m.pack === genPack) ? genPack : ""}
                      onChange={(e) => {
                        const selected = rcConfig.mapping?.find(m => m.pack === e.target.value);
                        if (selected) {
                          setGenPack(selected.pack);
                          setGenRateLimit(selected.rateLimit || '');
                          setGenVolumeLimit(selected.volumeLimit || '0');
                          setGenShared(selected.sharedUsers || '1');
                        }
                      }}
                      className="w-full bg-[#0B1320] border border-[#26314A] rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-blue-500 appearance-none custom-select shadow-inner"
                    >
                      <option value="">-- PILIH PAKET SESUAI DAFTAR --</option>
                      {rcConfig.mapping?.map((m, i) => (
                        <option key={i} value={m.pack}>{m.pack} ({m.rateLimit || 'Std'})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-4 p-6 bg-[#0B1320] rounded-3xl border border-[#26314A]/50">
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-black uppercase tracking-widest">
                      <span>Summary Konfigurasi</span>
                      <span className="text-blue-400">Auto-Apply</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div className="bg-[#151D2F] p-3 rounded-xl">
                        <p className="text-[9px] text-slate-600 font-bold uppercase mb-1">Speed</p>
                        <p className="text-white font-bold text-xs">{genRateLimit || 'No Limit'}</p>
                      </div>
                      <div className="bg-[#151D2F] p-3 rounded-xl">
                        <p className="text-[9px] text-slate-600 font-bold uppercase mb-1">Quota</p>
                        <p className="text-white font-bold text-xs">
                          {genVolumeLimit && genVolumeLimit !== '0'
                            ? (genVolumeLimit > 1073741824 ? `${(genVolumeLimit / 1073741824).toFixed(1)} GB` : `${(genVolumeLimit / 1048576).toFixed(0)} MB`)
                            : 'Unlimited'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-3xl flex items-start gap-4">
                    <Activity size={20} className="text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-white mb-1">Status Sinkronisasi Router</p>
                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                        Voucher akan otomatis terdaftar di MikroTik. Pastikan Router Status <strong className="text-emerald-400">ONLINE</strong>.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleGenerateManual}
                    disabled={isGeneratingVoucher}
                    className="w-full py-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-sm uppercase tracking-[0.3em] rounded-[1.5rem] transition-all shadow-2xl shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-4"
                  >
                    {isGeneratingVoucher ? <RefreshCw className="animate-spin" size={20} /> : <Zap size={20} />}
                    {isGeneratingVoucher ? 'Generating...' : 'Hasilkan Sekarang'}
                  </button>
                </div>
              </div>
            </div>
          )
        }

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
        {
          showRewardModal && (
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
          )
        }

        {/* PRINT-ONLY CSS SECTION (HIDDEN ON SCREEN, VISIBLE ON PRINT) */}
        <style dangerouslySetInnerHTML={{
          __html: `
        @keyframes neural-pulse {
          0%, 100% { height: 4px; opacity: 0.3; }
          50% { height: 12px; opacity: 1; }
        }
        @media print {
          /* Sembunyikan semua elemen UI Dashboard */
          body * { visibility: hidden !important; }
          
          /* Tampilkan hanya kontainer print dan isinya */
          .print-container, .print-container * { 
            visibility: visible !important; 
          }
          
          .print-container {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 15px !important;
            padding: 0 !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
          }

          body { background: white !important; }
          .voucher-premium {
            width: 100% !important;
            height: 140px !important;
            background: #fff !important;
            border: 2px solid #1e293b !important;
            border-radius: 12px !important;
            position: relative !important;
            overflow: hidden !important;
            display: flex !important;
            page-break-inside: avoid !important;
          }
          .voucher-left {
            width: 30% !important;
            background: #1e293b !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 10px !important;
            color: white !important;
          }
          .voucher-right {
            flex: 1 !important;
            padding: 12px !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
          }
          .voucher-brand { 
            font-size: 14px !important; 
            font-weight: 900 !important; 
            color: #1e293b !important;
            letter-spacing: -0.5px !important;
            display: flex !important;
            align-items: center !important;
            gap: 4px !important;
          }
          .voucher-code {
            font-family: 'Courier New', monospace !important;
            font-size: 24px !important;
            font-weight: 900 !important;
            color: #000 !important;
            background: #f1f5f9 !important;
            padding: 4px 10px !important;
            border-radius: 6px !important;
            margin: 6px 0 !important;
            display: inline-block !important;
            letter-spacing: 2px !important;
          }
          .voucher-info-row {
            display: flex !important;
            gap: 10px !important;
            margin-top: 4px !important;
          }
          .info-box {
            background: #f8fafc !important;
            border: 1px solid #e2e8f0 !important;
            padding: 4px 8px !important;
            border-radius: 4px !important;
            flex: 1 !important;
          }
          .info-label { font-size: 8px !important; color: #64748b !important; text-transform: uppercase !important; font-weight: 700 !important; }
          .info-value { font-size: 11px !important; font-weight: 800 !important; color: #1e293b !important; }
          .print-hidden { display: none !important; }
          @page { margin: 10mm; size: A4; }
        }
      `}} />

        {/* CUSTOMER DETAIL MODAL */}
        {
          showCustomerModal && selectedCustomer && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
              <div className="absolute inset-0 bg-[#070D1A]/90 backdrop-blur-md" onClick={() => setShowCustomerModal(false)} />
              <div className="relative bg-[#151D2F] border border-[#26314A]/60 rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <div className="p-8 border-b border-white/[0.05] flex justify-between items-center bg-[#1A233A]/50">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 flex items-center justify-center border border-white/10 ring-1 ring-white/5">
                      <Users size={24} className="text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white tracking-tight leading-none uppercase">{selectedCustomer.name}</h2>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                        <CheckCircle size={10} className="text-emerald-400" />
                        Verified Customer Data
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCustomerModal(false)}
                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 flex items-center justify-center transition-all border border-transparent hover:border-red-500/30"
                  >
                    <XCircle size={18} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                  {/* Stats Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#0A111E]/50 border border-white/5 rounded-2xl p-6 flex flex-col justify-center items-center text-center relative overflow-hidden group">
                      <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors" />
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 relative z-10">Total Transaksi</p>
                      <p className="text-3xl font-black text-blue-400 relative z-10">{selectedCustomer.userVouchers.length}</p>
                    </div>
                    <div className="bg-[#0A111E]/50 border border-white/5 rounded-2xl p-6 flex flex-col justify-center items-center text-center relative overflow-hidden group">
                      <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors" />
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 relative z-10">Total Belanja</p>
                      <p className="text-3xl font-black text-emerald-400 relative z-10">
                        Rp {selectedCustomer.userVouchers.reduce((acc, v) => acc + (parseInt(v.price.replace(/[^\d]/g, '')) || 0), 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-[#0A111E]/50 border border-white/5 rounded-2xl p-6 flex flex-col justify-center items-center text-center relative overflow-hidden group">
                      <div className="absolute inset-0 bg-indigo-500/5 group-hover:bg-indigo-500/10 transition-colors" />
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 relative z-10">Status Keaktifan</p>
                      <p className="text-lg font-black text-indigo-400 uppercase tracking-widest relative z-10">Loyal</p>
                    </div>
                  </div>

                  {/* History Table */}
                  <div>
                    <h3 className="text-lg font-black text-white tracking-tight mb-4 flex items-center gap-2">
                      <Activity size={16} className="text-blue-500" />
                      Riwayat Pembelian
                    </h3>
                    <div className="bg-[#0A111E]/50 border border-white/5 rounded-2xl overflow-hidden">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-white/[0.02] border-b border-white/[0.05] text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <th className="px-6 py-4">Voucher Code</th>
                            <th className="px-6 py-4">Packet Date</th>
                            <th className="px-6 py-4">Package/Limit</th>
                            <th className="px-6 py-4">Nominal</th>
                            <th className="px-6 py-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02] text-xs">
                          {selectedCustomer.vouchers.map((v, idx) => (
                            <tr key={idx} className="hover:bg-white/[0.015] transition-colors">
                              <td className="px-6 py-4">
                                <span className="font-mono text-white bg-white/5 px-2 py-1 rounded select-all">{v.code}</span>
                              </td>
                              <td className="px-6 py-4 text-slate-400">
                                {v.date ? new Date(v.date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : 'Unknown'}
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-white font-bold">{v.pack}</p>
                                <p className="text-[9px] text-slate-500 font-mono mt-0.5">{v.rateLimit || 'Default'}</p>
                              </td>
                              <td className="px-6 py-4 font-black text-emerald-400">
                                {v.price}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest ${v.status === 'Used' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                  v.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                    'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                  }`}>
                                  {v.status === 'Active' ? 'Aktif' : v.status === 'Used' ? 'Terpakai' : 'Nonaktif'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-white/[0.05] bg-black/20 flex justify-end">
                  <button
                    onClick={() => setShowCustomerModal(false)}
                    className="px-6 py-2.5 rounded-xl font-black text-[10px] text-white bg-white/10 hover:bg-white/20 uppercase tracking-widest transition-all"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          )
        }

        {/* ACTUAL PRINT-ONLY RENDER */}
        <div className="hidden print-container w-full min-h-screen bg-white">
          {(printSelection.length > 0 ? vouchers.filter(v => printSelection.includes(v.code)) : (selectedVoucher ? [selectedVoucher] : [])).map((v, idx) => (
            <div key={idx} className="voucher-premium">
              <div className="voucher-left">
                <div className="bg-white p-1 rounded-lg">
                  <QRCodeSVG value={v.magicLink || v.code} size={65} />
                </div>
                <p className="text-[6px] font-bold mt-2 opacity-70">SCAN UNTUK LOGIN</p>
              </div>
              <div className="voucher-right">
                <div className="flex justify-between items-start">
                  <div className="voucher-brand">
                    <Wifi size={14} className="text-blue-600" />
                    <span>NetVocher Access</span>
                  </div>
                  <div className="text-[7px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    PREMIUM ACCESS
                  </div>
                </div>

                <div className="text-center">
                  <span className="voucher-code">{v.code}</span>
                </div>

                <div className="voucher-info-row">
                  <div className="info-box">
                    <p className="info-label">Paket Durasi</p>
                    <p className="info-value">{v.pack}</p>
                  </div>
                  <div className="info-box">
                    <p className="info-label">Harga Voucher</p>
                    <p className="info-value">{v.price}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-2 border-t pt-2 border-dashed border-slate-200">
                  <p className="text-[7px] text-slate-400 italic">Terima kasih atas kunjungan Anda!</p>
                  <p className="text-[8px] font-black text-slate-800">Support: 0812-3456-7890</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* STATUS BAR FOOTER */}
        <footer className="fixed bottom-0 left-0 md:left-64 right-0 z-40 bg-[#0D1526]/80 backdrop-blur-2xl border-t border-white/[0.05] px-6 py-2">
          <div className="max-w-[1500px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* MikroTik Status */}
              <div className="flex items-center gap-2 pr-6 border-r border-white/5">
                <div className={`w-1.5 h-1.5 rounded-full ${stats?.system?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
                <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${stats?.system?.connected ? 'text-emerald-400' : 'text-red-400'}`}>
                    {stats?.system?.connected ? 'MikroTik Online' : 'Router Offline'}
                  </span>
                  <span className="text-[7px] text-slate-500 font-bold uppercase tracking-tighter">
                    {mtConfig.ip || 'No IP'} • {stats?.system?.latency || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Runchise Webhook Status */}
              <div className="hidden sm:flex items-center gap-2 pr-6 border-r border-white/5">
                <div className={`w-1.5 h-1.5 rounded-full ${rcConfig.apiKey ? 'bg-indigo-400' : 'bg-slate-700'}`} />
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">POS Integration</span>
                  <span className="text-[7px] text-slate-500 font-bold uppercase tracking-tighter">
                    {rcConfig.apiKey ? 'API Active' : 'Not Connected'}
                  </span>
                </div>
              </div>

              {/* Last Sync */}
              <div className="hidden lg:flex flex-col">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-0.5">Last Sync</span>
                <span className="text-[9px] font-black text-white tracking-widest uppercase">{lastSync}</span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2">
                    <Zap size={10} className="text-emerald-400" />
                    <span className="text-[8px] font-black text-white uppercase tracking-widest">Health: {stats?.system?.health || 0}%</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1">
                      <Activity size={8} className="text-blue-400" />
                      <span className="text-[7px] text-slate-500 font-bold">CPU: {stats?.system?.cpu || 0}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Server size={8} className="text-indigo-400" />
                      <span className="text-[7px] text-slate-500 font-bold">RAM: {stats?.system?.ram || 0}%</span>
                    </div>
                  </div>
                </div>
                <div className="w-[1px] h-6 bg-white/5 mx-2 hidden sm:block" />
                <span className="text-[10px] font-black text-slate-400 tracking-tighter">NETVOCHER V3.4.1-PRO</span>
              </div>
            </div>
          </div>
        </footer>

        {/* TOAST SYSTEM (Max Robustness Feedback) */}
        <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
          {toasts.map(t => (
            <div
              key={t.id}
              className={`pointer-events-auto min-w-[320px] flex items-center gap-4 p-5 rounded-3xl border shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl animate-in slide-in-from-right-10 duration-500 ${t.type === 'success' ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-100' :
                t.type === 'error' ? 'bg-red-950/80 border-red-500/50 text-red-100' :
                  t.type === 'warning' ? 'bg-amber-950/80 border-amber-500/50 text-amber-100' :
                    'bg-slate-900/80 border-blue-500/50 text-blue-100'
                }`}
            >
              <div className={`p-2 rounded-2xl ${t.type === 'success' ? 'bg-emerald-500/20' :
                t.type === 'error' ? 'bg-red-500/20' :
                  t.type === 'warning' ? 'bg-amber-500/20' :
                    'bg-blue-500/20'
                }`}>
                {t.type === 'success' ? <CheckCircle size={20} className="text-emerald-400" /> :
                  t.type === 'error' ? <AlertTriangle size={20} className="text-red-400" /> :
                    t.type === 'warning' ? <AlertTriangle size={20} className="text-amber-400" /> :
                      <Zap size={20} className="text-blue-400" />}
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-0.5">{t.type === 'success' ? 'System Success' : t.type === 'error' ? 'System Error' : 'System Info'}</p>
                <p className="text-xs font-bold leading-tight">{t.message}</p>
              </div>
              <button
                onClick={() => setToasts(prev => prev.filter(toast => toast.id !== t.id))}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <XCircle size={14} className="opacity-50" />
              </button>
            </div>
          ))}
        </div>
      </div >
    </div >
  );
}

export default App;
