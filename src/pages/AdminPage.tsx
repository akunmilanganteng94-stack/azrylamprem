import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Package,
  Wallet,
  Users,
  ShoppingBag,
  Plus,
  Trash2,
  Check,
  X,
  Clock,
  AlertCircle,
  Search,
  Upload,
  RefreshCw,
  Edit3,
  CheckCircle2,
  DollarSign,
  FileText,
  Activity,
  Layers,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatDateTime, formatRupiah } from '../utils/formatters';
import {
  subscribeAllInventory,
  addSingleStock,
  addBulkStock,
  deleteStockItem,
  clearSoldStockItems,
} from '../services/inventoryService';
import {
  subscribeAllDeposits,
  approveDeposit,
  rejectDeposit,
} from '../services/depositService';
import {
  subscribeAllUsers,
  adjustUserBalance,
} from '../services/adminService';
import { subscribeAllOrders } from '../services/orderService';
import { subscribeAuditLogs } from '../services/auditService';
import { InventoryItem, Deposit, UserProfile, Order, AuditLog } from '../types';
import { EmptyState } from '../components/EmptyState';

type AdminTab = 'stock' | 'deposits' | 'users' | 'orders' | 'logs';

export function AdminPage() {
  const { userProfile, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<AdminTab>('stock');

  // Real-time states
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  // Stock Form states
  const [bulkMode, setBulkMode] = useState(false);
  const [singleGmail, setSingleGmail] = useState('');
  const [singleGen, setSingleGen] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [isStockSubmitting, setIsStockSubmitting] = useState(false);
  const [stockFilter, setStockFilter] = useState<'ALL' | 'AVAILABLE' | 'SOLD'>('AVAILABLE');
  const [stockSearch, setStockSearch] = useState('');

  // Deposit reject modal state
  const [rejectModalDeposit, setRejectModalDeposit] = useState<Deposit | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Balance edit modal state
  const [editUserBalance, setEditUserBalance] = useState<UserProfile | null>(null);
  const [newBalanceValue, setNewBalanceValue] = useState<string>('');
  const [balanceAdjustReason, setBalanceAdjustReason] = useState<string>('');

  useEffect(() => {
    const unsubInv = subscribeAllInventory((data) => setInventory(data));
    const unsubDep = subscribeAllDeposits((data) => setDeposits(data));
    const unsubUsr = subscribeAllUsers((data) => setUsers(data));
    const unsubOrd = subscribeAllOrders((data) => setOrders(data));
    const unsubLog = subscribeAuditLogs((data) => setLogs(data));

    return () => {
      unsubInv();
      unsubDep();
      unsubUsr();
      unsubOrd();
      unsubLog();
    };
  }, []);

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white font-['Poppins']">Akses Dibatasi</h2>
        <p className="text-xs text-slate-400">
          Halaman ini hanya dapat diakses oleh Admin Resmi Alight Motion Store.
        </p>
      </div>
    );
  }

  // Calculated Stats
  const availableStock = inventory.filter((i) => i.status === 'AVAILABLE').length;
  const soldStock = inventory.filter((i) => i.status === 'SOLD').length;
  const pendingDeposits = deposits.filter((d) => d.status === 'PENDING').length;
  const totalRevenue = orders.reduce((acc, o) => acc + (o.total || 0), 0);
  const totalUserBalance = users.reduce((acc, u) => acc + (u.balance || 0), 0);

  // Stock Add Handlers
  const handleAddSingleStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleGmail.trim() || !singleGen.trim()) {
      showToast('Data Tidak Lengkap', 'Gmail dan Generator Login wajib diisi.', 'warning');
      return;
    }
    setIsStockSubmitting(true);
    try {
      await addSingleStock(
        singleGmail.trim(),
        singleGen.trim(),
        { uid: userProfile?.uid || 'admin', email: userProfile?.email || 'admin' }
      );
      setSingleGmail('');
      setSingleGen('');
      showToast('Stok Berhasil Ditambahkan!', '1 unit akun AM telah masuk ke inventory.', 'success');
    } catch (err: any) {
      showToast('Gagal Menambah Stok', err.message, 'error');
    } finally {
      setIsStockSubmitting(false);
    }
  };

  const handleAddBulkStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim()) {
      showToast('Form Kosong', 'Tempel teks daftar akun terlebih dahulu.', 'warning');
      return;
    }
    setIsStockSubmitting(true);
    try {
      const addedCount = await addBulkStock(
        bulkText,
        { uid: userProfile?.uid || 'admin', email: userProfile?.email || 'admin' }
      );
      setBulkText('');
      showToast('Bulk Stok Berhasil!', `${addedCount} unit akun berhasil ditambahkan ke inventory.`, 'success');
    } catch (err: any) {
      showToast('Gagal Menambah Bulk Stok', err.message, 'error');
    } finally {
      setIsStockSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Yakin ingin menghapus item stok ini?')) return;
    try {
      await deleteStockItem(itemId, { uid: userProfile?.uid || 'admin', email: userProfile?.email || 'admin' });
      showToast('Stok Dihapus', 'Item berhasil dihapus dari inventory.', 'info');
    } catch (err: any) {
      showToast('Gagal Menghapus', err.message, 'error');
    }
  };

  const handleClearSold = async () => {
    if (!confirm('Yakin ingin membersihkan semua riwayat stok yang sudah TERJUAL?')) return;
    try {
      const count = await clearSoldStockItems({ uid: userProfile?.uid || 'admin', email: userProfile?.email || 'admin' });
      showToast('Pembersihan Berhasil', `${count} item stok terjual berhasil dibersihkan.`, 'success');
    } catch (err: any) {
      showToast('Gagal Membersihkan', err.message, 'error');
    }
  };

  // Deposit Actions
  const handleApproveDeposit = async (dep: Deposit) => {
    try {
      await approveDeposit(dep, {
        uid: userProfile?.uid || 'admin',
        email: userProfile?.email || 'apriliansyahazril10@gmail.com',
      });
      showToast(
        'Deposit Disetujui!',
        `Saldo ${formatRupiah(dep.amount)} telah otomatis ditambahkan ke ${dep.userName || dep.userEmail}.`,
        'success'
      );
    } catch (err: any) {
      showToast('Gagal Menyetujui Deposit', err.message, 'error');
    }
  };

  const handleConfirmRejectDeposit = async () => {
    if (!rejectModalDeposit) return;
    try {
      await rejectDeposit(
        rejectModalDeposit,
        {
          uid: userProfile?.uid || 'admin',
          email: userProfile?.email || 'apriliansyahazril10@gmail.com',
        },
        rejectionReason.trim() || 'Pembayaran tidak sesuai atau mutasi tidak ditemukan.'
      );
      showToast('Deposit Ditolak', `Deposit ${rejectModalDeposit.depositId} telah ditolak.`, 'info');
      setRejectModalDeposit(null);
      setRejectionReason('');
    } catch (err: any) {
      showToast('Gagal Menolak Deposit', err.message, 'error');
    }
  };

  // User Balance Edit
  const handleSaveBalance = async () => {
    if (!editUserBalance || !userProfile) return;
    const num = parseInt(newBalanceValue.replace(/[^0-9]/g, ''), 10);
    if (isNaN(num) || num < 0) {
      showToast('Nominal Tidak Valid', 'Masukkan nominal saldo yang benar.', 'warning');
      return;
    }
    try {
      const diff = num - (editUserBalance.balance || 0);
      await adjustUserBalance(
        editUserBalance.uid,
        diff,
        balanceAdjustReason.trim() || 'Penyesuaian saldo manual oleh Admin',
        userProfile
      );
      showToast('Saldo Berhasil Diubah!', `Saldo pengguna telah diupdate menjadi ${formatRupiah(num)}.`, 'success');
      setEditUserBalance(null);
    } catch (err: any) {
      showToast('Gagal Mengubah Saldo', err.message, 'error');
    }
  };

  // Filtered Stock
  const filteredStock = inventory.filter((item) => {
    const matchFilter =
      stockFilter === 'ALL' ? true : item.status === stockFilter;
    const matchSearch =
      stockSearch === '' ||
      item.gmail.toLowerCase().includes(stockSearch.toLowerCase()) ||
      item.generatorLogin.toLowerCase().includes(stockSearch.toLowerCase()) ||
      (item.buyerEmail && item.buyerEmail.toLowerCase().includes(stockSearch.toLowerCase()));
    return matchFilter && matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      {/* Admin Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-950 border border-cyan-500/30 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2 border border-cyan-500/20">
              <ShieldCheck className="w-4 h-4" />
              Admin Control Panel
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Poppins']">
              Pusat Manajemen Store
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Sinkronisasi stok instan antara User & Admin, verifikasi deposit, dan audit transaksi.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300">
              Admin: {userProfile?.email}
            </span>
          </div>
        </div>
      </div>

      {/* 5 Stats Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Stok Ready</span>
            <Package className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {availableStock}
          </div>
          <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">
            {availableStock === 0 ? 'Habis (SOLD OUT)' : 'Tersedia untuk dibeli'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Stok Terjual</span>
            <ShoppingBag className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-cyan-400 font-mono">
            {soldStock}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Total unit diserahkan</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Deposit Pending</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-400 font-mono">
            {pendingDeposits}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {pendingDeposits > 0 ? 'Perlu konfirmasi' : 'Semua sudah beres'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Pengguna</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {users.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Terdaftar di database</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Pendapatan Order</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-extrabold text-emerald-400 font-mono">
            {formatRupiah(totalRevenue)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Dari {orders.length} order</div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex overflow-x-auto gap-2 p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800 no-scrollbar">
        <button
          onClick={() => setActiveTab('stock')}
          className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'stock'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Manajemen Stok ({availableStock})</span>
        </button>

        <button
          onClick={() => setActiveTab('deposits')}
          className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'deposits'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Verifikasi Deposit {pendingDeposits > 0 && `(${pendingDeposits})`}</span>
          {pendingDeposits > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Daftar User & Saldo ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Riwayat Semua Order ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'logs'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Audit Log ({logs.length})</span>
        </button>
      </div>

      {/* TAB 1: MANAJEMEN STOK */}
      {activeTab === 'stock' && (
        <div className="space-y-6">
          {/* Add Stock Card */}
          <div className="glass-card rounded-3xl p-6 sm:p-7 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white font-['Poppins'] flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-400" />
                  <span>Tambah Stok Alight Motion Premium</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Setiap stok yang ditambahkan langsung live dan bisa dibeli pembeli seharga Rp300.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBulkMode((prev) => !prev)}
                className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{bulkMode ? 'Mode Satuan' : 'Mode Bulk / Massal'}</span>
              </button>
            </div>

            {bulkMode ? (
              <form onSubmit={handleAddBulkStock} className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-slate-300">
                      Tempel Daftar Akun (Format: <code>gmail|generator</code> atau <code>gmail - generator</code> per baris)
                    </label>
                  </div>
                  <textarea
                    required
                    rows={5}
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    placeholder="user1@gmail.com|https://generator-link-1&#10;user2@gmail.com|https://generator-link-2&#10;user3@gmail.com - https://generator-link-3"
                    className="w-full p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-white placeholder-slate-600 focus:border-emerald-500 outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isStockSubmitting}
                  className="py-2.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isStockSubmitting ? 'Menyimpan...' : 'Impor Semua Stok Massal'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleAddSingleStock} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-5">
                  <input
                    type="text"
                    required
                    value={singleGmail}
                    onChange={(e) => setSingleGmail(e.target.value)}
                    placeholder="Alamat Gmail (contoh: ampro01@gmail.com)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-emerald-500 outline-none font-mono"
                  />
                </div>
                <div className="sm:col-span-5">
                  <input
                    type="text"
                    required
                    value={singleGen}
                    onChange={(e) => setSingleGen(e.target.value)}
                    placeholder="Generator Login / Link Verifikasi"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-emerald-500 outline-none font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={isStockSubmitting}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setStockFilter('AVAILABLE')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    stockFilter === 'AVAILABLE'
                      ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tersedia ({availableStock})
                </button>
                <button
                  type="button"
                  onClick={() => setStockFilter('SOLD')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    stockFilter === 'SOLD'
                      ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Terjual ({soldStock})
                </button>
                <button
                  type="button"
                  onClick={() => setStockFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    stockFilter === 'ALL'
                      ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Semua ({inventory.length})
                </button>
              </div>

              {soldStock > 0 && (
                <button
                  type="button"
                  onClick={handleClearSold}
                  className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-1.5 border border-red-500/20 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Bersihkan Terjual</span>
                </button>
              )}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
                placeholder="Cari Gmail / Pembeli..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Stock Table List */}
          {filteredStock.length === 0 ? (
            <EmptyState
              title="Tidak Ada Data Stok"
              description="Belum ada stok akun dengan filter saat ini. Tambahkan melalui form di atas."
            />
          ) : (
            <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="p-4">Status</th>
                      <th className="p-4">Gmail</th>
                      <th className="p-4">Generator Login</th>
                      <th className="p-4">Info Pembeli / Tanggal</th>
                      <th className="p-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredStock.map((item, index) => (
                      <tr key={item.inventoryId || `stock-${index}`} className="hover:bg-slate-850/50 transition-colors">
                        <td className="p-4 whitespace-nowrap">
                          {item.status === 'AVAILABLE' ? (
                            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              READY
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                              TERJUAL
                            </span>
                          )}
                        </td>
                        <td className="p-4 font-mono font-medium text-white max-w-[180px] truncate">
                          {item.gmail}
                        </td>
                        <td className="p-4 font-mono text-cyan-300 max-w-[200px] truncate">
                          {item.generatorLogin}
                        </td>
                        <td className="p-4 text-slate-400">
                          {item.status === 'SOLD' ? (
                            <div>
                              <div className="text-white font-medium">{(item as any).buyerEmail || 'Pembeli AM'}</div>
                              <div className="text-[10px] text-slate-500">
                                Order #{item.orderId?.slice(0, 8) || 'N/A'} • {formatDateTime(item.soldAt || '')}
                              </div>
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-500">
                              Ditambahkan: {formatDateTime(item.createdAt)}
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDeleteItem(item.inventoryId)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Hapus Stok"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: VERIFIKASI DEPOSIT */}
      {activeTab === 'deposits' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white font-['Poppins']">
                Daftar Permohonan Top Up Saldo
              </h3>
              <p className="text-xs text-slate-400">
                Verifikasi mutasi masuk pada akun DANA (085786683784 - Jeje) sebelum menyetujui.
              </p>
            </div>
          </div>

          {deposits.length === 0 ? (
            <EmptyState
              title="Belum Ada Permohonan Deposit"
              description="Belum ada transaksi deposit dari pengguna saat ini."
            />
          ) : (
            <div className="space-y-3.5">
              {deposits.map((dep) => (
                <div
                  key={dep.depositId}
                  className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl ${
                    dep.status === 'PENDING'
                      ? 'bg-slate-900/95 border-amber-500/40 shadow-amber-500/5'
                      : dep.status === 'APPROVED'
                      ? 'bg-slate-900/70 border-emerald-500/20 opacity-80'
                      : 'bg-slate-900/70 border-red-500/20 opacity-80'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                        dep.status === 'PENDING'
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          : dep.status === 'APPROVED'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-red-500/20 text-red-400 border-red-500/30'
                      }`}
                    >
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-lg font-extrabold text-white font-mono">
                          {formatRupiah(dep.amount)}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                            dep.status === 'PENDING'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                              : dep.status === 'APPROVED'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-red-500/20 text-red-300 border border-red-500/40'
                          }`}
                        >
                          {dep.status}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          ID: {dep.depositId}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300">
                        Nama Pengirim: <span className="font-semibold text-white">{dep.senderName}</span> •{' '}
                        Akun: <span className="text-cyan-300">{dep.userEmail}</span> ({dep.userName})
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Waktu Pengajuan: {formatDateTime(dep.createdAt)}
                      </div>
                      {dep.rejectionReason && (
                        <div className="text-xs text-red-400 mt-1.5">
                          Alasan Tolak: {dep.rejectionReason}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {dep.status === 'PENDING' ? (
                    <div className="flex items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                      <button
                        onClick={() => handleApproveDeposit(dep)}
                        className="flex-1 md:flex-none py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
                      >
                        <Check className="w-4 h-4" />
                        <span>Setujui (Approve)</span>
                      </button>
                      <button
                        onClick={() => {
                          setRejectModalDeposit(dep);
                          setRejectionReason('');
                        }}
                        className="flex-1 md:flex-none py-2.5 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs flex items-center justify-center gap-1.5 border border-red-500/20 transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                        <span>Tolak</span>
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 font-mono text-left md:text-right">
                      {dep.status === 'APPROVED' ? (
                        <span className="text-emerald-400 font-semibold">Telah Disetujui</span>
                      ) : (
                        <span className="text-red-400 font-semibold">Telah Ditolak</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DAFTAR USER & SALDO */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white font-['Poppins']">
                Daftar Pengguna Terdaftar
              </h3>
              <p className="text-xs text-slate-400">
                Total saldo pengguna beredar: <span className="font-mono font-bold text-emerald-400">{formatRupiah(totalUserBalance)}</span>
              </p>
            </div>
          </div>

          <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-4">Pengguna</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Saldo Akun</th>
                    <th className="p-4">Terdaftar Sejak</th>
                    <th className="p-4 text-right">Kelola Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {users.map((usr) => (
                    <tr key={usr.uid} className="hover:bg-slate-850/50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-white font-['Poppins']">{usr.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">UID: {usr.uid}</div>
                      </td>
                      <td className="p-4 font-mono text-slate-300">{usr.email}</td>
                      <td className="p-4 font-mono font-extrabold text-emerald-400 text-sm">
                        {formatRupiah(usr.balance || 0)}
                      </td>
                      <td className="p-4 text-slate-400 text-[11px]">
                        {formatDateTime(usr.createdAt)}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => {
                            setEditUserBalance(usr);
                            setNewBalanceValue((usr.balance || 0).toString());
                            setBalanceAdjustReason('');
                          }}
                          className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Ubah Saldo</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: RIWAYAT SEMUA ORDER */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white font-['Poppins']">
                Riwayat Transaksi Pesanan Keseluruhan
              </h3>
              <p className="text-xs text-slate-400">
                Semua pembelian akun Alight Motion yang telah berhasil diproses otomatis.
              </p>
            </div>
          </div>

          {orders.length === 0 ? (
            <EmptyState
              title="Belum Ada Pesanan"
              description="Belum ada transaksi pembelian produk Alight Motion."
            />
          ) : (
            <div className="space-y-3.5">
              {orders.map((ord) => (
                <div
                  key={ord.orderId}
                  className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-xl"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white font-['Poppins']">
                        {ord.productName}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {ord.quantity} Unit
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        #{ord.orderId}
                      </span>
                    </div>
                    <div className="text-sm font-extrabold text-emerald-400 font-mono">
                      {formatRupiah(ord.total)}
                    </div>
                  </div>

                  <div className="text-xs text-slate-400">
                    Pembeli: <span className="text-slate-200 font-semibold">{ord.userEmail}</span> ({ord.userName}) •{' '}
                    <span>{formatDateTime(ord.createdAt)}</span>
                  </div>

                  {/* Accounts Given */}
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5 text-xs font-mono">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      Data Akun Diserahkan:
                    </div>
                    {ord.items.map((it, idx) => (
                      <div key={idx} className="text-slate-300 truncate">
                        • {it.gmail} | <span className="text-cyan-400">{it.generatorLogin}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white font-['Poppins']">
              Audit & Activity Logs
            </h3>
            <p className="text-xs text-slate-400">
              Rekam jejak setiap perubahan stok, saldo, dan aksi administratif.
            </p>
          </div>

          <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="divide-y divide-slate-800/60 text-xs">
              {logs.length === 0 ? (
                <div className="p-8 text-center text-slate-500">Belum ada audit log.</div>
              ) : (
                logs.map((log, index) => (
                  <div key={log.logId || log.id || `log-${index}`} className="p-4 flex items-start gap-3 hover:bg-slate-850/50 transition-colors">
                    <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0 mt-0.5">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-white font-mono uppercase tracking-wider">
                          {log.action}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {formatDateTime(log.timestamp || log.createdAt)}
                        </span>
                      </div>
                      <p className="text-slate-300 mt-1">{log.details}</p>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Oleh: {log.performedBy || log.adminEmail || 'Admin'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Reject Deposit */}
      <AnimatePresence>
        {rejectModalDeposit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 space-y-4"
            >
              <h3 className="text-lg font-bold text-white font-['Poppins']">
                Tolak Permohonan Deposit
              </h3>
              <p className="text-xs text-slate-400">
                Deposit {rejectModalDeposit.depositId} sebesar{' '}
                <span className="font-bold text-white font-mono">
                  {formatRupiah(rejectModalDeposit.amount)}
                </span>{' '}
                dari <span className="font-semibold text-white">{rejectModalDeposit.userName}</span> akan ditolak.
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Alasan Penolakan
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Contoh: Bukti transfer tidak valid / mutasi DANA belum masuk"
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-red-500 outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalDeposit(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRejectDeposit}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white text-xs font-bold cursor-pointer"
                >
                  Tolak Deposit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Edit User Balance */}
      <AnimatePresence>
        {editUserBalance && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 space-y-4"
            >
              <h3 className="text-lg font-bold text-white font-['Poppins']">
                Kelola Saldo Pengguna
              </h3>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                <div>Nama: <span className="font-bold text-white">{editUserBalance.name}</span></div>
                <div>Email: <span className="font-mono text-cyan-300">{editUserBalance.email}</span></div>
                <div>Saldo Saat Ini: <span className="font-mono font-bold text-emerald-400">{formatRupiah(editUserBalance.balance || 0)}</span></div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Nominal Saldo Baru
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                    Rp
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={newBalanceValue}
                    onChange={(e) => setNewBalanceValue(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-bold font-mono text-white focus:border-cyan-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Alasan / Keterangan Penyesuaian
                </label>
                <input
                  type="text"
                  value={balanceAdjustReason}
                  onChange={(e) => setBalanceAdjustReason(e.target.value)}
                  placeholder="Contoh: Bonus cashback / koreksi deposit manual"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-cyan-500 outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditUserBalance(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveBalance}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold cursor-pointer"
                >
                  Simpan Saldo
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
