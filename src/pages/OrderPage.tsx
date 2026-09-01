import React, { useEffect, useState } from 'react';
import {
  ShoppingBag,
  Package,
  Wallet,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Plus,
  Minus,
  Info,
  ShieldCheck,
  Video,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { subscribeAvailableStockCount } from '../services/inventoryService';
import { processOrder } from '../services/orderService';
import { Order } from '../types';
import { formatRupiah } from '../utils/formatters';
import { OrderConfirmModal } from '../components/OrderConfirmModal';
import { OrderSuccessModal } from '../components/OrderSuccessModal';
import { NavTab } from '../components/Navbar';
import { ALIGHT_MOTION_PRODUCT_LOGO } from '../components/AlightMotionLogo';

interface OrderPageProps {
  onNavigate: (tab: NavTab) => void;
  onOpenAuth: () => void;
  onOpenHowToLogin: () => void;
}

const PRICE_PER_UNIT = 300;

export function OrderPage({ onNavigate, onOpenAuth, onOpenHowToLogin }: OrderPageProps) {
  const { currentUser, userProfile } = useAuth();
  const { showToast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [stockCount, setStockCount] = useState<number | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [latestOrder, setLatestOrder] = useState<Order | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const unsub = subscribeAvailableStockCount((count) => {
      setStockCount(count);
    });
    return () => unsub();
  }, []);

  const total = quantity * PRICE_PER_UNIT;
  const userBalance = Number(userProfile?.balance || 0);
  const isSoldOut = stockCount === 0;
  const isStockInsufficient = stockCount !== null && quantity > stockCount;
  const isBalanceInsufficient = currentUser && userBalance < total;

  const handleQuickQty = (qty: number) => {
    if (stockCount !== null && stockCount > 0) {
      setQuantity(Math.min(qty, stockCount));
    } else {
      setQuantity(qty);
    }
  };

  const handleIncrement = () => {
    setQuantity((prev) => {
      if (stockCount !== null && prev >= stockCount) return prev;
      return prev + 1;
    });
  };

  const handleDecrement = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleInitiateOrder = () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (quantity < 1) {
      showToast('Jumlah Tidak Valid', 'Minimal pembelian adalah 1 unit.', 'warning');
      return;
    }
    if (isSoldOut) {
      showToast('Stok Habis', 'Mohon maaf, stok saat ini sedang habis.', 'error');
      return;
    }
    if (isStockInsufficient) {
      showToast('Stok Tidak Cukup', 'Jumlah pesanan melebihi stok tersedia.', 'error');
      return;
    }
    if (isBalanceInsufficient) {
      showToast(
        'Saldo Tidak Cukup',
        'Saldo Anda tidak mencukupi. Silakan deposit terlebih dahulu.',
        'error'
      );
      return;
    }
    setIsConfirmOpen(true);
  };

  const handleConfirmOrder = async () => {
    if (!userProfile) return;
    setIsProcessing(true);
    try {
      const order = await processOrder(userProfile, quantity);
      setLatestOrder(order);
      setIsConfirmOpen(false);
      setIsSuccessOpen(true);
      showToast('Pembelian Berhasil!', `${quantity} unit akun AM Premium siap digunakan.`, 'success');
      // Reset quantity back to 1
      setQuantity(1);
    } catch (err: any) {
      console.error('Order error:', err);
      showToast('Gagal Memproses Pesanan', err.message || 'Terjadi kesalahan sistem.', 'error');
      setIsConfirmOpen(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      {/* Title */}
      <div className="text-center max-w-xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2 border border-emerald-500/20">
          <Sparkles className="w-3.5 h-3.5" />
          Instant Auto Delivery
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-['Poppins']">
          Pesan Alight Motion Premium
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
          Proses otomatis 24 jam. Saldo Anda akan otomatis dipotong dan data login langsung diberikan.
        </p>
      </div>

      {/* Main Order Box */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 relative overflow-hidden shadow-2xl">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left Column: Product Info & Pricing */}
          <div className="md:col-span-6 space-y-6">
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative p-0.5 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-400 shrink-0 shadow-md shadow-emerald-500/20">
                  <img
                    src={ALIGHT_MOTION_PRODUCT_LOGO}
                    alt="Alight Motion Logo"
                    className="w-14 h-14 rounded-[14px] object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-400">Produk</span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Ready Stock
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white font-['Poppins'] truncate">
                    Alight Motion Premium
                  </h3>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Akun unlock fitur Pro, bebas watermark, support semua preset XML & 5MB+, akses langsung dengan Gmail + Generator Login.
              </p>

              <div className="flex items-baseline justify-between pt-3 border-t border-slate-800">
                <span className="text-xs text-slate-400">Harga Satuan:</span>
                <span className="text-xl font-extrabold text-emerald-400 font-mono">
                  {formatRupiah(PRICE_PER_UNIT)}
                  <span className="text-xs font-normal text-slate-400"> / unit</span>
                </span>
              </div>
            </div>

            {/* Stock status indicator */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-900 text-teal-400 border border-slate-800">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Stok Real-time</div>
                  <div className="text-[11px] text-slate-400">Tersedia di inventory</div>
                </div>
              </div>
              <div className="text-right">
                {stockCount === null ? (
                  <span className="text-xs text-slate-500 font-mono">Memuat...</span>
                ) : isSoldOut ? (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                    SOLD OUT
                  </span>
                ) : (
                  <span className="text-base font-bold text-white font-mono">
                    {stockCount} Unit
                  </span>
                )}
              </div>
            </div>

            {/* User Balance overview */}
            {currentUser && (
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-900 text-emerald-400 border border-slate-800">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">Saldo Anda</div>
                    <div className="text-[11px] text-slate-400">Tersedia di dompet</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold text-emerald-400 font-mono">
                    {formatRupiah(userBalance)}
                  </div>
                  {isBalanceInsufficient && (
                    <button
                      onClick={() => onNavigate('deposit')}
                      className="text-[10px] text-red-400 underline hover:text-red-300 font-semibold cursor-pointer"
                    >
                      Top Up Saldo
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Quantity selector & Checkout */}
          <div className="md:col-span-6 space-y-6 flex flex-col justify-between">
            <div className="space-y-5">
              {/* Quantity Counter */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Jumlah Pesanan
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleDecrement}
                    disabled={quantity <= 1 || isSoldOut}
                    className="w-12 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <div className="flex-1 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-xl font-bold font-mono text-white">
                    {quantity}
                  </div>
                  <button
                    onClick={handleIncrement}
                    disabled={isSoldOut || (stockCount !== null && quantity >= stockCount)}
                    className="w-12 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {/* Quick preset buttons */}
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {[1, 5, 10, 20].map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => handleQuickQty(qty)}
                      disabled={isSoldOut || (stockCount !== null && stockCount < qty)}
                      className={`py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        quantity === qty
                          ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                          : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
                      } disabled:opacity-30 disabled:cursor-not-allowed`}
                    >
                      {qty} Unit
                    </button>
                  ))}
                </div>
              </div>

              {/* Subtotal Calculation Box */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Perhitungan:</span>
                  <span className="font-mono">
                    {quantity} × {formatRupiah(PRICE_PER_UNIT)}
                  </span>
                </div>
                <div className="h-px bg-slate-800 my-1" />
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-white">Total Pembayaran:</span>
                  <span className="font-extrabold text-emerald-400 text-lg font-mono">
                    {formatRupiah(total)}
                  </span>
                </div>
              </div>

              {/* Error alerts */}
              {isSoldOut ? (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center gap-2.5 text-xs text-red-300">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>Stok saat ini habis. Silakan cek kembali nanti atau hubungi Admin.</span>
                </div>
              ) : isStockInsufficient ? (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2.5 text-xs text-amber-300">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>Jumlah pesanan melebihi stok tersedia ({stockCount} unit).</span>
                </div>
              ) : isBalanceInsufficient ? (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-2 text-xs text-amber-300">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>Saldo Anda tidak mencukupi.</span>
                  </div>
                  <button
                    onClick={() => onNavigate('deposit')}
                    className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-[11px] hover:bg-amber-400 transition-colors cursor-pointer"
                  >
                    Top Up
                  </button>
                </div>
              ) : null}
            </div>

            {/* Action Buttons */}
            <div className="pt-4">
              {!currentUser ? (
                <button
                  onClick={onOpenAuth}
                  className="w-full py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 active:scale-98 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Login Terlebih Dahulu untuk Order</span>
                </button>
              ) : (
                <button
                  onClick={handleInitiateOrder}
                  disabled={isSoldOut || isStockInsufficient || isBalanceInsufficient}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 active:scale-98 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>
                    {isSoldOut
                      ? 'Stok Habis'
                      : isBalanceInsufficient
                      ? 'Saldo Tidak Cukup'
                      : `Beli Sekarang (${formatRupiah(total)})`}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <OrderConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmOrder}
        productName="Alight Motion Premium"
        pricePerUnit={PRICE_PER_UNIT}
        quantity={quantity}
        currentBalance={userBalance}
        isLoading={isProcessing}
      />

      {/* Success Modal */}
      <OrderSuccessModal
        isOpen={isSuccessOpen}
        onClose={() => setIsSuccessOpen(false)}
        order={latestOrder}
        onOpenTutorial={onOpenHowToLogin}
      />
    </div>
  );
}
