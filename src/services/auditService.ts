import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { generateId } from '../utils/formatters';
import { AuditLog } from '../types';
import { addLocalAuditLog, getLocalAuditLogs, subscribeLocalEvent } from './localStore';

export async function logAdminAction(
  adminId: string,
  adminEmail: string,
  action: string,
  targetId?: string,
  details?: string
) {
  try {
    const logsRef = collection(db, 'auditLogs');
    const logId = generateId('LOG');
    await addDoc(logsRef, {
      logId,
      adminId,
      adminEmail,
      action,
      targetId: targetId || null,
      details: details || null,
      createdAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Firestore write audit log skipped, recording locally');
  }
  addLocalAuditLog(adminId, adminEmail, action, targetId, details);
}

export async function fetchAuditLogs(maxLogs = 100): Promise<AuditLog[]> {
  try {
    const q = query(
      collection(db, 'auditLogs'),
      orderBy('createdAt', 'desc'),
      limit(maxLogs)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        logId: data.logId || d.id,
        adminId: data.adminId,
        adminEmail: data.adminEmail,
        action: data.action,
        targetId: data.targetId,
        details: data.details,
        timestamp: data.timestamp || data.createdAt,
        createdAt: data.createdAt,
      } as AuditLog;
    });
  } catch (e) {
    return getLocalAuditLogs().slice(0, maxLogs);
  }
}

export function subscribeAuditLogs(callback: (logs: AuditLog[]) => void, maxLogs = 50) {
  let isFirestoreWorking = false;
  const emitLocal = () => {
    if (!isFirestoreWorking) {
      callback(getLocalAuditLogs().slice(0, maxLogs));
    }
  };
  emitLocal();

  const unsubLocal = subscribeLocalEvent('audit', emitLocal);

  try {
    const q = query(
      collection(db, 'auditLogs'),
      orderBy('createdAt', 'desc'),
      limit(maxLogs)
    );
    const unsubFirestore = onSnapshot(
      q,
      (snapshot) => {
        isFirestoreWorking = true;
        const logs = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            logId: data.logId || d.id,
            adminId: data.adminId,
            adminEmail: data.adminEmail,
            action: data.action,
            targetId: data.targetId,
            details: data.details,
            timestamp: data.timestamp || data.createdAt,
            createdAt: data.createdAt,
          } as AuditLog;
        });
        callback(logs);
      },
      (err) => {
        isFirestoreWorking = false;
        emitLocal();
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
