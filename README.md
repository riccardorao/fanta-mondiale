# Fantamondiale — FIFA World Cup 2026 Leaderboard

Live leaderboard powered by **Excel + Python + Supabase + Vercel**.

**Live URL:** [https://fantaid.vercel.app](https://fantaid.vercel.app)

---

## Architecture & Pipeline

```
              ┌────────────────────────────────────────────────────────┐
              │                   Local Machine                        │
              │  ~/Desktop/FIFAWC2026/                                 │
              │  ├── FIFAWC2026_Model.xlsx (Official Results)          │
              │  └── Pronostici/*.xlsx (Participant predictions)       │
              └────────────────────────────────────────────────────────┘
                                   │
                                   │ Commit & Push to GitHub data/
                                   ▼
              ┌────────────────────────────────────────────────────────┐
              │                   GitHub Repository                    │
              │  fanta-mondiale/                                       │
              │  ├── data/FIFAWC2026_Model.xlsx                        │
              │  └── data/Pronostici/*.xlsx                            │
              └────────────────────────────────────────────────────────┘
                                   │
                                   │ Auto-run (GitHub Actions)
                                   ▼
 ┌─────────────────────────────────────────────────────────────────────────┐
 │                       GitHub Actions Runner                             │
 │  • cron schedule: Every 5 mins between 18:00 and 08:00 CEST             │
 │  • fetch_results.py checks football-data.org (Primary)                  │
 │  • updates data/FIFAWC2026_Model.xlsx in-place                          │
 │  • commits & pushes new results back to GitHub repository               │
 │  • triggers push_to_supabase.py to recompute leaderboard                │
 └─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ REST API Upsert
                                   ▼
              ┌────────────────────────────────────────────────────────┐
              │                   Supabase Database                    │
              │  • xl_leaderboard (Participant scores & rankings)      │
              │  • xl_leaderboard_meta (Metadata & marquee ticker)     │
              └────────────────────────────────────────────────────────┘
                                   │
                                   │ REST API Fetch (Browser)
                                   ▼
              ┌────────────────────────────────────────────────────────┐
              │                   Vercel Frontend                      │
              │  • Serves static index.html                            │
              │  • Renders responsive leaderboard & ticker live        │
              └────────────────────────────────────────────────────────┘
```

---

## File Structure

```
fanta-mondiale/
├── .github/workflows/
│   └── auto_update.yml       ← GitHub Actions scheduler & permissions setup
├── data/
│   ├── FIFAWC2026_Model.xlsx  ← Official results (synchronized with cloud)
│   └── Pronostici/
│       └── *.xlsx             ← Participant prediction sheets (committed once)
├── scripts/
│   ├── fetch_results.py       ← Main API result fetcher & spreadsheet synchronizer
│   ├── generate_leaderboard.py ← Core scoring algorithm & rules engine
│   └── push_to_supabase.py    ← Leaderboard re-computation & database sync
├── index.html                 ← Responsive HTML/CSS/JS frontend dashboard
├── supabase/
│   └── migrations/            ← Database SQL schema migrations
├── vercel.json                ← Vercel deployment configuration
├── .gitignore                 ← Git exclusion patterns (ignores local env/Desktop config)
├── .env.example               ← Environment credentials template
└── README.md                  ← Unified guide (you are here)
```

---

## Local Setup & Quick Start

### 1. Install Dependencies
Make sure you have Python 3 installed. Then, install the required packages:
```bash
pip install openpyxl python-dotenv requests
```

### 2. Set Up Local Credentials (One Time)
Create a `.env` file in the root of the repository:
```env
SUPABASE_URL="https://ecqieaselexhcqkwbtcy.supabase.co"
SUPABASE_SERVICE_KEY="your_supabase_service_role_key"
FOOTBALL_DATA_API_KEY="your_football_data_org_api_key"
```
* **SUPABASE_SERVICE_KEY**: Obtain from your Supabase Dashboard → Settings → API → `service_role secret`.
* **FOOTBALL_DATA_API_KEY**: Register for a free API key at [football-data.org](https://www.football-data.org/client/register) to fetch results.

### 3. Run Manually
* **Update results and sync with Supabase:**
  ```bash
  python3 scripts/fetch_results.py
  ```
  Options:
  * `--dry-run`: Show matches that would be updated in Excel without modifying files.
  * `--no-push`: Save results to Excel but skip re-scoring and uploading to Supabase.
  * `--ticker-only`: Only regenerate the top ticker string with recent scores in Supabase.

* **Recompute and push leaderboard only:**
  ```bash
  python3 scripts/push_to_supabase.py
  ```

---

## Cloud Auto-Update (GitHub Actions)

The repository includes a GitHub Actions workflow that automatically keeps the leaderboard updated without needing your computer active.

### 1. Synchronization Flow
1. **GitHub Actions** runs every **5 minutes** during tournament hours (18:00 to 08:00 CEST / 16:00 to 06:00 UTC).
2. It calls the `football-data.org` API to fetch completed and live match results.
3. If new matches are finished, it updates `data/FIFAWC2026_Model.xlsx` in the cloud workspace.
4. The workflow commits and pushes the updated model file back to the repository.
5. Finally, it triggers `scripts/push_to_supabase.py` to recompute scores for all participants and sync them to the live site.

### 2. Manual Trigger
You can force an immediate update at any time (e.g. right after a match ends):
1. Go to your GitHub repository in your browser or the **GitHub mobile app**.
2. Tap the **Actions** tab.
3. Select the **"Auto-update Leaderboard"** workflow.
4. Tap **Run workflow** -> **Run workflow**.

---

## Scoring Rules

Each participant's points are automatically calculated based on the following breakdown:

* **Correct Score**: +5 points per correct team goal count (up to +10 points per match).
* **Correct Outcome**: +10 points for the correct match outcome (1/X/2).
* **Group Positions**: +10 points per correct final-table position slot per team (calculated once groups finish).
* **Knockouts**: 10–90 points depending on the round accuracy.
* **Final Standings**: 20–100 points for correct top-4 team predictions.
* **Top Scorer**: 80 points for the correct player + 20 points for the correct goal count.

Scoring weights can be modified in the `POINTS` dictionary inside [generate_leaderboard.py](file:///Users/riccardorao/fanta-mondiale/fanta-mondiale/scripts/generate_leaderboard.py).

---

## Troubleshooting

| Error / Warning | Cause & Resolution |
| --- | --- |
| `[WARN] Unknown team: 'X' or 'Y' — add to FOOTBALLDATA_TEAM_MAP` | A team name in the API doesn't match the Excel spelling. Open [fetch_results.py](file:///Users/riccardorao/fanta-mondiale/fanta-mondiale/scripts/fetch_results.py) and update the `FOOTBALLDATA_TEAM_MAP` dictionary. |
| `ERROR: SUPABASE_SERVICE_KEY is not set` | Ensure the environment variable is set in your shell or inside `.env`. |
| `remote: Permission to ... denied to github-actions[bot]` | Ensure workflow permissions are set to `write` (this is configured in [.github/workflows/auto_update.yml](file:///Users/riccardorao/fanta-mondiale/fanta-mondiale/.github/workflows/auto_update.yml)). |
| `ModuleNotFoundError: No module named 'openpyxl'` | Run `pip install openpyxl python-dotenv requests` to install Python dependencies. |

---

## Technical Stack

* **Scoring Engine**: Python 3 (`openpyxl`, `requests`)
* **Database**: Supabase (PostgreSQL tables: `xl_leaderboard`, `xl_leaderboard_meta`)
* **Frontend**: Vanilla HTML5 + Modern CSS + Fetch API
* **Hosting**: Vercel (static deployment with automatic API sync)
