import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  serverTimestamp,
  writeBatch,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { InventoryItem } from '../types';
import { generateInventoryId } from '../utils/formatters';
import { logAdminAction } from './auditService';
import {
  addBulkLocalInventory,
  addLocalInventoryItem,
  deleteLocalInventoryItem,
  getDeletedInventoryIds,
  getSoldInventoryIds,
  getLocalInventory,
  subscribeLocalEvent,
  syncLocalInventoryWithFirestore,
} from './localStore';

export async function addSingleStock(
  gmail: string,
  generatorLogin: string,
  adminUser: { uid: string; email: string }
): Promise<InventoryItem> {
  const cleanGmail = gmail.trim();
  const cleanGen = generatorLogin.trim();
  if (!cleanGmail || !cleanGen) {
    throw new Error('Gmail dan Generator Login tidak boleh kosong');
  }

  const inventoryId = generateInventoryId();
  const item: InventoryItem = {
    inventoryId,
    productId: 'am-premium',
    gmail: cleanGmail,
    generatorLogin: cleanGen,
    status: 'AVAILABLE',
    createdAt: new Date().toISOString(),
    soldAt: null,
    orderId: null,
  };

  try {
    const itemRef = doc(db, 'inventory', inventoryId);
    await setDoc(itemRef, {
      ...item,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    console.warn('Firestore addSingleStock failed, using local store:', e);
  }

  addLocalInventoryItem(item);
  await logAdminAction(
    adminUser.uid,
    adminUser.email,
    'TAMBAH_STOK',
    inventoryId,
    `Tambah stok 1 unit: ${cleanGmail}`
  );

  return item;
}

export interface BulkParseResult {
  gmail: string;
  generatorLogin: string;
}

export function parseBulkStockText(rawText: string): BulkParseResult[] {
  const lines = rawText.split('\n');
  const results: BulkParseResult[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.toLowerCase().startsWith('gmail')) {
      continue;
    }

    let gmail = '';
    let generatorLogin = '';

    if (trimmed.includes('|')) {
      const parts = trimmed.split('|').map((s) => s.trim());
      if (parts.length >= 2) {
        gmail = parts[0];
        generatorLogin = parts[1];
      }
    } else if (trimmed.includes(';')) {
      const parts = trimmed.split(';').map((s) => s.trim());
      if (parts.length >= 2) {
        gmail = parts[0];
        generatorLogin = parts[1];
      }
    } else if (trimmed.includes('\t')) {
      const parts = trimmed.split('\t').map((s) => s.trim()).filter(Boolean);
      if (parts.length >= 2) {
        gmail = parts[0];
        generatorLogin = parts[1];
      }
    } else if (trimmed.includes(',')) {
      const parts = trimmed.split(',').map((s) => s.trim());
      if (parts.length >= 2) {
        gmail = parts[0];
        generatorLogin = parts[1];
      }
    } else {
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 2) {
        gmail = parts[0];
        generatorLogin = parts.slice(1).join(' ');
      }
    }

    if (gmail && generatorLogin) {
      results.push({ gmail, generatorLogin });
    }
  }

  return results;
}

export async function addBulkStock(
  rawText: string,
  adminUser: { uid: string; email: string }
): Promise<number> {
  const items = parseBulkStockText(rawText);
  if (items.length === 0) {
    throw new Error('Tidak ada data valid yang ditemukan. Format: user@gmail.com [spasi/tab/|] generatorLogin');
  }

  const inventoryItems: InventoryItem[] = items.map((item) => ({
    inventoryId: generateInventoryId(),
    productId: 'am-premium',
    gmail: item.gmail,
    generatorLogin: item.generatorLogin,
    status: 'AVAILABLE',
    createdAt: new Date().toISOString(),
    soldAt: null,
    orderId: null,
  }));

  try {
    const CHUNK_SIZE = 400;
    for (let i = 0; i < inventoryItems.length; i += CHUNK_SIZE) {
      const chunk = inventoryItems.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      for (const inv of chunk) {
        const itemRef = doc(db, 'inventory', inv.inventoryId);
        batch.set(itemRef, {
          ...inv,
          createdAt: serverTimestamp(),
        });
      }
      await batch.commit();
    }
  } catch (e) {
    console.warn('Firestore addBulkStock failed, storing locally:', e);
  }

  addBulkLocalInventory(inventoryItems);
  await logAdminAction(
    adminUser.uid,
    adminUser.email,
    'BULK_TAMBAH_STOK',
    undefined,
    `Tambah massal ${inventoryItems.length} unit stok AM Premium`
  );

  return inventoryItems.length;
}

export async function clearSoldStockItems(adminUser: { uid: string; email: string }): Promise<number> {
  const localItems = getLocalInventory();
  const soldItems = localItems.filter((i) => i.status === 'SOLD');

  for (const item of soldItems) {
    try {
      const docRef = doc(db, 'inventory', item.inventoryId);
      await deleteDoc(docRef);
    } catch (e) {
      // ignore
    }
    deleteLocalInventoryItem(item.inventoryId);
  }

  await logAdminAction(
    adminUser.uid,
    adminUser.email,
    'BERSIHKAN_STOK_TERJUAL',
    undefined,
    `Membersihkan ${soldItems.length} unit stok terjual`
  );

  return soldItems.length;
}

export async function deleteStockItem(
  inventoryId: string,
  adminUser: { uid: string; email: string }
) {
  try {
    const docRef = doc(db, 'inventory', inventoryId);
    await deleteDoc(docRef);
  } catch (e) {
    console.warn('Firestore deleteStockItem failed, deleting locally:', e);
  }

  deleteLocalInventoryItem(inventoryId);
  await logAdminAction(
    adminUser.uid,
    adminUser.email,
    'HAPUS_STOK',
    inventoryId,
    `Hapus stok item ${inventoryId}`
  );
}

export function mergeInventory(firestoreItems: InventoryItem[], localItems: InventoryItem[]): InventoryItem[] {
  const deletedIds = getDeletedInventoryIds();
  const soldIds = getSoldInventoryIds();
  const map = new Map<string, InventoryItem>();

  // Add local items first
  for (const item of localItems) {
    if (item && item.inventoryId && !deletedIds.has(item.inventoryId)) {
      const isSold = item.status === 'SOLD' || soldIds.has(item.inventoryId);
      map.set(item.inventoryId, isSold ? { ...item, status: 'SOLD' } : item);
    }
  }

  // Overlay Firestore items, respecting SOLD status and ignoring deleted items
  for (const item of firestoreItems) {
    if (!item || !item.inventoryId || deletedIds.has(item.inventoryId)) {
      continue;
    }
    const local = map.get(item.inventoryId);
    const isSold = item.status === 'SOLD' || (local && local.status === 'SOLD') || soldIds.has(item.inventoryId);
    if (isSold) {
      map.set(item.inventoryId, {
        ...item,
        status: 'SOLD',
        soldAt: (local && local.soldAt) || item.soldAt || new Date().toISOString(),
        orderId: (local && local.orderId) || item.orderId || undefined,
      });
    } else {
      map.set(item.inventoryId, item);
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    return timeB - timeA;
  });
}

export function subscribeAllInventory(callback: (items: InventoryItem[]) => void) {
  let firestoreList: InventoryItem[] = [];
  const emitMerged = () => {
    const localList = getLocalInventory();
    const merged = mergeInventory(firestoreList, localList);
    callback(merged);
  };
  emitMerged();

  const unsubLocal = subscribeLocalEvent('inventory', emitMerged);

  try {
    const q = query(collection(db, 'inventory'), orderBy('createdAt', 'desc'));
    const unsubFirestore = onSnapshot(
      q,
      (snapshot) => {
        firestoreList = snapshot.docs.map((d) => d.data() as InventoryItem);
        syncLocalInventoryWithFirestore(firestoreList);
        emitMerged();
      },
      (err) => {
        console.warn('Firestore all inventory listener warning:', err.message);
        emitMerged();
      }
    );
    return () => {
      unsubFirestore();
      unsubLocal();
    };
  } catch (err) {
    return unsubLocal;
  }
}

export function subscribeAvailableStockCount(callback: (count: number) => void) {
  return subscribeAllInventory((items) => {
    const available = items.filter((i) => i.status === 'AVAILABLE').length;
    callback(available);
  });
}
