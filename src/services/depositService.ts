import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  runTransaction,
  serverTimestamp,
  onSnapshot,
  increment,
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
  adminUser?: { uid: string; email: string } | string
) {
  const depositId = deposit.depositId;
  const adminEmail =
    typeof adminUser === 'string'
      ? adminUser
      : adminUser?.email || 'apriliansyahazril10@gmail.com';
  const adminUid =
    typeof adminUser === 'string' ? 'admin' : adminUser?.uid || 'admin';

  // 1. Update deposit status in Firestore
  try {
    const depositRef = doc(db, 'deposits', depositId);
    await setDoc(
      depositRef,
      {
        ...deposit,
        status: 'APPROVED',
        processedAt: new Date().toISOString(),
        processedBy: adminEmail,
      },
      { merge: true }
    );
  } catch (e) {
    console.warn('Firestore deposit status update warning:', e);
  }

  // 2. Update user balance in Firestore
  try {
    let updatedInFirestore = false;

    if (deposit.userId) {
      try {
        const userRef = doc(db, 'users', deposit.userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const uData = userSnap.data() as UserProfile;
          const currBal = Number(uData.balance || 0);
          const currTotal = Number(uData.totalDeposits || 0);
          await updateDoc(userRef, {
            balance: currBal + Number(deposit.amount),
            totalDeposits: currTotal + Number(deposit.amount),
            updatedAt: serverTimestamp(),
          });
          updatedInFirestore = true;
        }
      } catch (uErr) {
        console.warn('Firestore update by userId failed:', uErr);
      }
    }

    if (!updatedInFirestore && deposit.userEmail) {
      try {
        const q = query(
          collection(db, 'users'),
          where('email', '==', deposit.userEmail.toLowerCase().trim())
        );
        const userSnaps = await getDocs(q);
        for (const uDoc of userSnaps.docs) {
          const uData = uDoc.data() as UserProfile;
          const currBal = Number(uData.balance || 0);
          const currTotal = Number(uData.totalDeposits || 0);
          await updateDoc(uDoc.ref, {
            balance: currBal + Number(deposit.amount),
            totalDeposits: currTotal + Number(deposit.amount),
            updatedAt: serverTimestamp(),
          });
          updatedInFirestore = true;
        }
      } catch (qErr) {
        console.warn('Firestore query by email failed:', qErr);
      }
    }
  } catch (e) {
    console.warn('Firestore balance update warning, proceeding with local approval:', e);
  }

  // 3. Approve in Local Store (synchronous instant feedback)
  approveLocalDeposit(deposit, adminEmail);

  // 4. Log audit action
  try {
    const formattedAmount = (Number(deposit?.amount) || 0).toLocaleString('id-ID');
    await logAdminAction(
      adminUid,
      adminEmail,
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
  adminUserOrReason: { uid: string; email: string } | string,
  maybeReason?: string
) {
  let adminEmail = 'apriliansyahazril10@gmail.com';
  let adminUid = 'admin';
  let cleanReason = 'Pembayaran tidak sesuai atau mutasi tidak ditemukan';

  if (typeof adminUserOrReason === 'string') {
    if (maybeReason) {
      // (deposit, reason, email)
      cleanReason = adminUserOrReason.trim();
      adminEmail = maybeReason;
    } else {
      // (deposit, email)
      adminEmail = adminUserOrReason;
    }
  } else if (adminUserOrReason) {
    // (deposit, adminUser, reason)
    adminEmail = adminUserOrReason.email || adminEmail;
    adminUid = adminUserOrReason.uid || adminUid;
    if (maybeReason) cleanReason = maybeReason.trim();
  }

  // 1. Update in Firestore
  try {
    const depositRef = doc(db, 'deposits', deposit.depositId);
    await setDoc(
      depositRef,
      {
        ...deposit,
        status: 'REJECTED',
        rejectionReason: cleanReason,
        processedAt: new Date().toISOString(),
        processedBy: adminEmail,
      },
      { merge: true }
    );
  } catch (e) {
    console.warn('Firestore rejectDeposit warning, proceeding with local reject:', e);
  }

  // 2. Reject in Local Store
  rejectLocalDeposit(deposit, adminEmail, cleanReason);

  // 3. Log audit action
  try {
    const formattedAmount = (Number(deposit?.amount) || 0).toLocaleString('id-ID');
    await logAdminAction(
      adminUid,
      adminEmail,
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
