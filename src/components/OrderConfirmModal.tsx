import React from 'react';
import { X, AlertCircle, ShoppingCart, Loader2, Wallet, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatRupiah } from '../utils/formatters';

interface OrderConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  productName: string;
  pricePerUnit: number;
  quantity: number;
  currentBalance: number;
  isLoading: boolean;
}

export function OrderConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  productName,
  pricePerUnit,
  quantity,
  currentBalance,
  isLoading,
}: OrderConfirmModalProps) {
  const total = quantity * pricePerUnit;
  const balanceAfter = currentBalance - total;
  const isInsufficient = balanceAfter < 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl text-slate-100"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-['Poppins']">Konfirmasi Pesanan</h3>
                  <p className="text-xs text-slate-400">Pastikan detail pesanan Anda sudah benar</p>
                </div>
              </div>
              {!isLoading && (
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Breakdown table */}
            <div className="space-y-3 p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 mb-5 text-sm">
              <div className="flex justify-between items-center text-slate-400">
                <span>Produk:</span>
                <span className="font-semibold text-white">{productName}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Harga:</span>
                <span className="font-semibold text-white">{formatRupiah(pricePerUnit)} / unit</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Jumlah:</span>
                <span className="font-semibold text-white">{quantity} unit</span>
              </div>
              <div className="h-px bg-slate-700/50 my-1" />
              <div className="flex justify-between items-center text-base">
                <span className="font-bold text-white">Total Tagihan:</span>
                <span className="font-bold text-emerald-400">{formatRupiah(total)}</span>
              </div>
            </div>

            {/* Balance simulation */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 mb-6 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-slate-400" />
                  Saldo saat ini:
                </span>
                <span className="font-medium text-slate-200">{formatRupiah(currentBalance)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Saldo setelah pembelian:</span>
                <span
                  className={`font-semibold ${
                    isInsufficient ? 'text-red-400 font-bold' : 'text-slate-200'
                  }`}
                >
                  {formatRupiah(balanceAfter)}
                </span>
              </div>
            </div>

            {/* Insufficient balance warning */}
            {isInsufficient && (
              <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2.5 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>Saldo Anda tidak mencukupi. Silakan deposit terlebih dahulu.</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-colors disabled:opacity-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading || isInsufficient}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-98 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <span>Konfirmasi Pesanan</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
