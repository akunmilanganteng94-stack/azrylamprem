import {
  collection,
  doc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  runTransaction,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { UserProfile, UserRole, AdminStats, Order, InventoryItem } from '../types';
import { logAdminAction } from './auditService';
import {
  getLocalAdminStats,
  getLocalOrders,
  getLocalUsers,
  getLocalInventory,
  saveLocalUser,
  subscribeLocalEvent,
  updateLocalUserBalance,
} from './localStore';
import { mergeInventory } from './inventoryService';

export async function getAdminDashboardStats(): Promise<AdminStats> {
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    const ordersSnap = await getDocs(collection(db, 'orders'));
    const depositsSnap = await getDocs(collection(db, 'deposits'));
    const invSnap = await getDocs(collection(db, 'inventory'));

    let totalRevenue = 0;
    ordersSnap.forEach((d) => {
      totalRevenue += Number(d.data().total || 0);
    });

    let totalApprovedDepositsAmount = 0;
    let pendingDepositsCount = 0;
    depositsSnap.forEach((d) => {
      const data = d.data();
      if (data.status === 'APPROVED') {
        totalApprovedDepositsAmount += Number(data.amount || 0);
      } else if (data.status === 'PENDING') {
        pendingDepositsCount += 1;
      }
    });

    const firestoreInv = invSnap.docs.map((d) => d.data() as InventoryItem);
    const mergedInv = mergeInventory(firestoreInv, getLocalInventory());
    const availableStock = mergedInv.filter((i) => i.status === 'AVAILABLE').length;
    const soldStock = mergedInv.filter((i) => i.status === 'SOLD').length;

    return {
      totalUsers: Math.max(usersSnap.size, getLocalUsers().length),
      totalOrders: Math.max(ordersSnap.size, getLocalOrders().length),
      totalRevenue,
      pendingDepositsCount,
      totalApprovedDepositsAmount,
      availableStock,
      soldStock,
    };
  } catch (e) {
    console.warn('Firestore getAdminDashboardStats failed, returning local stats:', e);
    return getLocalAdminStats();
  }
}

function mergeUsers(firestoreUsers: UserProfile[], localUsers: UserProfile[]): UserProfile[] {
  const map = new Map<string, UserProfile>();
  for (const u of localUsers) {
    if (u && (u.uid || u.email)) {
      map.set(u.uid || u.email, u);
    }
  }
  for (const u of firestoreUsers) {
    if (u && (u.uid || u.email)) {
      const key = u.uid || u.email;
      const existing = map.get(u.uid) || map.get(u.email);
      if (existing) {
        map.set(key, {
          ...existing,
          ...u,
          balance: u.balance !== undefined ? u.balance : existing.balance,
        });
      } else {
        map.set(key, u);
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    return timeB - timeA;
  });
}

export async function fetchAllUsers(): Promise<UserProfile[]> {
  try {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const firestoreUsers = snap.docs.map((d) => ({
      ...d.data(),
      uid: d.id,
    } as UserProfile));
    return mergeUsers(firestoreUsers, getLocalUsers());
  } catch (e) {
    return getLocalUsers();
  }
}

export function subscribeAllUsers(callback: (users: UserProfile[]) => void) {
  let firestoreList: UserProfile[] = [];
  const emitMerged = () => {
    const localList = getLocalUsers();
    callback(mergeUsers(firestoreList, localList));
  };
  emitMerged();

  const unsubLocal = subscribeLocalEvent('users', emitMerged);

  try {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubFirestore = onSnapshot(
      q,
      (snapshot) => {
        firestoreList = snapshot.docs.map((d) => ({
          ...d.data(),
          uid: d.id,
        } as UserProfile));
        emitMerged();
      },
      (err) => {
        emitMerged();
      }
    );
    return () => {
      unsubFirestore();
      unsubLocal();
    };
  } catch (e) {
    return unsubLocal;
  }
}

export async function fetchAllOrders(): Promise<Order[]> {
  try {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      ...d.data(),
      orderId: d.id,
    } as Order));
  } catch (e) {
    return getLocalOrders();
  }
}

export async function updateUserRole(
  targetUserId: string,
  newRole: UserRole,
  adminUser: UserProfile
) {
  try {
    const userRef = doc(db, 'users', targetUserId);
    await runTransaction(db, async (transaction) => {
      transaction.update(userRef, { role: newRole });
    });
  } catch (e) {
    console.warn('Firestore updateUserRole failed, updating locally:', e);
  }

  const users = getLocalUsers();
  const target = users.find((u) => u.uid === targetUserId);
  if (target) {
    target.role = newRole;
    saveLocalUser(target);
  }

  await logAdminAction(
    adminUser.uid,
    adminUser.email,
    'UBAH_ROLE_USER',
    targetUserId,
    `Ubah role user ${targetUserId} menjadi ${newRole}`
  );
}

export async function adjustUserBalance(
  targetUserId: string,
  amountChange: number,
  reason: string,
  adminUser: UserProfile
) {
  try {
    const userRef = doc(db, 'users', targetUserId);
    await runTransaction(db, async (transaction) => {
      const liveDoc = await transaction.get(userRef);
      if (!liveDoc.exists()) throw new Error('Pengguna tidak ditemukan');
      const currentBalance = Number(liveDoc.data().balance || 0);
      const newBalance = Math.max(0, currentBalance + amountChange);
      transaction.update(userRef, { balance: newBalance });
    });
  } catch (e) {
    console.warn('Firestore adjustUserBalance failed, adjusting locally:', e);
  }

  updateLocalUserBalance(targetUserId, amountChange);
  await logAdminAction(
    adminUser.uid,
    adminUser.email,
    'ADJUST_SALDO_USER',
    targetUserId,
    `Penyesuaian saldo sebesar ${amountChange > 0 ? '+' : ''}Rp${amountChange.toLocaleString('id-ID')}. Alasan: ${reason}`
  );
}
