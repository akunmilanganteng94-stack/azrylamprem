import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Zap,
  ShieldCheck,
  Clock,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  ShoppingBag,
  Wallet,
  Play,
  Flame,
  Layers,
  ArrowRight,
  Video,
} from 'lucide-react';
import { motion } from 'motion/react';
import { formatRupiah } from '../utils/formatters';
import { subscribeAvailableStockCount } from '../services/inventoryService';
import { DEPOSIT_CONFIG } from '../services/depositService';
import { NavTab } from '../components/Navbar';
import { ALIGHT_MOTION_PRODUCT_LOGO } from '../components/AlightMotionLogo';

interface HomePageProps {
  onNavigate: (tab: NavTab) => void;
  onOpenHowToTopUp: () => void;
  onOpenHowToLogin: () => void;
  onOpenAuth: () => void;
  isLoggedIn: boolean;
}

export function HomePage({
  onNavigate,
  onOpenHowToTopUp,
  onOpenHowToLogin,
  onOpenAuth,
  isLoggedIn,
}: HomePageProps) {
  const [stockCount, setStockCount] = useState<number | null>(null);

  useEffect(() => {
    const unsub = subscribeAvailableStockCount((count) => {
      setStockCount(count);
    });
    return () => unsub();
  }, []);

  const isSoldOut = stockCount === 0;

  const faqs = [
    {
      q: 'Apa itu Alight Motion Premium di store ini?',
      a: 'Akun Alight Motion Pro/Premium yang sudah di-unlock full fitur, tanpa watermark, support impor semua preset 5MB+ & XML, dan siap langsung dipakai.',
    },
    {
      q: 'Berapa harga Alight Motion Premium?',
      a: 'Hanya Rp300 per unit/akun! Harga termurah dengan sistem otomatis 24 jam.',
    },
    {
      q: 'Bagaimana cara mendapatkan akun setelah bayar?',
      a: 'Data login (Gmail dan Generator Login) akan langsung muncul di layar Anda secara instan dalam hitungan detik setelah konfirmasi pembelian.',
    },
    {
      q: 'Berapa minimal deposit / top up saldo?',
      a: 'Minimal top up adalah Rp1.000 melalui DANA atau Scan QRIS.',
    },
    {
      q: 'Bagaimana jika saya bingung cara login akunnya?',
      a: 'Kami menyediakan tombol video tutorial langkah demi langkah di TikTok yang dapat Anda tonton kapan saja.',
    },
  ];

  return (
    <div className="w-full space-y-16 sm:space-y-24 pb-16">
      {/* HERO SECTION */}
      <section className="relative pt-6 sm:pt-12 overflow-hidden">
        {/* Glow ambient backgrounds */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[350px] sm:w-[650px] h-[350px] bg-gradient-to-tr from-emerald-600/20 via-teal-500/15 to-cyan-500/20 rounded-full blur-[100px] pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto text-center px-4">
          {/* Product Logo Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="flex justify-center mb-5"
          >
            <div className="relative p-1 rounded-3xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-400 shadow-2xl shadow-emerald-500/25">
              <div className="p-0.5 bg-slate-950 rounded-[22px]">
                <img
                  src={ALIGHT_MOTION_PRODUCT_LOGO}
                  alt="Alight Motion Logo"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-[20px] object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </motion.div>

          {/* Realtime stock badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 backdrop-blur-md mb-6 shadow-lg"
          >
            <div
              className={`w-2 h-2 rounded-full ${
                isSoldOut ? 'bg-red-500' : 'bg-emerald-400 animate-ping'
              }`}
            />
            <span className="text-xs font-semibold text-slate-300">
              Stok Real-time:
            </span>
            <span
              className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md ${
                isSoldOut
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {stockCount === null
                ? 'Memuat...'
                : isSoldOut
                ? 'SOLD OUT'
                : `${stockCount} Tersedia`}
            </span>
          </motion.div>

          {/* Main Hero Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white font-['Poppins'] leading-tight mb-4"
          >
            Alight Motion{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              Premium
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto mb-6 leading-relaxed font-medium"
          >
            Premium murah, proses cepat, langsung mendapatkan data login.
          </motion.p>

          {/* Price Highlight Banner */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
            className="inline-flex items-baseline gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-slate-900/90 to-slate-950/90 border border-emerald-500/40 shadow-xl shadow-emerald-500/10 mb-8"
          >
            <span className="text-xs sm:text-sm text-slate-400 font-medium">Harga Spesial:</span>
            <span className="text-2xl sm:text-4xl font-extrabold text-emerald-400 font-mono">
              Rp300
            </span>
            <span className="text-xs sm:text-sm text-slate-400 font-medium">/ unit</span>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto"
          >
            <button
              onClick={() => onNavigate('order')}
              disabled={isSoldOut}
              className="w-full sm:w-auto flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-base flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>{isSoldOut ? 'Stok Habis' : 'Pesan Sekarang'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('deposit')}
              className="w-full sm:w-auto flex-1 py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
            >
              <Wallet className="w-5 h-5 text-emerald-400" />
              <span>Top Up Saldo</span>
            </button>
          </motion.div>

          {/* Quick guide links */}
          <div className="flex items-center justify-center gap-4 mt-6 text-xs text-slate-400">
            <button
              onClick={onOpenHowToTopUp}
              className="hover:text-emerald-400 underline underline-offset-4 transition-colors cursor-pointer"
            >
              Cara Top Up
            </button>
            <span>•</span>
            <button
              onClick={onOpenHowToLogin}
              className="hover:text-cyan-400 underline underline-offset-4 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Tutorial Login</span>
            </button>
          </div>
        </div>
      </section>

      {/* KEUNGGULAN SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2.5 border border-emerald-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            Keunggulan Utama
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-['Poppins']">
            Kenapa Memilih Store Kami?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="glass-card glass-card-hover p-6 rounded-3xl relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white font-['Poppins'] mb-2">
              Pengiriman Otomatis Instan
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Sistem backend langsung mengambil stok login aktif dan menampilkannya di layar Anda detik itu juga tanpa menunggu admin.
            </p>
          </div>

          <div className="glass-card glass-card-hover p-6 rounded-3xl relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center mb-4">
              <Flame className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white font-['Poppins'] mb-2">
              Harga Termurah Rp300
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Dapatkan akun Alight Motion Pro dengan harga terjangkau mulai dari Rp300/unit, cocok untuk pemakaian pribadi maupun reseller.
            </p>
          </div>

          <div className="glass-card glass-card-hover p-6 rounded-3xl relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white font-['Poppins'] mb-2">
              Sistem Saldo Terjamin
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Top up saldo fleksibel melalui DANA atau Scan QRIS dengan verifikasi manual aman dan transparan.
            </p>
          </div>
        </div>
      </section>

      {/* CARA KERJA & CARA ORDER SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/60 border border-slate-800/80 relative overflow-hidden">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-['Poppins'] mb-2">
              Cara Kerja & Pemesanan
            </h2>
            <p className="text-sm text-slate-400">
              Proses mudah hanya dalam 3 langkah singkat
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col items-start text-left">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-sm mb-3.5 border border-emerald-500/30">
                1
              </div>
              <h4 className="text-base font-bold text-white mb-1.5 font-['Poppins']">
                Daftar & Top Up Saldo
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Buat akun, pilih menu deposit, transfer minimal Rp1.000 via DANA atau QR, lalu konfirmasi.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col items-start text-left">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-sm mb-3.5 border border-cyan-500/30">
                2
              </div>
              <h4 className="text-base font-bold text-white mb-1.5 font-['Poppins']">
                Pilih Jumlah & Order
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tentukan berapa unit akun Alight Motion yang ingin dibeli (@ Rp300), lalu klik Konfirmasi Pesanan.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col items-start text-left">
              <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 font-bold flex items-center justify-center text-sm mb-3.5 border border-teal-500/30">
                3
              </div>
              <h4 className="text-base font-bold text-white mb-1.5 font-['Poppins']">
                Dapatkan Akun & Login
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Gmail dan Generator Login langsung muncul di layar untuk Anda salin dan gunakan di aplikasi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2 border border-cyan-500/20">
            <HelpCircle className="w-3.5 h-3.5" />
            Tanya Jawab
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-['Poppins']">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 text-left"
            >
              <h4 className="text-sm sm:text-base font-bold text-white font-['Poppins'] mb-1.5 flex items-start gap-2.5">
                <span className="text-emerald-400">Q:</span>
                <span>{faq.q}</span>
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-6">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER CALLOUT */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/40 border border-emerald-500/30 text-center relative overflow-hidden">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-['Poppins'] mb-2">
            Siap Menikmati Fitur Alight Motion Pro?
          </h3>
          <p className="text-sm text-slate-300 max-w-lg mx-auto mb-6">
            Beli sekarang hanya Rp300 / unit dan dapatkan data login instan tanpa ribet.
          </p>
          <button
            onClick={() => onNavigate('order')}
            className="px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/20 active:scale-95 transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Order Sekarang</span>
          </button>
        </div>
      </section>
    </div>
  );
}
