/**
 * KUBOXT Dispatch Planner - Lock Manager for Concurrent Updates
 */

/**
 * Execute a callback within a script lock
 * @param {Function} callback - The function to execute under lock
 * @return {*} The callback's return value
 */
function withLock(callback) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(CONFIG.LOCK_TIMEOUT);
  } catch (e) {
    return {
      success: false,
      error: 'サーバーが混雑しています。しばらくしてから再試行してください。'
    };
  }

  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}

/**
 * Update an order with lock protection
 * @param {string} orderId - The request ID to find
 * @param {Object} updates - Key-value pairs to update
 * @return {Object} Result with success status
 */
function updateOrderWithLock(orderId, updates) {
  return withLock(function() {
    var sheet = getSheet(CONFIG.SHEETS.ORDERS);
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return { success: false, error: 'データが見つかりません。' };
    }

    var col = CONFIG.COLUMNS.ORDERS;
    var requestIds = sheet.getRange(2, col.REQUEST_ID, lastRow - 1, 1).getValues();
    var targetRow = -1;

    for (var i = 0; i < requestIds.length; i++) {
      if (String(requestIds[i][0]) === String(orderId)) {
        targetRow = i + 2;
        break;
      }
    }

    if (targetRow === -1) {
      return { success: false, error: '受注ID ' + orderId + ' が見つかりません。' };
    }

    // Apply updates to specific columns
    if (updates.truckId !== undefined) {
      sheet.getRange(targetRow, col.TRUCK_ID).setValue(updates.truckId);

      // Auto-fill vehicle master data
      if (updates.truckId) {
        var vehicle = getVehicleById(updates.truckId);
        if (vehicle) {
          sheet.getRange(targetRow, col.VEHICLE_NUMBER).setValue(vehicle.vehicleNumber);
          sheet.getRange(targetRow, col.VEHICLE_TYPE).setValue(vehicle.vehicleType);
          sheet.getRange(targetRow, col.DRIVER_NAME).setValue(vehicle.driverName);
        }
      } else {
        // Clear vehicle info when unassigning
        sheet.getRange(targetRow, col.VEHICLE_NUMBER).setValue('');
        sheet.getRange(targetRow, col.VEHICLE_TYPE).setValue('');
        sheet.getRange(targetRow, col.DRIVER_NAME).setValue('');
      }
    }

    if (updates.status !== undefined) {
      sheet.getRange(targetRow, col.STATUS).setValue(updates.status);
    }

    if (updates.loadDate !== undefined) {
      sheet.getRange(targetRow, col.LOAD_DATE).setValue(updates.loadDate);
    }

    if (updates.loadTime !== undefined) {
      sheet.getRange(targetRow, col.LOAD_TIME).setValue(updates.loadTime);
    }

    if (updates.unloadDate !== undefined) {
      sheet.getRange(targetRow, col.UNLOAD_DATE).setValue(updates.unloadDate);
    }

    if (updates.unloadTime !== undefined) {
      sheet.getRange(targetRow, col.UNLOAD_TIME).setValue(updates.unloadTime);
    }

    return { success: true, orderId: orderId };
  });
}
