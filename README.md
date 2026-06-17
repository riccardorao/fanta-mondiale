# Fantamondiale — FIFA World Cup 2026 Leaderboard

Live leaderboard powered by **Excel + Python + Supabase + Vercel**.

**Live URL:** https://fantaid.vercel.app

---

## How it works

```
┌──────────────────────┐
│  Excel Files         │  ← Your source of truth
│  (Desktop)           │     • Official results in Model.xlsx
│  FIFAWC2026/         │     • Participant predictions in Pronostici/
└──────────────────────┘
          ↓ python3 push_to_supabase.py
┌──────────────────────┐
│  Supabase            │  ← Data tables
│  • xl_leaderboard    │     (scores, rankings)
│  • xl_leaderboard_   │
│    meta              │
└──────────────────────┘
          ↓ REST API
┌──────────────────────┐
│  Vercel              │  ← Live website
│  index.html          │     Reads from Supabase
└──────────────────────┘
```

---

## Quick Start

### 1. Install dependencies

```bash
pip install openpyxl
```

### 2. Set Supabase credentials (one time)

Get your **Service Role Key** from Supabase Dashboard → Settings → API → `service_role secret`.

Then in your shell (macOS/Linux/WSL):

```bash
export SUPABASE_URL="https://ecqieaselexhcqkwbtcy.supabase.co"
export SUPABASE_SERVICE_KEY="sb_secret_..."
```

On **Windows (PowerShell)**:

```powershell
$env:SUPABASE_URL="https://ecqieaselexhcqkwbtcy.supabase.co"
$env:SUPABASE_SERVICE_KEY="sb_secret_..."
```

### 3. Update the leaderboard

After editing match results in `~/Desktop/FIFAWC2026/FIFAWC2026_Model.xlsx`:

```bash
python3 push_to_supabase.py
```

The live site updates within ~1 minute. ✅

---

## File structure

**Your machine:**

```
~/Desktop/FIFAWC2026/
├── FIFAWC2026_Model.xlsx              ← Official results (edit this)
├── FIFAWC2026_Leaderboard.html        ← Generated locally (optional)
└── Pronostici/
    ├── FIFAWC2026_RaoR.xlsx           ← Participant 1
    ├── FIFAWC2026_Antonini.xlsx       ← Participant 2
    └── ...more participants...
```

**This repo:**

```
fanta-mondiale/
├── push_to_supabase.py                ← Run this after Excel updates
├── generate_leaderboard.py            ← Scoring logic (imported)
├── index.html                         ← Vercel frontend (deployed)
├── supabase/migrations/               ← Database schema
├── vercel.json                        ← Deployment config
├── .env.example                       ← Credentials template
└── README.md                          ← You are here
```

---

## Scoring Rules

Each participant is scored on:

- **Correct Score**: +5 per correct goal (up to +10 per match)
- **Correct Outcome**: +10 per correct 1/X/2 result
- **Group Positions**: +10 per correct final-table slot (once group completes)
- **Knockouts**: 10–90 pts depending on round accuracy
- **Final Standings**: 20–100 pts for correct top-4
- **Top Scorer**: 80 pts for player + 20 pts for goal count

Edit the `POINTS` dictionary in `generate_leaderboard.py` to change scoring.

---

## Troubleshooting

| Error | Fix |
| --- | --- |
| `ModuleNotFoundError: No module named 'openpyxl'` | `pip install openpyxl` |
| `ERROR: SUPABASE_SERVICE_KEY is not set` | Set the env var (see Quick Start step 2) |
| `File not found: ~/Desktop/FIFAWC2026/...` | Check Excel file locations |
| `Supabase HTTP 401` | Service key is invalid; get a fresh one from the dashboard |
| `No such file or directory: /sessions/...` | Update `BASE` path in `generate_leaderboard.py` |

---

## Deployment

The repo is configured for **Vercel Static Deployment**:

- **index.html** is served as your leaderboard  
- Reads live Supabase data via REST API  
- Redeploys automatically when you push to `main`

No build step needed. The leaderboard updates when your Python script writes to Supabase.

---

## Database Setup

Supabase tables created by migrations:

1. **`xl_leaderboard`** — participant scores + rankings
2. **`xl_leaderboard_meta`** — tournament metadata (matches played, groups complete, etc.)

Both tables have **public read RLS** (anyone can view).

Apply migrations in Supabase SQL Editor:
```bash
supabase db push  # or run each .sql file in order
```

---

## Editing Scoring

Edit `POINTS` dictionary in `generate_leaderboard.py`:

```python
POINTS = {
    "score_per_team": 5,      # points per correct goal
    "outcome": 10,            # points for correct 1/X/2
    "position": 10,           # points per correct group slot
    "r32_correct": 10,        # knockout accuracy
    "r32_wrong": 5,           # etc...
    ...
}
```

Then re-run:

```bash
python3 push_to_supabase.py
```

---

## Technical Stack

| Component | Technology |
| --- | --- |
| Data source | Excel (openpyxl) |
| Scoring engine | Python 3 |
| Backend | Supabase (PostgreSQL) |
| Frontend | Static HTML + Fetch API |
| Hosting | Vercel |

---

## Contact & Support

For issues with the scripts or leaderboard, check that:

1. Excel files are in `~/Desktop/FIFAWC2026/` with correct names
2. Supabase credentials are set in your shell environment
3. Python dependencies are installed (`pip install openpyxl`)
4. Supabase migrations have been applied
