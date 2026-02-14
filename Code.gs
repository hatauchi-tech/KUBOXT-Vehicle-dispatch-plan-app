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
