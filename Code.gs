/**
 * KUBOXT 配車プランナー - サーバーエントリーポイント
 */

/**
 * Web App エントリーポイント - ページルーティング
 */
function doGet(e) {
  var page = (e && e.parameter && e.parameter.page) || 'dashboard';
  var template = page === 'driver' ? 'DriverView' : 'index';
  var title = page === 'driver' ? 'KUBOXT ドライバー' : 'KUBOXT 配車プランナー';

  return HtmlService.createTemplateFromFile(template)
    .evaluate()
    .setTitle(title)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * HTMLパーシャル (CSS, JS) をテンプレートに読み込み
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * ログインユーザー情報を取得
 */
function getUserInfo() {
  return {
    email: Session.getActiveUser().getEmail()
  };
}

/**
 * ダッシュボード用データ一括取得
 */
function getData() {
  try {
    var orders, vehicles;
    try {
      orders = getAllOrders();
    } catch (err) {
      return { success: false, error: '[Server:getAllOrders] ' + err.message };
    }
    try {
      vehicles = getAllVehicles();
    } catch (err) {
      return { success: false, error: '[Server:getAllVehicles] ' + err.message };
    }
    return {
      success: true,
      orders: orders,
      vehicles: vehicles,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    return {
      success: false,
      error: '[Server:getData] ' + err.message
    };
  }
}

/**
 * 受注更新 (クライアントから呼び出し)
 */
function updateOrder(orderId, updates) {
  return updateOrderWithLock(orderId, updates);
}

/**
 * CSVインポート - T_荷主依頼データにデータ投入
 *
 * CSVカラム構成 (13列):
 * 依頼ID, 受付日, 荷主, 積込日, 積込時間, 積込地1, 積込地2,
 * 品名, 荷卸日, 荷卸時間, 荷卸地1, 荷卸地2, 依頼車種
 */
function importCSV(csvContent) {
  try {
    var lines = csvContent.split('\n').filter(function(l) { return l.trim(); });
    if (lines.length < 2) {
      return { success: false, error: 'CSVにデータ行がありません。' };
    }

    var dataLines = lines.slice(1); // ヘッダー行スキップ
    var validShippers = getAllShipperNames();
    var warnings = [];
    var rows = [];
    var totalCols = CONFIG.COLUMNS.ORDERS_TOTAL_COLS; // 18

    for (var i = 0; i < dataLines.length; i++) {
      var fields = parseCSVLine(dataLines[i]);
      var lineNum = i + 2;

      // CSVは13カラム (依頼ID～依頼車種)
      if (fields.length < 13) {
        warnings.push('行 ' + lineNum + ': カラム数不足 (' + fields.length + '/13)');
        continue;
      }

      // 荷主マスター検証
      var shipperName = fields[2] ? fields[2].trim() : '';
      if (validShippers.length > 0 && shipperName && validShippers.indexOf(shipperName) === -1) {
        warnings.push('行 ' + lineNum + ': 荷主 "' + shipperName + '" がマスターに存在しません。');
        continue;
      }

      // 行データ構築: CSVの13列 + ナンバー(空) + 車番(空) + 車種(空) + 運転手(空) + ステータス(未割当)
      var row = [];
      for (var j = 0; j < 13; j++) {
        row.push(fields[j] !== undefined ? fields[j].trim() : '');
      }
      row.push(''); // ナンバー (col 14)
      row.push(''); // 車番 (col 15)
      row.push(''); // 車種 (col 16)
      row.push(''); // 運転手 (col 17)
      row.push(CONFIG.STATUS.UNASSIGNED); // ステータス (col 18)

      rows.push(row);
    }

    if (rows.length === 0) {
      return { success: false, error: '有効なデータ行がありません。', warnings: warnings };
    }

    // バッチ挿入 (GAS 6分制限対策)
    var sheet = getSheet(CONFIG.SHEETS.ORDERS);
    var lastRow = sheet.getLastRow();
    sheet.getRange(lastRow + 1, 1, rows.length, totalCols).setValues(rows);

    return {
      success: true,
      imported: rows.length,
      warnings: warnings
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * CSV行パーサー (ダブルクォート対応)
 */
function parseCSVLine(line) {
  var fields = [];
  var current = '';
  var inQuotes = false;

  for (var i = 0; i < line.length; i++) {
    var ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}
