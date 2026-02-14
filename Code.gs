/**
 * KUBOXT Dispatch Planner - Server Entry Point
 */

/**
 * Web App entry point - serves the appropriate page
 * @param {Object} e - Event parameter from doGet
 * @return {HtmlOutput} The HTML page
 */
function doGet(e) {
  var page = (e && e.parameter && e.parameter.page) || 'dashboard';
  var template = page === 'driver' ? 'DriverView' : 'index';
  var title = page === 'driver' ? 'KUBOXT Driver' : 'KUBOXT Dispatch Planner';

  return HtmlService.createTemplateFromFile(template)
    .evaluate()
    .setTitle(title)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Include HTML partials (CSS, JS) into templates
 * @param {string} filename - The file to include
 * @return {string} The file content as HTML
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Get current user information
 * @return {Object} User info with email
 */
function getUserInfo() {
  return {
    email: Session.getActiveUser().getEmail()
  };
}

/**
 * Fetch all data for the dashboard
 * @return {Object} Orders, vehicles, and timestamp
 */
function getData() {
  try {
    return {
      success: true,
      orders: getAllOrders(),
      vehicles: getAllVehicles(),
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Update an order (called from client-side)
 * @param {string} orderId - The order ID to update
 * @param {Object} updates - Key-value pairs to update
 * @return {Object} Result with success status
 */
function updateOrder(orderId, updates) {
  return updateOrderWithLock(orderId, updates);
}

/**
 * Import CSV data into T_Orders
 * @param {string} csvContent - Raw CSV string
 * @return {Object} Result with imported count and warnings
 */
function importCSV(csvContent) {
  try {
    var lines = csvContent.split('\n').filter(function(l) { return l.trim(); });
    if (lines.length < 2) {
      return { success: false, error: 'CSVにデータ行がありません。' };
    }

    // Skip header row
    var dataLines = lines.slice(1);
    var validShippers = getAllShipperNames();
    var warnings = [];
    var rows = [];

    for (var i = 0; i < dataLines.length; i++) {
      var fields = parseCSVLine(dataLines[i]);
      if (fields.length < 12) {
        warnings.push('行 ' + (i + 2) + ': カラム数不足 (' + fields.length + '/12)');
        continue;
      }

      // Validate shipper against M_Shippers
      var shipperName = fields[2] ? fields[2].trim() : '';
      if (validShippers.length > 0 && shipperName && validShippers.indexOf(shipperName) === -1) {
        warnings.push('行 ' + (i + 2) + ': 荷主 "' + shipperName + '" がマスターに存在しません。');
        continue;
      }

      // Build row: 13 CSV columns + 5 system columns (truckId, vehicleNumber, vehicleType, driverName, status)
      var row = [];
      for (var j = 0; j < 13; j++) {
        row.push(fields[j] !== undefined ? fields[j].trim() : '');
      }
      row.push('');  // truckId
      row.push('');  // vehicleNumber
      row.push('');  // vehicleType
      row.push('');  // driverName
      row.push(CONFIG.STATUS.UNASSIGNED);  // status

      rows.push(row);
    }

    if (rows.length === 0) {
      return { success: false, error: '有効なデータ行がありません。', warnings: warnings };
    }

    // Batch insert into T_Orders
    var sheet = getSheet(CONFIG.SHEETS.ORDERS);
    var lastRow = sheet.getLastRow();
    sheet.getRange(lastRow + 1, 1, rows.length, 18).setValues(rows);

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
 * Parse a single CSV line handling quoted fields
 * @param {string} line - A CSV line
 * @return {Array<string>} Parsed fields
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
