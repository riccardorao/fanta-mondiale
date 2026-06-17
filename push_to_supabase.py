#!/usr/bin/env python3
"""
Push the current leaderboard to Supabase (project: fanta-mondiale).

It re-scores every file in Pronostici/ against FIFAWC2026_Model.xlsx (reusing the
logic in generate_leaderboard.py) and UPSERTS the results into the public tables
`xl_leaderboard` and `xl_leaderboard_meta`. The Vercel site reads those live.

USAGE
-----
1. Create a `.env` file in this directory with your Supabase credentials:

   SUPABASE_URL=https://ecqieaselexhcqkwbtcy.supabase.co
   SUPABASE_SERVICE_KEY="sb_secret_apB4kMbtgI92_mKD7Tx3pA_8U3FXrxV"

   (Find SERVICE_KEY in Supabase → Project Settings → API → service_role secret.)
   The .env file is in .gitignore and will never be committed.

2. Run:
       python3 push_to_supabase.py

Re-run this any time after updating results in FIFAWC2026_Model.xlsx or adding a
new file to Pronostici/. The live leaderboard updates within ~a minute.
"""
import os, sys, json, glob, datetime, urllib.request, urllib.error
from dotenv import load_dotenv

# Load secrets from .env file (not committed to repo for security)
load_dotenv()

# Reuse all scoring logic from the generator (must sit next to this file)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import generate_leaderboard as gen

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://ecqieaselexhcqkwbtcy.supabase.co").rstrip("/")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

if not SERVICE_KEY:
    sys.exit(
        "ERROR: SUPABASE_SERVICE_KEY is not set.\n"
        "Set it first (see the instructions at the top of this file), then re-run.\n"
        "  export SUPABASE_SERVICE_KEY=\"your service_role key\""
    )


def compute():
    rows, meta = gen.compute_leaderboard_data(gen.MODEL, gen.PRON)
    meta["id"] = 1
    meta.pop("max_total", None)
    return rows, meta


def upsert(table, payload, on_conflict):
    """POST with upsert (merge-duplicates) to the Supabase REST endpoint."""
    url = f"{SUPABASE_URL}/rest/v1/{table}?on_conflict={on_conflict}"
    body = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=body, method="POST", headers={
        "apikey": SERVICE_KEY,
        "Authorization": "Bearer " + SERVICE_KEY,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    })
    try:
        with urllib.request.urlopen(req) as r:
            return r.status
    except urllib.error.HTTPError as e:
        sys.exit(f"Supabase {table} upsert failed: HTTP {e.code}\n{e.read().decode()[:400]}")


def main():
    rows, meta = compute()
    db_rows = [{
        "key": r["key"], "name": r["name"], "rank": r["rank"], "total": r["total"],
        "correct_score": r["bd"]["Correct Score"], "correct_outcome": r["bd"]["Correct Outcome"],
        "group_positions": r["bd"]["Group Positions"], "knockouts": r["bd"]["Knockouts"],
        "final_standings": r["bd"]["Final Standings"], "top_scorer": r["bd"]["Top Scorer"],
        "predicted_winner": r["predicted_winner"],
    } for r in rows]

    upsert("xl_leaderboard", db_rows, "key")
    upsert("xl_leaderboard_meta", [meta], "id")
    print(f"Pushed {len(db_rows)} participants to Supabase.")
    print(f"Leader: {rows[0]['name']} ({rows[0]['total']}) · "
          f"{meta['matches_played']} matches · max so far {meta['max_possible']}")


if __name__ == "__main__":
    main()
