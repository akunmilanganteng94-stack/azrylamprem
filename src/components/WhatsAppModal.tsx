import React, { useState, useEffect } from 'react';
import { X, MessageCircle, ArrowUpRight, Bell, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DEPOSIT_CONFIG } from '../services/depositService';

const STORAGE_KEY = 'am_whatsapp_popup_dismissed_v1';

export function WhatsAppModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem(STORAGE_KEY);
    if (!isDismissed) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsOpen(false);
  };

  const handleJoin = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    window.open(DEPOSIT_CONFIG.whatsappChannel, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md p-6 overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-emerald-500/30 shadow-2xl shadow-emerald-500/10"
          >
            {/* Ambient background glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition-colors z-10"
              aria-label="Tutup popup"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header / Icon */}
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-500 p-0.5 shadow-lg shadow-emerald-500/30 flex items-center justify-center shrink-0">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-emerald-400">
                  <MessageCircle className="w-7 h-7 fill-emerald-400/20" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  Official Community
                </div>
                <h3 className="text-xl font-bold text-white font-['Poppins']">
                  Gabung Saluran WhatsApp
                </h3>
              </div>
            </div>

            {/* Content */}
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              Dapatkan info stok, promo, dan update terbaru langsung ke ponsel Anda secara real-time.
            </p>

            {/* Benefits pill */}
            <div className="grid grid-cols-2 gap-2.5 mb-6 text-xs text-slate-300">
              <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Update Stok Instan</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Promo & Diskon</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleJoin}
                className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all active:scale-98 cursor-pointer"
              >
                <span>Gabung Sekarang</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleClose}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-sm transition-all cursor-pointer"
              >
                Nanti Saja
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
