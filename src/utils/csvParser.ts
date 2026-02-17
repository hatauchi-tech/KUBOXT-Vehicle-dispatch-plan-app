import Papa from 'papaparse';
import type { Vehicle, Customer, Order } from '../types';

// CSV parse result type
export interface CsvParseResult<T> {
  data: T[];
  errors: string[];
}

// Column name mappings (Japanese header -> English field)
const VEHICLE_COLUMN_MAP: Record<string, string> = {
  'ナンバー': 'vehicleNumber',
  '無線番号': 'radioNumber',
  '積載量': 'capacity',
  '車種': 'vehicleType',
  '対応可能依頼': 'supportedRequestTypes',
  '運転手': 'driverName',
  '電話番号': 'phone',
  'メール': 'email',
  '備考': 'notes',
};

const CUSTOMER_COLUMN_MAP: Record<string, string> = {
  '荷主ID': 'customerId',
  '荷主名': 'customerName',
  '電話番号': 'phone',
  '住所': 'address',
  '特記事項': 'notes',
};

const ORDER_COLUMN_MAP: Record<string, string> = {
  '受付日': 'receivedDate',
  '荷主名': 'customerName',
  '積込日': 'loadDate',
  '積込時間': 'loadTime',
  '積込地1': 'loadAddress1',
  '積込地2': 'loadAddress2',
  '品名': 'itemName',
  '荷卸日': 'unloadDate',
  '荷卸時間': 'unloadTime',
  '荷卸地1': 'unloadAddress1',
  '荷卸地2': 'unloadAddress2',
  '依頼車種': 'requestVehicleType',
};

/**
 * Parse a date string in YYYY/MM/DD or YYYY-MM-DD format.
 * Returns a Date object or null if parsing fails.
 */
function parseDate(value: string): Date | null {
  if (!value || !value.trim()) return null;
  const trimmed = value.trim();

  // Match YYYY/MM/DD or YYYY-MM-DD
  const match = trimmed.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (!match) return null;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  // Basic validation
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const date = new Date(year, month - 1, day);
  // Verify the date is valid (handles cases like Feb 30)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

/**
 * Map a raw CSV row (with Japanese headers) to an object with English field names.
 */
function mapRow(
  row: Record<string, string>,
  columnMap: Record<string, string>,
): Record<string, string> {
  const mapped: Record<string, string> = {};
  for (const [jpName, enName] of Object.entries(columnMap)) {
    const value = row[jpName];
    if (value !== undefined) {
      mapped[enName] = value.trim();
    }
  }
  return mapped;
}

/**
 * Read a File as text, attempting Shift-JIS first and falling back to UTF-8.
 */
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      resolve(text);
    };
    reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'));
    // Try Shift-JIS encoding first (common for Japanese CSV files)
    reader.readAsText(file, 'Shift-JIS');
  });
}

/**
 * Check if text appears to be valid (not garbled).
 * If the Shift-JIS read produced garbled text, we re-read as UTF-8.
 */
async function readFileWithEncodingDetection(file: File): Promise<string> {
  // First try Shift-JIS
  const shiftJisText = await readFileAsText(file);

  // Heuristic: if we see replacement characters or the text lacks
  // expected Japanese characters, try UTF-8
  const hasReplacementChars = shiftJisText.includes('\uFFFD');
  if (hasReplacementChars) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'));
      reader.readAsText(file, 'UTF-8');
    });
  }

  return shiftJisText;
}

/**
 * Parse CSV text using PapaParse.
 */
function parseCsvText(text: string): Promise<Papa.ParseResult<Record<string, string>>> {
  return new Promise((resolve) => {
    Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
      complete: (results) => resolve(results),
    });
  });
}

/**
 * Parse a vehicle CSV file.
 */
export async function parseVehicleCsv(
  file: File,
): Promise<CsvParseResult<Omit<Vehicle, 'createdAt' | 'updatedAt'>>> {
  const errors: string[] = [];
  const data: Omit<Vehicle, 'createdAt' | 'updatedAt'>[] = [];

  try {
    const text = await readFileWithEncodingDetection(file);
    const result = await parseCsvText(text);

    // Check for PapaParse errors
    if (result.errors.length > 0) {
      for (const err of result.errors) {
        errors.push(`CSV解析エラー (行 ${(err.row ?? 0) + 2}): ${err.message}`);
      }
    }

    // Validate required columns
    const headers = result.meta.fields || [];
    const requiredColumns = ['ナンバー', '車種'];
    for (const col of requiredColumns) {
      if (!headers.includes(col)) {
        errors.push(`必須列「${col}」が見つかりません`);
      }
    }
    if (errors.length > 0 && requiredColumns.some((c) => !headers.includes(c))) {
      return { data, errors };
    }

    for (let i = 0; i < result.data.length; i++) {
      const rowNum = i + 2; // 1-indexed + header row
      const row = result.data[i];
      const mapped = mapRow(row, VEHICLE_COLUMN_MAP);

      // Validate required fields
      if (!mapped.vehicleNumber) {
        errors.push(`行 ${rowNum}: ナンバーは必須です`);
        continue;
      }
      if (!mapped.vehicleType) {
        errors.push(`行 ${rowNum}: 車種は必須です`);
        continue;
      }

      // Parse supportedRequestTypes (comma-separated within the cell)
      const supportedRequestTypes = mapped.supportedRequestTypes
        ? mapped.supportedRequestTypes
            .split(/[,、]/)
            .map((s) => s.trim())
            .filter((s) => s.length > 0)
        : [];

      // Parse capacity
      const capacity = mapped.capacity ? parseFloat(mapped.capacity) : undefined;
      if (mapped.capacity && (isNaN(capacity as number) || (capacity as number) < 0)) {
        errors.push(`行 ${rowNum}: 積載量の値が不正です「${mapped.capacity}」`);
        continue;
      }

      data.push({
        vehicleNumber: mapped.vehicleNumber,
        radioNumber: mapped.radioNumber || undefined,
        capacity,
        vehicleType: mapped.vehicleType,
        supportedRequestTypes,
        driverName: mapped.driverName || undefined,
        phone: mapped.phone || undefined,
        email: mapped.email || undefined,
        notes: mapped.notes || undefined,
      });
    }
  } catch (err) {
    errors.push(`ファイル処理エラー: ${err instanceof Error ? err.message : String(err)}`);
  }

  return { data, errors };
}

/**
 * Parse a customer CSV file.
 */
export async function parseCustomerCsv(
  file: File,
): Promise<CsvParseResult<Omit<Customer, 'createdAt' | 'updatedAt'>>> {
  const errors: string[] = [];
  const data: Omit<Customer, 'createdAt' | 'updatedAt'>[] = [];

  try {
    const text = await readFileWithEncodingDetection(file);
    const result = await parseCsvText(text);

    // Check for PapaParse errors
    if (result.errors.length > 0) {
      for (const err of result.errors) {
        errors.push(`CSV解析エラー (行 ${(err.row ?? 0) + 2}): ${err.message}`);
      }
    }

    // Validate required columns
    const headers = result.meta.fields || [];
    const requiredColumns = ['荷主ID', '荷主名'];
    for (const col of requiredColumns) {
      if (!headers.includes(col)) {
        errors.push(`必須列「${col}」が見つかりません`);
      }
    }
    if (errors.length > 0 && requiredColumns.some((c) => !headers.includes(c))) {
      return { data, errors };
    }

    for (let i = 0; i < result.data.length; i++) {
      const rowNum = i + 2;
      const row = result.data[i];
      const mapped = mapRow(row, CUSTOMER_COLUMN_MAP);

      if (!mapped.customerId) {
        errors.push(`行 ${rowNum}: 荷主IDは必須です`);
        continue;
      }
      if (!mapped.customerName) {
        errors.push(`行 ${rowNum}: 荷主名は必須です`);
        continue;
      }

      data.push({
        customerId: mapped.customerId,
        customerName: mapped.customerName,
        phone: mapped.phone || undefined,
        address: mapped.address || undefined,
        notes: mapped.notes || undefined,
      });
    }
  } catch (err) {
    errors.push(`ファイル処理エラー: ${err instanceof Error ? err.message : String(err)}`);
  }

  return { data, errors };
}

/**
 * Parse an order CSV file.
 * Accepts a customers array to look up customerId from customerName.
 * Auto-generates orderId in the format ORD-YYYYMMDD-NNN.
 */
export async function parseOrderCsv(
  file: File,
  customers: Array<{ customerId: string; customerName: string }>,
): Promise<CsvParseResult<Omit<Order, 'createdAt' | 'updatedAt' | 'status' | 'assignedVehicleNumber' | 'assignedVehicleCode' | 'assignedVehicleType' | 'assignedDriverName'>>> {
  const errors: string[] = [];
  const data: Omit<Order, 'createdAt' | 'updatedAt' | 'status' | 'assignedVehicleNumber' | 'assignedVehicleCode' | 'assignedVehicleType' | 'assignedDriverName'>[] = [];

  // Build customer name -> ID map
  const customerNameMap = new Map<string, string>();
  for (const c of customers) {
    customerNameMap.set(c.customerName, c.customerId);
  }

  try {
    const text = await readFileWithEncodingDetection(file);
    const result = await parseCsvText(text);

    // Check for PapaParse errors
    if (result.errors.length > 0) {
      for (const err of result.errors) {
        errors.push(`CSV解析エラー (行 ${(err.row ?? 0) + 2}): ${err.message}`);
      }
    }

    // Validate required columns
    const headers = result.meta.fields || [];
    const requiredColumns = ['受付日', '荷主名', '積込日', '積込地1', '品名', '荷卸日', '荷卸地1', '依頼車種'];
    for (const col of requiredColumns) {
      if (!headers.includes(col)) {
        errors.push(`必須列「${col}」が見つかりません`);
      }
    }
    if (errors.length > 0 && requiredColumns.some((c) => !headers.includes(c))) {
      return { data, errors };
    }

    for (let i = 0; i < result.data.length; i++) {
      const rowNum = i + 2;
      const row = result.data[i];
      const mapped = mapRow(row, ORDER_COLUMN_MAP);

      // Look up customerId from customerName
      const customerName = mapped.customerName;
      if (!customerName) {
        errors.push(`行 ${rowNum}: 荷主名は必須です`);
        continue;
      }
      const customerId = customerNameMap.get(customerName);
      if (!customerId) {
        errors.push(`行 ${rowNum}: 荷主名「${customerName}」に該当する荷主が見つかりません`);
        continue;
      }

      // Validate required fields
      if (!mapped.loadAddress1) {
        errors.push(`行 ${rowNum}: 積込地1は必須です`);
        continue;
      }
      if (!mapped.itemName) {
        errors.push(`行 ${rowNum}: 品名は必須です`);
        continue;
      }
      if (!mapped.unloadAddress1) {
        errors.push(`行 ${rowNum}: 荷卸地1は必須です`);
        continue;
      }
      if (!mapped.requestVehicleType) {
        errors.push(`行 ${rowNum}: 依頼車種は必須です`);
        continue;
      }

      // Parse dates
      const receivedDate = mapped.receivedDate
        ? parseDate(mapped.receivedDate)
        : new Date();
      if (!receivedDate) {
        errors.push(`行 ${rowNum}: 受付日の形式が不正です「${mapped.receivedDate}」(YYYY/MM/DD または YYYY-MM-DD)`);
        continue;
      }

      const loadDate = parseDate(mapped.loadDate);
      if (!loadDate) {
        errors.push(`行 ${rowNum}: 積込日の形式が不正です「${mapped.loadDate}」(YYYY/MM/DD または YYYY-MM-DD)`);
        continue;
      }

      const unloadDate = parseDate(mapped.unloadDate);
      if (!unloadDate) {
        errors.push(`行 ${rowNum}: 荷卸日の形式が不正です「${mapped.unloadDate}」(YYYY/MM/DD または YYYY-MM-DD)`);
        continue;
      }

      // Generate orderId: ORD-YYYYMMDD-NNN (NNN = 001, 002, ...)
      const today = new Date();
      const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
      const orderId = `ORD-${dateStr}-${String(data.length + 1).padStart(3, '0')}`;

      data.push({
        orderId,
        receivedDate,
        customerId,
        loadDate,
        loadTime: mapped.loadTime || undefined,
        loadAddress1: mapped.loadAddress1,
        loadAddress2: mapped.loadAddress2 || undefined,
        itemName: mapped.itemName,
        unloadDate,
        unloadTime: mapped.unloadTime || undefined,
        unloadAddress1: mapped.unloadAddress1,
        unloadAddress2: mapped.unloadAddress2 || undefined,
        requestVehicleType: mapped.requestVehicleType,
      });
    }
  } catch (err) {
    errors.push(`ファイル処理エラー: ${err instanceof Error ? err.message : String(err)}`);
  }

  return { data, errors };
}

/**
 * Generate a CSV template string from column headers and optional sample data.
 */
export function generateCsvTemplate(
  columns: string[],
  sampleData?: string[][],
): string {
  const header = columns.join(',');
  if (!sampleData || sampleData.length === 0) {
    return header + '\n';
  }
  const rows = sampleData.map((row) => row.join(','));
  return [header, ...rows].join('\n') + '\n';
}

/**
 * Trigger download of a CSV string as a file.
 */
export function downloadCsvTemplate(
  filename: string,
  columns: string[],
  sampleData?: string[][],
): void {
  const csv = generateCsvTemplate(columns, sampleData);
  // Use BOM for Excel compatibility with Japanese characters
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
