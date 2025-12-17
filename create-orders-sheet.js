/**
 * Google Apps Script to Create Purchase Orders Sheet Structure
 *
 * INSTRUCTIONS:
 * 1. Create a new Google Sheet: https://sheets.google.com
 * 2. Name it: "Wandering Lantern - Purchase Orders"
 * 3. Go to Extensions → Apps Script
 * 4. Delete any code in the editor
 * 5. Copy and paste THIS ENTIRE FILE
 * 6. Click the disk icon to save (name it "Setup")
 * 7. Click "Run" button at the top
 * 8. Grant permissions when prompted
 * 9. Wait for "Execution completed" message
 * 10. Go back to your sheet - it should be fully set up!
 */

function createOrdersSheetStructure() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Clear existing sheets except the first one
  const sheets = ss.getSheets();

  // Rename first sheet to Orders
  const ordersSheet = sheets[0];
  ordersSheet.setName('Orders');

  // Delete any extra sheets
  for (let i = sheets.length - 1; i > 0; i--) {
    ss.deleteSheet(sheets[i]);
  }

  // Create the required sheets
  createOrdersSheet(ss, ordersSheet);
  createInventorySheet(ss);
  createSuppliersSheet(ss);
  createConfigSheet(ss);

  // Set active sheet to Orders
  ss.setActiveSheet(ordersSheet);

  Logger.log('✅ Sheet structure created successfully!');
  SpreadsheetApp.getUi().alert(
    'Success!',
    'Your Purchase Orders sheet is ready!\n\n' +
    'Next steps:\n' +
    '1. Copy the Sheet ID from the URL\n' +
    '2. Continue with Google Cloud setup\n' +
    '3. Add credentials to orders-app.js',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Create Orders sheet with proper structure
 */
function createOrdersSheet(ss, sheet) {
  sheet.clear();

  // Set up headers
  const headers = [
    'OrderID',
    'RequestDate',
    'CustomerName',
    'Phone',
    'Email',
    'BookTitle',
    'Author',
    'ISBN',
    'NeededBy',
    'Status',
    'PreferredSupplier',
    'ActualSupplier',
    'OrderDate',
    'TrackingInfo',
    'Cost',
    'Notes',
    'LastUpdated'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Format header row
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#8b6f47'); // Warm brown
  headerRange.setFontColor('#ffffff');
  headerRange.setHorizontalAlignment('center');

  // Freeze header row
  sheet.setFrozenRows(1);

  // Set column widths
  sheet.setColumnWidth(1, 80);   // OrderID
  sheet.setColumnWidth(2, 110);  // RequestDate
  sheet.setColumnWidth(3, 150);  // CustomerName
  sheet.setColumnWidth(4, 120);  // Phone
  sheet.setColumnWidth(5, 200);  // Email
  sheet.setColumnWidth(6, 250);  // BookTitle
  sheet.setColumnWidth(7, 150);  // Author
  sheet.setColumnWidth(8, 120);  // ISBN
  sheet.setColumnWidth(9, 110);  // NeededBy
  sheet.setColumnWidth(10, 100); // Status
  sheet.setColumnWidth(11, 130); // PreferredSupplier
  sheet.setColumnWidth(12, 130); // ActualSupplier
  sheet.setColumnWidth(13, 110); // OrderDate
  sheet.setColumnWidth(14, 150); // TrackingInfo
  sheet.setColumnWidth(15, 80);  // Cost
  sheet.setColumnWidth(16, 200); // Notes
  sheet.setColumnWidth(17, 150); // LastUpdated

  // Format date columns
  sheet.getRange('B:B').setNumberFormat('yyyy-mm-dd'); // RequestDate
  sheet.getRange('I:I').setNumberFormat('yyyy-mm-dd'); // NeededBy
  sheet.getRange('M:M').setNumberFormat('yyyy-mm-dd'); // OrderDate
  sheet.getRange('Q:Q').setNumberFormat('yyyy-mm-dd hh:mm:ss'); // LastUpdated

  // Format cost column
  sheet.getRange('O:O').setNumberFormat('$0.00'); // Cost

  // Add formulas to row 2 (will auto-fill down)
  // OrderID formula (auto-increment starting at 1001)
  sheet.getRange('A2').setFormula('=IF(C2="","",IF(A1="OrderID",1001,A1+1))');

  // LastUpdated formula (auto timestamp)
  sheet.getRange('Q2').setFormula('=IF(C2="","",NOW())');

  // Copy formulas down 1000 rows
  sheet.getRange('A2').copyTo(sheet.getRange('A2:A1000'));
  sheet.getRange('Q2').copyTo(sheet.getRange('Q2:Q1000'));

  // Add data validation for Status column (rows 2-1000)
  const statusValues = [
    'Requested',
    'Sourced',
    'Ordered',
    'Arrived',
    'Notified',
    'Picked Up',
    'Cancelled'
  ];
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(statusValues)
    .setAllowInvalid(false)
    .build();
  sheet.getRange('J2:J1000').setDataValidation(statusRule);

  // Add data validation for supplier columns
  const supplierValues = ['', 'Faire', 'Ingram', 'WorldBooks', 'Other'];
  const supplierRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(supplierValues, true)
    .setAllowInvalid(true)
    .build();
  sheet.getRange('K2:K1000').setDataValidation(supplierRule); // PreferredSupplier
  sheet.getRange('L2:L1000').setDataValidation(supplierRule); // ActualSupplier

  Logger.log('✅ Orders sheet created');
}

/**
 * Create Inventory sheet for tracking incoming shipments
 */
function createInventorySheet(ss) {
  const sheet = ss.insertSheet('Inventory');

  // Set up headers
  const headers = [
    'PO',
    'OrderDate',
    'ISBN',
    'Title',
    'Author',
    'Price',
    'Status',
    'ReceivedDate'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Format header row
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#8b6f47'); // Warm brown
  headerRange.setFontColor('#ffffff');
  headerRange.setHorizontalAlignment('center');

  // Freeze header row
  sheet.setFrozenRows(1);

  // Set column widths
  sheet.setColumnWidth(1, 80);   // PO
  sheet.setColumnWidth(2, 110);  // OrderDate
  sheet.setColumnWidth(3, 140);  // ISBN
  sheet.setColumnWidth(4, 300);  // Title
  sheet.setColumnWidth(5, 180);  // Author
  sheet.setColumnWidth(6, 80);   // Price
  sheet.setColumnWidth(7, 120);  // Status
  sheet.setColumnWidth(8, 120);  // ReceivedDate

  // Format date columns
  sheet.getRange('B:B').setNumberFormat('yyyy-mm-dd'); // OrderDate
  sheet.getRange('H:H').setNumberFormat('yyyy-mm-dd'); // ReceivedDate

  // Format price column
  sheet.getRange('F:F').setNumberFormat('$0.00'); // Price

  // Add data validation for Status column
  const statusValues = ['Shipped', 'Backordered', 'InStock'];
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(statusValues)
    .setAllowInvalid(false)
    .build();
  sheet.getRange('G2:G10000').setDataValidation(statusRule);

  Logger.log('✅ Inventory sheet created');
}

/**
 * Create Suppliers reference sheet
 */
function createSuppliersSheet(ss) {
  const sheet = ss.insertSheet('Suppliers');

  // Headers
  const headers = ['SupplierName', 'Discount', 'AvgDeliveryDays', 'Notes'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Format headers
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#8b6f47');
  headerRange.setFontColor('#ffffff');
  headerRange.setHorizontalAlignment('center');

  // Add supplier data
  const supplierData = [
    ['Faire', '50%', 10, 'Better pricing, slower, limited selection. Check first.'],
    ['Ingram', '40%', 3, 'Faster, better inventory visibility, higher cost. Fallback for speed/availability.'],
    ['WorldBooks', 'Varies', 7, 'Used/rare books'],
    ['Other', 'Varies', 14, 'Custom sources']
  ];

  sheet.getRange(2, 1, supplierData.length, 4).setValues(supplierData);

  // Format columns
  sheet.setColumnWidth(1, 150);
  sheet.setColumnWidth(2, 100);
  sheet.setColumnWidth(3, 150);
  sheet.setColumnWidth(4, 400);

  // Freeze header row
  sheet.setFrozenRows(1);

  Logger.log('✅ Suppliers sheet created');
}

/**
 * Create Config sheet
 */
function createConfigSheet(ss) {
  const sheet = ss.insertSheet('Config');

  // Headers
  const headers = ['Key', 'Value'];
  sheet.getRange(1, 1, 1, 2).setValues([headers]);

  // Format headers
  const headerRange = sheet.getRange(1, 1, 1, 2);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#8b6f47');
  headerRange.setFontColor('#ffffff');
  headerRange.setHorizontalAlignment('center');

  // Add config data
  const configData = [
    ['DefaultStatus', 'Requested'],
    ['StatusOptions', 'Requested,Sourced,Ordered,Arrived,Notified,Picked Up,Cancelled'],
    ['UrgentThresholdDays', '7'],
    ['DefaultSupplier', 'Faire']
  ];

  sheet.getRange(2, 1, configData.length, 2).setValues(configData);

  // Format columns
  sheet.setColumnWidth(1, 200);
  sheet.setColumnWidth(2, 400);

  // Freeze header row
  sheet.setFrozenRows(1);

  Logger.log('✅ Config sheet created');
}

/**
 * Menu option to run setup
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📋 Orders Setup')
    .addItem('🚀 Create Sheet Structure', 'createOrdersSheetStructure')
    .addItem('ℹ️ About', 'showAbout')
    .addToUi();
}

/**
 * Show about dialog
 */
function showAbout() {
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    'Purchase Orders System',
    'This script sets up your sheet structure for The Wandering Lantern PO system.\n\n' +
    'Created sheets:\n' +
    '• Orders - Customer order tracking\n' +
    '• Inventory - Incoming shipment tracking\n' +
    '• Suppliers - Supplier reference data\n' +
    '• Config - System configuration\n\n' +
    'After running setup, copy the Sheet ID from the URL and continue with Google Cloud setup.',
    ui.ButtonSet.OK
  );
}
