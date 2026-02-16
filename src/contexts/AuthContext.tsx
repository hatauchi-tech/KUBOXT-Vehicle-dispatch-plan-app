import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User, UserRole } from '../types';

const googleProvider = new GoogleAuthProvider();

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        if (!firebaseUser.email) {
          console.error('User email is required but not found');
          await signOut(auth);
          setCurrentUser(null);
          setLoading(false);
          return;
        }

        // Firestoreからユーザー情報取得
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCurrentUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: userData.role as UserRole,
            displayName: userData.displayName || firebaseUser.displayName || undefined,
            createdAt: userData.createdAt?.toDate() || new Date(),
          });
        } else {
          // 初回Googleログイン: Firestoreにユーザードキュメントを自動作成
          const newUser: Omit<User, 'createdAt'> & { createdAt: ReturnType<typeof Timestamp.now> } = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: 'admin' as UserRole,
            displayName: firebaseUser.displayName || undefined,
            createdAt: Timestamp.now(),
          };
          await setDoc(userDocRef, newUser);
          setCurrentUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: 'admin',
            displayName: firebaseUser.displayName || undefined,
            createdAt: new Date(),
          });
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value = {
    currentUser,
    loading,
    loginWithGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
