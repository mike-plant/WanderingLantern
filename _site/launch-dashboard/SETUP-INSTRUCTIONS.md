# Google Sheets Setup Instructions

Follow these steps to set up your shared task tracking with Emily.

---

## Step 1: Create Your Google Sheet (5 minutes)

### 1.1: Import the Template
1. Go to https://sheets.google.com
2. Click **+ Blank spreadsheet**
3. Name it: **"Wandering Lantern - Launch Tasks"**
4. Click **File** → **Import**
5. Click **Upload** tab
6. Drag and drop `tasks-template.csv` from this folder
7. Import location: **Replace current sheet**
8. Click **Import data**

✅ You now have all 45 tasks in your sheet!

### 1.2: Format the Sheet (Optional but Recommended)
1. **Freeze header row:** View → Freeze → 1 row
2. **Bold headers:** Select row 1, click **Bold** (Cmd+B)
3. **Resize columns:** Double-click between column headers to auto-fit
4. **Add filters:** Select row 1, click **Data** → Create a filter

### 1.3: Share the Sheet
1. Click **Share** button (top right)
2. Change to: **Anyone with the link** → **Viewer**
3. Click **Copy link**
4. Click **Done**

✅ Your sheet is now readable by anyone with the link!

---

## Step 2: Get Your Sheet ID (30 seconds)

Your sheet URL looks like this:
```
https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
```

**Copy the part between `/d/` and `/edit`:**
```
1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
```

This is your **Sheet ID**. Save it - you'll need it in the next step!

---

## Step 3: Deploy Google Apps Script (10 minutes)

This enables writing back to the sheet (checking off tasks).

### 3.1: Open Apps Script
1. In your Google Sheet: **Extensions** → **Apps Script**
2. You'll see a blank script

### 3.2: Add the Code
1. **Delete** the default code
2. **Open** the file `google-apps-script.js` (in this folder)
3. **Copy ALL the code**
4. **Paste** into Apps Script editor
5. Click **Save** (disk icon or Cmd+S)
6. Name it: "Task Updater"

### 3.3: Deploy as Web App
1. Click **Deploy** → **New deployment**
2. Click gear icon ⚙️ → Choose **Web app**
3. Settings:
   - **Description:** "Launch Dashboard API"
   - **Execute as:** Me (your@email.com)
   - **Who has access:** **Anyone**
4. Click **Deploy**
5. Click **Authorize access**
6. Choose your Google account
7. Click **Advanced** → **Go to Launch Dashboard API (unsafe)**
   - (It's safe - it's YOUR script!)
8. Click **Allow**

### 3.4: Copy Your Web App URL
After deployment, you'll see:
```
Web app URL: https://script.google.com/macros/s/AKfycbz.../exec
```

**Copy this entire URL** - you'll need it!

✅ Your Apps Script is deployed!

---

## Step 4: Connect the Dashboard (2 minutes)

### 4.1: Test with the POC First
1. Open: https://thewanderinglantern.com/launch-dashboard/poc-sheets.html
2. Paste your **Sheet ID** in the first box
3. Sheet name: **Sheet1** (or whatever your tab is named)
4. Paste your **Apps Script URL** in the third box
5. Click **"📊 Connect to Sheet"**

You should see:
```
✓ Connected! Loaded 45 tasks from Sheet (with write access)
```

### 4.2: Test Checking a Box
1. Check any task checkbox
2. You should see: **"✓ Saved to Google Sheet!"**
3. Go back to your Google Sheet
4. **Refresh the page**
5. The **Completed** column should show **TRUE** for that task!

✅ It's working!

---

## Step 5: Save Your Configuration (1 minute)

Create a simple text file with your settings so Emily can use them too.

Create a file called `sheet-config.txt`:
```
Sheet ID: [paste your Sheet ID here]
Sheet Name: Sheet1
Apps Script URL: [paste your Apps Script URL here]
```

Save this in your `launch-dashboard/` folder so you can reference it easily.

---

## Step 6: Share with Emily (30 seconds)

Send Emily an email:

**Subject:** Launch Dashboard - Let's Track Our Tasks!

**Body:**
```
Hi Emily!

I've set up a shared task tracker for our grand opening campaign.

Dashboard URL: https://thewanderinglantern.com/launch-dashboard/poc-sheets.html

To connect:
1. Open the link above
2. Paste this Sheet ID: [your Sheet ID]
3. Sheet name: Sheet1
4. Paste this Apps Script URL: [your Apps Script URL]
5. Click "Connect to Sheet"

When you check off a task, it syncs to everyone automatically!

You can also view the raw Google Sheet here:
[paste your Google Sheet URL]

Let me know if you have any questions!
```

✅ Emily can now use the same dashboard from her phone!

---

## How It Works

### For You and Emily:
1. Open: https://thewanderinglantern.com/launch-dashboard/poc-sheets.html
2. Enter Sheet ID + Apps Script URL (first time only)
3. Click "Connect to Sheet"
4. Check off tasks as you complete them
5. Auto-syncs every 30 seconds!

### The Google Sheet:
- View/edit the raw data anytime
- See all tasks in spreadsheet format
- Add notes, change dates, add tasks
- Changes appear in dashboard on next refresh

---

## Troubleshooting

### "Can't connect to Sheet"
- Make sure Sheet is shared: **Anyone with link can view**
- Double-check Sheet ID (no spaces, exact copy)
- Refresh the dashboard page

### "Checkbox works but doesn't save to Sheet"
- Make sure you entered the Apps Script URL
- Check that Apps Script is deployed with "Who has access: Anyone"
- Try re-deploying the Apps Script

### "Emily can't connect"
- Make sure she has the correct Sheet ID and Apps Script URL
- Send her the `sheet-config.txt` file
- Have her try the demo mode first to test

---

## Next Steps

### Option 1: Keep Using the POC
- The POC works great for task tracking
- Bookmark it on all devices
- Share with Emily

### Option 2: Integrate into Main Dashboard
- I can update the main dashboard to use Google Sheets
- Would show tasks with sync built-in
- Let me know if you want this!

---

## Your Sheet Structure

The CSV creates these columns:
- **Task** - What to do
- **Week** - 1, 2, 3, or 4
- **Date** - When to do it (Nov 4, Nov 5, etc.)
- **Completed** - FALSE (changes to TRUE when checked)
- **Category** - Email, Social, Website, Press, Store
- **Time** - How long it takes
- **Notes** - Space for your notes

Feel free to:
- Add more columns
- Rearrange tasks
- Add your own tasks
- Change dates
- Add links or resources

---

## Ready to Go!

You now have:
✅ Google Sheet with all 45 tasks
✅ Apps Script for read/write access
✅ Dashboard that syncs across devices
✅ Easy sharing with Emily

**Next:** Follow the steps above to import the CSV and set it up!

Questions? Let me know! 🚀
