/**
 * KUBOXT 配車プランナー - データアクセス層
 */

/**
 * スプレッドシートインスタンスを取得
 */
function getSpreadsheet() {
  return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
}

/**
 * シートを名前で取得
 */
function getSheet(sheetName) {
  var sheet = getSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('シートが見つかりません: ' + sheetName);
  }
  return sheet;
}

/**
 * Date → YYYY-MM-DD 文字列変換
 */
function formatDate(dateObj) {
  if (!dateObj) return '';
  if (typeof dateObj === 'string') return dateObj;
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) return '';
  var y = dateObj.getFullYear();
  var m = ('0' + (dateObj.getMonth() + 1)).slice(-2);
  var d = ('0' + dateObj.getDate()).slice(-2);
  return y + '-' + m + '-' + d;
}

/**
 * Date/Time → HH:mm 文字列変換
 */
function formatTime(timeObj) {
  if (!timeObj) return '';
  if (typeof timeObj === 'string') return timeObj;
  if (!(timeObj instanceof Date) || isNaN(timeObj.getTime())) return '';
  var h = ('0' + timeObj.getHours()).slice(-2);
  var m = ('0' + timeObj.getMinutes()).slice(-2);
  return h + ':' + m;
}

/**
 * T_荷主依頼データの全受注をJSON配列で返却
 * GAS Date型は文字列に変換してクライアントに返す
 */
function getAllOrders() {
  var sheet = getSheet(CONFIG.SHEETS.ORDERS);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var totalCols = CONFIG.COLUMNS.ORDERS_TOTAL_COLS;
  var data = sheet.getRange(2, 1, lastRow - 1, totalCols).getValues();
  var col = CONFIG.COLUMNS.ORDERS;

  return data.map(function(row, index) {
    return {
      rowIndex: index + 2,
      requestId: String(row[col.REQUEST_ID - 1] || ''),
      receivedDate: formatDate(row[col.RECEIVED_DATE - 1]),
      shipper: String(row[col.SHIPPER - 1] || ''),
      loadDate: formatDate(row[col.LOAD_DATE - 1]),
      loadTime: formatTime(row[col.LOAD_TIME - 1]),
      loadLocation1: String(row[col.LOAD_LOCATION_1 - 1] || ''),
      loadLocation2: String(row[col.LOAD_LOCATION_2 - 1] || ''),
      cargoName: String(row[col.CARGO_NAME - 1] || ''),
      unloadDate: formatDate(row[col.UNLOAD_DATE - 1]),
      unloadTime: formatTime(row[col.UNLOAD_TIME - 1]),
      unloadLocation1: String(row[col.UNLOAD_LOCATION_1 - 1] || ''),
      unloadLocation2: String(row[col.UNLOAD_LOCATION_2 - 1] || ''),
      requestedType: String(row[col.REQUESTED_TYPE - 1] || ''),
      number: String(row[col.NUMBER - 1] || ''),
      vehicleNumber: String(row[col.VEHICLE_NUMBER - 1] || ''),
      vehicleType: String(row[col.VEHICLE_TYPE - 1] || ''),
      driverName: String(row[col.DRIVER_NAME - 1] || ''),
      status: String(row[col.STATUS - 1] || CONFIG.STATUS.UNASSIGNED)
    };
  });
}

/**
 * M_車両の全車両をJSON配列で返却
 */
function getAllVehicles() {
  var sheet = getSheet(CONFIG.SHEETS.VEHICLES);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var totalCols = CONFIG.COLUMNS.VEHICLES_TOTAL_COLS;
  var data = sheet.getRange(2, 1, lastRow - 1, totalCols).getValues();
  var col = CONFIG.COLUMNS.VEHICLES;

  return data.map(function(row) {
    return {
      number: String(row[col.NUMBER - 1] || ''),
      radioNumber: String(row[col.RADIO_NUMBER - 1] || ''),
      capacity: row[col.CAPACITY - 1] || '',
      vehicleType: String(row[col.VEHICLE_TYPE - 1] || ''),
      capableRequests: String(row[col.CAPABLE_REQUESTS - 1] || ''),
      driverName: String(row[col.DRIVER_NAME - 1] || ''),
      phone: String(row[col.PHONE - 1] || ''),
      email: String(row[col.EMAIL - 1] || ''),
      notes: String(row[col.NOTES - 1] || '')
    };
  });
}

/**
 * ナンバーで車両を検索
 */
function getVehicleByNumber(number) {
  var vehicles = getAllVehicles();
  for (var i = 0; i < vehicles.length; i++) {
    if (vehicles[i].number === String(number)) {
      return vehicles[i];
    }
  }
  return null;
}

/**
 * M_荷主マスタから荷主名一覧を取得
 */
function getAllShipperNames() {
  var sheet = getSheet(CONFIG.SHEETS.SHIPPERS);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var data = sheet.getRange(2, CONFIG.COLUMNS.SHIPPERS.SHIPPER_NAME, lastRow - 1, 1).getValues();
  return data.map(function(row) { return String(row[0]); }).filter(Boolean);
}

/**
 * M_車両から車種のユニークリストを取得 (依頼車種のドロップダウン用)
 */
function getVehicleTypes() {
  var vehicles = getAllVehicles();
  var types = {};
  vehicles.forEach(function(v) {
    if (v.vehicleType) types[v.vehicleType] = true;
  });
  return Object.keys(types).sort();
}
