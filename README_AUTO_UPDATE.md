# Auto-Update Setup Guide

This file explains how to set up the automatic result pipeline so that GitHub
Actions can update the leaderboard in the cloud — with no Mac needed.

## How it works

```
worldcup26.ir API (free, no key)
        ↓  every 30 min
fetch_results.py (GitHub Actions cloud)
        ↓
FIFAWC2026_Model.xlsx (updated in repo)
        ↓
push_to_supabase.py
        ↓
Live webpage updates automatically 🎉
```

---

## One-time setup (do this once from your computer)

### Step 1: Add your Excel files to the repo

The Excel files live on your Desktop but need to be in the git repo
so GitHub Actions can access them in the cloud.

```bash
# From the fanta-mondiale directory:
mkdir -p data/Pronostici

# Copy your Model file
cp ~/Desktop/FIFAWC2026/FIFAWC2026_Model.xlsx data/FIFAWC2026_Model.xlsx

# Copy all participant prediction files
cp ~/Desktop/FIFAWC2026/Pronostici/*.xlsx data/Pronostici/

# Commit them
git add data/
git commit -m "Add Excel files for cloud automation"
git push
```

> **Note**: The `.xlsx` files are binary but git handles them fine. They're
> about 50-200KB each, well within GitHub's limits.

### Step 2: Add Supabase secrets to GitHub

1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Add these two secrets:
   - `SUPABASE_URL` — your Supabase project URL (e.g., `https://ecqieaselexhcqkwbtcy.supabase.co`)
   - `SUPABASE_SERVICE_KEY` — your service role key (from Supabase → Project Settings → API)

### Step 3: Verify the workflow runs

1. Go to your GitHub repo → **Actions** tab
2. Click **"Auto-update Leaderboard"**
3. Click **"Run workflow"** → **Run workflow** (manual trigger)
4. Watch it run — it should complete in ~60 seconds

---

## How to trigger manually from your phone

1. Open the **GitHub mobile app** (or go to github.com in mobile browser)
2. Navigate to your repo → **Actions**
3. Tap **"Auto-update Leaderboard"**
4. Tap **"Run workflow"**

That's it — scores update within 1 minute on the live website.

---

## How to update results when a new matchday happens

New results are picked up automatically every 30 minutes. The API at
`worldcup26.ir` updates within minutes of a match ending.

If you want to force an immediate update (e.g., right after a match):
1. Trigger the workflow manually from GitHub (see above)
2. Or run locally: `python3 fetch_results.py`

---

## Keeping the ticker current

The `fetch_results.py` script automatically:
1. Builds a ticker string from the last 10 finished matches
2. Pushes it to Supabase (`xl_leaderboard_meta.ticker_text`)
3. The webpage reads this and updates the scrolling ticker

You can also update it manually from Supabase Table Editor (phone-friendly):
- Go to Supabase → Table Editor → `xl_leaderboard_meta`
- Edit the `ticker_text` column in row 1
- The webpage will pick it up on next load

---

## Troubleshooting

**"No data/ directory found"** error in GitHub Actions:
→ You haven't done Step 1 yet. Run the copy commands above.

**Scores not updating in Excel**:
→ Check the Actions log for "WARN: Match not found in Excel". This means
  a team name in the API doesn't match your Excel. Edit `TEAM_MAP` in
  `fetch_results.py` to add the mapping.

**Leaderboard not updating on website**:
→ Check that SUPABASE_URL and SUPABASE_SERVICE_KEY are set correctly in
  GitHub Secrets (Step 2).
