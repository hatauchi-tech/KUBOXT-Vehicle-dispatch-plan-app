import { collection, doc, writeBatch, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Vehicle, Customer, Order } from '../types';

// Result type for bulk import operations
export interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

// Maximum documents per Firestore batch write
const BATCH_SIZE = 500;

/**
 * Execute batch writes in chunks of BATCH_SIZE.
 * Takes an array of items and a callback that adds each item to a batch.
 */
async function executeBatchWrites<T>(
  items: T[],
  collectionName: string,
  getDocId: (item: T) => string,
  toDocData: (item: T) => Record<string, unknown>,
): Promise<ImportResult> {
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  // Process in chunks of BATCH_SIZE
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const chunk = items.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);

    for (const item of chunk) {
      try {
        const docId = getDocId(item);
        const docRef = doc(collection(db, collectionName), docId);
        const data = toDocData(item);
        batch.set(docRef, {
          ...data,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      } catch (err) {
        failed++;
        errors.push(
          `ドキュメント作成エラー: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    try {
      await batch.commit();
      success += chunk.length - failed;
    } catch (err) {
      // If the entire batch fails, count all items in the chunk as failed
      failed += chunk.length;
      errors.push(
        `バッチ書き込みエラー (${i + 1}~${i + chunk.length}件目): ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return { success, failed, errors };
}

/**
 * Bulk import vehicles to the 'vehicles' collection.
 * Uses vehicleNumber as the document ID.
 */
export async function bulkImportVehicles(
  vehicles: Omit<Vehicle, 'createdAt' | 'updatedAt'>[],
): Promise<ImportResult> {
  if (vehicles.length === 0) {
    return { success: 0, failed: 0, errors: ['インポートするデータがありません'] };
  }

  return executeBatchWrites(
    vehicles,
    'vehicles',
    (v) => v.vehicleNumber,
    (v) => ({
      vehicleNumber: v.vehicleNumber,
      radioNumber: v.radioNumber ?? '',
      capacity: v.capacity ?? null,
      vehicleType: v.vehicleType,
      supportedRequestTypes: v.supportedRequestTypes,
      driverName: v.driverName ?? '',
      phone: v.phone ?? '',
      email: v.email ?? '',
      notes: v.notes ?? '',
    }),
  );
}

/**
 * Bulk import customers to the 'customers' collection.
 * Uses customerId as the document ID.
 */
export async function bulkImportCustomers(
  customers: Omit<Customer, 'createdAt' | 'updatedAt'>[],
): Promise<ImportResult> {
  if (customers.length === 0) {
    return { success: 0, failed: 0, errors: ['インポートするデータがありません'] };
  }

  return executeBatchWrites(
    customers,
    'customers',
    (c) => c.customerId,
    (c) => ({
      customerId: c.customerId,
      customerName: c.customerName,
      phone: c.phone ?? '',
      address: c.address ?? '',
      notes: c.notes ?? '',
    }),
  );
}

/**
 * Build a duplicate detection key from an existing Firestore document's data.
 * Firestore dates are stored as Timestamps, so they need conversion.
 */
function buildDuplicateKey(data: Record<string, unknown>): string {
  const loadDate = data.loadDate instanceof Timestamp
    ? data.loadDate.toDate().toISOString().split('T')[0]
    : '';
  const unloadDate = data.unloadDate instanceof Timestamp
    ? data.unloadDate.toDate().toISOString().split('T')[0]
    : '';
  return [
    data.customerId,
    loadDate,
    data.loadTime || '',
    data.loadAddress1,
    unloadDate,
    data.unloadTime || '',
    data.unloadAddress1,
    data.itemName,
    data.requestVehicleType,
  ].join('|');
}

/**
 * Build a duplicate detection key from a new order being imported.
 * Dates are JavaScript Date objects.
 */
function buildOrderDuplicateKey(o: {
  customerId: string;
  loadDate: Date;
  loadTime?: string;
  loadAddress1: string;
  unloadDate: Date;
  unloadTime?: string;
  unloadAddress1: string;
  itemName: string;
  requestVehicleType: string;
}): string {
  return [
    o.customerId,
    o.loadDate.toISOString().split('T')[0],
    o.loadTime || '',
    o.loadAddress1,
    o.unloadDate.toISOString().split('T')[0],
    o.unloadTime || '',
    o.unloadAddress1,
    o.itemName,
    o.requestVehicleType,
  ].join('|');
}

/**
 * Bulk import orders to the 'orders' collection.
 * Uses orderId as the document ID.
 * All imported orders are set to 'unassigned' status.
 * Duplicates are detected based on all fields except orderId and skipped.
 */
export async function bulkImportOrders(
  orders: Omit<Order, 'createdAt' | 'updatedAt' | 'status' | 'assignedVehicleNumber' | 'assignedVehicleCode' | 'assignedVehicleType' | 'assignedDriverName'>[],
): Promise<ImportResult> {
  if (orders.length === 0) {
    return { success: 0, failed: 0, errors: ['インポートするデータがありません'] };
  }

  // Fetch existing orders for duplicate detection
  const existingOrdersSnap = await getDocs(collection(db, 'orders'));
  const existingKeys = new Set<string>();
  existingOrdersSnap.docs.forEach(docSnap => {
    const d = docSnap.data();
    const key = buildDuplicateKey(d);
    existingKeys.add(key);
  });

  // Filter out duplicates
  const uniqueOrders: typeof orders = [];
  const duplicateErrors: string[] = [];
  const importKeys = new Set<string>();

  for (let i = 0; i < orders.length; i++) {
    const o = orders[i];
    const key = buildOrderDuplicateKey(o);
    if (existingKeys.has(key) || importKeys.has(key)) {
      duplicateErrors.push(`行 ${i + 2}: 重複データのためスキップ（${o.customerId} / ${o.loadAddress1} → ${o.unloadAddress1} / ${o.itemName}）`);
    } else {
      importKeys.add(key);
      uniqueOrders.push(o);
    }
  }

  if (uniqueOrders.length === 0) {
    return {
      success: 0,
      failed: duplicateErrors.length,
      errors: duplicateErrors.length > 0
        ? duplicateErrors
        : ['インポートするデータがありません'],
    };
  }

  const result = await executeBatchWrites(
    uniqueOrders,
    'orders',
    (o) => o.orderId,
    (o) => ({
      orderId: o.orderId,
      receivedDate: Timestamp.fromDate(o.receivedDate),
      customerId: o.customerId,
      loadDate: Timestamp.fromDate(o.loadDate),
      loadTime: o.loadTime ?? '',
      loadAddress1: o.loadAddress1,
      loadAddress2: o.loadAddress2 ?? '',
      itemName: o.itemName,
      unloadDate: Timestamp.fromDate(o.unloadDate),
      unloadTime: o.unloadTime ?? '',
      unloadAddress1: o.unloadAddress1,
      unloadAddress2: o.unloadAddress2 ?? '',
      requestVehicleType: o.requestVehicleType,
      assignedVehicleNumber: '',
      assignedVehicleCode: '',
      assignedVehicleType: '',
      assignedDriverName: '',
      status: 'unassigned' as const,
    }),
  );

  // Merge duplicate errors into the result
  result.failed += duplicateErrors.length;
  result.errors = [...duplicateErrors, ...result.errors];

  return result;
}
