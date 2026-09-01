import React from 'react';
import { X, AlertTriangle, ShieldCheck, Wallet, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HowToTopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToDeposit?: () => void;
}

export function HowToTopUpModal({ isOpen, onClose, onGoToDeposit }: HowToTopUpModalProps) {
  const steps = [
    {
      num: 1,
      title: 'Masukkan Nominal',
      desc: 'Masukkan nominal deposit minimal Rp1.000 pada form top up.',
    },
    {
      num: 2,
      title: 'Masukkan Nama Pengirim',
      desc: 'Ketik nama akun pengirim / rekening yang akan Anda gunakan.',
    },
    {
      num: 3,
      title: 'Tekan Lanjut',
      desc: 'Lanjutkan ke halaman pembayaran untuk melihat rincian transfer.',
    },
    {
      num: 4,
      title: 'Transfer Pembayaran',
      desc: 'Transfer sesuai nominal ke nomor DANA (085786683784 - Jeje) atau Scan QR Code.',
    },
    {
      num: 5,
      title: 'Konfirmasi Transfer',
      desc: 'Setelah pembayaran berhasil, klik tombol "Saya Sudah Transfer".',
    },
    {
      num: 6,
      title: 'Verifikasi Admin',
      desc: 'Admin akan memeriksa mutasi pembayaran Anda secara manual.',
    },
    {
      num: 7,
      title: 'Saldo Masuk Otomatis',
      desc: 'Setelah disetujui, saldo akun Anda otomatis bertambah dan siap dipakai order.',
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-700/70 shadow-2xl text-slate-100"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-['Poppins']">Cara Top Up Saldo</h3>
                  <p className="text-xs text-slate-400">Panduan lengkap langkah demi langkah</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Steps list */}
            <div className="space-y-3 mb-6">
              {steps.map((step) => (
                <div
                  key={step.num}
                  className="flex items-start gap-3.5 p-3 rounded-2xl bg-slate-800/40 border border-slate-800/80"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {step.num}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{step.title}</h4>
                    <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Warning Box */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 mb-6">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-200/90 leading-relaxed">
                <span className="font-semibold text-amber-300">Penting:</span> Jangan melakukan deposit berulang sebelum deposit sebelumnya dikonfirmasi Admin agar tidak terjadi selisih verifikasi.
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm transition-colors cursor-pointer"
              >
                Tutup
              </button>
              {onGoToDeposit && (
                <button
                  onClick={() => {
                    onClose();
                    onGoToDeposit();
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-colors cursor-pointer"
                >
                  <span>Mulai Deposit</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
