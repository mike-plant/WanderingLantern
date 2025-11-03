# Google Sheets Integration Setup

Complete guide to setting up cross-device task tracking using Google Sheets as your database.

---

## What You'll Have When Done

- Task list stored in Google Sheets (visible to you like a spreadsheet)
- Web dashboard that reads/writes to that Sheet
- Works on ANY device (Emily's phone, Michael's laptop, your tablet)
- Auto-syncs every 30 seconds
- No server, no database hosting, no monthly fees

**Total Setup Time:** 10-15 minutes (one-time setup)

---

## Step 1: Create Your Google Sheet (3 minutes)

1. **Go to:** [Google Sheets](https://sheets.google.com)
2. **Click:** + Blank spreadsheet
3. **Name it:** "Wandering Lantern - Launch Tasks"

### Add Column Headers (Row 1):
In the first row, type these exactly:

| A        | B    | C    | D         |
|----------|------|------|-----------|
| Task     | Week | Date | Completed |

### Add Your First Task (Row 2):
| A                                           | B | C      | D     |
|---------------------------------------------|---|--------|-------|
| Instagram: Construction photo "23 days"     | 1 | Nov 4  | FALSE |

### Add More Tasks:
Continue adding all your tasks from the week-by-week plan. Format:
- **Column A (Task):** Full task description
- **Column B (Week):** 1, 2, 3, or 4
- **Column C (Date):** "Nov 4", "Nov 5", etc.
- **Column D (Completed):** FALSE (will change to TRUE when checked)

### Share Your Sheet:
1. Click **Share** button (top right)
2. Change to: **Anyone with the link** → **Viewer**
3. Click **Copy link**
4. Click **Done**

### Get Your Sheet ID:
Your sheet URL looks like this:
```
https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
```

Copy the part between `/d/` and `/edit` - that's your **Sheet ID**:
```
1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
```

Save this ID - you'll need it in Step 3.

---

## Step 2: Deploy Google Apps Script (5 minutes)

This script allows the dashboard to UPDATE your Sheet (not just read it).

### 2.1: Open Apps Script
1. In your Google Sheet, go to: **Extensions** → **Apps Script**
2. You'll see a blank script called "Code.gs"

### 2.2: Replace the Code
1. **Delete** the default code (`function myFunction() { ... }`)
2. **Open** the file `google-apps-script.js` (in this folder)
3. **Copy ALL the code** from that file
4. **Paste** it into the Apps Script editor
5. **Click** the save icon (disk icon) or Cmd+S

### 2.3: Deploy as Web App
1. Click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Choose **Web app**
4. Fill in these settings:
   - **Description:** "Launch Dashboard API"
   - **Execute as:** Me (your email)
   - **Who has access:** Anyone
5. Click **Deploy**
6. Click **Authorize access**
7. Choose your Google account
8. Click **Advanced** (if you see a warning)
9. Click **Go to Launch Dashboard API (unsafe)** - this is YOUR script, it's safe
10. Click **Allow**

### 2.4: Copy Your Web App URL
After deployment, you'll see:
```
Web app URL: https://script.google.com/macros/s/AKfycbz.../exec
```

**Copy this entire URL** - you'll need it in Step 3.

---

## Step 3: Connect the Dashboard (2 minutes)

### 3.1: Open the POC
1. Open the file: `launch-dashboard/poc-sheets.html`
2. Double-click or right-click → Open With → Chrome/Safari

### 3.2: Enter Your Configuration
Fill in the three fields:

**Google Sheet ID:**
```
(Paste the ID you copied in Step 1)
```

**Sheet Name (tab):**
```
Week1
```
(Or whatever you named your first tab - default is "Sheet1" if you didn't rename it)

**Apps Script URL:**
```
(Paste the Web App URL you copied in Step 2.4)
```

### 3.3: Connect!
Click the **"📊 Connect to Sheet"** button.

You should see:
```
✓ Connected! Loaded 5 tasks from Sheet (with write access)
```

### 3.4: Test It!
1. Check one of the checkboxes
2. You should see: "✓ Saved to Google Sheet! (Row 1 updated)"
3. Go back to your Google Sheet
4. **Refresh the page**
5. Column D should now show **TRUE** for that task!

---

## Step 4: Use Across Devices (1 minute)

The POC page (`poc-sheets.html`) is just an HTML file. You can:

### Option A: Email It
1. Email `poc-sheets.html` to yourself
2. Open it on your phone/tablet
3. Enter the same Sheet ID and Apps Script URL
4. Click "Connect to Sheet"
5. Done! Both devices now sync to the same Sheet

### Option B: Host It (Recommended)
1. Upload `poc-sheets.html` to your website
2. Visit the URL on any device
3. Bookmark it on all devices
4. Always up to date!

### Option C: Use Google Drive
1. Upload `poc-sheets.html` to Google Drive
2. Share the file with yourself
3. Open on any device via Drive app

---

## Troubleshooting

### "Error loading Sheet - make sure it's shared publicly"
- Go to your Sheet → Share → Change to "Anyone with the link can view"
- Try connecting again

### "Connected but checkbox changes don't save to Sheet"
- Make sure you filled in the **Apps Script URL** field
- Check that you deployed the Apps Script (Step 2.3)
- The script must be deployed with "Who has access: Anyone"

### "Checkboxes update but don't persist across devices"
- Make sure you're using the **same Sheet ID** on all devices
- Make sure you're using the **same Apps Script URL** on all devices
- Wait 30 seconds for auto-refresh, or manually refresh the page

### "Row numbers are wrong in the Sheet"
- Row 1 must be your headers (Task, Week, Date, Completed)
- Row 2 is your first task (id: 1)
- Row 3 is your second task (id: 2), etc.

### Apps Script Authorization Issues
- Use the same Google account for the Sheet and the Apps Script
- If you see "This app isn't verified" - click Advanced → Go to... (it's YOUR script)
- Make sure you clicked "Allow" for all permissions

---

## Next Steps

Once the POC works:

### 1. Add All Your Tasks
Go to your Google Sheet and add all 47 tasks from your launch plan:
- Week 1 tasks (Nov 4-10)
- Week 2 tasks (Nov 11-17)
- Week 3 tasks (Nov 18-24)
- Week 4 tasks (Nov 25-29)

### 2. Create Tabs for Each Week (Optional)
Instead of one long list, create tabs:
- Tab 1: "Week1" (Nov 4-10 tasks)
- Tab 2: "Week2" (Nov 11-17 tasks)
- Tab 3: "Week3" (Nov 18-24 tasks)
- Tab 4: "Week4" (Nov 25-29 tasks)

Then switch between weeks in the dashboard by changing the "Sheet Name" field.

### 3. Integrate Into Main Dashboard
Once you're happy with the POC, we can integrate it into the full dashboard with:
- Week navigation buttons
- Progress tracking
- Stats and countdown
- All the features from the main dashboard plan

### 4. Customize the Interface
The POC is intentionally simple. We can add:
- Week filtering
- Search/filter tasks
- Categories/tags
- Due date highlighting
- Progress charts

---

## How It Works (Technical Details)

### Reading from Google Sheet
- Uses public Sheets API endpoint: `/gviz/tq?tqx=out:json`
- No authentication required if Sheet is publicly viewable
- Returns JSONP format (parsed in JavaScript)
- Auto-refreshes every 30 seconds

### Writing to Google Sheet
- Uses Google Apps Script deployed as Web App
- Script has permission to write to YOUR Sheets
- Dashboard sends POST request with row/column/value
- Apps Script updates the cell
- No-cors mode (can't read response, but update still works)

### Security
- Sheet ID is public (anyone with link can view)
- Apps Script URL is public (anyone can call it)
- But only YOUR Sheet can be updated (sheetId is required)
- For production, you could add API key validation to the Apps Script

---

## Alternative: Read-Only Mode

If you don't want to set up write capability yet, you can use **read-only mode**:

1. Skip Step 2 (Apps Script)
2. In Step 3, leave "Apps Script URL" blank
3. Click "Connect to Sheet"
4. Dashboard will load tasks from Sheet
5. Checkbox changes save to browser localStorage (per-device)
6. Manually update the Sheet when you complete tasks

This is useful for:
- Quick testing
- Viewing tasks on multiple devices (manual Sheet updates)
- Simpler setup if you don't need cross-device sync

---

## Demo Mode (No Sheet Needed)

Want to see how it works before setting anything up?

1. Open `poc-sheets.html`
2. Click **"🎯 Load Demo"**
3. 5 sample tasks appear
4. Check/uncheck boxes (saves to browser localStorage)
5. No Sheet connection needed

Perfect for testing the interface!

---

## Questions?

If you get stuck or want to customize this setup, let me know:
- What error message you're seeing
- Which step you're on
- Screenshot if helpful

Common requests:
- "Can we add more columns?" → Yes!
- "Can we use this for other projects?" → Absolutely!
- "Can we have multiple Sheets?" → Yes, just change the Sheet ID
- "Can we password protect it?" → Yes, we'd add authentication

---

**Ready to try it?** Start with Step 1! 🚀
