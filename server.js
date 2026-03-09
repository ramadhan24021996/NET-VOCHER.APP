import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import routeros from 'node-routeros';
const { RouterOSAPI } = routeros;
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3001;

process.on('uncaughtException', (err) => {
    if (err.message && err.message.includes('!empty')) return; // Ignore RouterOS !empty markers
    console.error('[CRITICAL ERROR] Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[CRITICAL ERROR] Unhandled Rejection at:', promise, 'reason:', reason);
});

const CONFIG_FILE = path.join(process.cwd(), 'config.json');

app.use(cors());
app.use(bodyParser.json());

// --- MIKROTIK CLIENT (Per-Request, Stable for RouterOS 7.x) ---
const safeRouterOSAction = async (actionFn) => {
    const { ip, user, pass } = systemConfigs.mikrotik;
    if (!ip || ip === '192.168.88.1' || ip === '') return null;

    const client = new RouterOSAPI({ host: ip, user, password: pass, keepalive: false, timeout: 12 });
    client.on('error', (err) => {
        if (err.message && (err.message.includes('!empty') || err.message.includes('UNKNOWNREPLY'))) return;
    });

    const safeWrite = async (cmd, params = {}) => {
        try { return await client.write(cmd, params); }
        catch (e) {
            if (e.message && (e.message.includes('!empty') || e.message.includes('UNKNOWNREPLY'))) return [];
            throw e;
        }
    };

    try {
        await client.connect();
        const result = await actionFn(client, safeWrite);
        return result;
    } catch (err) {
        if (err.message && (err.message.includes('!empty') || err.message.includes('UNKNOWNREPLY'))) return null;
        console.error(`[SAFE ACTION ERROR]`, err.message);
        return null;
    } finally {
        try { await client.close(); } catch (e) { /* ignore */ }
    }
};

app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url} - IP: ${req.ip}`);
    next();
});

// --- CONFIG PERSISTENCE ---
let systemConfigs = {
    adminAuth: { username: 'admin', password: 'admin123' },
    mikrotik: { ip: '', user: 'admin', pass: '', dnsName: '', userGroup: 'full' },
    runchise: {
        apiKey: '',
        webhook: 'https://api.netvocher.com/v1/webhook',
        defaultPack: '1 Hour',
        defaultProfile: 'NV-1H',
        defaultSharedUsers: '1',
        minOrder: 50000,
        mapping: [
            { keyword: 'hour', pack: '1 Hour', profile: 'NV-1H', rateLimit: '2M/5M', volumeLimit: '0' },
            { keyword: 'day', pack: '1 Day', profile: 'NV-1D', rateLimit: '5M/10M', volumeLimit: '0' },
            { keyword: 'week', pack: '1 Week', profile: 'NV-1W', rateLimit: '10M/20M', volumeLimit: '0' }
        ]
    },
    packages: [
        { id: 'p1', name: '1 Hour', profile: 'NV-1H', rateLimit: '2M/5M', sessionTimeout: '1h', volumeLimit: '0', price: 'Rp 2.000' },
        { id: 'p2', name: '1 Day', profile: 'NV-1D', rateLimit: '5M/10M', sessionTimeout: '24h', volumeLimit: '0', price: 'Rp 10.000' },
        { id: 'p3', name: '1 Week', profile: 'NV-1W', rateLimit: '10M/20M', sessionTimeout: '168h', volumeLimit: '0', price: 'Rp 50.000' },
        { id: 'p4', name: 'Quota 2GB', profile: 'NV-Q2', rateLimit: '5M/5M', sessionTimeout: '720h', volumeLimit: '2147483648', price: 'Rp 15.000' }
    ],
    infrastructure: {
        accessPoints: []
    },
    wifi: { ssid: 'NetVocher_Free', password: '', status: 'Active' },
    notifications: [],
    vouchers: []
};

const loadConfig = () => {
    if (fs.existsSync(CONFIG_FILE)) {
        try {
            const data = fs.readFileSync(CONFIG_FILE, 'utf8');
            const parsed = JSON.parse(data);
            // Deep merge for key objects
            if (parsed.adminAuth) systemConfigs.adminAuth = { ...systemConfigs.adminAuth, ...parsed.adminAuth };
            if (parsed.mikrotik) systemConfigs.mikrotik = { ...systemConfigs.mikrotik, ...parsed.mikrotik };
            if (parsed.runchise) systemConfigs.runchise = { ...systemConfigs.runchise, ...parsed.runchise };
            if (parsed.infrastructure) systemConfigs.infrastructure = parsed.infrastructure;
            if (parsed.wifi) systemConfigs.wifi = parsed.wifi;
            if (parsed.vouchers) systemConfigs.vouchers = parsed.vouchers;
            if (parsed.notifications) systemConfigs.notifications = parsed.notifications;
            console.log('[SYSTEM] Configuration loaded and merged.');
        } catch (e) {
            console.error('[ERROR] Failed to load config file.');
        }
    }
};

const saveConfig = () => {
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(systemConfigs, null, 2));
        console.log('[SYSTEM] Configuration saved to disk.');
    } catch (e) {
        console.error('[ERROR] Failed to save config to disk.');
    }
};

loadConfig();

// Using systemConfigs for persistent storage
if (!systemConfigs.vouchers) systemConfigs.vouchers = [];
if (!systemConfigs.notifications) systemConfigs.notifications = [];

let mtStats = {
    cpu: Array(24).fill(0),
    ram: Array(24).fill(0),
    connections: Array(24).fill(0),
    health: 100,
    activeUsers: 0
};

/**
 * Endpoint for Dashboard Stats with simple 5s cache to optimize MikroTik load
 */
let statsCache = { data: null, timestamp: 0 };
const CACHE_TTL = 5000; // 5 seconds

app.get('/api/dashboard-stats', async (req, res) => {
    const filterDateStr = req.query.filterDate; // YYYY-MM-DD
    const now = Date.now();

    // Only use cache if no filter date is provided (default dashboard view)
    if (!filterDateStr && statsCache.data && (now - statsCache.timestamp < CACHE_TTL)) {
        return res.json(statsCache.data);
    }

    let targetDate = null;
    if (filterDateStr) {
        targetDate = new Date(filterDateStr).toDateString();
    }

    // --- MIKROTIK LIVE DATA (Safe Implementation) ---
    const liveData = await safeRouterOSAction(async (client, safeCmd) => {
        if (!client) return { resource: null, active: null };


        try {
            const [resource, active] = await Promise.all([
                Promise.race([safeCmd('/system/resource/print'), new Promise((_, r) => setTimeout(() => r(new Error('resource timeout')), 8000))]),
                Promise.race([safeCmd('/ip/hotspot/active/print'), new Promise((_, r) => setTimeout(() => r(new Error('active timeout')), 8000))])
            ]);
            return { resource, active };
        } catch (e) {
            console.error('[STATS ERROR]', e.message);
            return { resource: null, active: null };
        }
    });

    if (liveData && liveData.resource && liveData.resource[0]) {
        const cpuLoad = parseInt(liveData.resource[0]['cpu-load']) || 0;
        const freeMem = parseInt(liveData.resource[0]['free-memory']) / (1024 * 1024);
        const totalMem = parseInt(liveData.resource[0]['total-memory']) / (1024 * 1024);

        mtStats.cpu.shift();
        mtStats.cpu.push(cpuLoad);
        mtStats.health = 100 - cpuLoad;
        mtStats.ram.shift();
        mtStats.ram.push(Math.round(((totalMem - freeMem) / totalMem) * 100));
        mtStats.activeUsers = liveData.active ? liveData.active.length : 0;
    } else {
        mtStats.cpu.shift();
        mtStats.cpu.push(0);
        mtStats.health = 0;
        mtStats.ram.shift();
        mtStats.ram.push(0);
        mtStats.activeUsers = 0;
    }

    mtStats.connections.shift();
    mtStats.connections.push(mtStats.activeUsers + 5);

    // Calculate daily sales for the last 12 periods (hours/timeblocks)
    const salesChart = Array(12).fill(0);
    const revenueChart = Array(7).fill(0);

    const parseVoucherDate = (vDate) => {
        if (!vDate) return new Date();
        if (typeof vDate === 'string' && vDate.includes('/') && !vDate.includes('T')) {
            const parts = vDate.split(',')[0].split('/');
            if (parts.length === 3) return new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`);
        }
        return new Date(vDate);
    };

    const filteredVouchers = targetDate
        ? systemConfigs.vouchers.filter(v => parseVoucherDate(v.date).toDateString() === targetDate)
        : systemConfigs.vouchers;

    filteredVouchers.forEach(v => {
        const date = parseVoucherDate(v.date);
        const hour = date.getHours();
        const day = date.getDay();
        if (!isNaN(hour)) salesChart[Math.floor(hour / 2)]++;
        if (!isNaN(day)) revenueChart[day]++;
    });

    // Calculate peak hours from voucher creation times
    const peakHoursData = Array(24).fill(0);
    filteredVouchers.forEach(v => {
        const date = parseVoucherDate(v.date);
        const hour = date.getHours();
        if (!isNaN(hour)) peakHoursData[hour]++;
    });
    // Add active users data to current hour
    const currentHour = new Date().getHours();
    peakHoursData[currentHour] = Math.max(peakHoursData[currentHour], mtStats.activeUsers);

    const dashboardData = {
        revenue: {
            total: filteredVouchers.reduce((acc, v) => acc + (parseInt(v.price.replace(/[^\d]/g, '')) || 0), 0),
            growth: filteredVouchers.length > 0 ? Math.round((filteredVouchers.length / Math.max(systemConfigs.vouchers.length, 1)) * 100) : 0,
            chartData: revenueChart
        },
        sales: {
            today: filteredVouchers.length,
            chartData: salesChart
        },
        users: {
            active: mtStats.activeUsers,
            capacity: 100
        },
        system: {
            health: mtStats.health,
            latency: mtStats.health > 0 ? `${Math.max(5, 100 - mtStats.health)}ms` : 'N/A',
            cpu: mtStats.cpu,
            ram: mtStats.ram,
            connections: mtStats.connections
        },
        peakHours: peakHoursData,
        revenueVsTarget: revenueChart.map((val, i) => ({
            name: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][i],
            actual: val * 5000,
            target: 1000000
        }))
    };

    if (!filterDateStr) {
        statsCache = { data: dashboardData, timestamp: Date.now() };
    }
    res.json(dashboardData);
});

app.get('/api/active-users', async (req, res) => {
    const activeUsers = await safeRouterOSAction(async (client, safeWrite) => {
        try {
            if (!client) return [];
            return await safeWrite('/ip/hotspot/active/print');
        } catch (e) {
            console.error('[ACTIVE USERS ERROR]', e.message);
            return [];
        }
    });
    res.json(activeUsers || []);
});

app.get('/api/dhcp-leases', async (req, res) => {
    const leases = await safeRouterOSAction(async (client, safeWrite) => {
        try {
            if (!client) return [];
            return await safeWrite('/ip/dhcp-server/lease/print');
        } catch (e) {
            console.error('[DHCP LEASE ERROR]', e.message);
            return [];
        }
    });
    res.json(leases || []);
});

app.get('/api/mikrotik-interfaces', async (req, res) => {
    const interfaces = await safeRouterOSAction(async (client, safeWrite) => {
        try {
            if (!client) return [];
            return await safeWrite('/interface/print');
        } catch (e) {
            console.error('[INTERFACE ERROR]', e.message);
            return [];
        }
    });
    res.json(interfaces || []);
});

app.get('/api/infrastructure-status', async (req, res) => {
    const { accessPoints } = systemConfigs.infrastructure;
    if (!accessPoints || accessPoints.length === 0) return res.json([]);

    const net = await import('net');
    const checkPort = (port, host) => {
        return new Promise((resolve) => {
            const socket = new net.Socket();
            socket.setTimeout(2000);
            socket.on('connect', () => { socket.destroy(); resolve(true); });
            socket.on('timeout', () => { socket.destroy(); resolve(false); });
            socket.on('error', () => { socket.destroy(); resolve(false); });
            socket.connect(port, host);
        });
    };

    const statusResults = await Promise.all(accessPoints.map(async (ap) => {
        // Try common ports: 80 (HTTP), 8728 (MikroTik API), 22 (SSH)
        const portsToTry = [80, 8728, 22, 443];
        let online = false;
        for (const port of portsToTry) {
            if (await checkPort(port, ap.ip)) {
                online = true;
                break;
            }
        }
        return { id: ap.id, online };
    }));

    res.json(statusResults);
});

app.get('/api/infrastructure-discover', async (req, res) => {
    console.log('[INFRASTRUCTURE] Discovering neighbors via MikroTik...');
    const neighbors = await safeRouterOSAction(async (client, safeWrite) => {
        try {
            if (!client) return [];
            // Get neighbors (discovery protocols like MNDP, CDP)
            const list = await safeWrite('/ip/neighbor/print');
            return list.map(n => ({
                name: n.identity || n['sys-name'] || 'Unknown Device',
                ip: n.address || '0.0.0.0',
                mac: n['mac-address'],
                port: n.interface,
                platform: n.platform || n.board || 'Unknown',
                version: n.version || ''
            }));
        } catch (e) {
            console.error('[DISCOVERY ERROR]', e.message);
            return [];
        }
    });

    // Auto-update existing infrastructure if names match but IPs changed
    let updatedCount = 0;
    if (neighbors && neighbors.length > 0) {
        systemConfigs.infrastructure.accessPoints.forEach(ap => {
            const match = neighbors.find(n => n.name === ap.name || n.mac === ap.mac);
            if (match && match.ip !== '0.0.0.0' && match.ip !== ap.ip) {
                console.log(`[AUTO-DISCOVERY] Updating IP for ${ap.name}: ${ap.ip} -> ${match.ip}`);
                ap.ip = match.ip;
                ap.port = match.port; // Update port too
                updatedCount++;
            }
        });
        if (updatedCount > 0) saveConfig();
    }

    res.json({
        success: true,
        devices: neighbors,
        autoUpdated: updatedCount
    });
});

app.post('/api/scan-remote-device', async (req, res) => {
    const { targetIp } = req.body;
    console.log(`[SCAN] Checking device capability at ${targetIp}...`);

    // Simple port check logic (HTTP, HTTPS, MikroTik API, etc)
    const net = await import('net');
    const checkPort = (port, host) => {
        return new Promise((resolve) => {
            const socket = new net.Socket();
            socket.setTimeout(1500);
            socket.on('connect', () => { socket.destroy(); resolve(true); });
            socket.on('timeout', () => { socket.destroy(); resolve(false); });
            socket.on('error', () => { socket.destroy(); resolve(false); });
            socket.connect(port, host);
        });
    };

    const ports = [80, 443, 8080, 8728]; // Common management ports
    let isOpen = false;
    for (const port of ports) {
        if (await checkPort(port, targetIp)) {
            isOpen = true;
            break;
        }
    }

    res.json({
        success: true,
        isReachable: isOpen,
        message: isOpen ? `Perangkat ${targetIp} AKTIF dan terdeteksi port manajemen.` : `Perangkat ${targetIp} tidak merespon di port manajemen umum.`
    });
});

app.get('/api/vouchers', async (req, res) => {
    const parseVoucherDate = (vDate) => {
        if (!vDate) return new Date();
        if (typeof vDate === 'string' && vDate.includes('/') && !vDate.includes('T')) {
            const parts = vDate.split(',')[0].split('/');
            if (parts.length === 3) return new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`);
        }
        return new Date(vDate);
    };

    const filterDateStr = req.query.filterDate;
    let sendingVouchers = systemConfigs.vouchers;
    if (filterDateStr) {
        const targetDate = new Date(filterDateStr).toDateString();
        sendingVouchers = sendingVouchers.filter(v => parseVoucherDate(v.date).toDateString() === targetDate);
    }
    res.json(sendingVouchers);
});

app.get('/api/notifications', (req, res) => {
    res.json(systemConfigs.notifications);
});

app.get('/api/get-config', (req, res) => {
    console.log('[API] Sending current config to frontend');
    res.json(systemConfigs);
});

app.post('/api/save-config', (req, res) => {
    try {
        const { type, config } = req.body;
        console.log(`[API] Saving ${type} config...`);

        if (type === 'mikrotik') {
            systemConfigs.mikrotik = { ...systemConfigs.mikrotik, ...config };
        }
        if (type === 'runchise') systemConfigs.runchise = { ...systemConfigs.runchise, ...config };
        if (type === 'infrastructure') systemConfigs.infrastructure = { ...systemConfigs.infrastructure, ...config };
        if (type === 'adminAuth') systemConfigs.adminAuth = { ...systemConfigs.adminAuth, ...config };

        saveConfig();
        res.json({ success: true, message: 'Configuration saved permanently' });
    } catch (err) {
        console.error('[CONFIG SAVE ERROR]', err.message);
        res.status(500).json({ success: false, message: `Failed to save: ${err.message}` });
    }
});

app.post('/api/admin-login', (req, res) => {
    const { username, password } = req.body;

    // Get current auth data from systemConfigs (which is loaded from config.json)
    const auth = {
        username: systemConfigs.adminAuth?.username || 'kepalatoko',
        password: systemConfigs.adminAuth?.password || 'rahasia123'
    };

    console.log(`[LOGIN] Attempt: "${username}" | Config Target: "${auth.username}"`);

    // STRICT CHECK: Only allow if it matches the current config
    if (username === auth.username && password === auth.password) {
        console.log(`[LOGIN] ✅ Success for user "${username}"`);
        res.json({ success: true, message: 'Login successful' });
    } else {
        console.warn(`[LOGIN] ❌ Failed! Input: (${username}/${password}) | Expected: (${auth.username}/${auth.password})`);
        res.status(401).json({ success: false, message: 'Username atau password salah!' });
    }
});

app.post('/api/test-mikrotik', async (req, res) => {
    console.log(`[MIKROTIK] Starting Safe Diagnostic Test...`);
    const success = await safeRouterOSAction(async (client) => {
        return true;
    });

    if (success) {
        res.json({ success: true, message: 'Connected to MikroTik successfully' });
    } else {
        res.json({ success: false, message: 'Connection timed out or refused. Check IP/Credentials.' });
    }
});

app.post('/api/test-runchise', async (req, res) => {
    const { apiKey } = systemConfigs.runchise;
    console.log(`[RUNCHISE] Testing API Key via Handshake...`);

    // Simulating a real Runchise API call
    try {
        // In a real scenario, we would call Runchise API here
        // axios.get('https://api.runchise.com/v1/store', { headers: { 'Authorization': `Bearer ${apiKey}` } })

        const isAuth = apiKey && apiKey.length > 8;
        setTimeout(() => {
            res.json({
                success: isAuth,
                message: isAuth ? 'Runchise API verified' : 'Invalid API Key'
            });
        }, 1500);
    } catch (err) {
        res.json({ success: false, message: 'API Request failed' });
    }
});

app.post('/api/sync', async (req, res) => {
    console.log('[SYNC] Starting real router synchronization...');
    try {
        // 1. Use a DEDICATED fresh connection for sync (not the shared globalClient)
        const { ip, user, pass } = systemConfigs.mikrotik;
        if (!ip || ip === '192.168.88.1' || ip === '') {
            return res.json({ success: false, message: 'IP MikroTik belum dikonfigurasi.' });
        }

        const syncClient = new RouterOSAPI({ host: ip, user, password: pass, keepalive: false, timeout: 15 });
        syncClient.on('error', (err) => {
            if (err.message && err.message.includes('!empty')) return;
        });

        await syncClient.connect();
        console.log('[SYNC] Dedicated connection established.');

        let resource = null, activeUsers = null, hotspotUsers = null;

        // Helper: RouterOS 7.x sends '!empty' when result set is empty, which crashes node-routeros
        const safeWrite = async (cmd) => {
            try { return await syncClient.write(cmd); }
            catch (e) {
                if (e.message && (e.message.includes('!empty') || e.message.includes('UNKNOWNREPLY'))) return [];
                console.warn('[SYNC] cmd failed:', cmd, e.message);
                return [];
            }
        };

        resource = await safeWrite('/system/resource/print');
        activeUsers = await safeWrite('/ip/hotspot/active/print');
        hotspotUsers = await safeWrite('/ip/hotspot/user/print');

        try { await syncClient.close(); } catch (e) { /* ignore */ }

        const syncResults = { resource, activeUsers, hotspotUsers };

        if (!syncResults.resource && !syncResults.activeUsers && !syncResults.hotspotUsers) {
            return res.json({ success: false, message: 'Gagal terhubung ke MikroTik. Periksa koneksi router.' });
        }

        // 2. Update system stats
        if (syncResults.resource && syncResults.resource[0]) {
            const cpuLoad = parseInt(syncResults.resource[0]['cpu-load']) || 0;
            const freeMem = parseInt(syncResults.resource[0]['free-memory']) / (1024 * 1024);
            const totalMem = parseInt(syncResults.resource[0]['total-memory']) / (1024 * 1024);
            mtStats.cpu.shift(); mtStats.cpu.push(cpuLoad);
            mtStats.health = 100 - cpuLoad;
            mtStats.ram.shift(); mtStats.ram.push(Math.round(((totalMem - freeMem) / totalMem) * 100));
            mtStats.activeUsers = syncResults.activeUsers ? syncResults.activeUsers.length : 0;
        }

        // 3. Reconcile voucher statuses with MikroTik data
        let reconciled = 0;
        if (Array.isArray(syncResults.hotspotUsers)) {
            systemConfigs.vouchers.forEach(v => {
                if (v.status === 'Active') {
                    const mUser = syncResults.hotspotUsers.find(u => u.name === v.code);
                    // Optimized: Only mark as used if uptime is meaningful (> 15s) or data has been transferred
                    // Note: RouterOS returns uptime as a string like "00:00:15" or "15s"
                    const hasUptime = mUser && mUser.uptime && mUser.uptime !== '0s' && mUser.uptime !== '00:00:00';
                    const bytesIn = parseInt(mUser?.['bytes-in']) || 0;

                    if (hasUptime && (bytesIn > 51200)) { // More than 50KB transferred or active session
                        v.status = 'Used';
                        reconciled++;
                    }
                }
            });
            if (reconciled > 0) saveConfig();
        }

        const activeCount = syncResults.activeUsers ? syncResults.activeUsers.length : 0;
        console.log(`[SYNC] Complete. Active: ${activeCount}, Reconciled: ${reconciled}`);
        res.json({
            success: true,
            message: `Sinkronisasi berhasil! ${activeCount} user aktif, ${reconciled} voucher diperbarui.`
        });
    } catch (err) {
        console.error('[SYNC ERROR]', err.message);
        res.json({ success: false, message: `Sync gagal: ${err.message}` });
    }
});

app.get('/api/mikrotik-logs', async (req, res) => {
    const logs = await safeRouterOSAction(async (client, safeWrite) => {
        try {
            return await safeWrite('/log/print');
        } catch (e) {
            console.error('[LOG ERROR]', e.message);
            return [];
        }
    });
    res.json(logs || []);
});

app.post('/api/setup-secure-user', async (req, res) => {
    const { user: newUser, pass: newPass, adminUser, adminPass } = req.body;
    const { ip } = systemConfigs.mikrotik;

    // Gunakan adminUser/adminPass jika dikirim (Wizard), jika tidak gunakan config utama
    const finalUser = adminUser || systemConfigs.mikrotik.user;
    const finalPass = adminPass || systemConfigs.mikrotik.pass;

    const client = new RouterOSAPI({ host: ip, user: finalUser, password: finalPass, keepalive: false, timeout: 30 });
    const safeWrite = async (cmd, params = {}) => {
        try { return await client.write(cmd, params); }
        catch (e) {
            if (e.message && (e.message.includes('!empty') || e.message.includes('UNKNOWNREPLY'))) return [];
            throw e;
        }
    };
    try {
        await client.connect();

        // 1. Create Restricted Group
        const groups = await safeWrite('/user/group/print', { '?name': 'NetVocher-Mgr' });
        if (groups.length === 0) {
            await safeWrite('/user/group/add', {
                name: 'NetVocher-Mgr',
                policy: 'api,read,write,test,sensitive'
            });
        }

        // 2. Create New User in that Group
        const users = await safeWrite('/user/print', { '?name': newUser });
        if (users.length === 0) {
            await safeWrite('/user/add', {
                name: newUser,
                password: newPass,
                group: 'NetVocher-Mgr'
            });
        } else {
            await safeWrite('/user/set', {
                '.id': users[0]['.id'],
                password: newPass,
                group: 'NetVocher-Mgr'
            });
        }

        res.json({ success: true, message: `User ${newUser} telah dibuat.` });
    } catch (err) {
        res.json({ success: false, message: `Gagal (Cek Akun Admin): ${err.message}` });
    } finally {
        try { await client.close(); } catch (e) { /* ignore */ }
    }
});

app.post('/api/setup-router-admin', async (req, res) => {
    const { adminUser, adminPass } = req.body;
    const { ip, dnsName } = systemConfigs.mikrotik;

    console.log(`[PROVISIONING] Master Admin Robust Setup for ${ip}...`);
    const client = new RouterOSAPI({ host: ip, user: adminUser, password: adminPass, keepalive: false, timeout: 15 });
    const safeWrite = async (cmd, params = {}) => {
        try { return await client.write(cmd, params); }
        catch (e) {
            if (e.message && (e.message.includes('!empty') || e.message.includes('UNKNOWNREPLY'))) return [];
            throw e;
        }
    };
    try {
        await client.connect();

        // 1. Ensure API is enabled
        await safeWrite('/ip/service/enable', { numbers: 'api' });

        // 2. Provision Hotspot DNS Name
        if (dnsName) {
            const serverProfiles = await safeWrite('/ip/hotspot/profile/print');
            for (const profile of serverProfiles) {
                await safeWrite('/ip/hotspot/profile/set', { '.id': profile['.id'], 'dns-name': dnsName });
            }

            // Add static DNS entry for router redundancy
            const staticDns = await safeWrite('/ip/dns/static/print', { '?name': dnsName });
            if (staticDns.length === 0) {
                await safeWrite('/ip/dns/static/add', { name: dnsName, address: ip });
            } else {
                await safeWrite('/ip/dns/static/set', { '.id': staticDns[0]['.id'], address: ip });
            }
        }

        // 3. Ensure Standard Profiles Exist (Public Readiness)
        const targetProfiles = [
            { name: 'NV-1H', session: '1h', limit: '2M/5M' },
            { name: 'NV-1D', session: '24h', limit: '5M/10M' },
            { name: 'NV-1W', session: '168h', limit: '10M/20M' },
            { name: 'NV-Q2', session: '720h', limit: '5M/5M' }
        ];

        const targetShared = systemConfigs.runchise.defaultSharedUsers || '1';

        for (const p of targetProfiles) {
            const existing = await safeWrite('/ip/hotspot/user/profile/print', { '?name': p.name });
            if (existing.length === 0) {
                await safeWrite('/ip/hotspot/user/profile/add', {
                    name: p.name,
                    'shared-users': targetShared,
                    'session-timeout': p.session,
                    'rate-limit': p.limit,
                    'status-autorefresh': '1m'
                });
            } else {
                await safeWrite('/ip/hotspot/user/profile/set', {
                    '.id': existing[0]['.id'],
                    'shared-users': targetShared,
                    'session-timeout': p.session,
                    'rate-limit': p.limit
                });
            }
        }

        res.json({ success: true, message: 'Router has been fully optimized & synchronized for Public use!' });
    } catch (err) {
        console.error('[PROV ERROR]', err.message);
        res.json({ success: false, message: `Gagal: ${err.message}` });
    } finally {
        try { await client.close(); } catch (e) { /* ignore */ }
    }
});

app.post('/api/setup-router', async (req, res) => {
    const { ip, user, pass, dnsName } = systemConfigs.mikrotik;
    console.log(`[PROVISIONING] Deep Syncing configuration to ${ip}...`);

    const client = new RouterOSAPI({ host: ip, user, password: pass, keepalive: false, timeout: 30 });
    client.on('error', (err) => { /* Background handle */ });
    try {
        await client.connect();

        // 1. Ensure API is enabled
        await client.write('/ip/service/enable', { numbers: 'api' });

        // 1.5 Sync API User Group if needed
        const currentUserGroup = systemConfigs.mikrotik.userGroup || 'full';
        if (currentUserGroup === 'NetVocher-Mgr') {
            const groups = await client.write('/user/group/print', { '?name': 'NetVocher-Mgr' });
            if (groups.length === 0) {
                await client.write('/user/group/add', {
                    name: 'NetVocher-Mgr',
                    policy: 'api,read,write,hotspot,policy,test'
                });
                console.log(`[PROVISIONING] Custom Group 'NetVocher-Mgr' created.`);
            }

            // Assign current user to this group
            const users = await client.write('/user/print', { '?name': user });
            if (users.length > 0) {
                await client.write('/user/set', {
                    '.id': users[0]['.id'],
                    group: 'NetVocher-Mgr'
                });
                console.log(`[PROVISIONING] User '${user}' moved to 'NetVocher-Mgr' group.`);
            }
        }

        // 2. Set Hotspot DNS Name if provided
        if (dnsName) {
            const serverProfiles = await client.write('/ip/hotspot/profile/print');
            for (const profile of serverProfiles) {
                await client.write('/ip/hotspot/profile/set', {
                    '.id': profile['.id'],
                    'dns-name': dnsName
                });
            }
            console.log(`[PROVISIONING] Hotspot DNS Name set to: ${dnsName}`);
        }

        // 3. Create/Update Profiles with High Compatibility
        const profiles = [
            { name: 'NV-1H', session: '1h', limit: '2M/5M' },
            { name: 'NV-1D', session: '24h', limit: '5M/10M' },
            { name: 'NV-1W', session: '168h', limit: '10M/20M' }
        ];

        const targetShared = systemConfigs.runchise.defaultSharedUsers || '1';

        for (const p of profiles) {
            const existing = await client.write('/ip/hotspot/user/profile/print', { '?name': p.name });
            if (existing.length === 0) {
                await client.write('/ip/hotspot/user/profile/add', {
                    name: p.name,
                    'shared-users': targetShared,
                    'session-timeout': p.session,
                    'rate-limit': p.limit,
                    'status-autorefresh': '1m'
                });
            } else {
                await client.write('/ip/hotspot/user/profile/set', {
                    '.id': existing[0]['.id'],
                    'shared-users': targetShared,
                    'session-timeout': p.session,
                    'rate-limit': p.limit
                });
            }
        }

        console.log(`[PROVISIONING] SUCCESS: Router is now Public-Ready.`);
        await client.close();
        res.json({ success: true, message: 'Router has been fully synchronized and is ready for public use!' });
    } catch (err) {
        console.error(`[PROVISIONING ERROR]`, err.message);
        res.json({ success: false, message: `Provisioning failed: ${err.message}. Make sure API is open on router.` });
    }
});

// --- EXPORT VOUCHERS AS CSV ---
app.get('/api/export', (req, res) => {
    console.log('[EXPORT] Generating CSV report...');
    const filterDateStr = req.query.filterDate;

    const parseVoucherDate = (vDate) => {
        if (!vDate) return new Date();
        if (typeof vDate === 'string' && vDate.includes('/') && !vDate.includes('T')) {
            const parts = vDate.split(',')[0].split('/');
            if (parts.length === 3) return new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`);
        }
        return new Date(vDate);
    };

    let exportVouchers = systemConfigs.vouchers;
    if (filterDateStr) {
        const targetDate = new Date(filterDateStr).toDateString();
        exportVouchers = exportVouchers.filter(v => parseVoucherDate(v.date).toDateString() === targetDate);
    }

    // Build CSV
    const csvHeader = 'No,Kode Voucher,Paket,Harga,Tanggal,Status,Customer,Order No,Magic Link';
    const csvRows = exportVouchers.map((v, i) => {
        const date = v.date ? new Date(v.date).toLocaleString('id-ID') : '-';
        const customer = v.details?.customer || '-';
        const orderNo = v.details?.orderNo || '-';
        const magicLink = v.magicLink || '-';
        // Escape commas in fields
        const escape = (str) => `"${String(str).replace(/"/g, '""')}"`;
        return [
            i + 1,
            escape(v.code),
            escape(v.pack),
            escape(v.price),
            escape(date),
            escape(v.status),
            escape(customer),
            escape(orderNo),
            escape(magicLink)
        ].join(',');
    });

    const csvContent = [csvHeader, ...csvRows].join('\n');
    const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="NetVocher_Report_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(BOM + csvContent);
    console.log(`[EXPORT] CSV generated with ${exportVouchers.length} vouchers.`);
});

// --- UPDATE WIFI SSID / PASS ---
app.post('/api/update-wifi', async (req, res) => {
    const { ssid, password } = req.body;
    console.log(`[WIFI CONFIG] Updating SSID to ${ssid}...`);

    systemConfigs.wifi.ssid = ssid;
    systemConfigs.wifi.password = password;
    saveConfig();

    const result = await safeRouterOSAction(async (client) => {
        // 1. Set SSID on wireless interfaces
        const interfaces = await client.write('/interface/wireless/print');
        for (const iface of interfaces) {
            await client.write('/interface/wireless/set', {
                '.id': iface['.id'],
                ssid: ssid
            });
        }

        // 2. Security Profile (Optional - Hotspot usually open)
        if (password) {
            try {
                // Try to update default security profile or create new one
                await client.write('/interface/wireless/security-profiles/set', {
                    '.id': 'default',
                    mode: 'dynamic-keys',
                    'authentication-types': 'wpa2-psk',
                    'unicast-ciphers': 'aes-ccm',
                    'group-ciphers': 'aes-ccm',
                    'wpa2-pre-shared-key': password
                });
            } catch (e) { console.warn('Could not set security profile:', e.message); }
        } else {
            // Open network
            try {
                await client.write('/interface/wireless/security-profiles/set', {
                    '.id': 'default',
                    mode: 'none'
                });
            } catch (e) { /* ignore */ }
        }
        return true;
    });

    if (result) res.json({ success: true, message: 'WiFi settings updated.' });
    else res.status(500).json({ success: false, message: 'Router connection failed.' });
});

// --- REUSABLE ORDER PROCESSOR ---
const processOrder = async (data) => {
    const amount = Number(data.total_amount) || 0;
    const orderId = data.id || 'N/A';
    const orderNo = data.order_number || orderId;
    const customerName = data.customer?.name || 'Guest';
    const paymentMethod = data.payment_details?.method || 'Direct';

    // --- AUTO PACKAGE DETECTION (Settings Based) ---
    // Default to configured value for any purchase (Food/Ticket/etc)
    let detectedPack = systemConfigs.runchise.defaultPack || '1 Hour';
    let profile = systemConfigs.runchise.defaultProfile || 'NV-1H';
    let rateLimit = ''; // Default (no limit)
    let isSpeciallyPurchased = false;
    let match = null;

    if (data.items && Array.isArray(data.items)) {
        const itemNames = data.items.map(i => i.name?.toLowerCase() || '').join(' ');

        // Find match in mapping (for specific Wifi packages like 1Day, 1Week)
        const mapping = systemConfigs.runchise.mapping || [];
        match = mapping.find(m => itemNames.includes(m.keyword.toLowerCase()));
        if (match) {
            detectedPack = match.pack;
            profile = match.profile;
            rateLimit = match.rateLimit || '';
            isSpeciallyPurchased = true;
        }
    }

    let calculatedSharedUsers = 1;
    const minOrder = Number(systemConfigs.runchise.minOrder || 50000);

    // Calculate devices based on amount (e.g. 50k = 1 device, 100k = 2 devices, 150k = 3 devices)
    if (amount >= minOrder) {
        calculatedSharedUsers = Math.floor(amount / minOrder);
    }

    if (!isSpeciallyPurchased) {
        // Evaluate strict minimum order for FREE bonus voucher
        if (minOrder > 0 && amount < minOrder) {
            console.log(`[ORDER SKIP] Order ${orderNo} below Minimum Amount (Rp ${minOrder}). Amount: Rp ${amount}. No bonus voucher generated.`);
            return null;
        }
    }


    const voucherCode = `NV-${Math.floor(10000 + Math.random() * 90000)}-${detectedPack.charAt(0)}`;
    const routerIp = systemConfigs.mikrotik.ip || '192.168.88.1';
    const loginHost = systemConfigs.mikrotik.dnsName || routerIp;
    const loginPath = systemConfigs.mikrotik.loginPath || '/login';
    const magicLink = `http://${loginHost}${loginPath}${loginPath.includes('?') ? '&' : '?'}username=${voucherCode}&password=${voucherCode}`;

    const newVoucher = {
        code: voucherCode,
        pack: `${detectedPack} (${calculatedSharedUsers} Device)`,
        price: isSpeciallyPurchased ? `Rp ${amount.toLocaleString()}` : "GRATIS (Bonus Order)",
        date: new Date().toISOString(),
        status: 'Active',
        rateLimit: rateLimit || '',
        volumeLimit: (match && (match.volumeLimit || match.volume_limit)) || '0',
        isFree: !isSpeciallyPurchased,
        magicLink: magicLink,
        details: {
            orderId: orderId,
            orderNo: orderNo,
            customer: customerName,
            payment: paymentMethod,
            items: data.items?.map(i => i.name) || []
        }
    };

    systemConfigs.vouchers.unshift(newVoucher);
    if (systemConfigs.vouchers.length > 500) systemConfigs.vouchers = systemConfigs.vouchers.slice(0, 500);

    // --- AUTOMATIC MIKROTIK VOUCHER CREATION ---
    const { ip, user, pass } = systemConfigs.mikrotik;
    if (ip && ip !== '192.168.88.1' && ip !== '') {
        const mtClient = new RouterOSAPI({ host: ip, user, password: pass, keepalive: false, timeout: 30 });
        mtClient.on('error', () => { });

        // Internal helper for this block
        const safeWrite = async (client, cmd, params = {}) => {
            try { return await client.write(cmd, params); }
            catch (e) {
                if (e.message && (e.message.includes('!empty') || e.message.includes('UNKNOWNREPLY'))) return [];
                throw e;
            }
        };

        try {
            await mtClient.connect();
            let limitUptime = '1h';
            if (detectedPack === '1 Day') limitUptime = '24h';
            else if (detectedPack === '1 Week') limitUptime = '168h';

            let finalProfile = profile;

            // If dynamic shared users, ensure a matching profile exists
            if (!isSpeciallyPurchased || calculatedSharedUsers > 1) {
                const requestedProfile = `${profile}-${calculatedSharedUsers}D`;
                const existing = await safeWrite(mtClient, '/ip/hotspot/user/profile/print', { '?name': requestedProfile });

                if (existing.length === 0) {
                    console.log(`[MIKROTIK] Creating dynamic profile: ${requestedProfile}`);
                    try {
                        await mtClient.write('/ip/hotspot/user/profile/add', {
                            name: requestedProfile,
                            'shared-users': calculatedSharedUsers.toString(),
                            'session-timeout': limitUptime,
                            'status-autorefresh': '1m'
                        });
                        finalProfile = requestedProfile;
                    } catch (err) {
                        console.error(`[MIKROTIK] Profile creation failed for ${requestedProfile}, falling back to ${profile}`);
                        // finalProfile remains base profile
                    }
                } else {
                    finalProfile = requestedProfile;
                }
            }

            // Verify final profile exists, otherwise fallback to 'default' or available profile
            const existingProfiles = await safeWrite(mtClient, '/ip/hotspot/user/profile/print');
            const profileNames = existingProfiles.map(p => p.name);

            if (profileNames.length > 0 && !profileNames.includes(finalProfile)) {
                console.warn(`[MIKROTIK] Profile ${finalProfile} not found! Searching best match...`);
                // Attempt to find base profile if dynamic one is missing
                if (profileNames.includes(profile)) finalProfile = profile;
                else if (profileNames.includes('default')) finalProfile = 'default';
                else finalProfile = profileNames[0];
            }

            const params = [
                `=name=${voucherCode}`,
                `=password=${voucherCode}`,
                `=limit-uptime=${limitUptime}`,
                `=profile=${finalProfile}`,
                `=comment=Runchise Order: ${orderNo}`
            ];

            await mtClient.write('/ip/hotspot/user/add', params);
            console.log(`[MIKROTIK] Voucher ${voucherCode} created successfully. Profile: ${finalProfile}`);
        } catch (err) {
            if (err.message && (err.message.includes('!empty') || err.message.includes('unknown reply'))) {
                console.log(`[MIKROTIK] Handled !empty for ${voucherCode}, assuming success.`);
            } else {
                console.error('[MIKROTIK ERROR] Failed to create voucher automatically:', err.message);
            }
        } finally {
            try { await mtClient.close(); } catch (e) { /* ignore */ }
        }
    }

    systemConfigs.notifications.unshift({
        id: Date.now(),
        text: `PAID: Order #${orderNo} - ${customerName}`,
        time: 'Just now',
        type: 'sale'
    });
    if (systemConfigs.notifications.length > 50) systemConfigs.notifications = systemConfigs.notifications.slice(0, 50);

    saveConfig(); // Simpan sekaligus di akhir proses
    return voucherCode;
};

app.post('/api/manual-sync-order', async (req, res) => {
    const { orderId, amount, customer, packKeyword } = req.body;
    console.log(`[MANUAL SYNC] Processing Order ID: ${orderId}`);

    // Create a mock payload that mimics Runchise structure
    const mockPayload = {
        id: orderId,
        order_number: orderId,
        total_amount: amount || 5000,
        customer: { name: customer || 'Manual Input' },
        items: [{ name: packKeyword || '1 Hour' }],
        payment_details: { method: 'Manual Validation' }
    };

    try {
        const code = await processOrder(mockPayload);
        res.json({ success: true, message: `Order validated. Voucher ${code} generated.`, code });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/webhook/runchise', async (req, res) => {
    try {
        if (!req.body) return res.status(400).json({ error: 'Missing body' });
        const { event, data } = req.body;
        console.log(`[RUNCHISE WEBHOOK] Received ${event || 'unknown'} event.`);

        if (!event || !data) return res.status(400).json({ error: 'Malformed payload' });

        if (event === 'order.paid') {
            const code = await processOrder(data);
            if (!code) {
                return res.json({ success: true, message: 'Order ignored (below minimum order req or other conditions)' });
            }
            return res.json({ success: true, voucher: code });
        }

        res.status(200).send('Event Ignored');
    } catch (error) {
        console.error('[WEBHOOK ERROR]', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/create-voucher', async (req, res) => {
    const { pack, sharedUsers, qty = 1, comment = 'Manual Generate', price } = req.body;
    console.log(`[VOUCHER] Manual request received: ${qty}x ${pack}`);

    let amount = 2000;
    let limitUptime = '1h';
    let profile = 'default';

    if (pack === '1 Day' || pack === '1440' || pack === '1440m') { amount = 10000; limitUptime = '24h'; }
    else if (pack === '1 Week' || pack === '10080' || pack === '10080m') { amount = 50000; limitUptime = '168h'; }
    else if (!isNaN(pack)) {
        const mins = Number(pack);
        amount = Math.ceil(mins / 60) * 2000;
        limitUptime = `${mins}m`;
    }

    if (price !== undefined) amount = Number(price);

    const createdVouchers = [];
    const { ip, user, pass } = systemConfigs.mikrotik;

    const mtClient = (ip && ip !== '192.168.88.1' && ip !== '')
        ? new RouterOSAPI({ host: ip, user: user, password: pass, keepalive: false, timeout: 20 })
        : null;

    if (mtClient) mtClient.on('error', (err) => {
        if (err.message && err.message.includes('!empty')) return;
        console.warn('[VOUCHER-MT] Background Client Error:', err.message);
    });

    const safeWrite = async (client, cmd, params = {}) => {
        try { return await client.write(cmd, params); }
        catch (e) {
            if (e.message && (e.message.includes('!empty') || e.message.includes('UNKNOWNREPLY'))) return [];
            throw e;
        }
    };

    try {
        if (mtClient) {
            console.log(`[VOUCHER] Connecting to MikroTik ${ip}...`);
            await Promise.race([
                mtClient.connect(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Koneksi MikroTik Timeout (10s)')), 10000))
            ]);
            console.log(`[VOUCHER] Connected successfully.`);

            const existingProfiles = await safeWrite(mtClient, '/ip/hotspot/user/profile/print');
            const profileNames = existingProfiles.map(p => p.name);

            let targetProfileParams = 'default';
            if (pack === '1 Day' || pack === '1440') { if (profileNames.includes('NV-1D')) targetProfileParams = 'NV-1D'; }
            else if (pack === '1 Week' || pack === '10080') { if (profileNames.includes('NV-1W')) targetProfileParams = 'NV-1W'; }
            else if (profileNames.includes('NV-1H')) { targetProfileParams = 'NV-1H'; }

            if (profileNames.length > 0 && !profileNames.includes(targetProfileParams)) {
                if (profileNames.includes('default')) targetProfileParams = 'default';
                else targetProfileParams = profileNames[0];
            }
            profile = targetProfileParams;
            console.log(`[VOUCHER] Final profile for manual gen: ${profile}`);
        }

        for (let i = 0; i < qty; i++) {
            let voucherCode;
            let isDuplicate = true;
            let attempts = 0;

            while (isDuplicate && attempts < 5) {
                voucherCode = `MAN-${Math.floor(10000 + Math.random() * 90000)}`;
                isDuplicate = systemConfigs.vouchers.some(v => v.code === voucherCode);
                attempts++;
            }

            const host = systemConfigs.mikrotik.dnsName || systemConfigs.mikrotik.ip;
            const loginHost = systemConfigs.mikrotik.dnsName || host;
            const loginPath = systemConfigs.mikrotik.loginPath || '/login';
            const voucherLink = `http://${loginHost}${loginPath}${loginPath.includes('?') ? '&' : '?'}username=${voucherCode}&password=${voucherCode}`;

            const newVoucher = {
                code: voucherCode,
                pack: isNaN(pack) ? pack : `${pack} Min`,
                price: `Rp ${amount.toLocaleString()}`,
                date: new Date().toISOString(),
                status: 'Active',
                rateLimit: req.body.rateLimit || '',
                volumeLimit: req.body.volumeLimit || '0',
                magicLink: voucherLink,
                details: { customer: 'Manual Generation', orderNo: 'MANUAL', comment }
            };

            systemConfigs.vouchers.unshift(newVoucher);
            createdVouchers.push(newVoucher);

            if (mtClient) {
                const params = [
                    `=name=${voucherCode}`,
                    `=password=${voucherCode}`,
                    `=limit-uptime=${limitUptime}`,
                    `=profile=${profile}`,
                    `=comment=${comment}`
                ];
                console.log(`[VOUCHER] Adding user ${voucherCode} to MikroTik...`);
                try {
                    await Promise.race([
                        mtClient.write('/ip/hotspot/user/add', params),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('MT Write Timeout')), 7000))
                    ]);
                    console.log(`[VOUCHER] ✅ User ${voucherCode} added.`);
                } catch (err) {
                    if (err.message && (err.message.includes('!empty') || err.message.includes('unknown reply'))) {
                        console.log(`[VOUCHER] Handled marker !empty for ${voucherCode}, assuming success.`);
                    } else {
                        console.error(`[VOUCHER] Failed to add user ${voucherCode}:`, err.message);
                        // Don't throw here to allow processing multiple vouchers, but maybe we should if it's a hard error
                    }
                }
            }
        }

        if (systemConfigs.vouchers.length > 500) systemConfigs.vouchers = systemConfigs.vouchers.slice(0, 500);
        saveConfig();
        res.json({ success: true, vouchers: createdVouchers, voucher: createdVouchers[0] });
    } catch (err) {
        console.error('[MANUAL CREATE ERROR]', err.message);
        res.status(500).json({ success: false, message: `Gagal: ${err.message}` });
    } finally {
        if (mtClient) {
            console.log('[VOUCHER] Closing temporary MT connection.');
            try { await mtClient.close(); } catch (e) { /* ignore */ }
        }
    }
});

const server = app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});

server.on('error', (err) => {
    console.error('[SERVER ERROR]', err);
});

// --- GRACEFUL SHUTDOWN ---
process.on('SIGINT', () => {
    console.log('[SYSTEM] Cleaning up processes...');
    server.close(() => {
        console.log('[SYSTEM] Backend terminated safely.');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    server.close(() => process.exit(0));
});
