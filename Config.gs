/**
 * KUBOXT Dispatch Planner - Configuration Constants
 */
var CONFIG = {
  SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID_HERE',

  SHEETS: {
    ORDERS: 'T_Orders',
    VEHICLES: 'M_Vehicles',
    SHIPPERS: 'M_Shippers'
  },

  COLUMNS: {
    ORDERS: {
      REQUEST_ID: 1,
      RECEIVED_DATE: 2,
      SHIPPER: 3,
      LOAD_DATE: 4,
      LOAD_TIME: 5,
      LOAD_LOCATION: 6,
      UNLOAD_DATE: 7,
      UNLOAD_TIME: 8,
      UNLOAD_LOCATION: 9,
      CARGO_NAME: 10,
      QUANTITY: 11,
      NOTES: 12,
      CSV_ROW_ID: 13,
      TRUCK_ID: 14,
      VEHICLE_NUMBER: 15,
      VEHICLE_TYPE: 16,
      DRIVER_NAME: 17,
      STATUS: 18
    },
    VEHICLES: {
      TRUCK_ID: 1,
      VEHICLE_NUMBER: 2,
      VEHICLE_TYPE: 3,
      DRIVER_NAME: 4,
      DRIVER_EMAIL: 5,
      ACTIVE: 6
    },
    SHIPPERS: {
      SHIPPER_ID: 1,
      SHIPPER_NAME: 2
    }
  },

  STATUS: {
    UNASSIGNED: 'Unassigned',
    ASSIGNED: 'Assigned',
    EN_ROUTE: 'En Route',
    COMPLETED: 'Completed'
  },

  LOCK_TIMEOUT: 10000
};
