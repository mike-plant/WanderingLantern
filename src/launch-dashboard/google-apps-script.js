/**
 * Google Apps Script for The Wandering Lantern Launch Dashboard
 *
 * SETUP INSTRUCTIONS:
 * 1. Open your Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Delete the default code and paste this entire file
 * 4. Click "Deploy" > "New deployment"
 * 5. Type: Web app
 * 6. Execute as: Me
 * 7. Who has access: Anyone
 * 8. Click "Deploy"
 * 9. Copy the Web App URL and paste it into your HTML file
 *
 * Your Google Sheet should have these columns:
 * A: Task (text)
 * B: Week (number)
 * C: Date (text)
 * D: Completed (TRUE/FALSE)
 */

function doPost(e) {
  try {
    // Parse the incoming request
    const data = JSON.parse(e.postData.contents);

    // Get the sheet
    const sheetId = data.sheetId;
    const sheetName = data.sheetName || 'Week1';
    const sheet = SpreadsheetApp.openById(sheetId).getSheetByName(sheetName);

    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: `Sheet "${sheetName}" not found`
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Update the cell
    // Row number (+1 because row 1 is header)
    // Column 4 is "Completed" (D column)
    const row = data.row;
    const column = data.column;
    const value = data.value;

    sheet.getRange(row, column).setValue(value);

    // Return success
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: `Updated row ${row}, column ${column} to ${value}`
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Optional: Add a doGet handler for testing
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'The Wandering Lantern Launch Dashboard API',
    message: 'This endpoint accepts POST requests to update Google Sheets',
    version: '1.0'
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * ALTERNATIVE: Batch Update Function
 * Use this if you want to update multiple rows at once
 */
function doPostBatch(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheetId = data.sheetId;
    const sheetName = data.sheetName || 'Week1';
    const updates = data.updates; // Array of {row, column, value}

    const sheet = SpreadsheetApp.openById(sheetId).getSheetByName(sheetName);

    if (!sheet) {
      throw new Error(`Sheet "${sheetName}" not found`);
    }

    updates.forEach(update => {
      sheet.getRange(update.row, update.column).setValue(update.value);
    });

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      updated: updates.length
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
