import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  ShoppingBag,
  Clock,
  Mail,
  KeyRound,
  Video,
  ExternalLink,
  PackageCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Order } from '../types';
import { copyToClipboard, formatDateTime, formatRupiah } from '../utils/formatters';
import { useToast } from '../context/ToastContext';
import { DEPOSIT_CONFIG } from '../services/depositService';

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onOpenTutorial: () => void;
}

export function OrderDetailModal({
  isOpen,
  onClose,
  order,
  onOpenTutorial,
}: OrderDetailModalProps) {
  const { showToast } = useToast();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!order) return null;

  const handleCopy = async (text: string, label: string, key: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedKey(key);
      showToast(`${label} berhasil disalin!`, '', 'success', 2000);
      setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 2000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl text-slate-100"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800/60 hover:bg-slate-800 transition-colors z-10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-800">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-['Poppins']">Rincian Pesanan</h3>
                <p className="text-xs text-slate-400 font-mono">Order ID: {order.orderId}</p>
              </div>
            </div>

            {/* Order overview meta */}
            <div className="grid grid-cols-2 gap-2 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 mb-5 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Produk:</span>
                <span className="font-semibold text-white">{order.productName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Jumlah Unit:</span>
                <span className="font-semibold text-emerald-400">{order.quantity} Unit</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Total Tagihan:</span>
                <span className="font-bold text-white font-mono">{formatRupiah(order.total)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Waktu Pembelian:</span>
                <span className="text-slate-300">{formatDateTime(order.createdAt)}</span>
              </div>
            </div>

            {/* Items List / Credentials */}
            <div className="space-y-3 mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <PackageCheck className="w-4 h-4 text-emerald-400" />
                Data Login Akun ({order.items.length} Unit)
              </h4>

              {order.items.map((item, index) => (
                <div
                  key={index}
                  className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5"
                >
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Unit #{index + 1}
                  </div>

                  {/* Gmail */}
                  <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800/80">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-xs font-mono text-white truncate">{item.gmail}</span>
                    </div>
                    <button
                      onClick={() => handleCopy(item.gmail, 'Gmail', `detail-gmail-${index}`)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {copiedKey === `detail-gmail-${index}` ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Generator Login */}
                  <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800/80">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <KeyRound className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="text-xs font-mono text-cyan-300 truncate">
                        {item.generatorLogin}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        handleCopy(item.generatorLogin, 'Generator Login', `detail-gen-${index}`)
                      }
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {copiedKey === `detail-gen-${index}` ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={onOpenTutorial}
                className="flex-1 py-3 px-4 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Video className="w-4 h-4" />
                <span>Lihat Tutorial Login</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onClose}
                className="py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
