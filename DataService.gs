/**
 * KUBOXT Dispatch Planner - Data Access Layer
 */

/**
 * Get the configured spreadsheet instance
 * @return {Spreadsheet} The spreadsheet
 */
function getSpreadsheet() {
  return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
}

/**
 * Get a sheet by name
 * @param {string} sheetName - The sheet name from CONFIG.SHEETS
 * @return {Sheet} The sheet
 */
function getSheet(sheetName) {
  var sheet = getSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('Sheet not found: ' + sheetName);
  }
  return sheet;
}

/**
 * Format a Date object to YYYY-MM-DD string
 * @param {Date|string} dateObj - The date to format
 * @return {string} Formatted date string or empty string
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
 * Format a Date object to HH:mm string
 * @param {Date|string} timeObj - The time to format
 * @return {string} Formatted time string or empty string
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
 * Get all orders from T_Orders as JSON array
 * Converts Date objects to strings server-side to avoid GAS serialization issues
 * @return {Array<Object>} Array of order objects
 */
function getAllOrders() {
  var sheet = getSheet(CONFIG.SHEETS.ORDERS);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var data = sheet.getRange(2, 1, lastRow - 1, 18).getValues();
  var col = CONFIG.COLUMNS.ORDERS;

  return data.map(function(row, index) {
    return {
      rowIndex: index + 2,
      requestId: String(row[col.REQUEST_ID - 1] || ''),
      receivedDate: formatDate(row[col.RECEIVED_DATE - 1]),
      shipper: String(row[col.SHIPPER - 1] || ''),
      loadDate: formatDate(row[col.LOAD_DATE - 1]),
      loadTime: formatTime(row[col.LOAD_TIME - 1]),
      loadLocation: String(row[col.LOAD_LOCATION - 1] || ''),
      unloadDate: formatDate(row[col.UNLOAD_DATE - 1]),
      unloadTime: formatTime(row[col.UNLOAD_TIME - 1]),
      unloadLocation: String(row[col.UNLOAD_LOCATION - 1] || ''),
      cargoName: String(row[col.CARGO_NAME - 1] || ''),
      quantity: String(row[col.QUANTITY - 1] || ''),
      notes: String(row[col.NOTES - 1] || ''),
      csvRowId: String(row[col.CSV_ROW_ID - 1] || ''),
      truckId: String(row[col.TRUCK_ID - 1] || ''),
      vehicleNumber: String(row[col.VEHICLE_NUMBER - 1] || ''),
      vehicleType: String(row[col.VEHICLE_TYPE - 1] || ''),
      driverName: String(row[col.DRIVER_NAME - 1] || ''),
      status: String(row[col.STATUS - 1] || CONFIG.STATUS.UNASSIGNED)
    };
  });
}

/**
 * Get all active vehicles from M_Vehicles
 * @return {Array<Object>} Array of vehicle objects
 */
function getAllVehicles() {
  var sheet = getSheet(CONFIG.SHEETS.VEHICLES);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var data = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
  var col = CONFIG.COLUMNS.VEHICLES;

  return data
    .map(function(row) {
      return {
        truckId: String(row[col.TRUCK_ID - 1] || ''),
        vehicleNumber: String(row[col.VEHICLE_NUMBER - 1] || ''),
        vehicleType: String(row[col.VEHICLE_TYPE - 1] || ''),
        driverName: String(row[col.DRIVER_NAME - 1] || ''),
        driverEmail: String(row[col.DRIVER_EMAIL - 1] || ''),
        active: row[col.ACTIVE - 1]
      };
    })
    .filter(function(v) {
      return v.active === true || v.active === 'TRUE' || v.active === 1;
    });
}

/**
 * Get a vehicle by its truck ID
 * @param {string} truckId - The truck ID to search for
 * @return {Object|null} The vehicle object or null
 */
function getVehicleById(truckId) {
  var vehicles = getAllVehicles();
  for (var i = 0; i < vehicles.length; i++) {
    if (vehicles[i].truckId === String(truckId)) {
      return vehicles[i];
    }
  }
  return null;
}

/**
 * Get all shipper names from M_Shippers
 * @return {Array<string>} Array of shipper names
 */
function getAllShipperNames() {
  var sheet = getSheet(CONFIG.SHEETS.SHIPPERS);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var data = sheet.getRange(2, CONFIG.COLUMNS.SHIPPERS.SHIPPER_NAME, lastRow - 1, 1).getValues();
  return data.map(function(row) { return String(row[0]); }).filter(Boolean);
}
