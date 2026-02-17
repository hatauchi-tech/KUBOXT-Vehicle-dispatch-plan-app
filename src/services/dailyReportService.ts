import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { DailyReport } from '../types';

const COLLECTION_NAME = 'dailyReports';

const convertDocToReport = (docData: Record<string, unknown>): DailyReport => {
  return {
    ...docData,
    createdAt: (docData.createdAt as Timestamp).toDate(),
    updatedAt: (docData.updatedAt as Timestamp).toDate(),
  } as DailyReport;
};

export const dailyReportService = {
  async getAll(): Promise<DailyReport[]> {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    return querySnapshot.docs.map((d) => convertDocToReport(d.data()));
  },

  async getByVehicleNumber(vehicleNumber: string): Promise<DailyReport[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('vehicleNumber', '==', vehicleNumber)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((d) => convertDocToReport(d.data()));
  },

  async getByOrderId(orderId: string): Promise<DailyReport | null> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('orderId', '==', orderId)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }
    return convertDocToReport(querySnapshot.docs[0].data());
  },

  async getByDateRange(startDate: Date, endDate: Date): Promise<DailyReport[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
      where('createdAt', '<=', Timestamp.fromDate(endDate))
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((d) => convertDocToReport(d.data()));
  },

  async getById(reportId: string): Promise<DailyReport | null> {
    const docRef = doc(db, COLLECTION_NAME, reportId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return convertDocToReport(docSnap.data());
    }
    return null;
  },

  async create(
    report: Omit<DailyReport, 'createdAt' | 'updatedAt'>
  ): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, report.reportId);
    await setDoc(docRef, {
      ...report,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  },

  async update(
    reportId: string,
    updates: Partial<DailyReport>
  ): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, reportId);
    await setDoc(
      docRef,
      {
        ...updates,
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );
  },

  async delete(reportId: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, reportId);
    await deleteDoc(docRef);
  },
};
