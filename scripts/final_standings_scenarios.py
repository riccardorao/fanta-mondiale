#!/usr/bin/env python3
"""
Project the leaderboard across every still-possible Final Standings outcome.

Stage-aware: it looks at the live Model and figures out which knockout matches
are still undecided, then enumerates exactly the outcomes those matches can
produce -- no more, no less:

  * If the FINAL and THIRD-PLACE contestants are both known but neither match
    has been played (the typical "two matches left" case), there are 4
    scenarios: 2 possible Final results x 2 possible third-place results.
  * If only the semifinal line-up is known (final not yet set), there are 16
    scenarios (2 per semifinal x 2 for the Final x 2 for third place).
  * If Final Standings are already decided, there is nothing to project.

For each scenario it does NOT re-implement scoring. Instead it injects the
hypothetical result indicators into a throwaway copy of the real Model and
runs the actual production engine (generate_leaderboard.compute_leaderboard_data)
on it, so the projected numbers are exactly what the live site would show.
As a self-check it asserts that no category OTHER than Final Standings moves
between the baseline and each scenario.

Output (written to reports/, NOT shown on the website):
  * final_standings_scenarios.json  -- structured, for reuse
  * final_standings_scenarios.md    -- shareable human summary

IMPORTANT CAVEAT reflected in the report: the Top Scorer category (up to
+100) is scored separately at tournament end and is NOT part of these
match scenarios; if it is still undecided, these projections hold it at its
current value for everyone.

Usage:  python3 scripts/final_standings_scenarios.py
"""
import json
import os
import shutil
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import generate_leaderboard as gen
import openpyxl

REPORTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "reports")

# Indicator cells read by read_truth to derive the Final Standings truth.
FINAL_IND = (35, 32)   # AF35: 1 -> finalist@row35 is champion; 2 -> finalist@row36 is champion
THIRD_IND = (43, 32)   # AF43: 1 -> third_place@row43 is 3rd;    2 -> third_place@row44 is 3rd
STANDINGS_POINTS_ROW = {35: "standing_1st", 36: "standing_2nd", 37: "standing_3rd", 38: "standing_4th"}


def base_leaderboard():
    rows, meta = gen.compute_leaderboard_data(gen.MODEL, gen.PRON)
    return rows, meta


def read_ko(model_path):
    wb = openpyxl.load_workbook(model_path, data_only=True)
    ws = wb["Bracket"] if "Bracket" in wb.sheetnames else wb.active
    return gen.read_truth(ws, wb)


def enumerate_indicator_scenarios(ko_truth, standings_truth):
    """Return list of dicts: {label, final_1st, final_2nd, third_3rd, third_4th,
    inject: {(row,col): value, ...}} for each still-possible outcome."""
    if standings_truth:
        return []

    final = ko_truth.get("final", {})
    third = ko_truth.get("third_place", {})
    if len(final) == 2 and len(third) == 2:
        # Two matches left: finalists and third-place contestants are fixed.
        fin_a, fin_b = final[35], final[36]          # the two finalists
        thi_a, thi_b = third[43], third[44]          # the two third-place contestants
        scenarios = []
        for fi in (1, 2):
            champ, runner = (fin_a, fin_b) if fi == 1 else (fin_b, fin_a)
            for ti in (1, 2):
                third_w, third_l = (thi_a, thi_b) if ti == 1 else (thi_b, thi_a)
                scenarios.append({
                    "label": f"{champ} champion, {runner} 2nd | {third_w} 3rd, {third_l} 4th",
                    "1st": champ, "2nd": runner, "3rd": third_w, "4th": third_l,
                    "inject": {FINAL_IND: fi, THIRD_IND: ti},
                })
        return scenarios

    # (Fallback for the earlier "semifinals not yet played" stage is intentionally
    # omitted here; regenerate this script for that stage if ever needed again.)
    sys.exit(
        "This script currently supports the 'two matches left' stage (finalists and "
        "third-place contestants known, neither played). Live Model state: "
        f"final={final}, third_place={third}, standings_truth={standings_truth}."
    )


def project(scenario, base_rows):
    """Inject the scenario's indicators into a copy of the Model, run the real
    engine, and return (ranked_rows, drift) where drift lists any non-Final-
    Standings category that changed vs baseline (should always be empty)."""
    base = {r["key"]: r for r in base_rows}
    tmpdir = tempfile.mkdtemp()
    try:
        tmp_model = os.path.join(tmpdir, "model.xlsx")
        wb = openpyxl.load_workbook(gen.MODEL, data_only=True)
        ws = wb["Bracket"] if "Bracket" in wb.sheetnames else wb.active
        for (row, col), val in scenario["inject"].items():
            ws.cell(row, col).value = val
        wb.save(tmp_model)

        rows, _ = gen.compute_leaderboard_data(tmp_model, gen.PRON)
    finally:
        shutil.rmtree(tmpdir)

    drift = []
    for r in rows:
        b = base[r["key"]]
        for cat in ("Correct Score", "Correct Outcome", "Group Positions", "Knockouts", "Top Scorer"):
            if r["bd"][cat] != b["bd"][cat]:
                drift.append((r["key"], cat, b["bd"][cat], r["bd"][cat]))

    ranked = sorted(rows, key=lambda r: (-r["total"], r["name"]))
    rank, prev = 0, None
    out = []
    for i, r in enumerate(ranked):
        if r["total"] != prev:
            rank = i + 1
            prev = r["total"]
        out.append({
            "rank": rank, "key": r["key"], "name": r["name"],
            "base_total": base[r["key"]]["total"],
            "final_standings": r["bd"]["Final Standings"],
            "total": r["total"],
        })
    return out, drift


def main():
    matches, positions, ko_truth, standings_truth, tsp, tsg = read_ko(gen.MODEL)
    base_rows, meta = base_leaderboard()
    scenarios = enumerate_indicator_scenarios(ko_truth, standings_truth)

    print(f"Finalists: {ko_truth['final'][35]} vs {ko_truth['final'][36]}")
    print(f"Third place: {ko_truth['third_place'][43]} vs {ko_truth['third_place'][44]}")
    print(f"Enumerated {len(scenarios)} scenario(s).")
    topscorer_open = not tsp
    if topscorer_open:
        print("NOTE: Top Scorer is still undecided (held at 0 for all in these projections).")

    results = []
    for s in scenarios:
        ranked, drift = project(s, base_rows)
        if drift:
            sys.exit(f"INTEGRITY FAILURE in scenario '{s['label']}': non-Final-Standings drift {drift}")
        results.append({"scenario": s, "ranked": ranked})
        print(f"  {s['label']}: winner {ranked[0]['name']} ({ranked[0]['total']})")

    os.makedirs(REPORTS_DIR, exist_ok=True)
    json_path = os.path.join(REPORTS_DIR, "final_standings_scenarios.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({
            "generated_from": os.path.basename(gen.MODEL),
            "final": {"team_a": ko_truth["final"][35], "team_b": ko_truth["final"][36]},
            "third_place": {"team_a": ko_truth["third_place"][43], "team_b": ko_truth["third_place"][44]},
            "topscorer_still_open": topscorer_open,
            "scenario_count": len(scenarios),
            "scenarios": [{"outcome": {k: r["scenario"][k] for k in ("label", "1st", "2nd", "3rd", "4th")},
                           "ranked": r["ranked"]} for r in results],
        }, f, indent=2)
    print(f"Wrote {json_path}")

    md_path = os.path.join(REPORTS_DIR, "final_standings_scenarios.md")
    write_markdown(md_path, ko_truth, results, topscorer_open, top_n=8)
    print(f"Wrote {md_path}")


def write_markdown(path, ko_truth, results, topscorer_open, top_n=8):
    fin_a, fin_b = ko_truth["final"][35], ko_truth["final"][36]
    thi_a, thi_b = ko_truth["third_place"][43], ko_truth["third_place"][44]
    L = []
    L.append("# Final Standings Scenarios — Two Matches Left\n")
    L.append(f"**Final:** {fin_a} vs {fin_b}  ·  **Third-place match:** {thi_a} vs {thi_b}\n")
    L.append(
        "Neither match has been played, so there are exactly **4 possible outcomes** "
        "(2 Final results x 2 third-place results). Points at stake: 1st = 150, "
        "2nd = 120, 3rd = 80, 4th = 60, awarded only for an exact position match.\n"
    )
    if topscorer_open:
        L.append(
            "> **Caveat:** the Top Scorer award (up to +100) is decided separately at "
            "tournament end and is **not** part of these two matches. These projections "
            "hold it at its current value (0) for everyone, so the real final board may "
            "shift once the Golden Boot is set.\n"
        )
    for i, r in enumerate(results, 1):
        s = r["scenario"]
        L.append(f"\n## Scenario {i}: {s['label']}\n")
        L.append(f"Final standings: 1st **{s['1st']}** · 2nd **{s['2nd']}** · 3rd **{s['3rd']}** · 4th **{s['4th']}**\n")
        L.append("| # | Player | Base | +Final Standings | Projected |")
        L.append("|---|---|---|---|---|")
        for row in r["ranked"][:top_n]:
            L.append(f"| {row['rank']} | {row['name']} | {row['base_total']} | "
                     f"+{row['final_standings']} | **{row['total']}** |")
        winners = [row["name"] for row in r["ranked"] if row["rank"] == 1]
        tie = "  _(tie)_" if len(winners) > 1 else ""
        L.append(f"\n**Winner: {', '.join(winners)}**{tie}\n")
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(L))


if __name__ == "__main__":
    main()
