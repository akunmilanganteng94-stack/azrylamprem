import {
  collection,
  doc,
  query,
  where,
  getDocs,
  limit,
  orderBy,
  runTransaction,
  serverTimestamp,
  onSnapshot,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Order, OrderItemCredential, UserProfile } from '../types';
import { generateOrderId } from '../utils/formatters';
import {
  getLocalOrders,
  processLocalOrder,
  subscribeLocalEvent,
  getLocalInventory,
  updateLocalUserBalance,
  saveLocalUser,
  markLocalItemsSold,
} from './localStore';

const PRODUCT_PRICE_PER_UNIT = 300; // Rp300 / unit

export async function processOrder(
  user: UserProfile,
  quantity: number
): Promise<Order> {
  const qty = Math.floor(quantity);
  if (qty < 1) {
    throw new Error('Jumlah pesanan minimal adalah 1 unit.');
  }

  const expectedTotal = qty * PRODUCT_PRICE_PER_UNIT;
  const currentBalance = Number(user.balance || 0);
  if (currentBalance < expectedTotal) {
    throw new Error('Saldo Anda tidak mencukupi. Silakan deposit terlebih dahulu.');
  }

  // Try Firestore atomic transaction first if available
  try {
    const inventoryRef = collection(db, 'inventory');
    const stockQuery = query(
      inventoryRef,
      where('status', '==', 'AVAILABLE'),
      limit(qty)
    );
    const stockSnap = await getDocs(stockQuery);

    if (stockSnap.size >= qty) {
      const selectedInventoryDocs = stockSnap.docs;
      const orderId = generateOrderId();
      const userRef = doc(db, 'users', user.uid);
      const orderRef = doc(db, 'orders', orderId);

      const resultOrder = await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        let userBal = currentBalance;
        let userOrders = user.totalOrders || 0;
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserProfile;
          userBal = Number(userData.balance || 0);
          userOrders = userData.totalOrders || 0;
        }

        if (userBal < expectedTotal) {
          throw new Error('Saldo Anda tidak mencukupi. Silakan deposit terlebih dahulu.');
        }

        const claimedItems: OrderItemCredential[] = [];

        for (const stockDoc of selectedInventoryDocs) {
          const liveStockDoc = await transaction.get(stockDoc.ref);
          if (!liveStockDoc.exists() || liveStockDoc.data().status !== 'AVAILABLE') {
            throw new Error('Sebagian stok baru saja dibeli pengguna lain. Silakan coba lagi.');
          }
          const data = liveStockDoc.data();
          claimedItems.push({
            gmail: data.gmail,
            generatorLogin: data.generatorLogin,
            inventoryId: liveStockDoc.id,
          });
        }

        if (claimedItems.length < qty) {
          throw new Error('Stok tidak mencukupi untuk memenuhi pesanan ini.');
        }

        const newBalance = userBal - expectedTotal;
        const newTotalOrders = userOrders + qty;

        if (userDoc.exists()) {
          transaction.update(userRef, {
            balance: newBalance,
            totalOrders: newTotalOrders,
          });
        }

        for (const stockDoc of selectedInventoryDocs) {
          transaction.update(stockDoc.ref, {
            status: 'SOLD',
            orderId: orderId,
            soldAt: serverTimestamp(),
          });
        }

        const orderData: Order = {
          orderId,
          userId: user.uid,
          userName: user.name || user.email.split('@')[0],
          userEmail: user.email,
          productId: 'am-premium',
          productName: 'Alight Motion Premium',
          quantity: qty,
          pricePerUnit: PRODUCT_PRICE_PER_UNIT,
          total: expectedTotal,
          items: claimedItems,
          status: 'SUCCESS',
          createdAt: new Date().toISOString(),
        };

        transaction.set(orderRef, {
          ...orderData,
          createdAt: serverTimestamp(),
        });

        return orderData;
      });

      // Synchronize exact claimed items to local store
      try {
        const claimedIds = resultOrder.items.map((i) => i.inventoryId).filter(Boolean) as string[];
        markLocalItemsSold(claimedIds, resultOrder.orderId, user, resultOrder);
      } catch (localSyncErr) {
        console.warn('Local sync error:', localSyncErr);
      }

      return resultOrder;
    }
  } catch (err: any) {
    if (
      err?.message?.includes('Saldo Anda tidak mencukupi') ||
      err?.message?.includes('Jumlah pesanan minimal')
    ) {
      throw err;
    }
    console.warn('Firestore processOrder proceeding with local store:', err?.message);
  }

  // Fallback to local store processing
  const localOrder = processLocalOrder(user, qty);

  // Sync back to Firestore in background
  try {
    const orderRef = doc(db, 'orders', localOrder.orderId);
    setDoc(orderRef, {
      ...localOrder,
      createdAt: serverTimestamp(),
    }).catch(() => {});

    const userRef = doc(db, 'users', user.uid);
    setDoc(
      userRef,
      {
        balance: Math.max(0, currentBalance - expectedTotal),
        totalOrders: (user.totalOrders || 0) + qty,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    ).catch(() => {});

    for (const item of localOrder.items) {
      if (item.inventoryId) {
        const invRef = doc(db, 'inventory', item.inventoryId);
        setDoc(
          invRef,
          {
            inventoryId: item.inventoryId,
            productId: 'am-premium',
            gmail: item.gmail,
            generatorLogin: item.generatorLogin,
            status: 'SOLD',
            orderId: localOrder.orderId,
            soldAt: serverTimestamp(),
          },
          { merge: true }
        ).catch(() => {});
      }
    }
  } catch (e) {
    // Ignore background sync errors
  }

  return localOrder;
}

function mergeOrders(firestoreOrders: Order[], localOrders: Order[]): Order[] {
  const map = new Map<string, Order>();
  for (const ord of localOrders) {
    map.set(ord.orderId, ord);
  }
  for (const ord of firestoreOrders) {
    map.set(ord.orderId, ord);
  }
  return Array.from(map.values()).sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    return timeB - timeA;
  });
}

export function subscribeUserOrders(userId: string, callback: (orders: Order[]) => void) {
  let firestoreList: Order[] = [];
  const emitMerged = () => {
    const localList = getLocalOrders().filter((o) => o.userId === userId);
    const merged = mergeOrders(firestoreList, localList);
    callback(merged);
  };
  emitMerged();

  const unsubLocal = subscribeLocalEvent('orders', emitMerged);

  try {
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const unsubFirestore = onSnapshot(
      q,
      (snapshot) => {
        firestoreList = snapshot.docs.map((d) => d.data() as Order);
        emitMerged();
      },
      (err) => {
        console.warn('Firestore user orders listener warning:', err.message);
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

export function subscribeAllOrders(callback: (orders: Order[]) => void) {
  let firestoreList: Order[] = [];
  const emitMerged = () => {
    const localList = getLocalOrders();
    const merged = mergeOrders(firestoreList, localList);
    callback(merged);
  };
  emitMerged();

  const unsubLocal = subscribeLocalEvent('orders', emitMerged);

  try {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubFirestore = onSnapshot(
      q,
      (snapshot) => {
        firestoreList = snapshot.docs.map((d) => d.data() as Order);
        emitMerged();
      },
      (err) => {
        console.warn('Firestore all orders listener warning:', err.message);
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
