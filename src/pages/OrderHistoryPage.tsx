import React, { useEffect, useState } from 'react';
import {
  ShoppingBag,
  Clock,
  ChevronRight,
  Sparkles,
  Search,
  Filter,
  Copy,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { subscribeUserOrders } from '../services/orderService';
import { Order } from '../types';
import { formatDateTime, formatRupiah, copyToClipboard } from '../utils/formatters';
import { useToast } from '../context/ToastContext';
import { EmptyState } from '../components/EmptyState';
import { NavTab } from '../components/Navbar';

interface OrderHistoryPageProps {
  onNavigate: (tab: NavTab) => void;
  onOpenOrderDetail: (order: Order) => void;
}

export function OrderHistoryPage({ onNavigate, onOpenOrderDetail }: OrderHistoryPageProps) {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const unsub = subscribeUserOrders(currentUser.uid, (data) => {
      setOrders(data);
      setLoading(false);
    });

    return () => unsub();
  }, [currentUser]);

  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase();
    return (
      o.orderId.toLowerCase().includes(q) ||
      o.productName.toLowerCase().includes(q) ||
      o.items.some(
        (i) =>
          i.gmail.toLowerCase().includes(q) ||
          i.generatorLogin.toLowerCase().includes(q)
      )
    );
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Poppins'] flex items-center gap-2.5">
            <ShoppingBag className="w-7 h-7 text-emerald-400" />
            <span>Riwayat Pesanan</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Daftar semua akun Alight Motion Premium yang pernah Anda beli
          </p>
        </div>
        <button
          onClick={() => onNavigate('order')}
          className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Beli Akun Baru</span>
        </button>
      </div>

      {/* Search Filter */}
      {orders.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari Order ID / Gmail / Akun..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
          />
        </div>
      )}

      {/* Orders List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 animate-pulse">
          Memuat riwayat transaksi pesanan...
        </div>
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          title={searchQuery ? 'Pesanan Tidak Ditemukan' : 'Belum Ada Riwayat Pesanan'}
          description={
            searchQuery
              ? 'Tidak ada pesanan yang sesuai dengan kata kunci pencarian Anda.'
              : 'Anda belum pernah membeli akun Alight Motion Premium di store ini.'
          }
          actionText={searchQuery ? undefined : 'Order Sekarang (Rp300)'}
          onAction={searchQuery ? undefined : () => onNavigate('order')}
        />
      ) : (
        <div className="space-y-3.5">
          {filteredOrders.map((order) => (
            <div
              key={order.orderId}
              onClick={() => onOpenOrderDetail(order)}
              className="p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group shadow-lg"
            >
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors font-['Poppins']">
                      {order.productName}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                      {order.quantity} Unit
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-slate-800 text-slate-300 font-mono">
                      ID: {order.orderId}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatDateTime(order.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Items Preview */}
              <div className="flex items-center justify-between md:justify-end gap-5 border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                <div className="text-left md:text-right">
                  <div className="text-sm font-extrabold text-emerald-400 font-mono">
                    {formatRupiah(order.total)}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {order.items.length} Akun Tersimpan
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400 group-hover:text-white font-medium">
                  <span>Lihat Detail</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
