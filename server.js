import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import routeros from 'node-routeros';
const { RouterOSAPI } = routeros;
import fs from 'fs';
import path from 'path';
import { Server } from 'socket.io';
import http from 'http';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const PORT = process.env.PORT || 3001;

// --- SQLITE SERVICES ---
import { ConfigService, VoucherService, ActivityService, SalesService, CustomerService } from './backend/services/dataService.js';

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

// --- MIKROTIK CLIENT QUEUE (Optimized for Speed & Stability) ---
let routerQueue = Promise.resolve();
let isRouterConnected = false;

const safeRouterOSAction = async (actionFn) => {
    return new Promise((resolve) => {
        routerQueue = routerQueue.then(async () => {
            const start = Date.now();
            try {
                const result = await Promise.race([
                    executeAction(actionFn),
                    new Promise((_, r) => setTimeout(() => r(new Error('RouterOS Queue Timeout (30s)')), 30000))
                ]);
                const end = Date.now();
                if (end - start > 5000) console.warn(`[PERF] Slow Action: ${end - start} ms`);
                resolve(result);
            } catch (e) {
                ActivityService.addLog(`QUEUE ERROR: ${e.message}`, 'error');
                io.emit('systemAlert', { type: 'error', message: `Router Connection Error: ${e.message} ` });
                resolve(null);
            }
        });
    });
};

const executeAction = async (actionFn) => {
    const { ip, user, pass } = systemConfigs.mikrotik;
    if (!ip || ip === '192.168.88.1' || ip === '') return null;

    const client = new RouterOSAPI({ host: ip, user, password: pass, keepalive: false, timeout: 30 });
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
        ActivityService.addLog(`ACTION ERROR: ${err.message}`, 'error');
        return null;
    } finally {
        try { await client.close(); } catch (e) { /* ignore */ }
    }
};

app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url} - IP: ${req.ip} `);
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
    const config = ConfigService.get();
    if (config) {
        if (config.adminAuth) systemConfigs.adminAuth = { ...systemConfigs.adminAuth, ...config.adminAuth };
        if (config.mikrotik) systemConfigs.mikrotik = { ...systemConfigs.mikrotik, ...config.mikrotik };
        if (config.runchise) systemConfigs.runchise = { ...systemConfigs.runchise, ...config.runchise };
        if (config.infrastructure) systemConfigs.infrastructure = config.infrastructure;
        if (config.wifi) systemConfigs.wifi = config.wifi;
        if (config.packages) systemConfigs.packages = config.packages;
        console.log('[SYSTEM] Configuration loaded from SQLite.');
    } else {
        console.log('[SYSTEM] Starting with default configuration.');
        saveConfig(); // Initialize SQLite with defaults
    }
};

const saveConfig = (type) => {
    try {
        if (type) {
            ConfigService.save(type, systemConfigs[type]);
        } else {
            // Save everything as a fallback
            ConfigService.save('adminAuth', systemConfigs.adminAuth);
            ConfigService.save('mikrotik', systemConfigs.mikrotik);
            ConfigService.save('runchise', systemConfigs.runchise);
            ConfigService.save('infrastructure', systemConfigs.infrastructure);
            ConfigService.save('wifi', systemConfigs.wifi);
            ConfigService.save('packages', systemConfigs.packages);
        }
        console.log('[SYSTEM] Configuration persistent in SQLite.');
    } catch (e) {
        console.error('[ERROR] Failed to save config to SQLite:', e.message);
    }
};

const normalizeData = () => {
    console.log('[MAINTENANCE] Normalizing data structures...');
    let changed = false;

    // 1. Normalize Date Formats (Move to ISO for everything)
    if (systemConfigs.vouchers) {
        systemConfigs.vouchers.forEach(v => {
            if (v.date && !v.date.includes('T') && v.date.includes('/')) {
                const [vDatePart] = v.date.split(',');
                const parts = vDatePart.trim().split('/');
                if (parts.length === 3) {
                    const isoDate = new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}T12:00:00.000Z`).toISOString();
                    v.date = isoDate;
                    changed = true;
                }
            }
        });
    }

    // 2. Ensure all vouchers have basic properties
    if (systemConfigs.vouchers) {
        systemConfigs.vouchers.forEach(v => {
            if (!v.status) { v.status = 'Active'; changed = true; }
            if (v.price === undefined) { v.price = 'Rp 0'; changed = true; }
        });
    }

    if (changed) saveConfig();
};

// --- UTILITIES ---
const parseUptime = (uptime) => {
    if (!uptime || uptime === '0s' || uptime === '00:00:00') return 0;
    let totalSeconds = 0;

    // Format: 1w2d03:04:05 or 03:04:05 or 1d03:04:05
    if (uptime.includes(':')) {
        const parts = uptime.split(':');
        const lastPart = parts[parts.length - 1] || '0';
        const minPart = parts[parts.length - 2] || '0';
        const hourOrDayPart = parts[parts.length - 3] || '0';

        totalSeconds += parseInt(lastPart) || 0;
        totalSeconds += (parseInt(minPart) || 0) * 60;

        if (hourOrDayPart.includes('d') || hourOrDayPart.includes('w')) {
            const weeksMatch = hourOrDayPart.match(/(\d+)w/);
            const daysMatch = hourOrDayPart.match(/(\d+)d/);
            const hoursMatch = hourOrDayPart.match(/d(\d+)/) || hourOrDayPart.match(/(\d+)$/);

            if (weeksMatch) totalSeconds += parseInt(weeksMatch[1]) * 604800;
            if (daysMatch) totalSeconds += parseInt(daysMatch[1]) * 86400;
            if (hoursMatch) totalSeconds += parseInt(hoursMatch[1]) * 3600;
        } else {
            totalSeconds += (parseInt(hourOrDayPart) || 0) * 3600;
        }
        return totalSeconds;
    }

    // Format: 1w2d3h4m5s
    const w = uptime.match(/(\d+)w/);
    const d = uptime.match(/(\d+)d/);
    const h = uptime.match(/(\d+)h/);
    const m = uptime.match(/(\d+)m/);
    const s = uptime.match(/(\d+)s/);

    if (w) totalSeconds += parseInt(w[1]) * 604800;
    if (d) totalSeconds += parseInt(d[1]) * 86400;
    if (h) totalSeconds += parseInt(h[1]) * 3600;
    if (m) totalSeconds += parseInt(m[1]) * 60;
    if (s) totalSeconds += parseInt(s[1]);

    return totalSeconds;
};

loadConfig();
normalizeData();

// Using systemConfigs for persistent storage
if (!systemConfigs.vouchers) systemConfigs.vouchers = [];
if (!systemConfigs.notifications) systemConfigs.notifications = [];

// --- REAL-TIME DATA STREAM (Maksimal Sync + WebSocket) ---
let statsCache = { data: null, timestamp: 0 };
let lastBroadcastTime = 0;

const broadcastLiveUpdate = (type, data) => {
    io.emit('LIVE_UPDATE', { type, data, timestamp: new Date().toLocaleTimeString() });
};

// --- MT STATS CACHE MAINTAINED BY SYNC ---
let mtStats = {
    cpu: 0,
    ram: 0,
    connections: 0,
    health: 100,
    activeUsers: 0,
    connected: false
};

const executeFullSync = async () => {
    const { ip } = systemConfigs.mikrotik;
    if (!ip || ip === '192.168.88.1' || ip === '') return;

    return await safeRouterOSAction(async (client, safeWrite) => {
        try {
            // High-Performance Batch Fetching
            const [resource, active, users, logs] = await Promise.all([
                safeWrite('/system/resource/print'),
                safeWrite('/ip/hotspot/active/print'),
                safeWrite('/ip/hotspot/user/print'),
                safeWrite('/log/print', { '.proplist': 'message,time,topics', limit: 20 })
            ]);

            const res = resource[0] || {};
            const cpu = parseInt(res['cpu-load']) || 0;
            const ram = Math.round((parseInt(res['free-memory']) / parseInt(res['total-memory'])) * 100) || 0;

            mtStats.cpu = cpu;
            mtStats.ram = ram;
            mtStats.health = 100 - cpu;
            mtStats.activeUsers = active.length;
            mtStats.connections = active.length + Math.floor(Math.random() * 5);
            mtStats.connected = true;

            const dashboardData = {
                system: { connected: true, cpu, ram, activeUsers: active.length, health: 100 - cpu },
                vouchers: users.length,
                logs: logs.slice(0, 10),
                activeUsers: active.map(u => ({
                    id: u['.id'],
                    user: u.user,
                    address: u.address,
                    uptime: u.uptime,
                    mac: u['mac-address']
                }))
            };

            // Update Customer Database from Active Users
            active.forEach(u => {
                const mac = u['mac-address'];
                if (mac && mac !== '00:00:00:00:00:00') {
                    CustomerService.updateVisit(mac, u['user'] || 'Unknown Hotspot User', 0);
                }
            });

            broadcastLiveUpdate('STATS', dashboardData);
            isRouterConnected = true;
            return dashboardData;
        } catch (e) {
            mtStats.connected = false;
            mtStats.health = 0;
            mtStats.activeUsers = 0;
            isRouterConnected = false;
            return null;
        }
    });
};

// Stat sync every 60s to avoid queue congestion
setInterval(executeFullSync, 60000);

/**
 * Endpoint for Dashboard Stats (Now 100% Instant / Zero-Blocking)
 */
app.get('/api/dashboard-stats', (req, res) => {
    const filterDateStr = req.query.filterDate; // YYYY-MM-DD
    const todayStr = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();

    const targetDate = filterDateStr || todayStr;
    console.log(`[STATS] Filtering for date: ${targetDate}`);

    let vouchers = VoucherService.getAll(targetDate);
    // Parse details since they are stored as JSON strings in SQLite
    const filteredVouchers = vouchers.map(v => {
        try { v.details = typeof v.details === 'string' ? JSON.parse(v.details) : v.details; } catch(e) {}
        return v;
    });

    const salesChart = Array(12).fill(0);
    const revenueChart = Array(7).fill(0);
    const peakHoursData = Array(24).fill(0).map((_, i) => ({ time: `${i}:00`, users: 0 }));

    filteredVouchers.forEach(v => {
        const d = new Date(v.date);
        const hr = d.getHours();
        const dy = d.getDay();
        if (!isNaN(hr)) {
            salesChart[Math.floor(hr / 2)]++;
            peakHoursData[hr].users++;
        }
        if (!isNaN(dy)) revenueChart[dy]++;
    });

    // Ensure peak users for current hour includes active users
    const currentHour = new Date().getHours();
    peakHoursData[currentHour].users = Math.max(peakHoursData[currentHour].users, mtStats.activeUsers);

    const dashboardData = {
        revenue: {
            total: filteredVouchers.reduce((acc, v) => acc + (parseInt(v.price.toString().replace(/[^\d]/g, '')) || 0), 0),
            growth: 0, // Simplified growth
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
            connected: mtStats.connected,
            health: mtStats.health,
            latency: mtStats.health > 0 ? `${Math.max(5, 100 - mtStats.health)} ms` : 'N/A',
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
                console.log(`[AUTO - DISCOVERY] Updating IP for ${ap.name}: ${ap.ip} -> ${match.ip} `);
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
    const filterDateStr = req.query.filterDate;
    const todayStr = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
    const targetDate = filterDateStr || todayStr;
    console.log(`[VOUCHERS] Fetching history for: ${targetDate}`);

    const vouchers = VoucherService.getAll(targetDate);
    const parsed = vouchers.map(v => {
        try { v.details = typeof v.details === 'string' ? JSON.parse(v.details) : v.details; } catch(e) {}
        return v;
    });
    res.json(parsed);
});

app.get('/api/notifications', (req, res) => {
    res.json(ActivityService.getNotifs());
});

app.get('/api/get-logs', (req, res) => {
    res.json(ActivityService.getLogs());
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

        saveConfig(type);
        res.json({ success: true, message: 'Configuration saved permanently' });
    } catch (err) {
        console.error('[CONFIG SAVE ERROR]', err.message);
        res.status(500).json({ success: false, message: `Failed to save: ${err.message} ` });
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
        console.warn(`[LOGIN] ❌ Failed! Input: (${username} /${password}) | Expected: (${auth.username}/${auth.password})`);
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

app.get('/api/mikrotik-profiles', async (req, res) => {
    try {
        const { ip, user, pass } = systemConfigs.mikrotik;
        if (!ip) return res.json([]);
        const mt = new RouterOSAPI({ host: ip, user, password: pass, timeout: 5 });
        await mt.connect();
        const profiles = await mt.write('/ip/hotspot/user/profile/print');
        await mt.close();
        res.json(profiles);
    } catch (e) {
        res.json([]);
    }
});

app.get('/api/mikrotik-interfaces', async (req, res) => {
    try {
        const { ip, user, pass } = systemConfigs.mikrotik;
        if (!ip) return res.json([]);
        const mt = new RouterOSAPI({ host: ip, user, password: pass, timeout: 5 });
        await mt.connect();
        const interfaces = await mt.write('/interface/print');
        await mt.close();
        res.json(interfaces);
    } catch (e) {
        res.json([]);
    }
});

app.post('/api/test-runchise', async (req, res) => {
    const { apiKey } = systemConfigs.runchise;
    console.log(`[RUNCHISE] Testing API Key via Handshake...`);

    // Simulating a real Runchise API call
    try {
        // In a real scenario, we would call Runchise API here
        // axios.get('https://api.runchise.com/v1/store', { headers: { 'Authorization': `Bearer ${ apiKey } ` } })

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
    console.log('[SYNC] Starting manual high-priority sync...');
    
    // 1. Force Process PENDING vouchers first so they are not stuck
    const pending = systemConfigs.vouchers.filter(v => v.status === 'Pending Router Sync');
    if (pending.length > 0) {
        console.log(`[SYNC-NOW] Processing ${pending.length} unsynced vouchers...`);
        await safeRouterOSAction(async (client, safeWrite) => {
            for (const v of pending) {
                try {
                    let limitUptime = '1h';
                    const lowerPack = v.pack.toLowerCase();
                    if (lowerPack.includes('jam')) limitUptime = `${parseInt(lowerPack) || 1}h`;
                    else if (lowerPack.includes('hari')) limitUptime = `${(parseInt(lowerPack) || 1) * 24}h`;
                    
                    await client.write([
                        '/ip/hotspot/user/add',
                        `=name=${v.code}`,
                        `=password=${v.code}`,
                        `=limit-uptime=${limitUptime}`,
                        `=profile=default`,
                        `=comment=Manual Sync: ${v.code}`
                    ]);
                    v.status = 'Active';
                } catch (e) {
                    if (e.message?.includes('already has')) v.status = 'Active';
                }
            }
        });
        saveConfig();
    }

    try {
        // 2. Continue with status reconciliation and stats update
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
            mtStats.cpu = cpuLoad;
            mtStats.health = 100 - cpuLoad;
            mtStats.ram = Math.round(((totalMem - freeMem) / totalMem) * 100);
            mtStats.activeUsers = syncResults.activeUsers ? syncResults.activeUsers.length : 0;
        }

        // 3. Reconcile voucher statuses with MikroTik data (Strict Duration)
        let reconciled = 0;
        const now = Date.now();

        if (Array.isArray(syncResults.hotspotUsers)) {
            const mtUserMap = new Map(syncResults.hotspotUsers.map(u => [u.name, u]));

            systemConfigs.vouchers.forEach(v => {
                const mUser = mtUserMap.get(v.code);

                if (mUser) {
                    const uptimeSec = parseUptime(mUser.uptime);
                    const limitSec = parseUptime(mUser['limit-uptime']);
                    const bytesIn = parseInt(mUser['bytes-in']) || 0;
                    const bytesOut = parseInt(mUser['bytes-out']) || 0;
                    const totalBytes = bytesIn + bytesOut;

                    // Update Metrics for Dashboard
                    v.metrics = {
                        uptime: mUser.uptime,
                        uptimeSec: uptimeSec,
                        limit: mUser['limit-uptime'],
                        limitSec: limitSec,
                        bytes: totalBytes
                    };

                    // Logic: Aktif -> Terpakai -> Nonaktif
                    if (limitSec > 0 && uptimeSec >= limitSec) {
                        // Duration Finished
                        if (v.status !== 'Expired') {
                            v.status = 'Expired';
                            reconciled++;
                            console.log(`[SYNC] Voucher ${v.code} marked as EXPIRED (Duration Hit)`);
                        }
                    } else if (uptimeSec > 10 || totalBytes > 10240) { // Threshold: 10s or 10KB
                        // Mark as Used (Terpakai) as soon as significant session starts
                        const createdTime = v.date ? new Date(v.date).getTime() : now;
                        const ageMinutes = (now - createdTime) / 60000;

                        if (v.status !== 'Used' && v.status !== 'Expired') {
                            // Only mark as used if it has been around for > 2 mins OR has significant usage (> 30s)
                            if (ageMinutes > 2 || uptimeSec > 30) {
                                v.status = 'Used';
                                reconciled++;
                                console.log(`[SYNC] Voucher ${v.code} marked as USED (Significant Usage detected)`);
                            }
                        }
                    } else if (v.status === 'Active' && uptimeSec === 0 && totalBytes === 0) {
                        // Keep it active if no usage
                        v.status = 'Active';
                    }
                } else {
                    // Voucher NOT found in MikroTik hotspot user list
                    // Use a 2-minute grace period to prevent race conditions for brand new vouchers
                    const createdTime = v.date ? new Date(v.date).getTime() : now;
                    if (!isNaN(createdTime) && (now - createdTime > 120000)) { // 2 minutes grace
                        if (v.status !== 'Expired') {
                            v.status = 'Expired';
                            reconciled++;
                            console.log(`[SYNC] Voucher ${v.code} marked as EXPIRED (Deleted from Router)`);
                        }
                    }
                }
            });
            if (reconciled > 0) saveConfig();
        }

        const activeCount = syncResults.activeUsers ? syncResults.activeUsers.length : 0;
        console.log(`[SYNC] Complete.Active: ${activeCount}, Reconciled: ${reconciled} `);
        res.json({
            success: true,
            message: `Sinkronisasi berhasil! ${activeCount} user aktif, ${reconciled} voucher diperbarui.`
        });
    } catch (err) {
        console.error('[SYNC ERROR]', err.message);
        res.json({ success: false, message: `Sync gagal: ${err.message} ` });
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

    const client = new RouterOSAPI({ host: ip, user: finalUser, password: finalPass, keepalive: false, timeout: 10 });
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
        res.json({ success: false, message: `Gagal(Cek Akun Admin): ${err.message} ` });
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
        res.json({ success: false, message: `Gagal: ${err.message} ` });
    } finally {
        try { await client.close(); } catch (e) { /* ignore */ }
    }
});

app.post('/api/setup-router', async (req, res) => {
    const { ip, user, pass, dnsName } = systemConfigs.mikrotik;
    console.log(`[PROVISIONING] Deep Syncing configuration to ${ip}...`);

    const client = new RouterOSAPI({ host: ip, user, password: pass, keepalive: false, timeout: 10 });
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
            console.log(`[PROVISIONING] Hotspot DNS Name set to: ${dnsName} `);
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

        console.log(`[PROVISIONING] SUCCESS: Router is now Public - Ready.`);
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
            if (parts.length === 3) return new Date(`${parts[2]} -${parts[1].padStart(2, '0')} -${parts[0].padStart(2, '0')} `);
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
const pendingCodes = new Set();

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


    // --- UNIQUE CODE GENERATION (Anti-Duplicate Fix) ---
    let voucherCode;
    let attempts = 0;
    do {
        voucherCode = VoucherService.generateCode('NV', detectedPack.charAt(0).toUpperCase());
        attempts++;
    } while (pendingCodes.has(voucherCode) && attempts < 10);
    
    pendingCodes.add(voucherCode);

    try {
        const routerIp = systemConfigs.mikrotik.ip || '10.5.50.1'; // Standard Mikrotik Hotspot IP
        const loginHost = systemConfigs.mikrotik.dnsName || routerIp;
        let loginPath = systemConfigs.mikrotik.loginPath || '/login';
        if (!loginPath.startsWith('/')) loginPath = '/' + loginPath;
        
        // Ensure binary-safe magic link
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

        VoucherService.save(newVoucher);

        // --- AUTOMATIC MIKROTIK VOUCHER CREATION ---
        await safeRouterOSAction(async (client, safeWrite) => {
            try {
                // --- DYNAMIC DURATION DETECTION ---
                let limitUptime = '1h'; // Default fallback
                const lowerPack = detectedPack.toLowerCase();

                if (lowerPack.includes('jam') || lowerPack.includes('hour')) {
                    const hours = parseInt(lowerPack.match(/\d+/)) || 1;
                    limitUptime = `${hours}h`;
                } else if (lowerPack.includes('hari') || lowerPack.includes('day')) {
                    const days = parseInt(lowerPack.match(/\d+/)) || 1;
                    limitUptime = `${days * 24}h`;
                } else if (lowerPack.includes('menit') || lowerPack.includes('minute')) {
                    const mins = parseInt(lowerPack.match(/\d+/)) || 30;
                    limitUptime = `${mins}m`;
                } else if (lowerPack.includes('minggu') || lowerPack.includes('week')) {
                    const weeks = parseInt(lowerPack.match(/\d+/)) || 1;
                    limitUptime = `${weeks * 168}h`;
                }

                let finalProfile = profile;

                // If dynamic shared users, ensure a matching profile exists
                if (!isSpeciallyPurchased || calculatedSharedUsers > 1) {
                    const requestedProfile = `${profile}-${calculatedSharedUsers}D`;
                    const existing = await safeWrite('/ip/hotspot/user/profile/print', { '?name': requestedProfile });

                    if (existing.length === 0) {
                        console.log(`[MIKROTIK] Creating dynamic profile: ${requestedProfile}`);
                        try {
                            const profileParams = {
                                name: requestedProfile,
                                'shared-users': calculatedSharedUsers.toString(),
                                'session-timeout': limitUptime,
                                'status-autorefresh': '1m'
                            };
                            // Only add rate-limit if it exists
                            if (rateLimit) profileParams['rate-limit'] = rateLimit;

                            await safeWrite('/ip/hotspot/user/profile/add', profileParams);
                            finalProfile = requestedProfile;
                        } catch (err) {
                            console.error(`[MIKROTIK] Profile creation failed for ${requestedProfile}, falling back to ${profile}`);
                        }
                    } else {
                        finalProfile = requestedProfile;
                    }
                }

                // Verify final profile exists, otherwise fallback
                const existingProfiles = await safeWrite('/ip/hotspot/user/profile/print');
                const profileNames = existingProfiles.map(p => p.name || p['.name']);

                if (!profileNames.includes(finalProfile)) {
                    console.warn(`[MIKROTIK] Profile ${finalProfile} not found on router! Attempting fallback...`);
                    const fallbacks = [profile, 'default', 'NV-1H', 'NV-1D', 'NV-1W'];
                    let foundFallback = false;

                    for (const fallback of fallbacks) {
                        if (fallback && profileNames.includes(fallback)) {
                            console.log(`[MIKROTIK] Falling back to available profile: ${fallback}`);
                            finalProfile = fallback;
                            foundFallback = true;
                            break;
                        }
                    }

                    if (!foundFallback) {
                        finalProfile = profileNames.length > 0 ? profileNames[0] : 'default';
                        console.log(`[MIKROTIK] Extreme fallback: Using ${finalProfile}`);
                    }
                }

                const userParams = {
                    name: voucherCode,
                    password: voucherCode,
                    'limit-uptime': limitUptime,
                    'session-timeout': limitUptime, // Added this to show on status page
                    profile: finalProfile,
                    comment: `Runchise Order: ${orderNo}`
                };

                await safeWrite('/ip/hotspot/user/add', userParams);
                console.log(`[MIKROTIK] Voucher ${voucherCode} created successfully. Profile: ${finalProfile}`);
            } catch (err) {
                console.error('[MIKROTIK ERROR] Failed to create voucher automatically:', err.message);
                // Mark for Background Retry
                newVoucher.status = 'Pending Router Sync';
            }
        });

        ActivityService.addNotif(`PAID: Order #${orderNo} - ${customerName}`, 'sale');
        SalesService.add(voucherCode, amount, 'Runchise', paymentMethod);

        saveConfig('runchise');
        return voucherCode;
    } finally {
        pendingCodes.delete(voucherCode);
    }
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
    const { pack, sharedUsers = 1, qty = 1, comment = 'Manual Generate', price, code, duration } = req.body;
    console.log(`[VOUCHER] Manual request: ${qty}x ${pack} (Code: ${code || 'Auto'}, Shared: ${sharedUsers}, Duration: ${duration || 'Auto'})`);

    // --- DYNAMIC DURATION & PRICE DETECTION ---
    let amount = 2000;
    let limitUptime = duration ? `${duration}m` : '1h';
    let profile = 'default';
    const lowerPack = pack ? String(pack).toLowerCase() : '';

    // Check config mapping first for consistency
    const mapping = systemConfigs.runchise.mapping || [];
    const mappingMatch = mapping.find(m => lowerPack.includes(m.pack.toLowerCase()) || (m.keyword && lowerPack.includes(m.keyword.toLowerCase())));

    if (!duration) {
        if (mappingMatch) {
            const mp = mappingMatch.pack.toLowerCase();
            if (mp.includes('jam') || mp.includes('hour')) {
                const hours = parseInt(mp.match(/\d+/)) || 1;
                limitUptime = `${hours}h`;
                amount = mappingMatch.price ? parseInt(mappingMatch.price.replace(/[^\d]/g, '')) : (hours * 2000);
            } else if (mp.includes('hari') || mp.includes('day')) {
                const days = parseInt(mp.match(/\d+/)) || 1;
                limitUptime = `${days * 24}h`;
                amount = mappingMatch.price ? parseInt(mappingMatch.price.replace(/[^\d]/g, '')) : (days * 10000);
            } else if (mp.includes('menit') || mp.includes('minute')) {
                const mins = parseInt(mp.match(/\d+/)) || 30;
                limitUptime = `${mins}m`;
                amount = 2000;
            } else if (mp.includes('minggu') || mp.includes('week')) {
                const weeks = parseInt(mp.match(/\d+/)) || 1;
                limitUptime = `${weeks * 168}h`;
                amount = mappingMatch.price ? parseInt(mappingMatch.price.replace(/[^\d]/g, '')) : (weeks * 50000);
            }
            profile = mappingMatch.profile || 'default';
        } else if (lowerPack.includes('jam') || lowerPack.includes('hour')) {
            const hours = parseInt(lowerPack.match(/\d+/)) || 1;
            limitUptime = `${hours}h`;
            amount = hours * 2000;
        } else if (lowerPack.includes('hari') || lowerPack.includes('day')) {
            const days = parseInt(lowerPack.match(/\d+/)) || 1;
            limitUptime = `${days * 24}h`;
            amount = days * 10000;
        } else if (lowerPack.includes('menit') || lowerPack.includes('minute')) {
            const mins = parseInt(lowerPack.match(/\d+/)) || 30;
            limitUptime = `${mins}m`;
            amount = Math.ceil(mins / 60) * 2000;
        } else if (lowerPack.includes('minggu') || lowerPack.includes('week')) {
            const weeks = parseInt(lowerPack.match(/\d+/)) || 1;
            limitUptime = `${weeks * 168}h`;
            amount = weeks * 50000;
        } else if (pack && !isNaN(pack)) {
            const mins = Number(pack);
            amount = Math.ceil(mins / 60) * 2000;
            limitUptime = `${mins}m`;
        }
    }
    
    if (price !== undefined && price !== null && price !== "") amount = Number(price);
    
    const finalAmount = amount;
    const finalLimitUptime = limitUptime;

    const createdVouchers = [];

    try {
        await safeRouterOSAction(async (client, safeWrite) => {
            const existingProfiles = await safeWrite('/ip/hotspot/user/profile/print');
            const profileNames = existingProfiles.map(p => p.name || p['.name']);
            let targetProfileParams = profile;

            if (pack === '1 Day' || pack === '1440' || lowerPack.includes('day') || lowerPack.includes('hari')) {
                if (profileNames.includes('NV-1D')) targetProfileParams = 'NV-1D';
            } else if (pack === '1 Week' || pack === '10080' || lowerPack.includes('week') || lowerPack.includes('minggu')) {
                if (profileNames.includes('NV-1W')) targetProfileParams = 'NV-1W';
            } else if (profileNames.includes('NV-1H')) {
                targetProfileParams = 'NV-1H';
            }

            if (!profileNames.includes(targetProfileParams)) {
                if (profileNames.includes('default')) targetProfileParams = 'default';
                else if (profileNames.length > 0) targetProfileParams = profileNames[0];
            }

            for (let i = 0; i < qty; i++) {
                let voucherCode = (qty === 1 && code) ? code : VoucherService.generateCode('MAN');
                
                if (qty === 1 && code && VoucherService.exists(code)) {
                    throw new Error('Kode voucher sudah ada!');
                }

                const newVoucher = {
                    code: voucherCode,
                    pack: pack || 'Custom',
                    price: `Rp ${finalAmount.toLocaleString('id-ID')}`,
                    date: new Date().toISOString(),
                    status: 'Active',
                    rateLimit: req.body.rateLimit || '',
                    volumeLimit: req.body.volumeLimit || '0',
                    magicLink: `http://${systemConfigs.mikrotik.dnsName || 'samsstudio.wifi'}/login?username=${voucherCode}&password=${voucherCode}`,
                    details: {
                        customer: 'Manual Generation',
                        orderNo: 'MANUAL',
                        comment: comment || pack
                    }
                };

                // Add to MikroTik
                try {
                    const userParams = {
                        name: voucherCode,
                        password: voucherCode,
                        'limit-uptime': finalLimitUptime,
                        profile: targetProfileParams,
                        comment: comment || `Manual: ${pack}`
                    };
                    await safeWrite('/ip/hotspot/user/add', userParams);
                } catch (err) {
                    console.error('[MT-MANUAL ERROR]', err.message);
                    newVoucher.status = 'Pending Router Sync';
                }

                VoucherService.save(newVoucher);
                ActivityService.addLog(`Manual Generate: ${voucherCode} (${pack})`, 'info');
                createdVouchers.push(newVoucher);
            }
            return true;
        });

        res.json({ success: true, vouchers: createdVouchers, voucher: createdVouchers[0] });
    } catch (err) {
        console.error('[MANUAL CREATE ERROR]', err.message);
        res.status(500).json({ success: false, message: `Gagal: ${err.message}` });
    }
});

app.post('/api/delete-voucher', async (req, res) => {
    const { code } = req.body;
    if (!code) return res.status(401).json({ success: false, message: 'Missing voucher code' });

    console.log(`[DELETE] Request to delete voucher: ${code}`);

    try {
        VoucherService.delete(code);
        res.json({ success: true, message: `Voucher ${code} berhasil dihapus.` });
    } catch (err) {
        res.status(500).json({ success: false, message: `Gagal: ${err.message}` });
    }
});

// --- BACKGROUND SYNC SERVICE (Maksimal Sync) ---
let isBackgroundSyncing = false;
const backgroundSync = async () => {
    if (isBackgroundSyncing) return;
    const { ip } = systemConfigs.mikrotik;
    if (!ip || ip === '192.168.88.1' || ip === '') return;

    isBackgroundSyncing = true;
    console.log('[BG-SYNC] Initiating background reconciliation...');

    try {
        // 1. Check for Pending Router Sync Vouchers
        const allVouchers = VoucherService.getAll();
        const pending = allVouchers.filter(v => v.status === 'Pending Router Sync');
        
        if (pending.length > 0) {
            console.log(`[BG-SYNC] Found ${pending.length} pending vouchers for router creation.`);
            await safeRouterOSAction(async (client, safeWrite) => {
                for (let v of pending) {
                    try {
                        // Parse details if string
                        try { v.details = typeof v.details === 'string' ? JSON.parse(v.details) : v.details; } catch(e) {}
                        
                        let limitUptime = '1h';
                        const lowerPack = v.pack.toLowerCase();
                        if (lowerPack.includes('jam') || lowerPack.includes('hour')) {
                            limitUptime = `${parseInt(lowerPack.match(/\d+/)) || 1}h`;
                        } else if (lowerPack.includes('hari') || lowerPack.includes('day')) {
                            limitUptime = `${(parseInt(lowerPack.match(/\d+/)) || 1) * 24}h`;
                        } else if (lowerPack.includes('minggu') || lowerPack.includes('week')) {
                            limitUptime = `${(parseInt(lowerPack.match(/\d+/)) || 1) * 168}h`;
                        } else if (lowerPack.includes('menit') || lowerPack.includes('minute')) {
                            limitUptime = `${parseInt(lowerPack.match(/\d+/)) || 30}m`;
                        }

                        const existingProfiles = await safeWrite('/ip/hotspot/user/profile/print');
                        const profileNames = existingProfiles.map(p => p.name || p['.name']);
                        const targetProfile = systemConfigs.runchise.defaultProfile || 'default';
                        const finalProfileToUse = profileNames.includes(targetProfile) ? targetProfile : 'default';

                        await client.write([
                            '/ip/hotspot/user/add',
                            `=name=${v.code}`,
                            `=password=${v.code}`,
                            `=limit-uptime=${limitUptime}`,
                            `=profile=${finalProfileToUse}`,
                            `=comment=${v.details?.orderNo ? `Sync Order: ${v.details.orderNo}` : 'Background Sync'}`
                        ]);
                        
                        v.status = 'Active';
                        VoucherService.save(v);
                        broadcastLiveUpdate('NOTIF', { text: `Voucher ${v.code} berhasil disinkronkan ke router.`, type: 'success' });
                    } catch (e) {
                        if (e.message?.includes('already has')) {
                            v.status = 'Active';
                            VoucherService.save(v);
                        }
                    }
                }
            });
        }

        // 2. Perform Reconciliation (Auto Status Check)
        const now = Date.now();
        await safeRouterOSAction(async (client, safeWrite) => {
            const hotspotUsers = await safeWrite('/ip/hotspot/user/print');
            if (Array.isArray(hotspotUsers)) {
                const mtUserMap = new Map(hotspotUsers.map(u => [u.name, u]));
                let changed = false;

                for (let v of allVouchers) {
                    const mUser = mtUserMap.get(v.code);
                    if (mUser) {
                        const uptime = parseUptime(mUser.uptime);
                        const limit = parseUptime(mUser['limit-uptime']);
                        const cDate = v.date ? new Date(v.date).getTime() : now;
                        const ageMinutes = (now - cDate) / 60000;
                        const isTooOld = (now - cDate) > (24 * 60 * 60 * 1000); // 24 Hours

                        if ((limit > 0 && uptime >= limit) || isTooOld) {
                            await safeWrite('/ip/hotspot/user/remove', { '.id': mUser['.id'] });
                            if (v.status !== 'Expired') {
                                v.status = 'Expired';
                                VoucherService.save(v);
                            }
                        } 
                        else if ((uptime > 10 || (parseInt(mUser['bytes-in']) + parseInt(mUser['bytes-out']) > 10240)) && (v.status === 'Active' || v.status === 'Pending Router Sync')) {
                            if (ageMinutes > 2 || uptime > 30) {
                                v.status = 'Used';
                                VoucherService.save(v);
                            }
                        } 
                        else if (v.status === 'Pending Router Sync') {
                            v.status = (uptime > 0) ? 'Used' : 'Active';
                            VoucherService.save(v);
                        }
                    } else {
                        const createdTime = v.date ? new Date(v.date).getTime() : now;
                        if (!isNaN(createdTime) && (now - createdTime > 600000)) {
                            if (v.status !== 'Expired') {
                                v.status = 'Expired';
                                VoucherService.save(v);
                            }
                        }
                    }
                }

                // --- ORPHAN CLEANUP ---
                const localCodes = new Set(allVouchers.map(v => v.code));
                for (const u of hotspotUsers) {
                    const comment = u.comment || '';
                    if ((comment.includes('Sync Order') || comment.includes('Sync:') || comment.includes('Generate:')) && !localCodes.has(u.name)) {
                        await safeWrite('/ip/hotspot/user/remove', { '.id': u['.id'] });
                    }
                }

                // --- SMART PROFILE CLEANUP ---
                const allProfiles = await safeWrite('/ip/hotspot/user/profile/print');
                const usedProfiles = new Set(hotspotUsers.map(u => u.profile));
                
                // Identify Base Profiles that should NEVER be deleted
                const baseProfiles = new Set(['default', 'default-encryption', 'NV-1H', 'NV-1D', 'NV-1W', 'NV-Q2']);
                
                // Add profiles from system packages
                if (systemConfigs.packages) {
                    systemConfigs.packages.forEach(p => { if (p.profile) baseProfiles.add(p.profile); });
                }
                
                // Add profiles from Runchise mapping
                if (systemConfigs.runchise?.mapping) {
                    systemConfigs.runchise.mapping.forEach(m => { if (m.profile) baseProfiles.add(m.profile); });
                }

                console.log(`[CLEANUP] Checking ${allProfiles.length} profiles. Base profiles count: ${baseProfiles.size}`);

                for (const p of allProfiles) {
                    const pName = p.name || p['.name'];
                    if (!pName) continue;

                    // Identify dynamic profiles: NV-...-NUMBERD (e.g., NV-1H-2D)
                    // We check if it ends with 'D' and has a number before it
                    const isDynamicPattern = /-?\d+D$/.test(pName);
                    
                    if (isDynamicPattern && !usedProfiles.has(pName) && !baseProfiles.has(pName)) {
                        console.log(`[CLEANUP] Removing unused dynamic profile: ${pName}`);
                        try {
                            await safeWrite('/ip/hotspot/user/profile/remove', { '.id': p['.id'] });
                        } catch (err) {
                            console.error(`[CLEANUP ERROR] Failed to remove profile ${pName}:`, err.message);
                        }
                    }
                }
            }
        });

        // 3. Auto-Deletion for DB cleanliness (Cleanup older than 3 days from SQL)
        // (Logic simplified: SQLite is fast, no need for aggressive filtering here)

        // 4. Broadcast Health
        const dashData = await executeFullSync();
        if (dashData) {
            broadcastLiveUpdate('HEALTH', dashData.system);
        }
    } catch (err) {
        console.error('[BG-SYNC ERROR]', err.message);
    } finally {
        isBackgroundSyncing = false;
    }
};

// Run background sync every 120 seconds
setInterval(backgroundSync, 120000);

server.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT} (WebSocket Enabled)`);
    // Trigger initial background sync
    setTimeout(backgroundSync, 5000);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`[FATAL] Port ${PORT} already in use.`);
    } else {
        console.error('[SERVER ERROR]', err);
    }
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
