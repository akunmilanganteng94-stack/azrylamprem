import React, { useEffect, useState } from 'react';
import {
  Wallet,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  Search,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { subscribeUserDeposits } from '../services/depositService';
import { Deposit } from '../types';
import { formatDateTime, formatRupiah } from '../utils/formatters';
import { EmptyState } from '../components/EmptyState';
import { NavTab } from '../components/Navbar';

interface DepositHistoryPageProps {
  onNavigate: (tab: NavTab) => void;
}

export function DepositHistoryPage({ onNavigate }: DepositHistoryPageProps) {
  const { currentUser } = useAuth();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setDeposits([]);
      setLoading(false);
      return;
    }

    const unsub = subscribeUserDeposits(currentUser.uid, (data) => {
      setDeposits(data);
      setLoading(false);
    });

    return () => unsub();
  }, [currentUser]);

  const getStatusBadge = (status: Deposit['status']) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <CheckCircle2 className="w-3.5 h-3.5" />
            BERHASIL
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/40">
            <AlertTriangle className="w-3.5 h-3.5" />
            DITOLAK
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            PENDING
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Poppins'] flex items-center gap-2.5">
            <Wallet className="w-7 h-7 text-emerald-400" />
            <span>Riwayat Deposit</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Status dan riwayat permohonan top up saldo akun Anda
          </p>
        </div>
        <button
          onClick={() => onNavigate('deposit')}
          className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Wallet className="w-4 h-4" />
          <span>Top Up Saldo Baru</span>
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 animate-pulse">
          Memuat riwayat deposit...
        </div>
      ) : deposits.length === 0 ? (
        <EmptyState
          title="Belum Ada Riwayat Deposit"
          description="Anda belum pernah membuat permohonan deposit atau top up saldo."
          actionText="Top Up Saldo Sekarang"
          onAction={() => onNavigate('deposit')}
        />
      ) : (
        <div className="space-y-3.5">
          {deposits.map((dep) => (
            <div
              key={dep.depositId}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg"
            >
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-base font-extrabold text-white font-mono">
                      {formatRupiah(dep.amount)}
                    </span>
                    {getStatusBadge(dep.status)}
                  </div>
                  <div className="text-xs text-slate-400">
                    Pengirim: <span className="text-slate-200 font-semibold">{dep.senderName}</span> •{' '}
                    <span className="font-mono">{dep.depositId}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDateTime(dep.createdAt)}</span>
                  </div>

                  {dep.status === 'REJECTED' && dep.rejectionReason && (
                    <div className="mt-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2 rounded-xl">
                      Alasan: {dep.rejectionReason}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-left md:text-right border-t md:border-t-0 pt-2 md:pt-0 border-slate-800">
                <div className="text-[11px] text-slate-400">
                  Metode: <span className="text-slate-200 font-semibold">DANA / QRIS</span>
                </div>
                {dep.status === 'APPROVED' && (
                  <div className="text-xs font-semibold text-emerald-400 mt-0.5">
                    Saldo Telah Ditambahkan
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
