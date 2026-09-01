import React from 'react';
import { X, Play, Video, KeyRound, Mail, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DEPOSIT_CONFIG } from '../services/depositService';

interface HowToLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HowToLoginModal({ isOpen, onClose }: HowToLoginModalProps) {
  const handleOpenTutorial = () => {
    window.open(DEPOSIT_CONFIG.tiktokTutorial, '_blank', 'noopener,noreferrer');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl text-slate-100"
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800/60 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Video className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-['Poppins']">Cara Login AM Premium</h3>
                <p className="text-xs text-slate-400">Petunjuk aktivasi akun Alight Motion</p>
              </div>
            </div>

            {/* Main content */}
            <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 mb-4">
              <p className="text-sm text-slate-200 leading-relaxed font-medium">
                Gunakan data <span className="text-emerald-400 font-semibold">Gmail</span> dan{' '}
                <span className="text-cyan-400 font-semibold">Generator Login</span> yang diberikan pada rincian pesanan Anda.
              </p>
            </div>

            {/* Step summary */}
            <div className="space-y-2.5 mb-6 text-xs text-slate-300">
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-800/30">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>1. Buka Alight Motion lalu pilih Login dengan Email/Link.</span>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-800/30">
                <KeyRound className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>2. Buka link / Generator Login pada browser untuk memverifikasi.</span>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-800/30">
                <Play className="w-4 h-4 text-amber-400 shrink-0" />
                <span>3. Ikuti video tutorial selengkapnya di bawah ini.</span>
              </div>
            </div>

            {/* Action button */}
            <div className="flex flex-col gap-2.5">
              <button
                onClick={handleOpenTutorial}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-98 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Tonton Tutorial Login</span>
                <ExternalLink className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors cursor-pointer"
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
