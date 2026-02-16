// ユーザー権限
export type UserRole = 'admin' | 'dispatcher' | 'driver';

// ユーザー
export interface User {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
  createdAt: Date;
}

// 荷主マスタ
export interface Customer {
  customerId: string; // キー
  customerName: string;
  phone?: string;
  address?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 車両マスタ
export interface Vehicle {
  vehicleNumber: string; // ナンバー（キー）
  radioNumber?: string;
  capacity?: number;
  vehicleType: string; // 車種
  supportedRequestTypes: string[]; // 対応可能依頼（カンマ区切りをパース）
  driverName?: string;
  phone?: string;
  email?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 受注データ（荷主依頼）
export interface Order {
  orderId: string; // 依頼ID（自動生成）
  receivedDate: Date; // 受付日
  customerId: string; // 荷主
  loadDate: Date; // 積込日
  loadTime?: string; // 積込時間（HH:mm形式）
  loadAddress1: string; // 積込地1
  loadAddress2?: string; // 積込地2
  itemName: string; // 品名
  unloadDate: Date; // 荷卸日
  unloadTime?: string; // 荷卸時間（HH:mm形式）
  unloadAddress1: string; // 荷卸地1
  unloadAddress2?: string; // 荷卸地2
  requestVehicleType: string; // 依頼車種
  assignedVehicleNumber?: string; // ナンバー
  assignedVehicleCode?: string; // 車番
  assignedVehicleType?: string; // 車種
  assignedDriverName?: string; // 運転手
  status: 'unassigned' | 'assigned'; // 配車状態
  createdAt: Date;
  updatedAt: Date;
}

// アプリ設定
export interface AppSettings {
  supportedVehicleTypes: string[];
  supportedRequestTypes: string[];
  companyName: string;
  updatedAt: Date;
  updatedBy: string;
}

// 実績データ（日報）- 将来対応
export interface DailyReport {
  reportId: string;
  orderId: string;
  vehicleNumber: string;
  departureTime?: string; // 出庫時間
  loadStartTime?: string; // 積込開始時間
  loadEndTime?: string; // 積込完了時間
  unloadStartTime?: string; // 荷下ろし開始時間
  unloadEndTime?: string; // 荷下ろし完了時間
  returnTime?: string; // 帰庫時間
  departureMeter?: number; // 出庫メーター
  returnMeter?: number; // 帰庫メーター
  vehicleInspection?: string; // 車両点検
  notes?: string; // 備考
  createdAt: Date;
  updatedAt: Date;
}
