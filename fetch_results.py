#!/usr/bin/env python3
"""
fetch_results.py — Automatic FIFA WC 2026 result fetcher.

Pulls finished group-stage match scores from https://worldcup26.ir/get/games
(free, no API key required) and writes them into FIFAWC2026_Model.xlsx,
then calls generate_leaderboard.py and push_to_supabase.py.

Usage:
    python3 fetch_results.py                  # fetch + update Excel + push
    python3 fetch_results.py --dry-run        # fetch only, show what would change
    python3 fetch_results.py --no-push        # update Excel but skip Supabase push
    python3 fetch_results.py --ticker-only    # only update the ticker text in Supabase

Run this script after every match (or on a schedule via GitHub Actions / cron).
"""

import os, sys, json, urllib.request, urllib.error, argparse, datetime, subprocess

# ─── Paths ────────────────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DESKTOP = os.path.expanduser("~/Desktop/FIFAWC2026")
BASE = BASE_DESKTOP if os.path.exists(BASE_DESKTOP) else SCRIPT_DIR
MODEL = os.path.join(BASE, "FIFAWC2026_Model.xlsx")

# ─── API ──────────────────────────────────────────────────────────────────────
API_URL = "https://worldcup26.ir/get/games"

# ─── Team name mapping: API name (title-case) → Excel name (UPPER) ────────────
# worldcup26.ir uses English names; your Excel uses specific abbreviations.
TEAM_MAP = {
    # API name                  : Excel name
    "Mexico":                     "MEXICO",
    "South Africa":               "SOUTH AFRICA",
    "South Korea":                "SOUTH KOREA",
    "Czech Republic":             "CZECHIA",
    "Canada":                     "CANADA",
    "Bosnia and Herzegovina":     "BOSNIA H.",
    "Qatar":                      "QATAR",
    "Switzerland":                "SWITZERLAND",
    "Brazil":                     "BRAZIL",
    "Morocco":                    "MOROCCO",
    "Haiti":                      "HAITI",
    "Scotland":                   "SCOTLAND",
    "United States":              "USA",
    "Paraguay":                   "PARAGUAY",
    "Australia":                  "AUSTRALIA",
    "Turkey":                     "TURKEY",
    "Germany":                    "GERMANY",
    "Curaçao":                    "CURAÇAO",
    "Netherlands":                "NETHERLANDS",
    "Japan":                      "JAPAN",
    "Sweden":                     "SWEDEN",
    "Tunisia":                    "TUNISIA",
    "Iran":                       "IRAN",
    "New Zealand":                "NEW ZEALAND",
    "Belgium":                    "BELGIUM",
    "Egypt":                      "EGYPT",
    "Spain":                      "SPAIN",
    "Cape Verde":                 "CAPO VERDE",
    "Saudi Arabia":               "SAUDI ARABIA",
    "Uruguay":                    "URUGUAY",
    "France":                     "FRANCE",
    "Senegal":                    "SENEGAL",
    "Iraq":                       "IRAQ",
    "Norway":                     "NORWAY",
    "Argentina":                  "ARGENTINA",
    "Algeria":                    "ALGERIA",
    "Austria":                    "AUSTRIA",
    "Jordan":                     "JORDAN",
    "Ivory Coast":                "IVORY COAST",
    "Ecuador":                    "ECUADOR",
    "Portugal":                   "PORTUGAL",
    "Democratic Republic of the Congo": "DR CONGO",
    "Uzbekistan":                 "UZBEKISTAN",
    "Colombia":                   "COLOMBIA",
    "England":                    "ENGLAND",
    "Croatia":                    "CROATIA",
    "Ghana":                      "GHANA",
    "Panama":                     "PANAMA",
}

# ─── Excel group layout ────────────────────────────────────────────────────────
# Matches in your Model are laid out as: row B = home team, C = away team,
# D = home goals, E = away goals. Base rows per group:
GH = {g: r for g, r in zip("ABCDEFGHIJKL", [4, 11, 18, 25, 32, 39, 46, 53, 60, 67, 74, 81])}


def fetch_games():
    """Download all games from the free API. Returns parsed list."""
    print(f"[fetch] GET {API_URL} ...")
    try:
        req = urllib.request.Request(
            API_URL,
            headers={"User-Agent": "fantamondiale-bot/1.0"},
        )
        with urllib.request.urlopen(req, timeout=15) as r:
            data = json.loads(r.read().decode())
    except urllib.error.URLError as e:
        sys.exit(f"[fetch] ERROR: Could not reach API: {e}")
    games = data.get("games", [])
    print(f"[fetch] Got {len(games)} games from API.")
    return games


def filter_finished_group(games):
    """Return only finished group-stage matches with valid scores."""
    finished = []
    for g in games:
        if g.get("type") != "group":
            continue
        if g.get("finished", "").upper() != "TRUE":
            continue
        try:
            hs = int(g["home_score"])
            as_ = int(g["away_score"])
        except (KeyError, ValueError, TypeError):
            continue
        home_api = g.get("home_team_name_en", "")
        away_api = g.get("away_team_name_en", "")
        home_xl = TEAM_MAP.get(home_api)
        away_xl = TEAM_MAP.get(away_api)
        if not home_xl or not away_xl:
            print(f"  [WARN] Unknown team name: '{home_api}' or '{away_api}' — skipping match {g['id']}")
            continue
        finished.append({
            "id": g["id"],
            "group": g.get("group", "?"),
            "home": home_xl,
            "away": away_xl,
            "home_score": hs,
            "away_score": as_,
        })
    return finished


def build_excel_match_index(ws):
    """
    Returns a dict: (home_team_upper, away_team_upper) → row_number
    for all group stage rows in the Model.
    """
    from openpyxl.utils import column_index_from_string as ci
    index = {}
    for g, base in GH.items():
        for i in range(1, 7):
            r = base + i
            home = ws.cell(r, ci("B")).value
            away = ws.cell(r, ci("C")).value
            if home and away:
                index[(str(home).strip().upper(), str(away).strip().upper())] = r
    return index


def update_excel(finished_games, dry_run=False):
    """Write scores into the Model Excel. Returns (updated_count, results_strings)."""
    import openpyxl
    from openpyxl.utils import column_index_from_string as ci

    if not os.path.exists(MODEL):
        sys.exit(f"[excel] ERROR: Model not found at {MODEL}")

    wb = openpyxl.load_workbook(MODEL)
    ws = wb["Bracket"] if "Bracket" in wb.sheetnames else wb.active

    match_index = build_excel_match_index(ws)

    updated = 0
    skipped = 0
    result_strings = []  # e.g. "FRA 3-1 SEN"

    for m in finished_games:
        key = (m["home"], m["away"])
        row = match_index.get(key)
        if row is None:
            print(f"  [WARN] Match not found in Excel: {m['home']} vs {m['away']}")
            skipped += 1
            continue

        current_home = ws.cell(row, ci("D")).value
        current_away = ws.cell(row, ci("E")).value

        if current_home == m["home_score"] and current_away == m["away_score"]:
            # Already correct — don't overwrite
            result_strings.append(f"{m['home'][:3]} {m['home_score']}-{m['away_score']} {m['away'][:3]}")
            continue

        if dry_run:
            print(f"  [DRY-RUN] Would set row {row}: {m['home']} {m['home_score']}-{m['away_score']} {m['away']}")
        else:
            ws.cell(row, ci("D")).value = m["home_score"]
            ws.cell(row, ci("E")).value = m["away_score"]
            print(f"  [excel] Updated row {row}: {m['home']} {m['home_score']}-{m['away_score']} {m['away']}")

        result_strings.append(f"{m['home'][:3]} {m['home_score']}-{m['away_score']} {m['away'][:3]}")
        updated += 1

    if not dry_run and updated > 0:
        wb.save(MODEL)
        print(f"[excel] Saved {MODEL} ({updated} match(es) updated, {skipped} skipped).")
    elif dry_run:
        print(f"[dry-run] Would update {updated} match(es), skip {skipped}.")
    else:
        print(f"[excel] No new results to write ({skipped} skipped).")

    return updated, result_strings


def build_ticker_text(result_strings):
    """Build a ticker string like: RECENT RESULTS // FRA 3-1 SEN // NOR 4-1 IRQ"""
    if not result_strings:
        return ""
    return " ★ RECENT RESULTS ★ " + " // ".join(result_strings) + " ★ "


def push_ticker_to_supabase(ticker_text):
    """Update ticker_text in xl_leaderboard_meta row 1 via Supabase REST."""
    from dotenv import load_dotenv
    load_dotenv()

    url_base = os.environ.get("SUPABASE_URL", "https://ecqieaselexhcqkwbtcy.supabase.co").rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not key:
        print("[ticker] Skipping ticker update: SUPABASE_SERVICE_KEY not set.")
        return

    url = f"{url_base}/rest/v1/xl_leaderboard_meta?id=eq.1"
    body = json.dumps({"ticker_text": ticker_text}).encode()
    req = urllib.request.Request(url, data=body, method="PATCH", headers={
        "apikey": key,
        "Authorization": "Bearer " + key,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    })
    try:
        with urllib.request.urlopen(req) as r:
            print(f"[ticker] Updated Supabase ticker: {r.status}")
    except urllib.error.HTTPError as e:
        print(f"[ticker] ERROR updating ticker: HTTP {e.code}: {e.read().decode()[:200]}")


def run_subprocess(script_name):
    """Run a sibling Python script."""
    script = os.path.join(SCRIPT_DIR, script_name)
    print(f"\n[run] python3 {script_name}")
    result = subprocess.run(
        [sys.executable, script],
        cwd=SCRIPT_DIR,
        capture_output=False,
    )
    if result.returncode != 0:
        print(f"[run] WARNING: {script_name} exited with code {result.returncode}")
    return result.returncode


def main():
    parser = argparse.ArgumentParser(description="Fetch FIFA WC2026 results and update leaderboard.")
    parser.add_argument("--dry-run", action="store_true", help="Show what would change without writing")
    parser.add_argument("--no-push", action="store_true", help="Update Excel but skip push_to_supabase")
    parser.add_argument("--ticker-only", action="store_true", help="Only update ticker text in Supabase (no Excel write)")
    args = parser.parse_args()

    print(f"\n{'='*60}")
    print(f"  FANTAMONDIALE — Auto Result Fetcher")
    print(f"  {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}\n")

    # 1. Fetch from API
    games = fetch_games()
    finished = filter_finished_group(games)
    print(f"[fetch] {len(finished)} finished group-stage matches found.\n")

    if not finished:
        print("[fetch] Nothing to do.")
        return

    if args.ticker_only:
        # Just build the ticker from API data and push it
        result_strings = [
            f"{m['home'][:3]} {m['home_score']}-{m['away_score']} {m['away'][:3]}"
            for m in finished[-10:]  # last 10 results
        ]
        ticker = build_ticker_text(result_strings)
        print(f"[ticker] {ticker}")
        push_ticker_to_supabase(ticker)
        return

    # 2. Update Excel
    updated, result_strings = update_excel(finished, dry_run=args.dry_run)

    if args.dry_run:
        print("\n[dry-run] Done. No files written.")
        return

    # 3. Update ticker in Supabase (even if 0 new — keeps it fresh)
    if result_strings and not args.no_push:
        ticker = build_ticker_text(result_strings[-10:])  # last 10
        print(f"\n[ticker] {ticker}")
        push_ticker_to_supabase(ticker)

    # 4. Regenerate leaderboard + push
    if not args.no_push:
        run_subprocess("push_to_supabase.py")
    else:
        print("\n[skip] Skipping push_to_supabase.py (--no-push)")

    print("\n[done] All updates complete.")


if __name__ == "__main__":
    main()
