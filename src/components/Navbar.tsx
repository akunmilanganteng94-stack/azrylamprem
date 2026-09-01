import React, { useState } from 'react';
import {
  Menu,
  X,
  Wallet,
  ShoppingBag,
  History,
  User,
  ShieldCheck,
  Home,
  LogOut,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AlightMotionLogo } from './AlightMotionLogo';
import { useAuth } from '../context/AuthContext';
import { formatRupiah } from '../utils/formatters';

export type NavTab = 'home' | 'order' | 'deposit' | 'orders-history' | 'deposits-history' | 'account' | 'admin';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenAuth: () => void;
}

export function Navbar({ currentTab, onSelectTab, onOpenAuth }: NavbarProps) {
  const { currentUser, userProfile, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [riwayatDropdownOpen, setRiwayatDropdownOpen] = useState(false);

  const handleNav = (tab: NavTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
    setRiwayatDropdownOpen(false);
  };

  const navItems = [
    { tab: 'home' as NavTab, label: 'Home', icon: Home },
    { tab: 'order' as NavTab, label: 'Order', icon: ShoppingBag },
    { tab: 'deposit' as NavTab, label: 'Deposit', icon: Wallet },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-17 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => handleNav('home')}
          className="flex items-center gap-2 text-left focus:outline-none cursor-pointer"
        >
          <AlightMotionLogo size="md" />
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.tab;
            return (
              <button
                key={item.tab}
                onClick={() => handleNav(item.tab)}
                className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* Riwayat Dropdown */}
          <div className="relative">
            <button
              onClick={() => setRiwayatDropdownOpen((prev) => !prev)}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                currentTab === 'orders-history' || currentTab === 'deposits-history'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Riwayat</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${
                  riwayatDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            <AnimatePresence>
              {riwayatDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="absolute left-0 mt-2 w-48 p-2 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl z-50 text-xs"
                >
                  <button
                    onClick={() => handleNav('orders-history')}
                    className={`w-full text-left px-3 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors cursor-pointer ${
                      currentTab === 'orders-history'
                        ? 'bg-emerald-500/20 text-emerald-400 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Riwayat Pesanan</span>
                  </button>
                  <button
                    onClick={() => handleNav('deposits-history')}
                    className={`w-full text-left px-3 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors mt-1 cursor-pointer ${
                      currentTab === 'deposits-history'
                        ? 'bg-emerald-500/20 text-emerald-400 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span>Riwayat Deposit</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Akun */}
          <button
            onClick={() => handleNav('account')}
            className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
              currentTab === 'account'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Akun</span>
          </button>

          {/* Admin Panel Link */}
          {isAdmin && (
            <button
              onClick={() => handleNav('admin')}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
                currentTab === 'admin'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-semibold shadow-lg shadow-cyan-500/10'
                  : 'text-cyan-400 hover:bg-cyan-500/10 border border-cyan-500/20'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Admin Panel</span>
            </button>
          )}
        </nav>

        {/* Desktop Right Side / User Balance / Auth */}
        <div className="hidden md:flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-2.5">
              {/* Balance Badge */}
              <button
                onClick={() => handleNav('deposit')}
                title="Klik untuk top up saldo"
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-emerald-500/30 hover:border-emerald-500/60 transition-all text-xs shadow-inner group cursor-pointer"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-400">Saldo:</span>
                <span className="font-bold text-emerald-400 group-hover:text-emerald-300 font-mono">
                  {formatRupiah(userProfile?.balance || 0)}
                </span>
              </button>

              {/* User Avatar / Profile pill */}
              <button
                onClick={() => handleNav('account')}
                className="flex items-center gap-2 p-1.5 pr-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
              >
                {userProfile?.photoURL ? (
                  <img
                    src={userProfile.photoURL}
                    alt={userProfile.name}
                    className="w-7 h-7 rounded-lg object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xs font-bold uppercase">
                    {(userProfile?.name || 'U').charAt(0)}
                  </div>
                )}
                <span className="text-xs font-medium text-slate-200 max-w-[100px] truncate">
                  {userProfile?.name || currentUser.email?.split('@')[0]}
                </span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Masuk / Daftar</span>
            </button>
          )}
        </div>

        {/* Mobile Hamburger & Balance */}
        <div className="flex md:hidden items-center gap-2">
          {currentUser && (
            <button
              onClick={() => handleNav('deposit')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-emerald-500/30 text-[11px] font-mono font-bold text-emerald-400 cursor-pointer"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>{formatRupiah(userProfile?.balance || 0)}</span>
            </button>
          )}
          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
            aria-label="Buka menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-slate-800 bg-slate-950/95 backdrop-blur-2xl overflow-hidden"
          >
            <div className="p-4 space-y-2">
              {/* User overview if logged in */}
              {currentUser ? (
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {userProfile?.photoURL ? (
                      <img
                        src={userProfile.photoURL}
                        alt="User"
                        className="w-10 h-10 rounded-xl object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-sm font-bold uppercase">
                        {(userProfile?.name || 'U').charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-bold text-white truncate max-w-[160px]">
                        {userProfile?.name || 'User'}
                      </div>
                      <div className="text-xs text-slate-400 truncate max-w-[160px]">
                        {userProfile?.email}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400">Saldo</div>
                    <div className="text-xs font-bold font-mono text-emerald-400">
                      {formatRupiah(userProfile?.balance || 0)}
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth();
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 mb-3 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Masuk / Daftar Akun</span>
                </button>
              )}

              {/* Navigation links */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleNav('home')}
                  className={`p-3 rounded-xl text-left text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                    currentTab === 'home'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-900/60 text-slate-300'
                  }`}
                >
                  <Home className="w-4 h-4 text-emerald-400" />
                  <span>Home</span>
                </button>
                <button
                  onClick={() => handleNav('order')}
                  className={`p-3 rounded-xl text-left text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                    currentTab === 'order'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-900/60 text-slate-300'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4 text-emerald-400" />
                  <span>Order AM</span>
                </button>
                <button
                  onClick={() => handleNav('deposit')}
                  className={`p-3 rounded-xl text-left text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                    currentTab === 'deposit'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-900/60 text-slate-300'
                  }`}
                >
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <span>Top Up Deposit</span>
                </button>
                <button
                  onClick={() => handleNav('orders-history')}
                  className={`p-3 rounded-xl text-left text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                    currentTab === 'orders-history'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-900/60 text-slate-300'
                  }`}
                >
                  <History className="w-4 h-4 text-emerald-400" />
                  <span>Riwayat Order</span>
                </button>
                <button
                  onClick={() => handleNav('deposits-history')}
                  className={`p-3 rounded-xl text-left text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                    currentTab === 'deposits-history'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-900/60 text-slate-300'
                  }`}
                >
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <span>Riwayat Deposit</span>
                </button>
                <button
                  onClick={() => handleNav('account')}
                  className={`p-3 rounded-xl text-left text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                    currentTab === 'account'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-900/60 text-slate-300'
                  }`}
                >
                  <User className="w-4 h-4 text-emerald-400" />
                  <span>Akun Saya</span>
                </button>
              </div>

              {/* Admin Panel button on Mobile */}
              {isAdmin && (
                <button
                  onClick={() => handleNav('admin')}
                  className={`w-full p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors mt-2 cursor-pointer ${
                    currentTab === 'admin'
                      ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/50'
                      : 'bg-slate-900 text-cyan-400 border border-cyan-500/30'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>Masuk ke Admin Panel</span>
                </button>
              )}

              {/* Logout button */}
              {currentUser && (
                <button
                  onClick={async () => {
                    await logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full mt-2 p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-red-500/20 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar dari Akun</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
