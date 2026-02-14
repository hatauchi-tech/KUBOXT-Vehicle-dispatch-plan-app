/**
 * KUBOXT 配車プランナー - 排他制御マネージャー
 */

/**
 * スクリプトロック内でコールバックを実行
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
 * ロック付き受注更新
 * @param {string} orderId - 依頼ID
 * @param {Object} updates - 更新するキー・値ペア
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
      return { success: false, error: '依頼ID ' + orderId + ' が見つかりません。' };
    }

    // ナンバー (車両割当) の更新
    if (updates.number !== undefined) {
      sheet.getRange(targetRow, col.NUMBER).setValue(updates.number);

      // 車両マスターから自動反映
      if (updates.number) {
        var vehicle = getVehicleByNumber(updates.number);
        if (vehicle) {
          sheet.getRange(targetRow, col.VEHICLE_NUMBER).setValue(vehicle.vehicleNumber || '');
          sheet.getRange(targetRow, col.VEHICLE_TYPE).setValue(vehicle.vehicleType);
          sheet.getRange(targetRow, col.DRIVER_NAME).setValue(vehicle.driverName);
        }
      } else {
        // 割当解除時は車両情報をクリア
        sheet.getRange(targetRow, col.VEHICLE_NUMBER).setValue('');
        sheet.getRange(targetRow, col.VEHICLE_TYPE).setValue('');
        sheet.getRange(targetRow, col.DRIVER_NAME).setValue('');
      }
    }

    // ステータス更新
    if (updates.status !== undefined) {
      sheet.getRange(targetRow, col.STATUS).setValue(updates.status);
    }

    // 日程更新 (ガントドラッグ時)
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
