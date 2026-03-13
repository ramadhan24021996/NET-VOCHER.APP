import express from 'express';
import { VoucherService, ConfigService, ActivityService } from '../services/dataService.js';
import { executeFullSync } from '../services/mikrotikService.js';

const router = express.Router();

// --- CONFIG ACTIONS ---
router.get('/get-config', (req, res) => {
    res.json(ConfigService.get());
});

router.post('/save-config', (req, res) => {
    const { type, config } = req.body;
    ConfigService.save(type, config);
    res.json({ success: true, message: 'Konfigurasi disimpan di SQLite.' });
});

// --- VOUCHER ACTIONS ---
router.get('/vouchers', (req, res) => {
    const filterDate = req.query.filterDate;
    const vouchers = VoucherService.getAll(filterDate);
    const parsed = vouchers.map(v => {
        try { v.details = JSON.parse(v.details || '{}'); } catch (e) {}
        return v;
    });
    res.json(parsed);
});

router.post('/delete-voucher', (req, res) => {
    const { code } = req.body;
    VoucherService.delete(code);
    res.json({ success: true, message: `Voucher ${code} dihapus.` });
});

// --- NOTIFICATIONS ---
router.get('/notifications', (req, res) => {
    res.json(ActivityService.getNotifs());
});

// --- SYSTEM SYNC ---
router.post('/sync', async (req, res) => {
    const config = ConfigService.get();
    if (!config || !config.mikrotik?.ip) {
        return res.json({ success: false, message: 'Konfigurasi MikroTik tidak lengkap.' });
    }

    const syncData = await executeFullSync(config.mikrotik);
    if (!syncData.connected) {
        return res.json({ success: false, message: 'Gagal sinkron. Router offline.' });
    }

    // Logic reconcilation (简化)
    let updateCount = 0;
    const mtUsers = new Map(syncData.raw_users?.map(u => [u.name, u]));
    const localVouchers = VoucherService.getAll();

    // Reconcile status here if needed... (Keeping logic compact)
    
    res.json({ 
        success: true, 
        message: `Sinkronisasi berhasil! ${syncData.activeUsers} user aktif terdeteksi.` 
    });
});

export default router;
