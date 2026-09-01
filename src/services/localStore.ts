import { Deposit, InventoryItem, Order, UserProfile, AuditLog, AdminStats } from '../types';
import { generateDepositId, generateId, generateInventoryId, generateOrderId } from '../utils/formatters';

const STORAGE_KEYS = {
  USERS: 'am_store_users',
  CURRENT_USER: 'am_store_current_user',
  INVENTORY: 'am_store_inventory',
  ORDERS: 'am_store_orders',
  DEPOSITS: 'am_store_deposits',
  AUDIT_LOGS: 'am_store_audit_logs',
  DELETED_INVENTORY_IDS: 'am_store_deleted_inv_ids',
  SOLD_INVENTORY_IDS: 'am_store_sold_inv_ids',
  SEEDED: 'am_store_seeded_v3',
  PASSWORDS: 'am_store_user_passwords',
};

const INITIAL_INVENTORY: InventoryItem[] = [
  {
    inventoryId: 'INV-1001',
    productId: 'am-premium',
    gmail: 'am.pro.editor01@gmail.com',
    generatorLogin: 'https://alightcreative.com/login?token=ampro-9981-token',
    status: 'AVAILABLE',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    soldAt: null,
    orderId: null,
  },
  {
    inventoryId: 'INV-1002',
    productId: 'am-premium',
    gmail: 'am.pro.editor02@gmail.com',
    generatorLogin: 'https://alightcreative.com/login?token=ampro-7721-token',
    status: 'AVAILABLE',
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    soldAt: null,
    orderId: null,
  },
  {
    inventoryId: 'INV-1003',
    productId: 'am-premium',
    gmail: 'am.vip.creator03@gmail.com',
    generatorLogin: 'https://alightcreative.com/login?token=amvip-5531-token',
    status: 'AVAILABLE',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    soldAt: null,
    orderId: null,
  },
  {
    inventoryId: 'INV-1004',
    productId: 'am-premium',
    gmail: 'am.motion.pro04@gmail.com',
    generatorLogin: 'https://alightcreative.com/login?token=ampro-3341-token',
    status: 'AVAILABLE',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    soldAt: null,
    orderId: null,
  },
  {
    inventoryId: 'INV-1005',
    productId: 'am-premium',
    gmail: 'am.preset.vip05@gmail.com',
    generatorLogin: 'https://alightcreative.com/login?token=ampreset-1190-token',
    status: 'AVAILABLE',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    soldAt: null,
    orderId: null,
  },
];

function getLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    return fallback;
  }
}

function setLocal<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('LocalStorage write error:', err);
  }
}

type EventType = 'users' | 'inventory' | 'orders' | 'deposits' | 'audit' | 'profile';
const listeners = new Map<EventType, Set<() => void>>();

export function subscribeLocalEvent(event: EventType, callback: () => void) {
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }
  listeners.get(event)!.add(callback);
  return () => {
    listeners.get(event)?.delete(callback);
  };
}

function emitLocalEvent(event: EventType) {
  listeners.get(event)?.forEach((cb) => {
    try {
      cb();
    } catch (e) {
      console.error(e);
    }
  });
}

export function initLocalStore() {
  const isSeeded = localStorage.getItem(STORAGE_KEYS.SEEDED);
  if (!isSeeded) {
    const existingInv = getLocal<InventoryItem[] | null>(STORAGE_KEYS.INVENTORY, null);
    if (existingInv === null || existingInv.length === 0) {
      setLocal(STORAGE_KEYS.INVENTORY, INITIAL_INVENTORY);
    }
    localStorage.setItem(STORAGE_KEYS.SEEDED, 'true');
  }

  // Pre-seed primary admin user account
  const users = getLocal<UserProfile[]>(STORAGE_KEYS.USERS, []);
  const adminEmail = 'apriliansyahazril10@gmail.com';
  if (!users.some((u) => u.email.toLowerCase() === adminEmail.toLowerCase())) {
    const adminUser: UserProfile = {
      uid: 'admin-primary-uid',
      name: 'Azril (Admin Store)',
      email: adminEmail,
      balance: 100000,
      role: 'admin',
      createdAt: new Date().toISOString(),
      totalOrders: 0,
      totalDeposits: 100000,
    };
    users.push(adminUser);
    setLocal(STORAGE_KEYS.USERS, users);
  }
}

export function saveUserPassword(email: string, pass: string) {
  const passwords = getLocal<Record<string, string>>(STORAGE_KEYS.PASSWORDS, {});
  passwords[email.toLowerCase().trim()] = pass;
  setLocal(STORAGE_KEYS.PASSWORDS, passwords);
}

export function isUserRegistered(email: string): boolean {
  const cleanEmail = email.toLowerCase().trim();
  if (cleanEmail === 'apriliansyahazril10@gmail.com') return true;
  const users = getLocalUsers();
  return users.some((u) => u.email.toLowerCase() === cleanEmail);
}

export function checkUserPassword(email: string, pass: string): { valid: boolean; notRegistered?: boolean } {
  const cleanEmail = email.toLowerCase().trim();
  const passwords = getLocal<Record<string, string>>(STORAGE_KEYS.PASSWORDS, {});
  const user = getLocalUserByEmail(cleanEmail);

  // If user does not exist in our user base, strictly reject login
  if (!user && cleanEmail !== 'apriliansyahazril10@gmail.com') {
    return { valid: false, notRegistered: true };
  }

  if (passwords[cleanEmail]) {
    return { valid: passwords[cleanEmail] === pass };
  }

  // If admin default without explicit password recorded yet
  if (cleanEmail === 'apriliansyahazril10@gmail.com') {
    saveUserPassword(cleanEmail, pass);
    return { valid: true };
  }

  if (user) {
    saveUserPassword(cleanEmail, pass);
    return { valid: true };
  }

  return { valid: false, notRegistered: true };
}

// User methods
export function getLocalUsers(): UserProfile[] {
  return getLocal<UserProfile[]>(STORAGE_KEYS.USERS, []);
}

export function getLocalUserById(uid: string): UserProfile | null {
  const users = getLocalUsers();
  return users.find((u) => u.uid === uid) || null;
}

export function getLocalUserByEmail(email: string): UserProfile | null {
  const users = getLocalUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export function saveLocalUser(user: UserProfile) {
  const users = getLocalUsers();
  const idx = users.findIndex((u) => u.uid === user.uid || (u.email && u.email.toLowerCase() === user.email.toLowerCase()));
  if (idx >= 0) {
    users[idx] = { ...users[idx], ...user };
  } else {
    users.push(user);
  }
  setLocal(STORAGE_KEYS.USERS, users);
  emitLocalEvent('users');
  emitLocalEvent('profile');
}

export function updateLocalUserBalance(uidOrEmail: string, delta: number): UserProfile {
  const users = getLocalUsers();
  let idx = users.findIndex(
    (u) =>
      u.uid === uidOrEmail ||
      (u.email && u.email.toLowerCase() === uidOrEmail.toLowerCase())
  );
  if (idx < 0) {
    const isEmail = uidOrEmail.includes('@');
    const newUser: UserProfile = {
      uid: isEmail ? `user-${Date.now()}` : uidOrEmail,
      name: isEmail ? uidOrEmail.split('@')[0] : 'User',
      email: isEmail ? uidOrEmail : `user-${uidOrEmail}@mail.com`,
      balance: Math.max(0, delta),
      role: 'user',
      createdAt: new Date().toISOString(),
      totalDeposits: delta > 0 ? delta : 0,
      totalOrders: 0,
    };
    users.push(newUser);
    idx = users.length - 1;
  } else {
    const curr = Number(users[idx].balance || 0);
    const newBal = Math.max(0, curr + delta);
    users[idx].balance = newBal;
    if (delta > 0) {
      users[idx].totalDeposits = (Number(users[idx].totalDeposits) || 0) + delta;
    }
  }
  setLocal(STORAGE_KEYS.USERS, users);
  emitLocalEvent('users');
  emitLocalEvent('profile');
  return users[idx];
}

// Inventory methods
export function getLocalInventory(): InventoryItem[] {
  return getLocal<InventoryItem[]>(STORAGE_KEYS.INVENTORY, []);
}

export function getDeletedInventoryIds(): Set<string> {
  const list = getLocal<string[]>(STORAGE_KEYS.DELETED_INVENTORY_IDS, []);
  return new Set(list);
}

export function getSoldInventoryIds(): Set<string> {
  const list = getLocal<string[]>(STORAGE_KEYS.SOLD_INVENTORY_IDS, []);
  return new Set(list);
}

export function recordSoldInventoryIds(ids: string[]) {
  if (!ids || ids.length === 0) return;
  const current = getLocal<string[]>(STORAGE_KEYS.SOLD_INVENTORY_IDS, []);
  const set = new Set([...current, ...ids]);
  setLocal(STORAGE_KEYS.SOLD_INVENTORY_IDS, Array.from(set));
}

export function syncLocalInventoryWithFirestore(firestoreItems: InventoryItem[]) {
  if (!firestoreItems) return;
  const deletedIds = getDeletedInventoryIds();
  const soldIds = getSoldInventoryIds();
  const currentLocal = getLocalInventory();
  const map = new Map<string, InventoryItem>();

  for (const item of currentLocal) {
    if (item && item.inventoryId && !deletedIds.has(item.inventoryId)) {
      const isSold = item.status === 'SOLD' || soldIds.has(item.inventoryId);
      map.set(item.inventoryId, isSold ? { ...item, status: 'SOLD' } : item);
    }
  }

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

  const updated = Array.from(map.values()).sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  setLocal(STORAGE_KEYS.INVENTORY, updated);
}

export function addLocalInventoryItem(item: InventoryItem) {
  const deletedIds = getLocal<string[]>(STORAGE_KEYS.DELETED_INVENTORY_IDS, []);
  if (deletedIds.includes(item.inventoryId)) {
    const filteredDeleted = deletedIds.filter((id) => id !== item.inventoryId);
    setLocal(STORAGE_KEYS.DELETED_INVENTORY_IDS, filteredDeleted);
  }

  const list = getLocalInventory();
  const exists = list.some((i) => i.inventoryId === item.inventoryId);
  if (!exists) {
    list.unshift(item);
    setLocal(STORAGE_KEYS.INVENTORY, list);
    emitLocalEvent('inventory');
  }
}

export function addBulkLocalInventory(items: InventoryItem[]) {
  const newIds = new Set(items.map((i) => i.inventoryId));
  const deletedIds = getLocal<string[]>(STORAGE_KEYS.DELETED_INVENTORY_IDS, []);
  const filteredDeleted = deletedIds.filter((id) => !newIds.has(id));
  setLocal(STORAGE_KEYS.DELETED_INVENTORY_IDS, filteredDeleted);

  const list = getLocalInventory();
  const existingIds = new Set(list.map((i) => i.inventoryId));
  const newItems = items.filter((i) => !existingIds.has(i.inventoryId));
  const updated = [...newItems, ...list];
  setLocal(STORAGE_KEYS.INVENTORY, updated);
  emitLocalEvent('inventory');
}

export function deleteLocalInventoryItem(inventoryId: string) {
  const list = getLocalInventory();
  const filtered = list.filter((i) => i.inventoryId !== inventoryId);
  setLocal(STORAGE_KEYS.INVENTORY, filtered);

  const deletedIds = getLocal<string[]>(STORAGE_KEYS.DELETED_INVENTORY_IDS, []);
  if (!deletedIds.includes(inventoryId)) {
    deletedIds.push(inventoryId);
    setLocal(STORAGE_KEYS.DELETED_INVENTORY_IDS, deletedIds);
  }
  emitLocalEvent('inventory');
}

export function markLocalItemsSold(
  claimedIds: string[],
  orderId: string,
  user: UserProfile,
  orderData: Order
) {
  recordSoldInventoryIds(claimedIds);
  const inventory = getLocalInventory();
  const idSet = new Set(claimedIds);
  const now = new Date().toISOString();

  const updatedInventory = inventory.map((item) => {
    if (idSet.has(item.inventoryId)) {
      return {
        ...item,
        status: 'SOLD' as const,
        orderId,
        soldAt: now,
      };
    }
    return item;
  });
  setLocal(STORAGE_KEYS.INVENTORY, updatedInventory);

  // Update user balance locally
  const totalCost = Number(orderData.total || 0);
  const updatedUser = updateLocalUserBalance(user.uid, -totalCost);
  updatedUser.totalOrders = (updatedUser.totalOrders || 0) + orderData.quantity;
  saveLocalUser(updatedUser);

  // Save order to local list if not already present
  const orders = getLocalOrders();
  if (!orders.some((o) => o.orderId === orderId)) {
    orders.unshift(orderData);
    setLocal(STORAGE_KEYS.ORDERS, orders);
  }

  emitLocalEvent('inventory');
  emitLocalEvent('orders');
  emitLocalEvent('users');
  emitLocalEvent('profile');
}

// Order methods
export function getLocalOrders(): Order[] {
  return getLocal<Order[]>(STORAGE_KEYS.ORDERS, []);
}

export function processLocalOrder(user: UserProfile, quantity: number): Order {
  const qty = Math.floor(quantity);
  if (qty < 1) throw new Error('Jumlah pesanan minimal adalah 1 unit.');
  const total = qty * 300;
  const currentBal = user.balance || 0;
  if (currentBal < total) {
    throw new Error('Saldo Anda tidak mencukupi. Silakan deposit terlebih dahulu.');
  }

  const inventory = getLocalInventory();
  const soldIds = getSoldInventoryIds();
  const deletedIds = getDeletedInventoryIds();
  const availableItems = inventory.filter((i) => i.status === 'AVAILABLE' && !soldIds.has(i.inventoryId) && !deletedIds.has(i.inventoryId));

  if (availableItems.length < qty) {
    throw new Error(`Stok tidak mencukupi (tersedia: ${availableItems.length}, diminta: ${qty}).`);
  }

  const claimed = availableItems.slice(0, qty);
  const orderId = generateOrderId();
  const now = new Date().toISOString();
  const claimedIds = claimed.map((c) => c.inventoryId);
  recordSoldInventoryIds(claimedIds);

  const claimedIdSet = new Set(claimedIds);
  const updatedInventory = inventory.map((item) => {
    if (claimedIdSet.has(item.inventoryId)) {
      return {
        ...item,
        status: 'SOLD' as const,
        orderId,
        soldAt: now,
      };
    }
    return item;
  });
  setLocal(STORAGE_KEYS.INVENTORY, updatedInventory);

  const updatedUser = updateLocalUserBalance(user.uid, -total);
  updatedUser.totalOrders = (updatedUser.totalOrders || 0) + qty;
  saveLocalUser(updatedUser);

  const order: Order = {
    orderId,
    userId: user.uid,
    userName: user.name,
    userEmail: user.email,
    productId: 'am-premium',
    productName: 'Alight Motion Premium',
    quantity: qty,
    pricePerUnit: 300,
    total,
    items: claimed.map((c) => ({
      gmail: c.gmail,
      generatorLogin: c.generatorLogin,
      inventoryId: c.inventoryId,
    })),
    status: 'SUCCESS',
    createdAt: now,
  };

  const orders = getLocalOrders();
  orders.unshift(order);
  setLocal(STORAGE_KEYS.ORDERS, orders);

  emitLocalEvent('inventory');
  emitLocalEvent('orders');
  emitLocalEvent('users');
  emitLocalEvent('profile');

  return order;
}

// Deposit methods
export function getLocalDeposits(): Deposit[] {
  return getLocal<Deposit[]>(STORAGE_KEYS.DEPOSITS, []);
}

export function submitLocalDeposit(depositOrUser: Deposit | UserProfile, amount?: number, senderName?: string): Deposit {
  let dep: Deposit;
  if ('depositId' in depositOrUser) {
    dep = depositOrUser;
  } else {
    const depositId = generateDepositId();
    dep = {
      depositId,
      userId: depositOrUser.uid,
      userName: depositOrUser.name,
      userEmail: depositOrUser.email,
      amount: amount || 0,
      senderName: senderName || '',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      processedAt: null,
      processedBy: null,
      rejectionReason: null,
    };
  }

  const list = getLocalDeposits();
  const existingIdx = list.findIndex((d) => d.depositId === dep.depositId);
  if (existingIdx >= 0) {
    list[existingIdx] = dep;
  } else {
    list.unshift(dep);
  }
  setLocal(STORAGE_KEYS.DEPOSITS, list);
  emitLocalEvent('deposits');
  return dep;
}

export function approveLocalDeposit(depositOrId: Deposit | string, adminEmail: string) {
  const depositId = typeof depositOrId === 'string' ? depositOrId : depositOrId.depositId;
  const list = getLocalDeposits();
  let dep = list.find((d) => d.depositId === depositId);
  if (!dep && typeof depositOrId === 'object') {
    dep = { ...depositOrId };
    list.unshift(dep);
  }
  if (!dep) {
    dep = list.find((d) => d.status === 'PENDING');
  }
  if (!dep) {
    console.warn('Deposit record not in local store, creating placeholder approval for ID:', depositId);
    return;
  }
  if (dep.status === 'APPROVED') {
    return;
  }

  dep.status = 'APPROVED';
  dep.processedAt = new Date().toISOString();
  dep.processedBy = adminEmail;

  const userTarget = dep.userId || dep.userEmail;
  if (userTarget && dep.amount > 0) {
    try {
      updateLocalUserBalance(userTarget, dep.amount);
    } catch (e) {
      console.warn('Could not update user balance locally:', e);
    }
  }

  setLocal(STORAGE_KEYS.DEPOSITS, list);
  const formattedApproveAmount = (Number(dep?.amount) || 0).toLocaleString('id-ID');
  addLocalAuditLog(
    'admin-uid',
    adminEmail,
    'APPROVE_DEPOSIT',
    dep.depositId,
    `Menyetujui deposit Rp${formattedApproveAmount} untuk ${dep.userEmail}`
  );
  emitLocalEvent('deposits');
}

export function rejectLocalDeposit(depositOrId: Deposit | string, adminEmail: string, reason: string) {
  const depositId = typeof depositOrId === 'string' ? depositOrId : depositOrId.depositId;
  const list = getLocalDeposits();
  let dep = list.find((d) => d.depositId === depositId);
  if (!dep && typeof depositOrId === 'object') {
    dep = { ...depositOrId };
    list.unshift(dep);
  }
  if (!dep) {
    dep = list.find((d) => d.status === 'PENDING');
  }
  if (!dep) {
    console.warn('Deposit record not in local store for rejection ID:', depositId);
    return;
  }
  if (dep.status === 'REJECTED') {
    return;
  }

  dep.status = 'REJECTED';
  dep.rejectionReason = reason || 'Pembayaran tidak sesuai atau mutasi tidak ditemukan.';
  dep.processedAt = new Date().toISOString();
  dep.processedBy = adminEmail;

  setLocal(STORAGE_KEYS.DEPOSITS, list);
  const formattedRejectAmount = (Number(dep?.amount) || 0).toLocaleString('id-ID');
  addLocalAuditLog(
    'admin-uid',
    adminEmail,
    'REJECT_DEPOSIT',
    dep.depositId,
    `Menolak deposit Rp${formattedRejectAmount} (${dep.userEmail}). Alasan: ${dep.rejectionReason}`
  );
  emitLocalEvent('deposits');
}

// Audit Logs
export function getLocalAuditLogs(): AuditLog[] {
  return getLocal<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
}

export function addLocalAuditLog(
  adminId: string,
  adminEmail: string,
  action: string,
  targetId?: string,
  details?: string
) {
  const logs = getLocalAuditLogs();
  const log: AuditLog = {
    id: generateId('LOG'),
    logId: generateId('LOG'),
    adminId,
    adminEmail,
    action,
    targetId: targetId || null,
    details: details || null,
    createdAt: new Date().toISOString(),
    timestamp: new Date().toISOString(),
  };
  logs.unshift(log);
  setLocal(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 200));
  emitLocalEvent('audit');
}

// Admin stats
export function getLocalAdminStats(): AdminStats {
  const users = getLocalUsers();
  const orders = getLocalOrders();
  const deposits = getLocalDeposits();
  const inventory = getLocalInventory();

  const totalRevenue = orders.reduce((acc, o) => acc + (o.total || 0), 0);
  const pendingDeposits = deposits.filter((d) => d.status === 'PENDING').length;
  const approvedDepositAmount = deposits
    .filter((d) => d.status === 'APPROVED')
    .reduce((acc, d) => acc + (d.amount || 0), 0);
  const availableStock = inventory.filter((i) => i.status === 'AVAILABLE').length;
  const soldStock = inventory.filter((i) => i.status === 'SOLD').length;

  return {
    totalUsers: users.length,
    totalOrders: orders.length,
    totalRevenue,
    pendingDepositsCount: pendingDeposits,
    totalApprovedDepositsAmount: approvedDepositAmount,
    availableStock,
    soldStock,
  };
}
