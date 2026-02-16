import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Order } from '../types';

const COLLECTION_NAME = 'orders';

const convertDocToOrder = (docData: Record<string, unknown>): Order => {
  return {
    ...docData,
    receivedDate: (docData.receivedDate as Timestamp).toDate(),
    loadDate: (docData.loadDate as Timestamp).toDate(),
    unloadDate: (docData.unloadDate as Timestamp).toDate(),
    createdAt: (docData.createdAt as Timestamp).toDate(),
    updatedAt: (docData.updatedAt as Timestamp).toDate(),
  } as Order;
};

const convertDatesToTimestamps = (data: Partial<Order>): Record<string, unknown> => {
  const result: Record<string, unknown> = { ...data };
  if (data.receivedDate instanceof Date) {
    result.receivedDate = Timestamp.fromDate(data.receivedDate);
  }
  if (data.loadDate instanceof Date) {
    result.loadDate = Timestamp.fromDate(data.loadDate);
  }
  if (data.unloadDate instanceof Date) {
    result.unloadDate = Timestamp.fromDate(data.unloadDate);
  }
  return result;
};

export const orderService = {
  async getAll(): Promise<Order[]> {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    return querySnapshot.docs.map(doc => convertDocToOrder(doc.data()));
  },

  async getUnassigned(): Promise<Order[]> {
    const q = query(collection(db, COLLECTION_NAME), where('status', '==', 'unassigned'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => convertDocToOrder(doc.data()));
  },

  async getAssigned(): Promise<Order[]> {
    const q = query(collection(db, COLLECTION_NAME), where('status', '==', 'assigned'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => convertDocToOrder(doc.data()));
  },

  async getById(orderId: string): Promise<Order | null> {
    const docRef = doc(db, COLLECTION_NAME, orderId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return convertDocToOrder(docSnap.data());
    }
    return null;
  },

  async create(order: Omit<Order, 'createdAt' | 'updatedAt'>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, order.orderId);
    const data = convertDatesToTimestamps(order);
    await setDoc(docRef, {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  },

  async update(orderId: string, updates: Partial<Order>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, orderId);
    const data = convertDatesToTimestamps(updates);
    await setDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    }, { merge: true });
  },

  async delete(orderId: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, orderId);
    await deleteDoc(docRef);
  },

  async assignVehicle(
    orderId: string,
    vehicleNumber: string,
    vehicleType: string,
    driverName: string,
  ): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, orderId);
    await setDoc(docRef, {
      assignedVehicleNumber: vehicleNumber,
      assignedVehicleType: vehicleType,
      assignedDriverName: driverName,
      status: 'assigned',
      updatedAt: Timestamp.now(),
    }, { merge: true });
  },

  async unassignVehicle(orderId: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, orderId);
    await setDoc(docRef, {
      assignedVehicleNumber: '',
      assignedVehicleCode: '',
      assignedVehicleType: '',
      assignedDriverName: '',
      status: 'unassigned',
      updatedAt: Timestamp.now(),
    }, { merge: true });
  },
};
