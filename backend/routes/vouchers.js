import express from 'express';
import { VoucherService } from '../services/dataService.js';
import { safeRouterOSAction, ConfigService } from '../services/dataService.js'; // need to fix imports lol
// wait, VoucherService is in dataService.
// I'll fix the imports in the actual file.

const router = express.Router();

// GET /api/vouchers
router.get('/', (req, res) => {
    const filterDate = req.query.filterDate;
    try {
        const vouchers = VoucherService.getAll(filterDate);
        // Parsing details dari string JSON di SQLite ke Object
        const parsed = vouchers.map(v => {
            try { 
                v.details = JSON.parse(v.details || '{}');
                return v;
            } catch (e) { return v; }
        });
        res.json(parsed);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

export default router;
