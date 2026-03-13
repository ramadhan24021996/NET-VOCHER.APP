import { systemDb, voucherDb, activityDb } from '../../db_manager.js';

/**
 * Service untuk mengelola Konfigurasi (IP, Auth, Packages) di SQLite.
 */
export const ConfigService = {
    get: () => {
        const row = systemDb.prepare('SELECT data FROM config WHERE id = ?').get('main_config');
        return row ? JSON.parse(row.data) : null;
    },
    save: (type, config) => {
        const currentData = ConfigService.get() || {};
        currentData[type] = { ...currentData[type], ...config };
        systemDb.prepare('INSERT OR REPLACE INTO config (id, data) VALUES (?, ?)').run('main_config', JSON.stringify(currentData));
        return true;
    }
};

/**
 * Service untuk mengelola Voucher di SQLite.
 */
export const VoucherService = {
    getAll: (filterDate) => {
        if (!filterDate) {
            return voucherDb.prepare('SELECT * FROM vouchers ORDER BY date DESC').all();
        }
        // Logic filter date di SQLite:
        // voucher date is ISO -> 2026-03-11T...
        return voucherDb.prepare("SELECT * FROM vouchers WHERE date LIKE ? ORDER BY date DESC").all(`${filterDate}%`);
    },
    save: (voucher) => {
        const stmt = voucherDb.prepare(`
            INSERT OR REPLACE INTO vouchers 
            (code, pack, price, date, status, rateLimit, volumeLimit, magicLink, details) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(
            voucher.code,
            voucher.pack,
            voucher.price,
            voucher.date,
            voucher.status,
            voucher.rateLimit || '',
            voucher.volumeLimit || '0',
            voucher.magicLink || '',
            JSON.stringify(voucher.details || {})
        );
    },
    delete: (code) => {
        return voucherDb.prepare('DELETE FROM vouchers WHERE code = ?').run(code);
    },
    exists: (code) => {
        const row = voucherDb.prepare('SELECT 1 FROM vouchers WHERE code = ?').get(code);
        return !!row;
    },
    generateCode: (prefix = 'NV', suffix = '') => {
        let code;
        let attempts = 0;
        do {
            // Increase to 6 random digits for better entropy
            const num = Math.floor(100000 + Math.random() * 900000);
            code = `${prefix}-${num}${suffix ? '-' + suffix : ''}`;
            attempts++;
        } while (VoucherService.exists(code) && attempts < 50);
        
        if (attempts >= 50) {
            // Fallback: Add timestamp if we keep colliding
            code += '-' + Date.now().toString().slice(-4);
        }
        return code;
    }
};

/**
 * Service untuk Notifikasi & Log di SQLite.
 */
export const ActivityService = {
    getNotifs: () => {
        return activityDb.prepare('SELECT * FROM notifications ORDER BY id DESC LIMIT 50').all();
    },
    addNotif: (text, type = 'info') => {
        const stmt = activityDb.prepare('INSERT INTO notifications (id, text, time, type) VALUES (?, ?, ?, ?)');
        return stmt.run(Date.now(), text, 'Just now', type);
    },
    clearNotifs: () => {
        return activityDb.prepare('DELETE FROM notifications').run();
    },
    getLogs: () => {
        return activityDb.prepare('SELECT * FROM logs ORDER BY id DESC LIMIT 100').all();
    },
    addLog: (message, type = 'info') => {
        const stmt = activityDb.prepare('INSERT INTO logs (message, time, type) VALUES (?, ?, ?)');
        return stmt.run(message, new Date().toISOString(), type);
    }
};

/**
 * Service untuk mengelola Database Pelanggan.
 */
export const CustomerService = {
    getAll: () => {
        return voucherDb.prepare('SELECT * FROM customers ORDER BY last_visit DESC').all();
    },
    updateVisit: (mac, hostname, spend = 0) => {
        const existing = voucherDb.prepare('SELECT * FROM customers WHERE mac = ?').get(mac);
        if (existing) {
            voucherDb.prepare(`
                UPDATE customers SET 
                hostname = ?, 
                last_visit = ?, 
                total_vouchers = total_vouchers + 1,
                total_spend = total_spend + ?
                WHERE mac = ?
            `).run(hostname, new Date().toISOString(), spend, mac);
        } else {
            voucherDb.prepare(`
                INSERT INTO customers (mac, hostname, last_visit, total_vouchers, total_spend)
                VALUES (?, ?, ?, 1, ?)
            `).run(mac, hostname, new Date().toISOString(), spend);
        }
    }
};

/**
 * Service untuk mengelola Laporan Penjualan.
 */
export const SalesService = {
    add: (voucherCode, amount, mac, method = 'Automatic') => {
        const stmt = voucherDb.prepare(`
            INSERT INTO sales (voucher_code, amount, date, customer_mac, payment_method)
            VALUES (?, ?, ?, ?, ?)
        `);
        return stmt.run(voucherCode, amount, new Date().toISOString(), mac, method);
    },
    getSummary: (filterDate) => {
        const query = filterDate 
            ? "SELECT SUM(amount) as total FROM sales WHERE date LIKE ?" 
            : "SELECT SUM(amount) as total FROM sales";
        const row = filterDate 
            ? voucherDb.prepare(query).get(`${filterDate}%`) 
            : voucherDb.prepare(query).get();
        return row ? row.total || 0 : 0;
    }
};

