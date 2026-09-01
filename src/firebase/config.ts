import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyCryGWfhJyjoP2GNsga7xfV70eiGSr-oj4",
  authDomain: "alight-motion-premium-dcfb1.firebaseapp.com",
  projectId: "alight-motion-premium-dcfb1",
  storageBucket: "alight-motion-premium-dcfb1.firebasestorage.app",
  messagingSenderId: "432393579760",
  appId: "1:432393579760:web:d2015943a38d2a676d6635",
  measurementId: "G-WLFMSN4N5N"
};

// Initialize Firebase safely
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
