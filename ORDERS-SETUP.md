# Purchase Orders System - Setup Guide

This guide will walk you through setting up the Google Sheets-based purchase order management system for The Wandering Lantern.

## Part 1: Create the Google Sheet

### Step 1: Create New Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new blank spreadsheet
3. Name it: **"Wandering Lantern - Purchase Orders"**
4. Copy the Sheet ID from the URL:
   - URL looks like: `https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit`
   - Copy everything between `/d/` and `/edit`
   - You'll need this later!

### Step 2: Set Up Sheet Structure

Create **3 sheets** (tabs) in your spreadsheet:

#### Sheet 1: "Orders"

Rename the first sheet to "Orders" and add these column headers in row 1:

| A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| OrderID | RequestDate | CustomerName | Phone | Email | BookTitle | Author | ISBN | NeededBy | Status | PreferredSupplier | ActualSupplier | OrderDate | TrackingInfo | Cost | Notes | LastUpdated |

**Format the header row:**
- Bold text
- Background color: `#8b6f47` (your warm brown)
- Text color: white
- Freeze row 1 (View → Freeze → 1 row)

**Column formatting:**
- Column B (RequestDate): Format → Number → Date
- Column I (NeededBy): Format → Number → Date
- Column M (OrderDate): Format → Number → Date
- Column O (Cost): Format → Number → Currency
- Column Q (LastUpdated): Format → Number → Date time

**Formulas to add:**
- In cell A2, add this formula (auto-incrementing OrderID):
  ```
  =IF(C2="","",IF(A1="OrderID",1001,A1+1))
  ```
- In cell Q2, add this formula (auto timestamp):
  ```
  =IF(C2="","",NOW())
  ```
- Drag both formulas down to row 1000

#### Sheet 2: "Suppliers"

Create a new sheet named "Suppliers" with these columns:

| A | B | C | D |
|---|---|---|---|
| SupplierName | Discount | AvgDeliveryDays | Notes |

Add this data starting in row 2:

| SupplierName | Discount | AvgDeliveryDays | Notes |
|---|---|---|---|
| Faire | 50% | 10 | Better pricing, slower, limited selection. Check first. |
| Ingram | 40% | 3 | Faster, better inventory visibility, higher cost. Fallback for speed/availability. |
| WorldBooks | Varies | 7 | Used/rare books |
| Other | Varies | 14 | Custom sources |

**Format header row same as Orders sheet**

#### Sheet 3: "Config"

Create a new sheet named "Config" with these columns:

| A | B |
|---|---|
| Key | Value |

Add this data:

| Key | Value |
|---|---|
| DefaultStatus | Requested |
| StatusOptions | Requested,Sourced,Ordered,Arrived,Notified,Picked Up,Cancelled |
| UrgentThresholdDays | 7 |
| DefaultSupplier | Faire |

**Format header row same as Orders sheet**

### Step 3: Share Settings

1. Click the "Share" button (top right)
2. Under "General access" select **"Restricted"**
3. Only people you add can access
4. You'll add the Google Cloud service account email later

---

## Part 2: Set Up Google Cloud & API Access

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Click "Select a project" → "New Project"
4. Project name: **"Wandering Lantern Orders"**
5. Click "Create"
6. Wait for project creation, then select it

### Step 2: Enable Google Sheets API

1. In your new project, go to "APIs & Services" → "Library"
2. Search for "Google Sheets API"
3. Click on it, then click "Enable"
4. Wait for it to enable

### Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted to configure consent screen first:
   - Click "Configure Consent Screen"
   - Choose "External" (unless you have Google Workspace)
   - Fill in:
     - App name: **Wandering Lantern Orders**
     - User support email: your email
     - Developer contact: your email
   - Click "Save and Continue"
   - Skip "Scopes" (click "Save and Continue")
   - Add your email as a test user
   - Click "Save and Continue"
   - Click "Back to Dashboard"

4. Now create OAuth client ID:
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: **Web application**
   - Name: **Wandering Lantern Orders Web Client**
   - Authorized JavaScript origins:
     - `https://mike-plant.github.io`
     - `http://localhost:8080` (for local testing)
   - Authorized redirect URIs:
     - `https://mike-plant.github.io/WanderingLantern/orders/`
     - `http://localhost:8080/orders/`
   - Click "Create"

5. **IMPORTANT**: Copy your Client ID
   - You'll see a popup with your Client ID and Client Secret
   - Copy the **Client ID** (looks like: `123456789-abc123.apps.googleusercontent.com`)
   - Save it somewhere safe - you'll need it in the next step

---

## Part 3: Configure the Web App

### Step 1: Add Your Credentials

Open the file `src/assets/js/orders-app.js` and find this section near the top:

```javascript
// CONFIGURATION - UPDATE THESE VALUES
const CONFIG = {
    GOOGLE_CLIENT_ID: 'YOUR_CLIENT_ID_HERE',
    SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID_HERE',
    SHEET_NAME: 'Orders'
};
```

Replace:
- `YOUR_CLIENT_ID_HERE` with your OAuth Client ID from Step 2
- `YOUR_SPREADSHEET_ID_HERE` with the Sheet ID from Part 1, Step 1

### Step 2: Build and Deploy

```bash
npm run build
```

Commit and push to GitHub:

```bash
git add .
git commit -m "Add purchase orders management system"
git push
```

---

## Part 4: First Login

1. Go to `https://mike-plant.github.io/WanderingLantern/orders/`
2. Click "Sign in with Google"
3. Sign in with your Google account
4. You may see a warning "Google hasn't verified this app"
   - This is normal for apps in testing mode
   - Click "Advanced" → "Go to Wandering Lantern Orders (unsafe)"
5. Grant permission to view and manage your Google Sheets
6. You should now see the orders dashboard!

---

## Usage Guide

### Adding an Order

1. Click "New Order" button
2. Fill in customer details (name, phone, email)
3. Enter book information (title, author, ISBN if known)
4. Set "Needed By" date
5. System will suggest supplier based on timing:
   - If needed in < 7 days: suggests Ingram (faster)
   - Otherwise: suggests Faire (better pricing)
6. Add any notes
7. Click "Save"

### Tracking Orders

**Status Workflow:**
1. **Requested** - Customer asked, not yet sourced
2. **Sourced** - Found supplier, ready to order
3. **Ordered** - Purchase order placed
4. **Arrived** - Book is in store
5. **Notified** - Customer has been called
6. **Picked Up** - Customer collected book

**Update Status:**
- Click on any row to edit
- Change status dropdown
- Add tracking info, actual supplier used, cost
- Click "Save"

### Filters & Search

- **Status filters**: Click status badges at top to filter
- **Search**: Type in search box to find by customer name, book title, etc.
- **Sort**: Click column headers to sort
- **Urgent**: Orders needed within 7 days show with orange "URGENT" badge

### Reports

The Google Sheet is your source of truth. You can:
- Open the Sheet directly for manual edits
- Create pivot tables for supplier spending analysis
- Export to CSV for QuickBooks/accounting
- View version history

---

## Troubleshooting

### "Sign in failed" or "API error"

1. Check that Sheet ID and Client ID are correct in `orders-app.js`
2. Verify the Sheet is shared with your Google account
3. Check browser console (F12) for specific error messages

### "Permission denied" when loading orders

1. Go to Google Cloud Console → OAuth consent screen
2. Make sure your email is added as a test user
3. Try signing out and back in

### Orders not saving

1. Open the Google Sheet directly
2. Check if the "Orders" sheet name matches exactly
3. Verify column headers match the setup guide
4. Check browser console for errors

### Need to add another user

1. Google Cloud Console → OAuth consent screen
2. Under "Test users", add their email
3. They'll need to sign in and grant permissions

---

## Security Notes

- OAuth restricts access to only Google accounts you specify
- Data lives in your Google account (you control it)
- The web app runs client-side (no server storing credentials)
- Google Sheets API calls are made directly from user's browser
- All access is logged in Google Sheets version history

---

## Future Enhancements

Once this is working, we can add:
- Email notifications when books arrive (via Google Apps Script)
- Customer-facing "Request a Book" form on main site
- Integration with Faire/Ingram APIs (if available)
- Inventory sync with Shopify
- Weekly digest email of pending orders
- Analytics dashboard

---

Need help? Check browser console (F12) for error messages or reach out!
