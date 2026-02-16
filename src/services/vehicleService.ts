import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Vehicle } from '../types';

const COLLECTION_NAME = 'vehicles';

export const vehicleService = {
  async getAll(): Promise<Vehicle[]> {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
    })) as Vehicle[];
  },

  async getById(vehicleNumber: string): Promise<Vehicle | null> {
    const docRef = doc(db, COLLECTION_NAME, vehicleNumber);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as Vehicle;
    }
    return null;
  },

  async create(vehicle: Omit<Vehicle, 'createdAt' | 'updatedAt'>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, vehicle.vehicleNumber);
    await setDoc(docRef, {
      ...vehicle,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  },

  async update(vehicleNumber: string, updates: Partial<Vehicle>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, vehicleNumber);
    await setDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    }, { merge: true });
  },

  async delete(vehicleNumber: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, vehicleNumber);
    await deleteDoc(docRef);
  },
};
