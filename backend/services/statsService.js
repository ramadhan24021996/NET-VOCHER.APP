import { voucherDb } from '../../db_manager.js';

/**
 * Service untuk menghitung statistik Dashboard (Penghasilan, User, dll).
 */
export const StatsService = {
  getDashboardStats: (filterDate) => {
    // 1. Ambil data voucher sesuai tanggal
    const vouchers = voucherDb.prepare("SELECT * FROM vouchers WHERE date LIKE ?").all(`${filterDate}%`);

    let totalRevenue = 0;
    let totalSales = 0;
    
    vouchers.forEach(v => {
      const price = parseInt(v.price.replace(/[^\d]/g, '')) || 0;
      totalRevenue += price;
      totalSales++;
    });

    // 2. Data Grafik (Hari ini vs Kemarin) - Sederhana lol
    const chartData = [
      { name: '00:00', sales: 0 },
      { name: '04:00', sales: 2 },
      { name: '08:00', sales: 12 },
      { name: '12:00', sales: 25 },
      { name: '16:00', sales: 18 },
      { name: '20:00', sales: 30 },
    ];

    return {
      overview: {
        revenue: `Rp ${totalRevenue.toLocaleString()}`,
        sales: totalSales,
        uptime: '99.9%',
        activeUsers: vouchers.filter(v => v.status === 'Used').length
      },
      chartData: chartData,
      system: {
        latency: '15ms',
        connected: true
      }
    };
  }
};
