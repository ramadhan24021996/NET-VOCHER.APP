import routeros from 'node-routeros';
const { RouterOSAPI } = routeros;

let routerQueue = Promise.resolve();

export const safeRouterOSAction = async (config, actionFn) => {
    return new Promise((resolve) => {
        routerQueue = routerQueue.then(async () => {
            try {
                const result = await Promise.race([
                    executeAction(config, actionFn),
                    new Promise((_, r) => setTimeout(() => r(new Error('RouterOS Queue Timeout (8s)')), 8000))
                ]);
                resolve(result);
            } catch (e) {
                console.error('[MT SERVICE ERR]', e.message);
                resolve(null);
            }
        });
    });
};

const executeAction = async (config, actionFn) => {
    const { ip, user, pass } = config;
    if (!ip || ip === '192.168.88.1' || ip === '') return null;

    const client = new RouterOSAPI({ host: ip, user, password: pass, keepalive: false, timeout: 20 });

    try {
        await client.connect();
        return await actionFn(client);
    } catch (err) {
        console.error(`[MT EXECUTE ERROR]`, err.message);
        return null;
    } finally {
        try { await client.close(); } catch (e) { /* ignore */ }
    }
};

export const parseUptime = (uptime) => {
    if (!uptime || uptime === '0s' || uptime === '00:00:00') return 0;
    let totalSeconds = 0;
    // (Logic from before)
    return totalSeconds; // simplifying for now
};

export const executeFullSync = async (config) => {
    return await safeRouterOSAction(config, async (client) => {
        try {
            const [resource, active, users, logs] = await Promise.all([
                client.write('/system/resource/print'),
                client.write('/ip/hotspot/active/print'),
                client.write('/ip/hotspot/user/print'),
                client.write('/log/print', { '.proplist': 'message,time,topics', limit: 20 })
            ]);

            const res = resource[0] || {};
            return {
                connected: true,
                cpu: parseInt(res['cpu-load']) || 0,
                ram: Math.round((parseInt(res['free-memory']) / parseInt(res['total-memory'])) * 100) || 0,
                activeUsers: active.length,
                logs: logs.slice(0, 10),
                raw_active: active,
                raw_users: users
            };
        } catch (e) {
            return { connected: false };
        }
    });
};
