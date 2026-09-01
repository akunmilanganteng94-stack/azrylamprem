import React, { useEffect, useState } from 'react';
import {
  Wallet,
  ShoppingBag,
  History,
  User,
  Package,
  Layers,
  ArrowRight,
  Sparkles,
  Clock,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { formatDateTime, formatRupiah } from '../utils/formatters';
import { subscribeAvailableStockCount } from '../services/inventoryService';
import { subscribeUserOrders } from '../services/orderService';
import { Order } from '../types';
import { NavTab } from '../components/Navbar';
import { EmptyState } from '../components/EmptyState';

interface DashboardPageProps {
  onNavigate: (tab: NavTab) => void;
  onOpenOrderDetail: (order: Order) => void;
}

export function DashboardPage({ onNavigate, onOpenOrderDetail }: DashboardPageProps) {
  const { userProfile, currentUser } = useAuth();
  const [stockCount, setStockCount] = useState<number | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    const unsubStock = subscribeAvailableStockCount((count) => {
      setStockCount(count);
    });

    let unsubOrders = () => {};
    if (currentUser) {
      unsubOrders = subscribeUserOrders(currentUser.uid, (orders) => {
        setRecentOrders(orders.slice(0, 5));
        setLoadingOrders(false);
      });
    }

    return () => {
      unsubStock();
      unsubOrders();
    };
  }, [currentUser]);

  const isSoldOut = stockCount === 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-2 border border-emerald-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              Member Dashboard
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Poppins']">
              Halo, {userProfile?.name || currentUser?.email?.split('@')[0] || 'User'}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {userProfile?.email || currentUser?.email}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('order')}
              disabled={isSoldOut}
              className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Beli AM Premium</span>
            </button>
            <button
              onClick={() => onNavigate('deposit')}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span>Top Up</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 Main Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Saldo Anda */}
        <div className="glass-card glass-card-hover p-6 rounded-3xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Saldo Anda
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono mb-2">
            {formatRupiah(userProfile?.balance || 0)}
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <span className="text-emerald-400 font-medium">Real-time sync</span> dengan Firestore
          </p>
        </div>

        {/* Card 2: Harga AM Premium */}
        <div className="glass-card glass-card-hover p-6 rounded-3xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Harga AM Premium
            </span>
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-cyan-400 font-mono mb-2">
            Rp300 <span className="text-sm font-normal text-slate-400">/ unit</span>
          </div>
          <p className="text-xs text-slate-400">
            Akses instan data login otomatis
          </p>
        </div>

        {/* Card 3: Stok Tersedia */}
        <div className="glass-card glass-card-hover p-6 rounded-3xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Stok Tersedia
            </span>
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono mb-2">
            {stockCount === null ? (
              <span className="text-slate-500">...</span>
            ) : isSoldOut ? (
              <span className="text-red-400 text-2xl font-bold">SOLD OUT</span>
            ) : (
              <span>{stockCount}</span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            {isSoldOut ? 'Admin akan segera restock' : 'Siap diklaim secara otomatis'}
          </p>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3.5">
          Menu Cepat
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <button
            onClick={() => onNavigate('deposit')}
            className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 text-left transition-all group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              <Wallet className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white">Deposit</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Top up saldo DANA / QR</div>
          </button>

          <button
            onClick={() => onNavigate('order')}
            className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 text-left transition-all group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white">Pesan Sekarang</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Beli akun AM Rp300</div>
          </button>

          <button
            onClick={() => onNavigate('orders-history')}
            className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 text-left transition-all group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              <History className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white">Riwayat Pesanan</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Lihat data akun dibeli</div>
          </button>

          <button
            onClick={() => onNavigate('deposits-history')}
            className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 text-left transition-all group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white">Riwayat Deposit</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Status verifikasi top up</div>
          </button>

          <button
            onClick={() => onNavigate('account')}
            className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 text-left transition-all group col-span-2 sm:col-span-1 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              <User className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white">Akun Saya</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Detail profil & keluar</div>
          </button>
        </div>
      </div>

      {/* Pesanan Terbaru Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white font-['Poppins']">
              Pesanan Terbaru
            </h2>
            <p className="text-xs text-slate-400">5 transaksi pembelian terakhir Anda</p>
          </div>
          {recentOrders.length > 0 && (
            <button
              onClick={() => onNavigate('orders-history')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Lihat Semua</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {loadingOrders ? (
          <div className="glass-card p-6 rounded-2xl text-center text-xs text-slate-400 animate-pulse">
            Memuat data pesanan...
          </div>
        ) : recentOrders.length === 0 ? (
          <EmptyState
            title="Belum Ada Pesanan"
            description="Anda belum memiliki riwayat pembelian akun Alight Motion Premium."
            actionText="Beli Akun Sekarang (Rp300)"
            onAction={() => onNavigate('order')}
          />
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div
                key={order.orderId}
                onClick={() => onOpenOrderDetail(order)}
                className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                        {order.productName}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {order.quantity} Unit
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">
                      {order.orderId} • {formatDateTime(order.createdAt)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                  <div className="text-left sm:text-right">
                    <div className="text-xs font-bold text-emerald-400 font-mono">
                      {formatRupiah(order.total)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {order.items.length} Data Login
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
