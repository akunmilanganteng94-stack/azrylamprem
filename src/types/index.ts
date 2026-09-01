export type UserRole = 'user' | 'admin';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  balance: number;
  role: UserRole;
  photoURL?: string;
  createdAt: any;
  updatedAt?: any;
  totalOrders?: number;
  totalDeposits?: number;
}

export interface Product {
  productId: string;
  name: string;
  price: number;
  active: boolean;
  description?: string;
}

export type InventoryStatus = 'AVAILABLE' | 'SOLD';

export interface InventoryItem {
  inventoryId: string;
  productId: string;
  gmail: string;
  generatorLogin: string;
  status: InventoryStatus;
  orderId?: string | null;
  createdAt: any;
  soldAt?: any | null;
}

export type OrderStatus = 'SUCCESS' | 'FAILED' | 'CANCELLED';

export interface OrderItemCredential {
  gmail: string;
  generatorLogin: string;
  inventoryId?: string;
}

export interface Order {
  orderId: string;
  userId: string;
  userName: string;
  userEmail: string;
  productId: string;
  productName: string;
  quantity: number;
  pricePerUnit: number;
  total: number;
  items: OrderItemCredential[];
  status: OrderStatus;
  createdAt: any;
}

export type DepositStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Deposit {
  depositId: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  senderName: string;
  status: DepositStatus;
  createdAt: any;
  processedAt?: any | null;
  processedBy?: string | null;
  rejectionReason?: string | null;
}

export interface AuditLog {
  id?: string;
  logId: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetId?: string | null;
  details?: string | null;
  createdAt: any;
  timestamp?: any;
}

export interface AdminStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingDepositsCount: number;
  totalApprovedDepositsAmount: number;
  availableStock: number;
  soldStock: number;
}
