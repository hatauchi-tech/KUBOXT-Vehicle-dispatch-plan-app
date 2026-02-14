/**
 * KUBOXT 配車プランナー - 設定定数
 */
var CONFIG = {
  SPREADSHEET_ID: '',

  SHEETS: {
    ORDERS: 'T_荷主依頼データ',
    VEHICLES: 'M_車両',
    SHIPPERS: 'M_荷主マスタ'
  },

  // T_荷主依頼データ カラム (1-18)
  // 1:依頼ID  2:受付日  3:荷主  4:積込日  5:積込時間
  // 6:積込地1  7:積込地2  8:品名  9:荷卸日  10:荷卸時間
  // 11:荷卸地1  12:荷卸地2  13:依頼車種  14:ナンバー  15:車番
  // 16:車種  17:運転手  18:ステータス(アプリ管理用)
  COLUMNS: {
    ORDERS: {
      REQUEST_ID: 1,       // 依頼ID
      RECEIVED_DATE: 2,    // 受付日
      SHIPPER: 3,          // 荷主
      LOAD_DATE: 4,        // 積込日
      LOAD_TIME: 5,        // 積込時間
      LOAD_LOCATION_1: 6,  // 積込地1
      LOAD_LOCATION_2: 7,  // 積込地2
      CARGO_NAME: 8,       // 品名
      UNLOAD_DATE: 9,      // 荷卸日
      UNLOAD_TIME: 10,     // 荷卸時間
      UNLOAD_LOCATION_1: 11, // 荷卸地1
      UNLOAD_LOCATION_2: 12, // 荷卸地2
      REQUESTED_TYPE: 13,  // 依頼車種
      NUMBER: 14,          // ナンバー (M_車両のキー)
      VEHICLE_NUMBER: 15,  // 車番
      VEHICLE_TYPE: 16,    // 車種
      DRIVER_NAME: 17,     // 運転手
      STATUS: 18           // ステータス (アプリ管理用)
    },
    ORDERS_TOTAL_COLS: 18,

    // M_車両 カラム (1-9)
    VEHICLES: {
      NUMBER: 1,           // ナンバー (キー)
      RADIO_NUMBER: 2,     // 無線番号
      CAPACITY: 3,         // 積載量
      VEHICLE_TYPE: 4,     // 車種
      CAPABLE_REQUESTS: 5, // 対応可能依頼
      DRIVER_NAME: 6,      // 運転手
      PHONE: 7,            // 電話番号
      EMAIL: 8,            // メールアドレス
      NOTES: 9             // 備考
    },
    VEHICLES_TOTAL_COLS: 9,

    // M_荷主マスタ カラム (1-2)
    SHIPPERS: {
      SHIPPER_ID: 1,       // 荷主ID
      SHIPPER_NAME: 2      // 荷主名
    }
  },

  STATUS: {
    UNASSIGNED: '未割当',
    ASSIGNED: '割当済',
    EN_ROUTE: '配送中',
    COMPLETED: '完了'
  },

  LOCK_TIMEOUT: 10000
};
