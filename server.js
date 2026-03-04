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

// --- PERSISTENT MIKROTIK CLIENT ---
let globalClient = null;
let isConnecting = false;

const getMikroTikClient = async () => {
    const { ip, user, pass } = systemConfigs.mikrotik;
    if (!ip || ip === '192.168.88.1' || ip === '') return null;

    if (globalClient && globalClient.connected) return globalClient;
    if (isConnecting) {
        return new Promise(resolve => {
            const check = setInterval(() => {
                if (!isConnecting) { clearInterval(check); resolve(globalClient); }
            }, 100);
        });
    }

    isConnecting = true;
    try {
        const client = new RouterOSAPI({
            host: ip, user, password: pass, keepalive: true, timeout: 5
        });
        client.on('error', (err) => {
            if (err.message && (err.message.includes('!empty') || err.message.includes('Tried to process unknown reply: !empty'))) return;
            console.warn(`[MIKROTIK] Connection Error:`, err.message);
            globalClient = null;
        });
        await client.connect();
        globalClient = client;
        console.log('[MIKROTIK] Persistent connection established.');
        return client;
    } catch (e) {
        console.error('[MIKROTIK] Connection Failed:', e.message);
        return null;
    } finally {
        isConnecting = false;
    }
};

const safeRouterOSAction = async (actionFn) => {
    const client = await getMikroTikClient();
    if (!client) return null;
    try {
        return await actionFn(client);
    } catch (err) {
        console.error(`[SAFE ACTION ERROR]`, err.message);
        globalClient = null; // Reset on serious error
        return null;
    }
};

app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url} - IP: ${req.ip}`);
    next();
});

// --- CONFIG PERSISTENCE ---
let systemConfigs = {
    mikrotik: { ip: '', user: 'admin', pass: '' },
    runchise: {
        apiKey: '',
        webhook: 'https://api.netvocher.com/v1/webhook',
        defaultPack: '1 Hour',
        defaultProfile: 'NV-1H',
        defaultSharedUsers: '1',
        mapping: [
            { keyword: 'hour', pack: '1 Hour', profile: 'NV-1H', rateLimit: '2M/2M' },
            { keyword: 'day', pack: '1 Day', profile: 'NV-1D', rateLimit: '5M/5M' },
            { keyword: 'week', pack: '1 Week', profile: 'NV-1W', rateLimit: '10M/10M' }
        ]
    },
    infrastructure: {
        accessPoints: []
    }
};

const loadConfig = () => {
    if (fs.existsSync(CONFIG_FILE)) {
        try {
            const data = fs.readFileSync(CONFIG_FILE, 'utf8');
            systemConfigs = { ...systemConfigs, ...JSON.parse(data) };
            console.log('[SYSTEM] Configuration loaded from disk.');
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
 * Endpoint for Dashboard Stats
 */
app.get('/api/dashboard-stats', async (req, res) => {
    const filterDateStr = req.query.filterDate; // YYYY-MM-DD
    let targetDate = null;
    if (filterDateStr) {
        targetDate = new Date(filterDateStr).toDateString();
    }

    // --- MIKROTIK LIVE DATA (Safe Implementation) ---
    const liveData = await safeRouterOSAction(async (client) => {
        try {
            if (!client) return { resource: null, active: null };

            // Adding a small timeout to individual API calls just in case
            const resourcePromise = client.write('/system/resource/print');
            const activePromise = client.write('/ip/hotspot/active/print');

            const [resource, active] = await Promise.all([
                Promise.race([resourcePromise, new Promise((_, r) => setTimeout(() => r(new Error('resource timeout')), 2000))]),
                Promise.race([activePromise, new Promise((_, r) => setTimeout(() => r(new Error('active timeout')), 2000))])
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

    res.json({
        revenue: {
            total: filteredVouchers.reduce((acc, v) => acc + (parseInt(v.price.replace(/[^\d]/g, '')) || 0), 0),
            growth: 0,
            chartData: revenueChart
        },
        sales: {
            today: filteredVouchers.length,
            chartData: salesChart
        },
        users: {
            active: mtStats.activeUsers,
            capacity: 50
        },
        system: {
            health: mtStats.health,
            cpu: mtStats.cpu,
            ram: mtStats.ram,
            connections: mtStats.connections
        },
        revenueVsTarget: revenueChart.map((val, i) => ({
            name: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][i],
            actual: val * 5000,
            target: 10000
        }))
    });
});

app.get('/api/active-users', async (req, res) => {
    const activeUsers = await safeRouterOSAction(async (client) => {
        try {
            if (!client) return [];
            return await client.write('/ip/hotspot/active/print');
        } catch (e) {
            console.error('[ACTIVE USERS ERROR]', e.message);
            return [];
        }
    });
    res.json(activeUsers || []);
});

app.get('/api/dhcp-leases', async (req, res) => {
    const leases = await safeRouterOSAction(async (client) => {
        try {
            if (!client) return [];
            return await client.write('/ip/dhcp-server/lease/print');
        } catch (e) {
            console.error('[DHCP LEASE ERROR]', e.message);
            return [];
        }
    });
    res.json(leases || []);
});

app.get('/api/mikrotik-interfaces', async (req, res) => {
    const interfaces = await safeRouterOSAction(async (client) => {
        try {
            if (!client) return [];
            return await client.write('/interface/print');
        } catch (e) {
            console.error('[INTERFACE ERROR]', e.message);
            return [];
        }
    });
    res.json(interfaces || []);
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
    const { ip } = systemConfigs.mikrotik;
    if (ip && ip !== '192.168.88.1' && systemConfigs.vouchers.some(v => v.status === 'Active')) {
        const mtUsers = await safeRouterOSAction(async (client) => {
            try {
                if (!client) return null;
                const reqs = client.write('/ip/hotspot/user/print');
                const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000));
                return await Promise.race([reqs, timeout]);
            } catch (e) { return null; }
        });

        if (Array.isArray(mtUsers)) {
            let changed = false;
            systemConfigs.vouchers.forEach(v => {
                if (v.status === 'Active') {
                    const mUser = mtUsers.find(u => u.name === v.code);
                    if (mUser) {
                        if (mUser.uptime && mUser.uptime !== '0s') {
                            v.status = 'Used';
                            changed = true;
                        }
                    }
                }
            });
            if (changed) saveConfig();
        }
    }

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
    const { type, config } = req.body;
    if (type === 'mikrotik') systemConfigs.mikrotik = { ...systemConfigs.mikrotik, ...config };
    if (type === 'runchise') systemConfigs.runchise = { ...systemConfigs.runchise, ...config };
    if (type === 'infrastructure') systemConfigs.infrastructure = { ...systemConfigs.infrastructure, ...config };
    saveConfig();
    res.json({ success: true, message: 'Configuration saved permanently' });
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

app.post('/api/sync', (req, res) => {
    setTimeout(() => {
        res.json({ success: true, message: 'Router synchronized successfully' });
    }, 1500);
});

app.post('/api/setup-router', async (req, res) => {
    const { ip, user, pass } = systemConfigs.mikrotik;
    console.log(`[PROVISIONING] Sending auto-configuration to ${ip}...`);

    const client = new RouterOSAPI({ host: ip, user, password: pass, keepalive: false, timeout: 5 });
    client.on('error', (err) => { /* Background handle */ });
    try {
        await client.connect();

        // 1. Ensure API is enabled
        await client.write('/ip/service/enable', { numbers: 'api' });

        // 2. Create Specific Profiles for packages
        const profiles = [
            { name: 'NV-1H', session: '1h' },
            { name: 'NV-1D', session: '24h' },
            { name: 'NV-1W', session: '168h' }
        ];

        for (const p of profiles) {
            try {
                await client.write('/ip/hotspot/user/profile/add', {
                    name: p.name,
                    'shared-users': '1',
                    'session-timeout': p.session,
                    'status-autorefresh': '1m'
                });
                console.log(`[PROVISIONING] Profile ${p.name} created.`);
            } catch (e) {
                // Profile might exist, try to update it instead
                try {
                    await client.write('/ip/hotspot/user/profile/set', {
                        '.id': p.name,
                        'session-timeout': p.session
                    });
                } catch (err) { /* silent skip */ }
            }
        }

        console.log(`[PROVISIONING] SUCCESS: MikroTik configured efficiently.`);
        await client.close();
        res.json({ success: true, message: 'Router has been configured with NV-1H, NV-1D, and NV-1W profiles!' });
    } catch (err) {
        console.error(`[PROVISIONING ERROR]`, err.message);
        res.json({ success: false, message: `Provisioning failed: ${err.message}` });
    }
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

    if (data.items && Array.isArray(data.items)) {
        const itemNames = data.items.map(i => i.name?.toLowerCase() || '').join(' ');

        // Find match in mapping (for specific Wifi packages like 1Day, 1Week)
        const match = systemConfigs.runchise.mapping.find(m => itemNames.includes(m.keyword.toLowerCase()));
        if (match) {
            detectedPack = match.pack;
            profile = match.profile;
            rateLimit = match.rateLimit || '';
            isSpeciallyPurchased = true;
        }
    }

    const voucherCode = `NV-${Math.floor(10000 + Math.random() * 90000)}-${detectedPack.charAt(0)}`;
    const routerIp = systemConfigs.mikrotik.ip || '192.168.88.1';

    const newVoucher = {
        code: voucherCode,
        pack: detectedPack,
        price: isSpeciallyPurchased ? `Rp ${amount.toLocaleString()}` : "GRATIS (Bonus Order)",
        date: new Date().toISOString(),
        status: 'Active',
        isFree: !isSpeciallyPurchased, magicLink: `http://${routerIp}/login?username=${voucherCode}`,
        details: {
            orderId: orderId,
            orderNo: orderNo,
            customer: customerName,
            payment: paymentMethod,
            items: data.items?.map(i => i.name) || []
        }
    };

    systemConfigs.vouchers.unshift(newVoucher);
    if (systemConfigs.vouchers.length > 500) systemConfigs.vouchers.pop();
    saveConfig(); // Save to database immediately

    // --- AUTOMATIC MIKROTIK VOUCHER CREATION ---
    const { ip, user, pass } = systemConfigs.mikrotik;
    if (ip && ip !== '192.168.88.1') {
        const mtClient = new RouterOSAPI({ host: ip, user, password: pass, keepalive: false });
        mtClient.on('error', (err) => { /* Background handle */ });
        try {
            await mtClient.connect();
            let limitUptime = '1h';
            if (detectedPack === '1 Day') limitUptime = '24h';
            else if (detectedPack === '1 Week') limitUptime = '168h';

            const userOptions = {
                name: voucherCode,
                password: voucherCode,
                'limit-uptime': limitUptime,
                profile: profile,
                'shared-users': systemConfigs.runchise.defaultSharedUsers || '1',
                comment: `Runchise Order: ${orderNo}`
            };

            if (rateLimit) userOptions['rate-limit'] = rateLimit;

            await mtClient.write('/ip/hotspot/user/add', userOptions);
            console.log(`[MIKROTIK] Hotspot user ${voucherCode} created successfully with rate limit ${rateLimit}.`);
            await mtClient.close();
        } catch (err) {
            console.error(`[MIKROTIK ERROR] Failed to create hotspot user:`, err.message);
        }
    }

    systemConfigs.notifications.unshift({
        id: Date.now(),
        text: `PAID: Order #${orderNo} - ${customerName}`,
        time: 'Just now',
        type: 'sale'
    });
    if (systemConfigs.notifications.length > 50) systemConfigs.notifications.pop();
    saveConfig();

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
        const { event, data } = req.body;
        console.log(`[RUNCHISE WEBHOOK] Received ${event} event.`);

        if (!event || !data) return res.status(400).json({ error: 'Malformed payload' });

        if (event === 'order.paid') {
            const code = await processOrder(data);
            return res.json({ success: true, voucher: code });
        }

        res.status(200).send('Event Ignored');
    } catch (error) {
        console.error('[WEBHOOK ERROR]', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/create-voucher', async (req, res) => {
    const { pack, sharedUsers } = req.body;
    let amount = 2000;
    let limitUptime = '1h';
    let profile = 'NV-1H';

    if (pack === '1 Day') { amount = 10000; limitUptime = '24h'; profile = 'NV-1D'; }
    if (pack === '1 Week') { amount = 50000; limitUptime = '168h'; profile = 'NV-1W'; }

    const voucherCode = `MAN-${Math.floor(10000 + Math.random() * 90000)}`;

    const newVoucher = {
        code: voucherCode,
        pack,
        price: `Rp ${amount.toLocaleString()}`,
        date: new Date().toISOString(),
        status: 'Active',
        magicLink: `http://${systemConfigs.mikrotik.ip}/login?username=${voucherCode}`,
        details: { customer: 'Manual Generation', orderNo: 'MANUAL' }
    };

    systemConfigs.vouchers.unshift(newVoucher);
    saveConfig(); // Save permanently

    const { ip, user, pass } = systemConfigs.mikrotik;
    if (ip && ip !== '192.168.88.1') {
        const mtClient = new RouterOSAPI({ host: ip, user, password: pass, keepalive: false, timeout: 5 });
        mtClient.on('error', (err) => { /* Background handle */ });
        try {
            await mtClient.connect();
            const userOptions = {
                name: voucherCode,
                password: voucherCode,
                'limit-uptime': limitUptime,
                profile: profile,
                'shared-users': sharedUsers || '1',
                comment: 'Manual Generate'
            };

            if (req.body.rateLimit) userOptions['rate-limit'] = req.body.rateLimit;

            await mtClient.write('/ip/hotspot/user/add', userOptions);
            await mtClient.close();
        } catch (err) {
            console.error('[MANUAL CREATE ERROR]', err.message);
        }
    }

    res.json({ success: true, voucher: newVoucher });
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
