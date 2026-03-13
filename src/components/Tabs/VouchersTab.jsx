import React from 'react';
import { 
  FileText, Zap, RefreshCw, Plus, Printer, XCircle, AlertTriangle 
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import VoucherTable from '../Vouchers/VoucherTable';

const VouchersTab = ({
  orderIdInput,
  setOrderIdInput,
  handleManualSync,
  isSyncingOrder,
  showManualGen,
  setShowManualGen,
  manualGenQty,
  setManualGenQty,
  isCustomManual,
  setIsCustomManual,
  manualGenLabel,
  setManualGenLabel,
  manualGenDur,
  setManualGenDur,
  manualGenPrice,
  setManualGenPrice,
  manualGenSpeed,
  setManualGenSpeed,
  manualGenCode,
  setManualGenCode,
  manualGenLimit,
  setManualGenLimit,
  genVolumeLimit,
  setGenVolumeLimit,
  handlePremiumManualGen,
  isGeneratingVoucher,
  vouchers,
  handleSync,
  isSyncing,
  lastSync,
  handleDeleteVoucher,
  selectedVoucher,
  setSelectedVoucher,
  rcConfig
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* VOUCHER MANAGEMENT CONTROLS */}
      <div className="bg-[#151D2F] border border-[#26314A] rounded-3xl p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FileText size={20} className="text-blue-500 group-focus-within:text-blue-400 transition-colors" />
              </div>
              <input
                type="text"
                value={orderIdInput}
                onChange={(e) => setOrderIdInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualSync()}
                placeholder="Ketik Order ID dari Sistem POS..."
                className="w-full bg-[#0B1320] border-2 border-[#26314A] focus:border-blue-500 rounded-[1.25rem] pl-12 pr-6 py-5 text-white placeholder-slate-600 outline-none transition-all shadow-inner font-medium"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={handleManualSync}
              disabled={isSyncingOrder}
              className="flex-1 md:flex-none px-10 py-5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black text-sm uppercase tracking-widest rounded-[1.25rem] transition-all shadow-xl shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isSyncingOrder ? <RefreshCw className="animate-spin" size={20} /> : <Zap size={20} />}
              PROSES ORDER
            </button>

            <button
              onClick={() => setShowManualGen(!showManualGen)}
              className={`p-5 rounded-[1.25rem] border-2 transition-all active:scale-95 flex items-center justify-center shadow-lg ${showManualGen ? 'bg-blue-600 border-blue-400 text-white' : 'bg-[#1A233A] border-[#26314A] text-slate-400 hover:border-slate-500'}`}
            >
              <Plus size={24} className={`transition-transform duration-300 ${showManualGen ? 'rotate-45' : ''}`} />
            </button>
          </div>
        </div>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-4 pl-2 opacity-50">
          Tekan <span className="text-white">Enter</span> pada keyboard untuk memproses secara otomatis.
        </p>
      </div>

      {/* MANUAL GENERATOR CARD */}
      {showManualGen && (
        <div className="bg-[#151D2F] border-2 border-blue-500/20 rounded-[2.5rem] p-10 shadow-3xl animate-in zoom-in-95 slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-5 mb-10">
            <div className="p-3 bg-blue-500 font-black text-white rounded-2xl shadow-lg shadow-blue-500/20">
              <Plus size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Generator Manual</h2>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1">Manual Hotspot Creation Flow</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Jumlah Voucher</label>
              <input
                type="number"
                value={manualGenQty}
                onChange={(e) => setManualGenQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-[#0B1320] border-2 border-[#26314A] focus:border-blue-500 rounded-2xl px-5 py-4 text-white font-bold outline-none transition-all shadow-inner"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Pilih Paket WiFi</label>
              <select
                value={isCustomManual ? "CUSTOM" : (manualGenLabel && rcConfig.mapping?.find(m => m.pack === manualGenLabel) ? manualGenLabel : "")}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'CUSTOM') {
                    setIsCustomManual(true);
                    setManualGenLabel('Paket Custom');
                    setManualGenDur(60);
                    setManualGenPrice(2000);
                    setManualGenSpeed('2M/5M');
                    return;
                  }
                  setIsCustomManual(false);
                  const selected = rcConfig.mapping?.find(m => m.pack === val);
                  if (selected) {
                    setManualGenLabel(selected.pack);
                    setManualGenSpeed(selected.rateLimit || '');
                    setGenVolumeLimit(selected.volumeLimit || '0');
                    if (selected.price) setManualGenPrice(parseInt(selected.price.replace(/[^\d]/g, '')) || 2000);
                    if (selected.sharedUsers) setManualGenLimit(parseInt(selected.sharedUsers) || 1);

                    const lower = selected.pack.toLowerCase();
                    if (lower.includes('jam') || lower.includes('hour')) {
                      setManualGenDur(parseInt(lower.match(/\d+/)) * 60 || 60);
                    } else if (lower.includes('hari') || lower.includes('day')) {
                      setManualGenDur(parseInt(lower.match(/\d+/)) * 1440 || 1440);
                    } else if (lower.includes('menit') || lower.includes('minute')) {
                      setManualGenDur(parseInt(lower.match(/\d+/)) || 30);
                    }
                  }
                }}
                className="w-full bg-[#0B1320] border-2 border-[#26314A] focus:border-blue-500 rounded-2xl px-5 py-4 text-white font-bold outline-none transition-all shadow-inner appearance-none custom-select"
              >
                <option value="">-- Pilih Paket Tersedia --</option>
                {rcConfig.mapping?.map((m, i) => (
                  <option key={i} value={m.pack}>{m.pack} ({m.rateLimit || 'Std'})</option>
                ))}
                <option value="CUSTOM">-- INPUT MANUAL / CUSTOM --</option>
              </select>
            </div>

            {isCustomManual && (
              <>
                <div className="md:col-span-1 space-y-3">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Durasi (Menit)</label>
                  <input
                    type="number"
                    value={manualGenDur}
                    onChange={(e) => setManualGenDur(e.target.value)}
                    placeholder="Contoh: 60"
                    className="w-full bg-[#0B1320] border-2 border-[#26314A] focus:border-blue-500 rounded-2xl px-5 py-4 text-white font-bold outline-none transition-all shadow-inner"
                  />
                </div>
                <div className="md:col-span-1 space-y-3">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Harga (Angka)</label>
                  <input
                    type="number"
                    value={manualGenPrice}
                    onChange={(e) => setManualGenPrice(e.target.value)}
                    placeholder="Contoh: 5000"
                    className="w-full bg-[#0B1320] border-2 border-[#26314A] focus:border-blue-500 rounded-2xl px-5 py-4 text-white font-bold outline-none transition-all shadow-inner"
                  />
                </div>
                <div className="md:col-span-1 space-y-3">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Speed / Bandwidth</label>
                  <input
                    type="text"
                    value={manualGenSpeed}
                    onChange={(e) => setManualGenSpeed(e.target.value)}
                    placeholder="Contoh: 5M/10M"
                    className="w-full bg-[#0B1320] border-2 border-[#26314A] focus:border-blue-500 rounded-2xl px-5 py-4 text-white font-bold outline-none transition-all shadow-inner"
                  />
                </div>
              </>
            )}

            <div className="md:col-span-1 space-y-3">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Custom Kode (Opsional)</label>
              <input
                type="text"
                value={manualGenCode}
                onChange={(e) => setManualGenCode(e.target.value.toUpperCase())}
                placeholder="Ex: GOKIL50 atau Biarkan Kosong"
                className="w-full bg-[#0B1320] border-2 border-[#26314A] focus:border-blue-500 rounded-2xl px-5 py-4 text-white font-bold outline-none transition-all shadow-inner"
              />
            </div>

            <div className="md:col-span-1 space-y-3">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Keterangan Manual (Opsional)</label>
              <input
                type="text"
                value={manualGenLabel}
                onChange={(e) => setManualGenLabel(e.target.value)}
                placeholder="Nama Paket atau Keterangan Tambahan..."
                className="w-full bg-[#0B1320] border-2 border-[#26314A] focus:border-blue-500 rounded-2xl px-5 py-4 text-white font-bold outline-none transition-all shadow-inner"
              />
            </div>
          </div>

          <div className="flex justify-end mt-12">
            <button
              onClick={handlePremiumManualGen}
              disabled={isGeneratingVoucher}
              className="px-12 py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm uppercase tracking-widest rounded-2xl transition-all shadow-2xl shadow-indigo-600/30 active:scale-95 flex items-center gap-3"
            >
              {isGeneratingVoucher ? <RefreshCw className="animate-spin" size={20} /> : <Zap size={20} />}
              GENERATE & AKTIFKAN
            </button>
          </div>
        </div>
      )}

      {/* VOUCHER TABLE CARD */}
      <VoucherTable 
        vouchers={vouchers}
        handleSync={handleSync}
        isSyncing={isSyncing}
        lastSync={lastSync}
        handleDeleteVoucher={handleDeleteVoucher}
        setSelectedVoucher={setSelectedVoucher}
      />

      {/* VOUCHER DETAIL MODAL */}
      {selectedVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedVoucher(null)}>
          <div className="bg-[#151D2F] border border-[#26314A] rounded-[2.5rem] w-full max-w-[320px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 px-6 pt-5 pb-4 text-center relative">
              <button
                onClick={() => setSelectedVoucher(null)}
                className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors p-1"
              >
                <XCircle size={20} />
              </button>

              <div className="inline-block bg-white p-2.5 rounded-2xl shadow-xl mb-2">
                <QRCodeSVG value={selectedVoucher.magicLink || selectedVoucher.code} size={100} />
              </div>
              <h3 className="text-white font-black text-xl tracking-tighter leading-none mb-1">{selectedVoucher.code}</h3>
              <p className="text-blue-100/60 text-[10px] font-bold uppercase tracking-[0.2em]">{selectedVoucher.pack}</p>

              <div className="mt-3 px-3 py-1.5 bg-amber-500/20 border border-amber-500/30 rounded-xl flex items-center justify-center gap-2">
                <AlertTriangle size={12} className="text-amber-400 shrink-0" />
                <p className="text-[9px] text-amber-200 font-bold uppercase">Sambungkan ke WiFi sebelum Scan!</p>
              </div>
            </div>

            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#0B1320] rounded-xl border border-[#26314A]">
                  <p className={`font-bold text-[12px] ${
                    selectedVoucher.status === 'Expired' ? 'text-amber-500' : 'text-emerald-400'
                  }`}>{
                    selectedVoucher.status === 'Expired' ? 'Terpakai' : 'Aktif'
                  }</p>
                </div>
                <div className="p-3 bg-[#0B1320] rounded-xl border border-[#26314A]">
                  <p className="text-[9px] text-slate-500 font-bold uppercase mb-0.5">Sudah Digunakan</p>
                  <p className="text-white font-bold text-[12px]">{selectedVoucher.metrics?.uptime || '0s'}</p>
                </div>
                <div className="p-3 bg-[#1A233A] rounded-xl border border-blue-500/20">
                  <p className="text-[9px] text-slate-500 font-bold uppercase mb-0.5">Speed Limit</p>
                  <p className="text-indigo-400 font-bold text-[12px]">{selectedVoucher.rateLimit || 'No Limit'}</p>
                </div>
                <div className="p-3 bg-[#1A233A] rounded-xl border border-blue-500/20">
                  <p className="text-[9px] text-slate-500 font-bold uppercase mb-0.5">Volume Limit</p>
                  <p className="text-blue-400 font-bold text-[12px]">
                    {selectedVoucher.volumeLimit && selectedVoucher.volumeLimit !== '0'
                      ? (selectedVoucher.volumeLimit > 1073741824 ? `${(selectedVoucher.volumeLimit / 1073741824).toFixed(1)} GB` : `${(selectedVoucher.volumeLimit / 1048576).toFixed(0)} MB`)
                      : 'Unlimited'}
                  </p>
                </div>
              </div>

              {selectedVoucher.details && (
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 space-y-1.5">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-500 font-bold uppercase tracking-widest">Order #</span>
                    <span className="text-slate-300 font-mono">{selectedVoucher.details.orderNo}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-500 font-bold uppercase tracking-widest">Customer</span>
                    <span className="text-slate-300">{selectedVoucher.details.customer}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                  onClick={() => window.print()}
                >
                  <Printer size={16} />
                  Print
                </button>
                <button
                  onClick={() => setSelectedVoucher(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-xl transition-all active:scale-95"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VouchersTab;
