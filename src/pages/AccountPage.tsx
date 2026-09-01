import React from 'react';
import {
  User,
  Mail,
  Wallet,
  Calendar,
  LogOut,
  ShieldCheck,
  ExternalLink,
  MessageCircle,
  Video,
  ShoppingBag,
  History,
  Key,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatDateTime, formatRupiah } from '../utils/formatters';
import { DEPOSIT_CONFIG } from '../services/depositService';
import { NavTab } from '../components/Navbar';

interface AccountPageProps {
  onNavigate: (tab: NavTab) => void;
  onOpenHowToTopUp: () => void;
  onOpenHowToLogin: () => void;
  onOpenWhatsApp: () => void;
}

export function AccountPage({
  onNavigate,
  onOpenHowToTopUp,
  onOpenHowToLogin,
  onOpenWhatsApp,
}: AccountPageProps) {
  const { currentUser, userProfile, isAdmin, logout } = useAuth();

  if (!currentUser) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
      {/* Profile Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          {userProfile?.photoURL ? (
            <img
              src={userProfile.photoURL}
              alt={userProfile.name}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-xl"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-slate-950 flex items-center justify-center text-3xl font-extrabold shadow-xl shadow-emerald-500/20">
              {(userProfile?.name || 'U').charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap mb-1">
              <h2 className="text-xl sm:text-2xl font-bold text-white font-['Poppins'] truncate">
                {userProfile?.name || 'Pengguna'}
              </h2>
              {isAdmin ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  ADMIN UTAMA
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  MEMBER
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-mono mb-2 flex items-center justify-center sm:justify-start gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              <span>{userProfile?.email || currentUser.email}</span>
            </p>
            <p className="text-[11px] text-slate-500 flex items-center justify-center sm:justify-start gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Terdaftar sejak: {formatDateTime(userProfile?.createdAt || new Date().toISOString())}</span>
            </p>
          </div>
        </div>

        {/* Balance Highlight in Profile */}
        <div className="mt-6 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Total Saldo Tersedia</div>
              <div className="text-xl font-extrabold text-emerald-400 font-mono">
                {formatRupiah(userProfile?.balance || 0)}
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('deposit')}
            className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            Top Up Saldo
          </button>
        </div>
      </div>

      {/* Menu Actions */}
      <div className="glass-card rounded-3xl p-5 border border-slate-800 space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
          Navigasi Cepat
        </h3>

        <button
          onClick={() => onNavigate('orders-history')}
          className="w-full p-3.5 rounded-2xl hover:bg-slate-850 flex items-center justify-between text-slate-200 transition-colors text-xs font-semibold cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <span>Riwayat Pesanan Akun</span>
          </div>
          <span className="text-slate-500 font-normal">Lihat</span>
        </button>

        <button
          onClick={() => onNavigate('deposits-history')}
          className="w-full p-3.5 rounded-2xl hover:bg-slate-850 flex items-center justify-between text-slate-200 transition-colors text-xs font-semibold cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <Wallet className="w-4 h-4" />
            </div>
            <span>Riwayat Top Up & Status Deposit</span>
          </div>
          <span className="text-slate-500 font-normal">Lihat</span>
        </button>

        <button
          onClick={onOpenHowToTopUp}
          className="w-full p-3.5 rounded-2xl hover:bg-slate-850 flex items-center justify-between text-slate-200 transition-colors text-xs font-semibold cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Key className="w-4 h-4" />
            </div>
            <span>Panduan Cara Top Up Saldo</span>
          </div>
          <span className="text-slate-500 font-normal">Buka</span>
        </button>

        <button
          onClick={onOpenHowToLogin}
          className="w-full p-3.5 rounded-2xl hover:bg-slate-850 flex items-center justify-between text-slate-200 transition-colors text-xs font-semibold cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Video className="w-4 h-4" />
            </div>
            <span>Tutorial Login Alight Motion di TikTok</span>
          </div>
          <ExternalLink className="w-4 h-4 text-slate-500" />
        </button>

        <button
          onClick={onOpenWhatsApp}
          className="w-full p-3.5 rounded-2xl hover:bg-slate-850 flex items-center justify-between text-slate-200 transition-colors text-xs font-semibold cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <MessageCircle className="w-4 h-4" />
            </div>
            <span>Gabung Komunitas WhatsApp</span>
          </div>
          <ExternalLink className="w-4 h-4 text-slate-500" />
        </button>

        {isAdmin && (
          <button
            onClick={() => onNavigate('admin')}
            className="w-full p-3.5 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-between text-cyan-300 transition-colors text-xs font-bold cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Buka Admin Panel Pengelola</span>
            </div>
            <span className="text-cyan-400 font-semibold">Kelola</span>
          </button>
        )}
      </div>

      {/* Logout */}
      <button
        onClick={() => logout()}
        className="w-full p-4 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
        <span>Keluar dari Akun (Logout)</span>
      </button>
    </div>
  );
}
