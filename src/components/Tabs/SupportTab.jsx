import React from 'react';
import { 
  Cpu, HardDrive, HelpCircle, Wifi, Server, Zap, Ticket, MessageSquare 
} from 'lucide-react';

const SupportTab = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in zoom-in-95 duration-700 pb-20">
      <div className="bg-gradient-to-br from-[#121929]/80 to-blue-950/20 backdrop-blur-3xl border border-white/[0.08] rounded-[3.5rem] p-12 lg:p-16 text-center relative overflow-hidden shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 right-0 p-12 opacity-[0.05] rotate-12 scale-150"><Cpu size={280} className="text-blue-500" /></div>
        <div className="absolute bottom-0 left-0 p-12 opacity-[0.03] -rotate-12 scale-150"><HardDrive size={280} className="text-indigo-500" /></div>

        <div className="relative z-10">
          <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mb-10 mx-auto shadow-2xl shadow-blue-500/40 ring-4 ring-white/5">
            <HelpCircle size={48} className="text-white" />
          </div>
          <h2 className="text-5xl font-black text-white tracking-tight mb-6">Technical Infrastructure</h2>
          <p className="text-slate-400 text-xl font-medium max-w-3xl mx-auto leading-relaxed">
            Langkah konfigurasi teknis untuk mengintegrasikan <span className="text-blue-400 font-black">NetVocher Enterprise</span> ke dalam ekosistem jaringan Anda secara optimal.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#151D2F] border border-white/[0.05] rounded-[2.5rem] p-8 hover:border-pink-500/30 transition-all group">
          <div className="w-12 h-12 rounded-2xl bg-pink-500/10 text-pink-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Wifi size={24} />
          </div>
          <h3 className="text-xl font-black text-white mb-4">1. Setup MikroTik LAN & DNS</h3>
          <div className="space-y-4 text-xs text-slate-400 leading-relaxed font-medium">
            <div className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0 font-bold">1</span>
              <p><span className="text-white font-bold">IP &gt; Address:</span> Beri IP <code className="bg-black/40 px-1.5 py-0.5 rounded text-pink-300">10.5.50.1/24</code> ke interface yang mengarah ke AP (contoh: ether9).</p>
            </div>
            <div className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0 font-bold">2</span>
              <p><span className="text-white font-bold">IP &gt; DNS:</span> Aktifkan <span className="text-pink-400 font-bold">Allow Remote Requests</span> agar pelanggan bisa resolve domain.</p>
            </div>
            <div className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0 font-bold">3</span>
              <p><span className="text-white font-bold">Firewall NAT:</span> Pastikan ada rule <code className="bg-black/40 px-1.5 py-0.5 rounded text-pink-300">chain=srcnat action=masquerade</code> agar internet mengalir ke WiFi.</p>
            </div>
          </div>
        </div>

        <div className="bg-[#151D2F] border border-white/[0.05] rounded-[2.5rem] p-8 hover:border-blue-500/30 transition-all group">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Server size={24} />
          </div>
          <h3 className="text-xl font-black text-white mb-4">2. Setup Port & Hotspot</h3>
          <div className="space-y-4 text-xs text-slate-400 leading-relaxed font-medium">
            <div className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 font-bold">1</span>
              <p><span className="text-white font-bold">IP &gt; Hotspot:</span> Jalankan <span className="text-blue-400 font-bold">Hotspot Setup</span> pada interface ether9 (atau port AP).</p>
            </div>
            <div className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 font-bold">2</span>
              <p><span className="text-white font-bold">DNS Name:</span> Isi dengan <code className="bg-black/40 px-1.5 py-0.5 rounded text-blue-300">samsstudio.local</code>. Hindari domain .net/.com agar tak bentrok dengan internet.</p>
            </div>
            <div className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 font-bold">3</span>
              <p><span className="text-white font-bold">API Service:</span> Pastikan <code className="bg-black/40 px-1.5 py-0.5 rounded text-blue-300">/ip service enable api</code> port 8728 aktif untuk sinkronisasi dashboard.</p>
            </div>
          </div>
        </div>

        <div className="bg-[#151D2F] border border-white/[0.05] rounded-[2.5rem] p-8 hover:border-emerald-500/30 transition-all group">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Zap size={24} />
          </div>
          <h3 className="text-xl font-black text-white mb-4">3. Integrasi Runchise POS</h3>
          <div className="space-y-4 text-xs text-slate-400 leading-relaxed font-medium">
            <div className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold">1</span>
              <p>Copy Webhook URL dari menu Settings: <code className="bg-black/40 px-1.5 py-0.5 rounded text-emerald-300">/webhook/runchise</code>.</p>
            </div>
            <div className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold">2</span>
              <p>Tempel URL tersebut ke Dashboard Runchise (Settings {">"} Webhooks) untuk notifikasi pembayaran.</p>
            </div>
            <div className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold">3</span>
              <p>Gunakan <span className="text-emerald-400 font-bold">Mapping Aturan</span> di dashboard ini untuk menghubungkan Item POS dengan Profil WiFi.</p>
            </div>
          </div>
        </div>

        <div className="bg-[#151D2F] border border-white/[0.05] rounded-[2.5rem] p-8 hover:border-indigo-500/30 transition-all group">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Ticket size={24} />
          </div>
          <h3 className="text-xl font-black text-white mb-4">4. Cetak & Otomatisasi</h3>
          <div className="space-y-4 text-xs text-slate-400 leading-relaxed font-medium">
            <div className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 font-bold">1</span>
              <p>Setiap pesanan di Runchise akan otomatis menghasilkan voucher unik (QR Code) di tab <span className="text-indigo-400 font-bold">Vouchers</span>.</p>
            </div>
            <div className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 font-bold">2</span>
              <p>Pembuatan manual kini lebih praktis: Cukup tentukan <span className="text-indigo-400 font-bold">Jumlah</span> dan <span className="text-white font-bold">Pilih Paket WiFi</span> yang tersedia.</p>
            </div>
            <div className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 font-bold">3</span>
              <p>Voucher akan tetap aktif sesuai durasi masa berlaku yang ditentukan pada sistem WiFi MikroTik.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#151D2F] border border-white/[0.05] rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center text-slate-500 border border-white/5">
            <MessageSquare size={30} />
          </div>
          <div>
            <h4 className="text-lg font-black text-white uppercase tracking-tight">Butuh Bantuan Langsung?</h4>
            <p className="text-sm text-slate-500 font-medium">Hubungi teknisi kami untuk bantuan remote atau onsite.</p>
          </div>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer" className="flex-1 md:flex-none px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-3 active:scale-95">
            <Zap size={18} />
            WhatsApp Support
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0B1320] border border-white/[0.03] rounded-3xl p-6 text-center">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Build Version</p>
          <p className="text-lg font-black text-white tracking-widest">v3.3.1-PRO</p>
        </div>
        <div className="bg-[#0B1320] border border-white/[0.03] rounded-3xl p-6 text-center">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Platform Node</p>
          <p className="text-lg font-black text-blue-400">Enterprise Edition</p>
        </div>
        <div className="bg-[#0B1320] border border-white/[0.03] rounded-3xl p-6 text-center">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">API Security</p>
          <p className="text-lg font-black text-emerald-400">SSL Encrypted</p>
        </div>
      </div>
    </div>
  );
};

export default SupportTab;
