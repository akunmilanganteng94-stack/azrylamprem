import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Product } from '../types';

export const DEFAULT_PRODUCT: Product = {
  productId: 'am-premium',
  name: 'Alight Motion Premium',
  price: 300,
  active: true,
  description: 'Alight Motion Pro / Premium Unlock, Full Preset, Tanpa Watermark, Akses Instan.',
};

export async function ensureDefaultProduct(): Promise<Product> {
  const prodRef = doc(db, 'products', DEFAULT_PRODUCT.productId);
  try {
    const snap = await getDoc(prodRef);
    if (!snap.exists()) {
      await setDoc(prodRef, DEFAULT_PRODUCT);
      return DEFAULT_PRODUCT;
    }
    return snap.data() as Product;
  } catch (err) {
    console.warn('Could not fetch product from db, using default:', err);
    return DEFAULT_PRODUCT;
  }
}
