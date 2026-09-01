import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Copy,
  Check,
  QrCode,
  ArrowRight,
  AlertCircle,
  AlertTriangle,
  Clock,
  HelpCircle,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ChevronLeft,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { copyToClipboard, formatRupiah } from '../utils/formatters';
import { DEPOSIT_CONFIG, submitDeposit, subscribeUserDeposits } from '../services/depositService';
import { NavTab } from '../components/Navbar';
import { Deposit } from '../types';

interface DepositPageProps {
  onNavigate: (tab: NavTab) => void;
  onOpenHowToTopUp: () => void;
  onOpenAuth: () => void;
}

export function DepositPage({ onNavigate, onOpenHowToTopUp, onOpenAuth }: DepositPageProps) {
  const { currentUser, userProfile } = useAuth();
  const { showToast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [nominal, setNominal] = useState<string>('5000');
  const [senderName, setSenderName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [copiedDana, setCopiedDana] = useState(false);
  const [submittedDeposit, setSubmittedDeposit] = useState<Deposit | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const quickNominals = [1000, 3000, 5000, 10000, 20000, 50000];

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const amountNum = parseInt(nominal.replace(/[^0-9]/g, ''), 10);
    if (isNaN(amountNum) || amountNum < DEPOSIT_CONFIG.minDeposit) {
      setErrorMsg(`Minimal deposit adalah ${formatRupiah(DEPOSIT_CONFIG.minDeposit)}.`);
      showToast('Nominal Kurang', `Minimal deposit adalah ${formatRupiah(DEPOSIT_CONFIG.minDeposit)}.`, 'warning');
      return;
    }
    if (!senderName.trim()) {
      setErrorMsg('Nama pengirim wajib diisi.');
      return;
    }
    setStep(2);
  };

  const handleCopyDana = async () => {
    const ok = await copyToClipboard(DEPOSIT_CONFIG.danaNumber);
    if (ok) {
      setCopiedDana(true);
      showToast('Nomor DANA Berhasil Disalin!', DEPOSIT_CONFIG.danaNumber, 'success');
      setTimeout(() => setCopiedDana(false), 2500);
    }
  };

  // Real-time listener for current submitted deposit
  useEffect(() => {
    if (!currentUser || !submittedDeposit || step !== 3) return;
    const unsub = subscribeUserDeposits(currentUser.uid, (all) => {
      const live = all.find((d) => d.depositId === submittedDeposit.depositId);
      if (live && live.status !== submittedDeposit.status) {
        setSubmittedDeposit(live);
        if (live.status === 'APPROVED') {
          showToast(
            'Deposit Berhasil Dikonfirmasi!',
            `Saldo ${formatRupiah(live.amount)} sudah masuk ke akun Anda.`,
            'success'
          );
        }
      }
    });
    return () => unsub();
  }, [currentUser, submittedDeposit?.depositId, step]);

  const handleConfirmTransfer = async () => {
    if (!userProfile) return;
    const amountNum = parseInt(nominal.replace(/[^0-9]/g, ''), 10);
    setIsSubmitting(true);
    try {
      const dep = await submitDeposit(userProfile, amountNum, senderName.trim());
      setSubmittedDeposit(dep);
      setStep(3);
      showToast('Deposit Berhasil Dibuat!', 'Status saat ini PENDING. Admin akan segera memverifikasi.', 'success');
    } catch (err: any) {
      console.error('Deposit error:', err);
      showToast('Gagal Membuat Deposit', err.message || 'Terjadi kesalahan.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const parsedAmount = parseInt(nominal.replace(/[^0-9]/g, ''), 10) || 0;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2 border border-emerald-500/20">
          <Wallet className="w-3.5 h-3.5" />
          Sistem Top Up Saldo
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-['Poppins']">
          Deposit Saldo Akun
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
          Top up saldo otomatis dengan DANA atau QRIS. Minimal deposit Rp1.000.
        </p>
        <div className="mt-3">
          <button
            onClick={onOpenHowToTopUp}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-4 inline-flex items-center gap-1 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Baca Panduan Cara Top Up</span>
          </button>
        </div>
      </div>

      {/* Progress Indicators */}
      <div className="flex items-center justify-center gap-3 text-xs font-semibold">
        <div
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border transition-all ${
            step === 1
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
              : 'bg-slate-900 text-slate-500 border-slate-800'
          }`}
        >
          <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px] font-black">
            1
          </span>
          <span>Form Deposit</span>
        </div>
        <div className="w-6 h-px bg-slate-800" />
        <div
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border transition-all ${
            step === 2
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
              : 'bg-slate-900 text-slate-500 border-slate-800'
          }`}
        >
          <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-black">
            2
          </span>
          <span>Pembayaran</span>
        </div>
        <div className="w-6 h-px bg-slate-800" />
        <div
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border transition-all ${
            step === 3
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
              : 'bg-slate-900 text-slate-500 border-slate-800'
          }`}
        >
          <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-black">
            3
          </span>
          <span>Status</span>
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative"
          >
            {!currentUser ? (
              <div className="text-center py-6">
                <p className="text-sm text-slate-300 mb-4">
                  Silakan login terlebih dahulu untuk melakukan top up saldo.
                </p>
                <button
                  onClick={onOpenAuth}
                  className="py-3 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  Masuk / Daftar Akun
                </button>
              </div>
            ) : (
              <form onSubmit={handleStep1Submit} className="space-y-6">
                {errorMsg && (
                  <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Nominal Input */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Nominal Deposit
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Min: {formatRupiah(DEPOSIT_CONFIG.minDeposit)}
                    </span>
                  </div>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 font-mono">
                      Rp
                    </div>
                    <input
                      type="number"
                      min={DEPOSIT_CONFIG.minDeposit}
                      step={100}
                      required
                      value={nominal}
                      onChange={(e) => setNominal(e.target.value)}
                      placeholder="Contoh: 5000"
                      className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-base font-bold font-mono text-white outline-none transition-all"
                    />
                  </div>

                  {/* Preset Buttons */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3">
                    {quickNominals.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setNominal(amt.toString())}
                        className={`py-2 rounded-xl text-xs font-semibold font-mono transition-all cursor-pointer ${
                          parsedAmount === amt
                            ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                        }`}
                      >
                        {formatRupiah(amt)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nama Pengirim */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Nama Pengirim
                  </label>
                  <input
                    type="text"
                    required
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Nama akun DANA / Rekening pengirim Anda"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm text-white placeholder-slate-500 outline-none transition-all"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Gunakan nama yang sama dengan akun rekening pengirim untuk mempercepat verifikasi.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 active:scale-98 transition-all cursor-pointer"
                >
                  <span>Lanjut ke Pembayaran</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6"
          >
            {/* Top Bar back */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <button
                onClick={() => setStep(1)}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Ubah Nominal / Data</span>
              </button>
              <div className="text-xs font-mono font-semibold text-emerald-400">
                Total: {formatRupiah(parsedAmount)}
              </div>
            </div>

            {/* Payment instructions */}
            <div className="text-center">
              <h3 className="text-xl font-bold text-white font-['Poppins']">
                Transfer Pembayaran
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Silakan transfer tepat nominal di bawah ini melalui DANA atau Scan QRIS
              </p>
            </div>

            {/* Amount Banner */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30 text-center">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                Nominal Yang Harus Dibayar
              </div>
              <div className="text-3xl font-extrabold text-emerald-400 font-mono mt-1">
                {formatRupiah(parsedAmount)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Pengirim: <span className="text-slate-200 font-semibold">{senderName}</span>
              </div>
            </div>

            {/* QR Code & DANA Container */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* QR Box */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col items-center justify-center text-center">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-emerald-400" />
                  Scan QRIS Pembayaran
                </div>
                <div className="p-2 rounded-2xl bg-white shadow-xl max-w-[200px]">
                  <img
                    src={DEPOSIT_CONFIG.qrImage}
                    alt="QR Pembayaran Deposit"
                    className="w-full h-auto rounded-xl object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-2.5">
                  Scan melalui DANA, GoPay, OVO, ShopeePay, atau BCA
                </span>
              </div>

              {/* DANA Details Box */}
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between space-y-4">
                <div>
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                    Transfer Manual DANA
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                        Nomor DANA
                      </div>
                      <div className="text-lg font-mono font-bold text-white tracking-wider">
                        {DEPOSIT_CONFIG.danaNumber}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                        Atas Nama
                      </div>
                      <div className="text-base font-bold text-emerald-400 font-['Poppins']">
                        {DEPOSIT_CONFIG.danaName}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyDana}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {copiedDana ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Nomor DANA Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Salin Nomor DANA</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleConfirmTransfer}
                disabled={isSubmitting}
                className="w-full py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-base flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Mengirim Bukti Deposit...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Saya Sudah Transfer</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`glass-card rounded-3xl p-6 sm:p-10 border text-center shadow-2xl space-y-6 ${
              submittedDeposit?.status === 'APPROVED'
                ? 'border-emerald-500/50 bg-emerald-950/20'
                : submittedDeposit?.status === 'REJECTED'
                ? 'border-red-500/50 bg-red-950/20'
                : 'border-amber-500/30'
            }`}
          >
            {submittedDeposit?.status === 'APPROVED' ? (
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 animate-bounce">
                <CheckCircle2 className="w-9 h-9" />
              </div>
            ) : submittedDeposit?.status === 'REJECTED' ? (
              <div className="w-16 h-16 rounded-3xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center mx-auto shadow-lg shadow-red-500/20">
                <AlertTriangle className="w-9 h-9" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
                <Clock className="w-9 h-9 animate-pulse" />
              </div>
            )}

            <div>
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 font-mono ${
                  submittedDeposit?.status === 'APPROVED'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : submittedDeposit?.status === 'REJECTED'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                Status: {submittedDeposit?.status || 'PENDING'}
              </div>
              <h3 className="text-2xl font-bold text-white font-['Poppins']">
                {submittedDeposit?.status === 'APPROVED'
                  ? 'Deposit Telah Dikonfirmasi!'
                  : submittedDeposit?.status === 'REJECTED'
                  ? 'Deposit Ditolak'
                  : 'Deposit Sedang Diverifikasi'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto mt-1 leading-relaxed">
                {submittedDeposit?.status === 'APPROVED' ? (
                  <>
                    Saldo sebesar{' '}
                    <span className="text-emerald-400 font-bold font-mono">
                      {formatRupiah(submittedDeposit?.amount)}
                    </span>{' '}
                    telah berhasil ditambahkan ke akun Anda. Anda bisa langsung melakukan pemesanan!
                  </>
                ) : submittedDeposit?.status === 'REJECTED' ? (
                  <>
                    Deposit ditolak. Alasan:{' '}
                    <span className="text-red-300 font-semibold">
                      {submittedDeposit?.rejectionReason || 'Pembayaran tidak sesuai atau mutasi tidak ditemukan.'}
                    </span>
                  </>
                ) : (
                  <>
                    Permintaan deposit Anda sebesar{' '}
                    <span className="text-emerald-400 font-bold font-mono">
                      {formatRupiah(submittedDeposit?.amount)}
                    </span>{' '}
                    telah tercatat dan menunggu konfirmasi Admin.
                  </>
                )}
              </p>
            </div>

            {submittedDeposit && (
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 max-w-md mx-auto text-xs text-left space-y-2 font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Deposit ID:</span>
                  <span className="text-white">{submittedDeposit.depositId}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Nama Pengirim:</span>
                  <span className="text-white">{submittedDeposit.senderName}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Nominal:</span>
                  <span className="text-emerald-400 font-bold">{formatRupiah(submittedDeposit.amount)}</span>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => onNavigate('deposits-history')}
                className="w-full sm:w-auto py-3 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
              >
                Lihat Riwayat Deposit
              </button>
              <button
                onClick={() => {
                  setStep(1);
                  setNominal('5000');
                  setSenderName('');
                  setSubmittedDeposit(null);
                  onNavigate('order');
                }}
                className="w-full sm:w-auto py-3 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                Ke Halaman Order
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
