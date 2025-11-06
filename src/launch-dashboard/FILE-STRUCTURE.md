# Launch Dashboard - File Structure

All your launch planning tools, organized and ready to use!

---

## 📁 File Organization

```
WanderingLantern/
├── index.html                          # Main website (keep as-is)
├── email-signatures.html               # Email signature tool
├── qr-code.html                       # QR code generator
├── README-How-to-Use-These-Tools.md   # Instructions (updated)
│
└── launch-dashboard/                   # 👈 All launch tools here!
    │
    ├── index.html                      # Main dashboard (start here!)
    ├── week-by-week.html              # Week-by-week task lists
    ├── modular-plan.html              # Marketing modules (keep/skip)
    ├── progress.html                  # Progress tracker
    ├── quick-ref.html                 # Quick reference guide
    │
    ├── poc-sheets.html                # Google Sheets integration POC
    ├── google-apps-script.js          # Backend for Google Sheets
    │
    ├── README.md                      # Dashboard overview
    └── SETUP-GOOGLE-SHEETS.md         # Setup instructions
```

---

## ✅ What Changed

### Cleaned Up
- ❌ Removed `FRIDGE-CALENDAR-Week-by-Week.html` (now `week-by-week.html`)
- ❌ Removed `MARKETING-PLAN-Modular.html` (now `modular-plan.html`)
- ❌ Removed `PROGRESS-TRACKER-Print-and-Mark.html` (now `progress.html`)
- ❌ Removed `index-new.html` (old file)
- ❌ Removed `Wandering-Lantern-Complete-Redesign-and-Launch-Plan.html` (archived)

### Organized
- ✅ All launch tools moved to `launch-dashboard/` folder
- ✅ Files renamed for easier linking (kebab-case)
- ✅ Added `quick-ref.html` with contacts, dates, checklists
- ✅ Updated README-How-to-Use-These-Tools.md with new locations

### Added
- ✅ `index.html` - Main dashboard landing page
- ✅ `quick-ref.html` - Quick reference guide
- ✅ `poc-sheets.html` - Google Sheets integration
- ✅ `google-apps-script.js` - Backend script
- ✅ `README.md` - Dashboard documentation
- ✅ `SETUP-GOOGLE-SHEETS.md` - Setup guide

---

## 🚀 How to Use

### Option 1: Interactive Dashboard (Recommended)
1. Open `launch-dashboard/index.html` in your browser
2. Click on any of the four main cards:
   - 📅 Week-by-Week Plan
   - 🎯 Modular Plan
   - 📊 Progress Tracker
   - 📞 Quick Reference
3. All links work! No broken links!

### Option 2: Google Sheets Integration (Cross-Device)
1. Open `launch-dashboard/poc-sheets.html`
2. Click "Load Demo" to test
3. Follow `SETUP-GOOGLE-SHEETS.md` to connect real data
4. Use on phone, tablet, laptop - syncs via Google Sheets!

### Option 3: Print-Friendly (Classic)
1. Open any file in `launch-dashboard/`
2. Press Cmd+P (Mac) or Ctrl+P (Windows)
3. Print or save as PDF
4. Put on fridge, mark with pen!

---

## 📋 What Each File Does

### Main Dashboard
**`index.html`**
- Landing page with countdown to opening
- Stats overview (tasks completed, emails sent)
- Today's priority task
- Navigation to all other tools

### Task Management
**`week-by-week.html`**
- Daily tasks for all 4 weeks (Nov 4 - Nov 29)
- Color-coded by category
- Print one week at a time
- Checklist format

**`modular-plan.html`**
- 10 marketing initiatives
- Keep/Skip buttons
- Time estimates and impact levels
- Decision matrix (bare minimum vs. recommended vs. everything)

**`progress.html`**
- All tasks in simple checkbox format
- Space for notes
- Print, mark up, photograph, send back to Claude
- Metrics tracking for opening weekend

### Reference
**`quick-ref.html`**
- Key dates (email schedule, opening dates)
- Contact info (store, media, partners)
- Quick links (Mailchimp, image optimizer, etc.)
- Opening day checklist
- Your story/talking points
- Emergency contacts

### Google Sheets Integration
**`poc-sheets.html`**
- Proof-of-concept task tracker
- Reads from Google Sheets
- Writes to Google Sheets (with Apps Script)
- Auto-syncs every 30 seconds
- Demo mode for testing

**`google-apps-script.js`**
- Backend code for Google Sheets writes
- Deploy once, works forever
- Step-by-step instructions included

### Documentation
**`README.md`**
- Overview of dashboard
- Quick start options
- Architecture explanation
- Next steps

**`SETUP-GOOGLE-SHEETS.md`**
- Complete setup guide (10-15 min)
- Step-by-step with examples
- Troubleshooting section
- How to use across devices

---

## ✨ All Links Work!

The dashboard now has working links:
- `index.html` → Links to all 4 main tools ✅
- `week-by-week.html` → Back to dashboard ✅
- `modular-plan.html` → Back to dashboard ✅
- `progress.html` → Back to dashboard ✅
- `quick-ref.html` → Back to dashboard ✅

---

## 🎯 What to Open First

**Start Here:**
```
launch-dashboard/index.html
```

This gives you:
- Overview of your campaign
- Countdown to opening
- Links to everything else
- Today's priority task

**Then Explore:**
1. Click through each section
2. Bookmark the dashboard in your browser
3. Try the Google Sheets POC if you want cross-device sync
4. Print what you need, keep the rest digital

---

## 📱 Mobile-Friendly

All pages are responsive:
- Works on phone, tablet, laptop
- Touch-friendly buttons
- Readable on small screens
- Print-optimized too

---

## 🔄 Cross-Device Options

**Option A: Google Sheets (Recommended)**
- Follow `SETUP-GOOGLE-SHEETS.md`
- Real-time sync across all devices
- 10-15 minute one-time setup

**Option B: Email the Dashboard**
- Email `launch-dashboard/` folder to yourself
- Open on any device
- Progress saved per-device (localStorage)

**Option C: Host on Website**
- Upload `launch-dashboard/` to your website
- Access from anywhere via URL
- Share with Emily/Michael

**Option D: Shared Device**
- Use one iPad/laptop as command center
- Everyone updates the same device
- No sync needed

---

## 💡 Tips

1. **Bookmark the dashboard** - Add to browser favorites on all devices
2. **Start with demo mode** - Try `poc-sheets.html` → "Load Demo" to see how it works
3. **Print Week 1 today** - Open `week-by-week.html`, print this week's tasks
4. **Use Quick Reference often** - Contacts, dates, checklists all in one place
5. **Don't overthink it** - Pick what works for you, skip the rest!

---

## 🆘 Need Help?

If something isn't working:
1. Check this file for the correct path
2. Make sure you're opening files from `launch-dashboard/` folder
3. Try refreshing your browser (Cmd+R or Ctrl+R)
4. Let Claude know what's broken!

---

**Everything is organized and ready to go!** 🎉

Open `launch-dashboard/index.html` to get started!

*Updated Nov 3, 2025 - 25 days until grand opening!*
