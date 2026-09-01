import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Check,
  Video,
  ExternalLink,
  Mail,
  KeyRound,
  PackageCheck,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Order } from '../types';
import { copyToClipboard, formatDateTime, formatRupiah } from '../utils/formatters';
import { useToast } from '../context/ToastContext';
import { DEPOSIT_CONFIG } from '../services/depositService';

interface OrderSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onOpenTutorial: () => void;
}

export function OrderSuccessModal({
  isOpen,
  onClose,
  order,
  onOpenTutorial,
}: OrderSuccessModalProps) {
  const { showToast } = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && order) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#06b6d4', '#3b82f6', '#10b981'],
        });
      } catch {
        // Safe fallback
      }
    }
  }, [isOpen, order]);

  if (!order) return null;

  const handleCopy = async (text: string, label: string, key: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedField(key);
      showToast(`${label} berhasil disalin!`, '', 'success', 2000);
      setTimeout(() => {
        setCopiedField((prev) => (prev === key ? null : prev));
      }, 2000);
    }
  };

  const handleCopyAll = async () => {
    const allText = order.items
      .map(
        (item, idx) =>
          `[Item #${idx + 1}]\nGmail: ${item.gmail}\nGenerator Login: ${item.generatorLogin}\n`
      )
      .join('\n');
    const fullSummary = `Alight Motion Premium (Order ID: ${order.orderId})\n\n${allText}\nTutorial Login: ${DEPOSIT_CONFIG.tiktokTutorial}`;
    await handleCopy(fullSummary, 'Semua data akun', 'all');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg p-6 max-h-[92vh] overflow-y-auto rounded-3xl bg-slate-900 border border-emerald-500/40 shadow-2xl shadow-emerald-500/10 text-slate-100"
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800/60 hover:bg-slate-800 transition-colors z-10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header / Success Badge */}
            <div className="text-center pb-5 mb-5 border-b border-slate-800">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3.5 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="text-2xl font-bold text-white font-['Poppins']">
                Pesanan Berhasil!
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Data login Alight Motion Premium Anda telah siap digunakan.
              </p>
              <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300 font-mono">
                <span>Order ID:</span>
                <span className="text-emerald-400 font-semibold">{order.orderId}</span>
              </div>
            </div>

            {/* Items List / Credentials */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <PackageCheck className="w-4 h-4 text-emerald-400" />
                  Data Login Akun ({order.items.length} Unit)
                </h4>
                {order.items.length > 1 && (
                  <button
                    onClick={handleCopyAll}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Salin Semua
                  </button>
                )}
              </div>

              {order.items.map((item, index) => (
                <div
                  key={index}
                  className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 relative space-y-3"
                >
                  {order.items.length > 1 && (
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Unit #{index + 1}
                    </div>
                  )}

                  {/* Gmail Field */}
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div className="truncate">
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider">Gmail</div>
                        <div className="text-xs font-mono font-medium text-white truncate">
                          {item.gmail}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopy(item.gmail, 'Gmail', `gmail-${index}`)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                    >
                      {copiedField === `gmail-${index}` ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Gmail</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Generator Login Field */}
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <KeyRound className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div className="truncate">
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                          Generator Login
                        </div>
                        <div className="text-xs font-mono font-medium text-cyan-300 truncate">
                          {item.generatorLogin}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        handleCopy(item.generatorLogin, 'Generator Login', `gen-${index}`)
                      }
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                    >
                      {copiedField === `gen-${index}` ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Generator</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Order Info */}
            <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800/80 mb-6 flex justify-between items-center text-xs text-slate-300">
              <div>
                <span className="text-slate-400">Total:</span>{' '}
                <span className="font-semibold text-emerald-400">{formatRupiah(order.total)}</span>
              </div>
              <div>
                <span className="text-slate-400">Tanggal:</span>{' '}
                <span>{formatDateTime(order.createdAt)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onOpenTutorial}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-98 transition-all cursor-pointer"
              >
                <Video className="w-4 h-4" />
                <span>Tonton Tutorial Login</span>
                <ExternalLink className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-colors cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
