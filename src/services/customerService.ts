import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Customer } from '../types';

const COLLECTION_NAME = 'customers';

export const customerService = {
  async getAll(): Promise<Customer[]> {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
    })) as Customer[];
  },

  async getById(customerId: string): Promise<Customer | null> {
    const docRef = doc(db, COLLECTION_NAME, customerId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as Customer;
    }
    return null;
  },

  async create(customer: Omit<Customer, 'createdAt' | 'updatedAt'>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, customer.customerId);
    await setDoc(docRef, {
      ...customer,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  },

  async update(customerId: string, updates: Partial<Customer>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, customerId);
    await setDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    }, { merge: true });
  },

  async delete(customerId: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, customerId);
    await deleteDoc(docRef);
  },
};
