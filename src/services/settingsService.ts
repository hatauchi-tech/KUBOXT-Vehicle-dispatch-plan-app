import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { AppSettings } from '../types';

const COLLECTION_NAME = 'settings';
const DOCUMENT_ID = 'app-settings';

const DEFAULT_SETTINGS: AppSettings = {
  supportedVehicleTypes: ['4t', '2t', '1t', '0.5t'],
  supportedRequestTypes: ['引越し', '配送', '回収', 'その他'],
  companyName: '株式会社KUBOXT',
  updatedAt: new Date(),
  updatedBy: '',
};

export const settingsService = {
  async get(): Promise<AppSettings> {
    const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        updatedAt: data.updatedAt?.toDate() ?? new Date(),
      } as AppSettings;
    }
    return { ...DEFAULT_SETTINGS };
  },

  async update(data: Omit<AppSettings, 'updatedAt' | 'updatedBy'>, updatedBy: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
    await setDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
      updatedBy,
    });
  },
};
