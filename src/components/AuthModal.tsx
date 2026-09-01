import React, { useState } from 'react';
import { X, Mail, Lock, User, Loader2, ArrowRight, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AlightMotionLogo } from './AlightMotionLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  onSuccess?: () => void;
}

export function AuthModal({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccess,
}: AuthModalProps) {
  const { loginWithEmail, registerWithEmail } = useAuth();
  const { showToast } = useToast();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      setErrorMsg('Alamat Gmail / Email wajib diisi.');
      return;
    }
    if (!cleanPassword) {
      setErrorMsg('Password wajib diisi.');
      return;
    }

    if (mode === 'register') {
      if (!name.trim()) {
        setErrorMsg('Nama lengkap wajib diisi.');
        return;
      }
      if (cleanPassword.length < 6) {
        setErrorMsg('Password minimal 6 karakter.');
        return;
      }
    }

    setIsLoading(true);
    try {
      if (mode === 'register') {
        await registerWithEmail(name.trim(), cleanEmail, cleanPassword);
        showToast('Pendaftaran Berhasil!', 'Akun Anda telah disimpan di database dan siap digunakan.', 'success');
      } else {
        await loginWithEmail(cleanEmail, cleanPassword);
        showToast('Login Berhasil!', 'Selamat datang kembali.', 'success');
      }
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Auth error:', err);
      let message = 'Terjadi kesalahan. Silakan periksa data Anda.';
      const code = err?.code || '';
      const rawMsg = err?.message || '';

      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found' ||
        rawMsg.includes('belum terdaftar')
      ) {
        message = rawMsg.includes('belum terdaftar')
          ? rawMsg
          : 'Email atau password yang Anda masukkan salah. Jika belum punya akun, silakan daftar (Register) terlebih dahulu.';
      } else if (code === 'auth/email-already-in-use' || rawMsg.includes('sudah terdaftar')) {
        message = 'Email sudah terdaftar. Silakan langsung masuk (Login).';
      } else if (code === 'auth/weak-password' || rawMsg.includes('minimal 6')) {
        message = 'Password minimal 6 karakter.';
      } else if (code === 'auth/invalid-email') {
        message = 'Format email tidak valid (contoh: nama@gmail.com).';
      } else if (rawMsg) {
        message = rawMsg;
      }
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md p-6 sm:p-7 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 overflow-hidden"
        >
          {/* Ambient glow */}
          <div className="absolute -top-24 -right-24 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-44 h-44 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800/60 hover:bg-slate-800 transition-colors z-10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <AlightMotionLogo size="sm" showText={false} />
            </div>
            <h3 className="text-xl font-bold text-white font-['Poppins']">
              {mode === 'login' ? 'Masuk ke Akun' : 'Daftar Akun Baru'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {mode === 'login'
                ? 'Semua pengguna harus daftar dulu sebelum bisa login'
                : 'Daftar nama, Gmail, & password untuk akses order Rp300'}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex p-1 bg-slate-950/80 rounded-xl border border-slate-800 mb-5">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Masuk (Login)
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Daftar (Register)
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{errorMsg}</span>
                {mode === 'login' && errorMsg.includes('daftar') && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setErrorMsg(null);
                    }}
                    className="block mt-1 text-emerald-400 font-bold hover:underline cursor-pointer"
                  >
                     Klik di sini untuk mendaftar akun sekarang
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="Contoh: Azril / Budi"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm text-white placeholder-slate-500 outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Alamat Gmail / Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="nama@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm text-white placeholder-slate-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Password
                </label>
                {mode === 'register' && (
                  <span className={`text-[10px] ${password.length >= 6 ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {password.length >= 6 ? '✓ Minimal 6 karakter terpenuhi' : 'Minimal 6 karakter'}
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="Masukkan password akun"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm text-white placeholder-slate-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Masuk ke Akun' : 'Daftar Sekarang & Simpan ke Firebase'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-4 text-center">
            <p className="text-[11px] text-slate-400">
              {mode === 'login' ? (
                <>
                  Belum pernah daftar?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setErrorMsg(null);
                    }}
                    className="text-emerald-400 hover:underline font-semibold cursor-pointer"
                  >
                    Daftar di sini
                  </button>
                </>
              ) : (
                <>
                  Sudah punya akun terdaftar?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMsg(null);
                    }}
                    className="text-emerald-400 hover:underline font-semibold cursor-pointer"
                  >
                    Masuk di sini
                  </button>
                </>
              )}
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
