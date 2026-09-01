import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  runTransaction,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Deposit, UserProfile } from '../types';
import { generateDepositId } from '../utils/formatters';
import { logAdminAction } from './auditService';
import {
  approveLocalDeposit,
  getLocalDeposits,
  rejectLocalDeposit,
  submitLocalDeposit,
  subscribeLocalEvent,
} from './localStore';

export const DEPOSIT_CONFIG = {
  minDeposit: 1000,
  danaNumber: '085786683784',
  danaName: 'Jeje',
  qrImage: 'https://cdn.phototourl.com/member/2026-08-31-831fd686-d407-43b9-ad36-86b9502e8164.jpg',
  tiktokTutorial: 'https://vt.tiktok.com/ZSV3bDXSW/',
  whatsappChannel: 'https://whatsapp.com/channel/0029VbCwLl7J3jv1QSig1V0C',
};

export async function submitDeposit(
  user: UserProfile,
  amount: number,
  senderName: string
): Promise<Deposit> {
  const cleanAmount = Math.floor(amount);
  const cleanSender = senderName.trim();
  if (cleanAmount < DEPOSIT_CONFIG.minDeposit) {
    throw new Error(`Minimal deposit adalah Rp${DEPOSIT_CONFIG.minDeposit.toLocaleString('id-ID')}.`);
  }
  if (!cleanSender) {
    throw new Error('Nama pengirim wajib diisi.');
  }

  const depositId = generateDepositId();
  const depositData: Deposit = {
    depositId,
    userId: user.uid,
    userName: user.name || user.email.split('@')[0],
    userEmail: user.email,
    amount: cleanAmount,
    senderName: cleanSender,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    processedAt: null,
    processedBy: null,
    rejectionReason: null,
  };

  try {
    const depositRef = doc(db, 'deposits', depositId);
    await setDoc(depositRef, {
      ...depositData,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    console.warn('Firestore submitDeposit failed, using local store:', e);
  }

  submitLocalDeposit(depositData);
  return depositData;
}

export async function approveDeposit(
  deposit: Deposit,
  adminUser: { uid: string; email: string }
) {
  const depositId = deposit.depositId;

  // 1. Update Firestore
  try {
    const depositRef = doc(db, 'deposits', depositId);
    await setDoc(
      depositRef,
      {
        ...deposit,
        status: 'APPROVED',
        processedAt: serverTimestamp(),
        processedBy: adminUser.email,
      },
      { merge: true }
    );

    // Update user balance in Firestore
    if (deposit.userId) {
      try {
        const userRef = doc(db, 'users', deposit.userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const uData = userSnap.data() as UserProfile;
          const currBal = Number(uData.balance || 0);
          const currTotal = Number(uData.totalDeposits || 0);
          await updateDoc(userRef, {
            balance: currBal + deposit.amount,
            totalDeposits: currTotal + deposit.amount,
            updatedAt: serverTimestamp(),
          });
        }
      } catch (uErr) {
        console.warn('Firestore user balance update warning:', uErr);
      }
    }
  } catch (e) {
    console.warn('Firestore approveDeposit warning, proceeding with local approval:', e);
  }

  // 2. Approve in Local Store
  approveLocalDeposit(deposit, adminUser.email);

  // 3. Log audit action
  try {
    const formattedAmount = (Number(deposit?.amount) || 0).toLocaleString('id-ID');
    await logAdminAction(
      adminUser.uid,
      adminUser.email,
      'APPROVE_DEPOSIT',
      deposit.depositId,
      `Menyetujui deposit ${deposit.depositId} sebesar Rp${formattedAmount} untuk ${deposit.userEmail}`
    );
  } catch (err) {
    console.warn('Audit log error:', err);
  }
}

export async function rejectDeposit(
  deposit: Deposit,
  adminUser: { uid: string; email: string },
  reason: string
) {
  const cleanReason = reason?.trim() || 'Pembayaran tidak sesuai atau mutasi tidak ditemukan';

  // 1. Update in Firestore
  try {
    const depositRef = doc(db, 'deposits', deposit.depositId);
    await setDoc(
      depositRef,
      {
        ...deposit,
        status: 'REJECTED',
        rejectionReason: cleanReason,
        processedAt: serverTimestamp(),
        processedBy: adminUser.email,
      },
      { merge: true }
    );
  } catch (e) {
    console.warn('Firestore rejectDeposit warning, proceeding with local reject:', e);
  }

  // 2. Reject in Local Store
  rejectLocalDeposit(deposit, adminUser.email, cleanReason);

  // 3. Log audit action
  try {
    const formattedAmount = (Number(deposit?.amount) || 0).toLocaleString('id-ID');
    await logAdminAction(
      adminUser.uid,
      adminUser.email,
      'REJECT_DEPOSIT',
      deposit.depositId,
      `Menolak deposit ${deposit.depositId} sebesar Rp${formattedAmount} (${deposit.userEmail}). Alasan: ${cleanReason}`
    );
  } catch (err) {
    console.warn('Audit log error:', err);
  }
}

function mergeDeposits(firestoreDeposits: Deposit[], localDeposits: Deposit[]): Deposit[] {
  const map = new Map<string, Deposit>();
  for (const dep of localDeposits) {
    map.set(dep.depositId, dep);
  }
  for (const dep of firestoreDeposits) {
    const local = map.get(dep.depositId);
    if (local && local.status !== 'PENDING' && dep.status === 'PENDING') {
      map.set(dep.depositId, {
        ...dep,
        status: local.status,
        processedAt: local.processedAt || dep.processedAt,
        processedBy: local.processedBy || dep.processedBy,
        rejectionReason: local.rejectionReason || dep.rejectionReason,
      });
    } else {
      map.set(dep.depositId, dep);
    }
  }
  return Array.from(map.values()).sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    return timeB - timeA;
  });
}

export function subscribeUserDeposits(userId: string, callback: (deposits: Deposit[]) => void) {
  let firestoreList: Deposit[] = [];
  const emitMerged = () => {
    const localList = getLocalDeposits().filter((d) => d.userId === userId);
    const merged = mergeDeposits(firestoreList, localList);
    callback(merged);
  };
  emitMerged();

  const unsubLocal = subscribeLocalEvent('deposits', emitMerged);

  try {
    const q = query(
      collection(db, 'deposits'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const unsubFirestore = onSnapshot(
      q,
      (snapshot) => {
        firestoreList = snapshot.docs.map((d) => d.data() as Deposit);
        emitMerged();
      },
      (err) => {
        console.warn('Firestore user deposits error:', err.message);
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

export function subscribeAllDeposits(callback: (deposits: Deposit[]) => void) {
  let firestoreList: Deposit[] = [];
  const emitMerged = () => {
    const localList = getLocalDeposits();
    const merged = mergeDeposits(firestoreList, localList);
    callback(merged);
  };
  emitMerged();

  const unsubLocal = subscribeLocalEvent('deposits', emitMerged);

  try {
    const q = query(collection(db, 'deposits'), orderBy('createdAt', 'desc'));
    const unsubFirestore = onSnapshot(
      q,
      (snapshot) => {
        firestoreList = snapshot.docs.map((d) => d.data() as Deposit);
        emitMerged();
      },
      (err) => {
        console.warn('Firestore all deposits error:', err.message);
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
