import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase/config';
import { UserProfile, UserRole } from '../types';
import {
  initLocalStore,
  getLocalUserByEmail,
  getLocalUserById,
  saveLocalUser,
  saveUserPassword,
  checkUserPassword,
  subscribeLocalEvent,
} from '../services/localStore';

interface AuthContextType {
  currentUser: FirebaseUser | { uid: string; email: string | null; displayName: string | null; photoURL: string | null } | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (name: string, email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Primary admin email
export const PRIMARY_ADMIN_EMAIL = 'apriliansyahazril10@gmail.com';
const LOCAL_SESSION_KEY = 'am_active_session_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize local store on mount
  useEffect(() => {
    initLocalStore();
  }, []);

  // Sync profile when local events occur
  useEffect(() => {
    const unsub = subscribeLocalEvent('profile', () => {
      if (currentUser?.uid || currentUser?.email) {
        const local =
          (currentUser.uid ? getLocalUserById(currentUser.uid) : null) ||
          (currentUser.email ? getLocalUserByEmail(currentUser.email) : null);
        if (local) {
          setUserProfile(local);
        }
      }
    });
    return unsub;
  }, [currentUser]);

  // Main Auth Listener (Firebase Auth + Firestore Profile Sync)
  useEffect(() => {
    let isFirebaseActive = false;
    let unsubscribeProfile: (() => void) | null = null;
    let unsubscribeAuth: (() => void) | null = null;

    try {
      unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
        if (user) {
          isFirebaseActive = true;
          setCurrentUser(user);
          localStorage.removeItem(LOCAL_SESSION_KEY);

          if (unsubscribeProfile) {
            unsubscribeProfile();
            unsubscribeProfile = null;
          }

          const userRef = doc(db, 'users', user.uid);
          try {
            const docSnap = await getDoc(userRef);
            const isPrimaryAdmin = user.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase();

            if (!docSnap.exists()) {
              const initialRole: UserRole = isPrimaryAdmin ? 'admin' : 'user';
              const newProfile: UserProfile = {
                uid: user.uid,
                name: user.displayName || user.email?.split('@')[0] || 'User',
                email: user.email || '',
                balance: isPrimaryAdmin ? 100000 : 0,
                role: initialRole,
                photoURL: user.photoURL || undefined,
                createdAt: new Date().toISOString(),
                totalOrders: 0,
                totalDeposits: isPrimaryAdmin ? 100000 : 0,
              };
              await setDoc(userRef, {
                ...newProfile,
                createdAt: serverTimestamp(),
              });
              setUserProfile(newProfile);
              saveLocalUser(newProfile);
            } else {
              const data = docSnap.data() as UserProfile;
              if (isPrimaryAdmin && data.role !== 'admin') {
                await setDoc(userRef, { role: 'admin' }, { merge: true });
              }
              setUserProfile(data);
              saveLocalUser(data);
            }

            unsubscribeProfile = onSnapshot(
              userRef,
              (snapshot) => {
                if (snapshot.exists()) {
                  const data = snapshot.data() as UserProfile;
                  const roleValue: UserRole =
                    user.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase() ||
                    data.role === 'admin'
                      ? 'admin'
                      : 'user';
                  const profileData: UserProfile = {
                    ...data,
                    uid: snapshot.id,
                    balance: Number(data.balance || 0),
                    role: roleValue,
                  };
                  setUserProfile(profileData);
                  saveLocalUser(profileData);
                }
              },
              (err) => {
                console.warn('Firestore snapshot error:', err.message);
              }
            );
          } catch (err) {
            console.warn('Firestore user fetch failed, using local profile fallback:', err);
            setupLocalProfileForUser(user.uid, user.email || '', user.displayName || '');
          } finally {
            setLoading(false);
          }
        } else {
          // If no Firebase user, check active local session
          if (!isFirebaseActive) {
            restoreLocalSession();
          } else {
            setCurrentUser(null);
            setUserProfile(null);
            setLoading(false);
          }
        }
      });
    } catch (err) {
      console.warn('Firebase onAuthStateChanged error:', err);
      restoreLocalSession();
    }

    function restoreLocalSession() {
      try {
        const stored = localStorage.getItem(LOCAL_SESSION_KEY);
        if (stored) {
          const u = JSON.parse(stored);
          const prof = getLocalUserById(u.uid) || getLocalUserByEmail(u.email);
          if (prof) {
            setCurrentUser(u);
            setUserProfile(prof);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    function setupLocalProfileForUser(uid: string, email: string, name: string) {
      const isPrimaryAdmin = email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase();
      let prof = getLocalUserById(uid) || getLocalUserByEmail(email);
      if (!prof) {
        prof = {
          uid,
          name: name || email.split('@')[0] || 'User',
          email,
          balance: isPrimaryAdmin ? 100000 : 0,
          role: isPrimaryAdmin ? 'admin' : 'user',
          createdAt: new Date().toISOString(),
          totalOrders: 0,
          totalDeposits: isPrimaryAdmin ? 100000 : 0,
        };
      } else if (isPrimaryAdmin) {
        prof.role = 'admin';
      }
      saveLocalUser(prof);
      setUserProfile(prof);
    }

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    try {
      await signInWithEmailAndPassword(auth, cleanEmail, pass);
    } catch (err: any) {
      // If user does not exist on Firebase Auth
      if (
        err?.code === 'auth/user-not-found' ||
        err?.code === 'auth/invalid-credential'
      ) {
        // Check if user is registered in local fallback
        const result = checkUserPassword(cleanEmail, pass);
        if (result.notRegistered) {
          throw new Error('Akun belum terdaftar. Anda harus mendaftar (Register) terlebih dahulu sebelum bisa login.');
        }
        if (!result.valid) {
          throw new Error('Email atau password yang Anda masukkan salah.');
        }
        const prof = getLocalUserByEmail(cleanEmail);
        if (prof) {
          const localUserObj = {
            uid: prof.uid,
            email: prof.email,
            displayName: prof.name,
            photoURL: prof.photoURL || null,
          };
          localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(localUserObj));
          setCurrentUser(localUserObj);
          setUserProfile(prof);
          return;
        }
        throw new Error('Akun belum terdaftar. Anda harus mendaftar (Register) terlebih dahulu.');
      }

      // If Firebase fails with invalid api key, network error, or offline
      if (
        err?.message?.includes('api-key-not-valid') ||
        err?.code === 'auth/api-key-not-valid' ||
        err?.code === 'auth/invalid-api-key' ||
        err?.code === 'auth/network-request-failed' ||
        err?.code === 'auth/internal-error' ||
        err?.code === 'auth/configuration-not-found'
      ) {
        const result = checkUserPassword(cleanEmail, pass);
        if (result.notRegistered) {
          throw new Error('Akun belum terdaftar. Anda harus mendaftar (Register) terlebih dahulu sebelum bisa login.');
        }
        if (!result.valid) {
          throw new Error('Email atau password yang Anda masukkan salah.');
        }

        const prof = getLocalUserByEmail(cleanEmail);
        if (!prof) {
          throw new Error('Akun belum terdaftar. Anda harus mendaftar (Register) terlebih dahulu.');
        }

        const localUserObj = {
          uid: prof.uid,
          email: prof.email,
          displayName: prof.name,
          photoURL: prof.photoURL || null,
        };
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(localUserObj));
        setCurrentUser(localUserObj);
        setUserProfile(prof);
        return;
      }
      throw err;
    }
  };

  const registerWithEmail = async (name: string, email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    saveUserPassword(cleanEmail, pass);

    try {
      const res = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      if (res.user) {
        await updateProfile(res.user, { displayName: cleanName });
        const isPrimaryAdmin = cleanEmail === PRIMARY_ADMIN_EMAIL.toLowerCase();
        const userRef = doc(db, 'users', res.user.uid);
        const initialProfile: UserProfile = {
          uid: res.user.uid,
          name: cleanName,
          email: cleanEmail,
          balance: isPrimaryAdmin ? 100000 : 0,
          role: isPrimaryAdmin ? 'admin' : 'user',
          createdAt: new Date().toISOString(),
          totalOrders: 0,
          totalDeposits: isPrimaryAdmin ? 100000 : 0,
        };

        try {
          await setDoc(userRef, {
            ...initialProfile,
            createdAt: serverTimestamp(),
          });
        } catch (dbErr) {
          console.warn('Firestore setDoc failed:', dbErr);
        }
        saveLocalUser(initialProfile);
        setUserProfile(initialProfile);
      }
    } catch (err: any) {
      if (
        err?.message?.includes('api-key-not-valid') ||
        err?.code === 'auth/api-key-not-valid' ||
        err?.code === 'auth/invalid-api-key' ||
        err?.code === 'auth/network-request-failed' ||
        err?.code === 'auth/internal-error' ||
        err?.code === 'auth/configuration-not-found'
      ) {
        console.info('Using registration fallback and saving to store');
        const isPrimaryAdmin = cleanEmail === PRIMARY_ADMIN_EMAIL.toLowerCase();
        const existing = getLocalUserByEmail(cleanEmail);
        if (existing) {
          throw new Error('Email sudah terdaftar. Silakan login.');
        }

        const newProfile: UserProfile = {
          uid: isPrimaryAdmin ? 'admin-primary-uid' : 'user-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          name: cleanName,
          email: cleanEmail,
          balance: isPrimaryAdmin ? 100000 : 0,
          role: isPrimaryAdmin ? 'admin' : 'user',
          createdAt: new Date().toISOString(),
          totalOrders: 0,
          totalDeposits: isPrimaryAdmin ? 100000 : 0,
        };
        saveLocalUser(newProfile);

        try {
          const userRef = doc(db, 'users', newProfile.uid);
          setDoc(
            userRef,
            {
              ...newProfile,
              createdAt: serverTimestamp(),
            },
            { merge: true }
          ).catch((e) => console.warn('Firestore user save warning:', e));
        } catch (e) {
          // Ignore
        }

        const localUserObj = {
          uid: newProfile.uid,
          email: newProfile.email,
          displayName: newProfile.name,
          photoURL: null,
        };
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(localUserObj));
        setCurrentUser(localUserObj);
        setUserProfile(newProfile);
        return;
      }
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      if (
        err?.message?.includes('api-key-not-valid') ||
        err?.code === 'auth/api-key-not-valid' ||
        err?.code === 'auth/invalid-api-key' ||
        err?.code === 'auth/popup-blocked' ||
        err?.code === 'auth/unauthorized-domain'
      ) {
        const defaultGoogleEmail = 'apriliansyahazril10@gmail.com';
        let prof = getLocalUserByEmail(defaultGoogleEmail);
        if (!prof) {
          prof = {
            uid: 'google-user-admin',
            name: 'Azril (Admin Store)',
            email: defaultGoogleEmail,
            balance: 100000,
            role: 'admin',
            photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
            createdAt: new Date().toISOString(),
            totalOrders: 0,
            totalDeposits: 100000,
          };
          saveLocalUser(prof);
        }
        const localUserObj = {
          uid: prof.uid,
          email: prof.email,
          displayName: prof.name,
          photoURL: prof.photoURL || null,
        };
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(localUserObj));
        setCurrentUser(localUserObj);
        setUserProfile(prof);
        return;
      }
      throw err;
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn('Firebase signout skipped:', e);
    }
    localStorage.removeItem(LOCAL_SESSION_KEY);
    setCurrentUser(null);
    setUserProfile(null);
  };

  const isAdmin = Boolean(
    currentUser?.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase() ||
    userProfile?.role === 'admin'
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        isAdmin,
        loading,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
