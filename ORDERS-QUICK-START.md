# Purchase Orders System - Quick Start Guide

Your PO management system is ready! Here's how to get it running.

## Files Created

```
src/orders/
└── index.njk                    # Orders dashboard page

src/assets/js/
└── orders-app.js               # Google Sheets integration & app logic

src/assets/css/
└── orders.css                  # Styling (vintage aesthetic)

ORDERS-SETUP.md                 # Detailed setup instructions
```

## Next Steps (15 minutes)

### 1. Create Google Sheet (5 min)

1. Go to https://sheets.google.com
2. Create new spreadsheet: **"Wandering Lantern - Purchase Orders"**
3. Follow the exact structure in `ORDERS-SETUP.md` (Part 1)
   - Create 3 sheets: Orders, Suppliers, Config
   - Copy the exact column headers
   - Add the formulas for auto-ID and timestamps
4. **Copy the Sheet ID** from the URL (you'll need this!)

### 2. Set Up Google Cloud API (7 min)

1. Go to https://console.cloud.google.com/
2. Create new project: **"Wandering Lantern Orders"**
3. Enable **Google Sheets API**
4. Create **OAuth 2.0 credentials**:
   - Add authorized origins:
     - `https://mike-plant.github.io`
     - `http://localhost:8080`
   - Add redirect URIs:
     - `https://mike-plant.github.io/WanderingLantern/orders/`
     - `http://localhost:8080/orders/`
5. **Copy your Client ID** (looks like `123456789-abc123.apps.googleusercontent.com`)

See `ORDERS-SETUP.md` Part 2 for detailed instructions.

### 3. Configure the App (2 min)

Edit `src/assets/js/orders-app.js` lines 9-11:

```javascript
const CONFIG = {
    GOOGLE_CLIENT_ID: 'YOUR_CLIENT_ID_HERE',      // ← Paste your Client ID
    SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID_HERE',   // ← Paste your Sheet ID
    SHEET_NAME: 'Orders'
};
```

### 4. Test Locally (1 min)

```bash
npm run dev
```

Open: http://localhost:8080/orders/

You should see the sign-in screen. Sign in with your Google account!

### 5. Deploy to Production

```bash
npm run build
git add .
git commit -m "Add purchase orders management system"
git push
```

Your orders system will be live at:
**https://mike-plant.github.io/WanderingLantern/orders/**

## Using the System

### Daily Workflow

**Customer walks in and asks for a book:**

1. Open `/orders/` on your phone/tablet/computer
2. Click **"New Order"**
3. Fill in:
   - Customer name & phone (required)
   - Book title (required)
   - When they need it (required)
4. System recommends supplier:
   - **Faire** if you have 7+ days (50% discount)
   - **Ingram** if urgent/less than 7 days (40% discount, faster)
5. Click **"Save"**

**When you're ready to place orders:**

1. Filter by status: **"Requested"** or **"Sourced"**
2. Group by supplier in your head (or filter by supplier)
3. Place orders with Faire/Ingram
4. Update each order:
   - Change status to **"Ordered"**
   - Enter actual supplier used
   - Add order date, tracking info, cost
   - Save

**When books arrive:**

1. Change status to **"Arrived"**
2. Call customer → change to **"Notified"**
3. Customer picks up → change to **"Picked Up"**

### Status Flow

1. **Requested** - Customer asked, not yet sourced
2. **Sourced** - Found supplier, ready to order
3. **Ordered** - PO placed with supplier
4. **Arrived** - Book is in store
5. **Notified** - Customer called
6. **Picked Up** - Complete!

### Tips

- **Urgent orders** show with orange "URGENT" badge
- **Search** works across customer names, book titles, phone numbers
- **Sort** by clicking column headers
- **Export** data anytime by opening the Google Sheet directly
- **Edit** the Sheet directly if the app has issues

## Security

- Only you (and anyone you add as a test user in Google Cloud) can access
- OAuth login required
- All data stored in your Google account
- You control access and permissions

## Troubleshooting

**"Sign in failed"**
- Check that Client ID and Sheet ID are correct in `orders-app.js`
- Verify authorized origins/redirects in Google Cloud Console
- Open browser console (F12) for detailed error

**"Permission denied"**
- Add your email as a test user in Google Cloud Console → OAuth consent screen
- Sign out and back in

**Orders not loading**
- Open the Google Sheet directly - does it have the right structure?
- Check Sheet name is exactly "Orders"
- Look at browser console (F12) for errors

## Mobile Use

The system works great on phones/tablets:
- Responsive design
- Touch-friendly buttons
- Works offline (after initial load)
- Pin `/orders/` to home screen for quick access

## Data Backup

Your data is automatically backed up in Google Sheets:
- Version history (File → Version history)
- Download as CSV/Excel anytime
- Never loses data

## Future Enhancements

Once you're comfortable with the system, we can add:
- Email notifications when books arrive
- Customer-facing "Request a Book" form on main site
- Supplier API integration (auto-check Faire/Ingram inventory)
- Weekly digest email of pending orders
- Analytics dashboard (sales by supplier, fulfillment time, etc.)
- Shopify integration

## Support

Full documentation: `ORDERS-SETUP.md`

If you get stuck:
1. Check browser console (F12) for errors
2. Verify Sheet structure matches setup guide
3. Test in incognito mode (rules out browser extensions)
4. Check that OAuth consent screen has your email as test user

---

**Ready to go?** Follow the 3 steps above to get started! Should take ~15 minutes total.
