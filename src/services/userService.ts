import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { User } from '../types';

const COLLECTION_NAME = 'users';

export const userService = {
  async getAll(): Promise<User[]> {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
    })) as User[];
  },

  async getById(uid: string): Promise<User | null> {
    const docRef = doc(db, COLLECTION_NAME, uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        createdAt: data.createdAt.toDate(),
      } as User;
    }
    return null;
  },

  async create(user: Omit<User, 'createdAt'>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, user.uid);
    await setDoc(docRef, {
      ...user,
      createdAt: Timestamp.now(),
    });
  },

  async update(uid: string, updates: Partial<Pick<User, 'role' | 'displayName'>>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, uid);
    await setDoc(docRef, {
      ...updates,
    }, { merge: true });
  },

  async delete(uid: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, uid);
    await deleteDoc(docRef);
  },

  async sendPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  },
};
