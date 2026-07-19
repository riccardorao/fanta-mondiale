#!/usr/bin/env python3
"""
INDEPENDENT re-implementation of the FIFAWC2026 scoring engine, written from
scratch using ONLY the documented rules in README.md, without importing or
copying any function from generate_leaderboard.py. Used as a cross-check:
if this and the audited engine agree on every participant's total and every
category breakdown, that is strong evidence the engine is correct (a bug
would have to be replicated identically in two independently-written
implementations to survive this check).

Deliberately re-derives group standings, R32 seeding (incl. the Terze
third-place lookup), and full bracket progression from raw cells rather than
reusing generate_leaderboard.read_truth/compute_group_standings.
"""
import glob, os, sys
import openpyxl
from openpyxl.utils import column_index_from_string as ci

BASE = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE)
MODEL = os.path.join(PROJECT_ROOT, "data", "FIFAWC2026_Model.xlsx")
PRON = os.path.join(PROJECT_ROOT, "data", "Pronostici")

POINTS = {
    "score_per_team": 5, "outcome": 10, "position": 10,
    "r32_correct": 10, "r32_wrong": 5,
    "r16_correct": 20, "r16_wrong": 10,
    "qf_correct": 40, "qf_wrong": 20,
    "sf_correct": 80, "sf_wrong": 40,
    "final_correct": 100, "final_wrong": 60,
    "standing_1st": 150, "standing_2nd": 120, "standing_3rd": 80, "standing_4th": 60,
    "topscorer_player": 80, "topscorer_goals": 20,
}

GROUP_BASES = {g: r for g, r in zip("ABCDEFGHIJKL", [4, 11, 18, 25, 32, 39, 46, 53, 60, 67, 74, 81])}

TEAM_ALIASES = {
    "CAPE VERDE": "CAPE VERDE", "CABO VERDE": "CAPE VERDE", "CAPO VERDE": "CAPE VERDE",
    "CONGO DR": "CONGO DR", "DR CONGO": "CONGO DR", "DEMOCRATIC REPUBLIC OF CONGO": "CONGO DR",
    "BOSNIA": "BOSNIA", "BOSNIA HERZEGOVINA": "BOSNIA", "BOSNIA H.": "BOSNIA", "BOSNIA-HERZEGOVINA": "BOSNIA",
    "CURACAO": "CURACAO", "CURAÇAO": "CURACAO",
    "IVORY COAST": "IVORY COAST", "COTE D'IVOIRE": "IVORY COAST", "COTE DIVOIRE": "IVORY COAST",
    "SOUTH KOREA": "SOUTH KOREA", "KOREA SOUTH": "SOUTH KOREA", "KOREA REPUBLIC": "SOUTH KOREA",
    "CZECH REPUBLIC": "CZECHIA", "CZECHIA": "CZECHIA",
    "UNITED STATES": "USA", "UNITED STATES OF AMERICA": "USA", "USA": "USA",
}


def team(v):
    if v in (None, ""):
        return None
    s = str(v).strip().upper()
    return TEAM_ALIASES.get(s, s)


def scorer_key(v):
    """Independent top-scorer name matcher: uppercase, strip accents, drop a
    leading initial (e.g. 'C. '), then key on the surname (last token, ignoring
    'JR'/'JUNIOR'). Deliberately re-derived, not shared with the main engine's
    alias table, so agreement is a genuine cross-check. Returns '' for the
    unfilled template placeholder."""
    import unicodedata
    import re
    if v in (None, ""):
        return ""
    s = str(v).strip().upper()
    s = "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")
    s = re.sub(r"^[A-Z]\.\s+", "", s)
    s = re.sub(r"\s+", " ", s).strip()
    if s in ("PLAYER NAME", ""):
        return ""
    tokens = [t for t in s.split(" ") if t not in ("JR", "JUNIOR")]
    return tokens[-1] if tokens else ""


def is_num(v):
    if v in (None, ""):
        return False
    try:
        float(v)
        return True
    except (TypeError, ValueError):
        return False


def load_group_matches(ws):
    """Returns {group_letter: [(home, away, hs, as_), x6]} for all 12 groups."""
    out = {}
    for g, base in GROUP_BASES.items():
        rows = []
        for i in range(1, 7):
            r = base + i
            rows.append((team(ws.cell(r, ci("B")).value), team(ws.cell(r, ci("C")).value),
                         ws.cell(r, ci("D")).value, ws.cell(r, ci("E")).value))
        out[g] = rows
    return out


def standings_table(matches6):
    """Independent group-table computation: points, GD, GF, then head-to-head,
    then goals-scored-in-fixture-order as absolute last resort (documented
    limitation: real FIFA rules would use disciplinary points / lots here,
    not derivable from this sheet)."""
    teams = []
    for h, a, hs, as_ in matches6:
        if h and h not in teams:
            teams.append(h)
        if a and a not in teams:
            teams.append(a)

    tbl = {t: {"pts": 0, "gf": 0, "ga": 0} for t in teams}
    for h, a, hs, as_ in matches6:
        if not (h and a and is_num(hs) and is_num(as_)):
            continue
        hs, as_ = float(hs), float(as_)
        tbl[h]["gf"] += hs; tbl[h]["ga"] += as_
        tbl[a]["gf"] += as_; tbl[a]["ga"] += hs
        if hs > as_:
            tbl[h]["pts"] += 3
        elif hs < as_:
            tbl[a]["pts"] += 3
        else:
            tbl[h]["pts"] += 1; tbl[a]["pts"] += 1

    def gd(t):
        return tbl[t]["gf"] - tbl[t]["ga"]

    def h2h(t, cluster):
        pts = gfor = 0.0
        gagainst = 0.0
        for h, a, hs, as_ in matches6:
            if h not in cluster or a not in cluster or t not in (h, a) or not (is_num(hs) and is_num(as_)):
                continue
            hs, as_ = float(hs), float(as_)
            if h == t:
                gfor += hs; gagainst += as_
                pts += 3 if hs > as_ else (1 if hs == as_ else 0)
            else:
                gfor += as_; gagainst += hs
                pts += 3 if as_ > hs else (1 if hs == as_ else 0)
        return (pts, gfor - gagainst, gfor)

    primary = sorted(teams, key=lambda t: (tbl[t]["pts"], gd(t), tbl[t]["gf"]), reverse=True)
    ordered = []
    i = 0
    while i < len(primary):
        j = i
        key_i = (tbl[primary[i]]["pts"], gd(primary[i]), tbl[primary[i]]["gf"])
        while j + 1 < len(primary) and (tbl[primary[j+1]]["pts"], gd(primary[j+1]), tbl[primary[j+1]]["gf"]) == key_i:
            j += 1
        cluster = primary[i:j+1]
        if len(cluster) > 1:
            cset = set(cluster)
            cluster = sorted(cluster, key=lambda t: h2h(t, cset), reverse=True)
        ordered.extend(cluster)
        i = j + 1
    return ordered, tbl


def third_place_ranking(all_tables):
    """Rank the 12 third-placed teams across groups: points, GD, GF only
    (head-to-head does not apply -- these teams never played each other)."""
    entries = []
    for g in "ABCDEFGHIJKL":
        order, tbl = all_tables[g]
        if len(order) < 3:
            continue
        t3 = order[2]
        entries.append((g, t3, tbl[t3]["pts"], tbl[t3]["gf"] - tbl[t3]["ga"], tbl[t3]["gf"]))
    entries.sort(key=lambda x: (x[2], x[3], x[4]), reverse=True)
    return entries


def resolve_bracket(ws, wb):
    tables = {g: standings_table(load_group_matches(ws)[g]) for g in "ABCDEFGHIJKL"}
    group_matches = load_group_matches(ws)
    n_played = sum(1 for g in "ABCDEFGHIJKL" for h, a, hs, as_ in group_matches[g] if is_num(hs) and is_num(as_))
    group_stage_done = (n_played == 72)

    pos1 = {g: tables[g][0][0] for g in "ABCDEFGHIJKL"}  # 1st place per group
    pos2 = {g: tables[g][0][1] for g in "ABCDEFGHIJKL"}  # 2nd place per group

    slot_team = {}  # e.g. "1A" -> team, "3E" -> team
    for g in "ABCDEFGHIJKL":
        order, _ = tables[g]
        for idx, t in enumerate(order):
            slot_team[f"{idx+1}{g}"] = t

    third_slots = {}
    if group_stage_done:
        ranking = third_place_ranking(tables)
        top8_groups = sorted(g for g, t, p, gdv, gfv in ranking[:8])
        combo_key = "".join(top8_groups)
        terze = wb["Terze"]
        row_found = None
        for r in range(2, terze.max_row + 1):
            if terze.cell(r, 2).value == combo_key:
                row_found = r
                break
        if row_found:
            third_slots = {
                "1A": slot_team.get(terze.cell(row_found, 3).value),
                "1B": slot_team.get(terze.cell(row_found, 4).value),
                "1D": slot_team.get(terze.cell(row_found, 5).value),
                "1E": slot_team.get(terze.cell(row_found, 6).value),
                "1G": slot_team.get(terze.cell(row_found, 7).value),
                "1I": slot_team.get(terze.cell(row_found, 8).value),
                "1K": slot_team.get(terze.cell(row_found, 9).value),
                "1L": slot_team.get(terze.cell(row_found, 10).value),
            }

    R32_DIRECT = {5: "1E", 9: "1I", 13: "2A", 14: "2B", 17: "1F", 18: "2C", 21: "2K", 22: "2L",
                  25: "1H", 26: "2J", 29: "1D", 33: "1G", 37: "1C", 38: "2F", 41: "2E", 42: "2I",
                  45: "1A", 49: "1L", 53: "1J", 54: "2H", 57: "2D", 58: "2G", 61: "1B", 65: "1K"}
    R32_THIRD_SLOT = {6: "1E", 10: "1I", 30: "1D", 34: "1G", 46: "1A", 50: "1L", 62: "1B", 66: "1K"}

    r32 = {}
    if group_stage_done:
        for r, slot in R32_DIRECT.items():
            r32[r] = slot_team.get(slot)
        for r, key in R32_THIRD_SLOT.items():
            r32[r] = third_slots.get(key)

    def advance(pair_rows, ind_col, entrants):
        out = {}
        for h_r, a_r in pair_rows:
            ind = ws.cell(h_r, ind_col).value
            if is_num(ind):
                ind = int(ind)
                winner = entrants.get(h_r) if ind == 1 else entrants.get(a_r)
                out[h_r] = winner
        return out

    r16_pairs = [(5,6),(9,10),(13,14),(17,18),(21,22),(25,26),(29,30),(33,34),
                 (37,38),(41,42),(45,46),(49,50),(53,54),(57,58),(61,62),(65,66)]
    r32_ind = advance(r16_pairs, ci("L"), r32)  # winners keyed by h_r of each r32 pair
    # r16 slot rows (the *target* rows populated by each r32 pair's winner)
    R32_TO_R16_TARGET = {5: 7, 9: 8, 13: 15, 17: 16, 21: 23, 25: 24, 29: 31, 33: 32,
                         37: 39, 41: 40, 45: 47, 49: 48, 53: 55, 57: 56, 61: 63, 65: 64}
    r16 = {R32_TO_R16_TARGET[h_r]: w for h_r, w in r32_ind.items() if w}

    qf_pairs = [(7,8),(15,16),(23,24),(31,32),(39,40),(47,48),(55,56),(63,64)]
    r16_ind = advance(qf_pairs, ci("Q"), r16)
    R16_TO_QF_TARGET = {7: 11, 15: 12, 23: 27, 31: 28, 39: 43, 47: 44, 55: 59, 63: 60}
    qf = {R16_TO_QF_TARGET[h_r]: w for h_r, w in r16_ind.items() if w}

    sf_pairs = [(11,12),(27,28),(43,44),(59,60)]
    qf_ind = advance(sf_pairs, ci("V"), qf)
    QF_TO_SF_TARGET = {11: 19, 27: 20, 43: 51, 59: 52}
    sf = {QF_TO_SF_TARGET[h_r]: w for h_r, w in qf_ind.items() if w}

    final_pairs = [(19,20),(51,52)]
    sf_ind = advance(final_pairs, ci("AA"), sf)
    SF_TO_FINAL_TARGET = {19: 35, 51: 36}
    final_ = {SF_TO_FINAL_TARGET[h_r]: w for h_r, w in sf_ind.items() if w}

    # third-place contestants = the two SF losers
    third_place_teams = {}
    for h_r, a_r in final_pairs:
        ind = ws.cell(h_r, ci("AA")).value
        if is_num(ind):
            ind = int(ind)
            loser_row = a_r if ind == 1 else h_r
            third_place_teams[SF_TO_FINAL_TARGET[h_r]] = sf.get(loser_row)
    # remap to rows 43/44 for standings purposes (mirrors the real sheet's AF43/44 slots)
    tp_list = list(third_place_teams.values())
    third_place = {43: tp_list[0], 44: tp_list[1]} if len(tp_list) == 2 and all(tp_list) else {}

    standings = {}
    if 35 in final_ and 36 in final_:
        ind = ws.cell(35, ci("AF")).value
        if is_num(ind):
            ind = int(ind)
            standings[35] = final_[35] if ind == 1 else final_[36]
            standings[36] = final_[36] if ind == 1 else final_[35]
    if third_place:
        ind = ws.cell(43, ci("AF")).value
        if is_num(ind):
            ind = int(ind)
            standings[37] = third_place[43] if ind == 1 else third_place[44]
            standings[38] = third_place[44] if ind == 1 else third_place[43]

    positions = {}
    if group_stage_done:
        for g in "ABCDEFGHIJKL":
            base = GROUP_BASES[g]
            order, _ = tables[g]
            positions[g] = {base + i + 1: order[i] for i in range(4)}

    # Top-scorer truth: player name in AI44 (merge anchor), goals in AK44.
    ts_player_key = scorer_key(ws.cell(44, ci("AI")).value)
    ts_goals_raw = ws.cell(44, ci("AK")).value
    ts_goals = float(ts_goals_raw) if is_num(ts_goals_raw) else None

    return {
        "group_stage_done": group_stage_done,
        "n_played": n_played,
        "positions": positions,
        "ko": {"r32": r32, "r16": r16, "qf": qf, "sf": sf, "final": final_},
        "standings": standings,
        "topscorer_player_key": ts_player_key or None,
        "topscorer_goals": ts_goals,
        "tables": tables,
    }


def score_participant(path, truth, group_matches):
    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb["Bracket"] if "Bracket" in wb.sheetnames else wb.active
    bd = {"Correct Score": 0, "Correct Outcome": 0, "Group Positions": 0, "Knockouts": 0, "Final Standings": 0, "Top Scorer": 0}

    for g in "ABCDEFGHIJKL":
        base = GROUP_BASES[g]
        for i, (th, ta, ths, tas) in enumerate(group_matches[g]):
            if not (is_num(ths) and is_num(tas)):
                continue
            r = base + i + 1
            ph, pa = ws.cell(r, ci("D")).value, ws.cell(r, ci("E")).value
            if not (is_num(ph) and is_num(pa)):
                continue
            ph, pa, ths_f, tas_f = float(ph), float(pa), float(ths), float(tas)
            if ph == ths_f:
                bd["Correct Score"] += POINTS["score_per_team"]
            if pa == tas_f:
                bd["Correct Score"] += POINTS["score_per_team"]
            p_out = "H" if ph > pa else ("A" if ph < pa else "D")
            t_out = "H" if ths_f > tas_f else ("A" if ths_f < tas_f else "D")
            if p_out == t_out:
                bd["Correct Outcome"] += POINTS["outcome"]

    for g, slots in truth["positions"].items():
        for r, true_team in slots.items():
            if team(ws.cell(r, ci("G")).value) == true_team:
                bd["Group Positions"] += POINTS["position"]

    KO_COLS = {"r32": ci("K"), "r16": ci("P"), "qf": ci("U"), "sf": ci("Z"), "final": ci("AE")}
    for round_name, truth_slots in truth["ko"].items():
        if not truth_slots:
            continue
        col = KO_COLS[round_name]
        actual_teams = {t for t in truth_slots.values() if t}
        credited = set()
        for r, true_team in truth_slots.items():
            pred = team(ws.cell(r, col).value)
            if pred == true_team:
                bd["Knockouts"] += POINTS[f"{round_name}_correct"]
                credited.add(true_team)
        guessed = {team(ws.cell(r, col).value) for r in truth_slots} - {None}
        for t in guessed & actual_teams - credited:
            bd["Knockouts"] += POINTS[f"{round_name}_wrong"]

    for r, true_team in truth["standings"].items():
        pred = team(ws.cell(r, ci("AJ")).value)
        if pred == true_team:
            key = {35: "standing_1st", 36: "standing_2nd", 37: "standing_3rd", 38: "standing_4th"}[r]
            bd["Final Standings"] += POINTS[key]

    # Top scorer: predicted player in AI44, predicted goals in AK44.
    if truth.get("topscorer_player_key"):
        if scorer_key(ws.cell(44, ci("AI")).value) == truth["topscorer_player_key"]:
            bd["Top Scorer"] += POINTS["topscorer_player"]
    if truth.get("topscorer_goals") is not None:
        pg = ws.cell(44, ci("AK")).value
        if is_num(pg) and float(pg) == truth["topscorer_goals"]:
            bd["Top Scorer"] += POINTS["topscorer_goals"]

    total = sum(bd.values())
    return total, bd


def main():
    wbM = openpyxl.load_workbook(MODEL, data_only=True)
    wsM = wbM["Bracket"] if "Bracket" in wbM.sheetnames else wbM.active
    group_matches = load_group_matches(wsM)
    truth = resolve_bracket(wsM, wbM)

    print(f"group_stage_done={truth['group_stage_done']} n_played={truth['n_played']}")
    print("ko counts:", {k: len(v) for k, v in truth["ko"].items()})
    print("standings:", truth["standings"])

    results = {}
    for f in sorted(glob.glob(os.path.join(PRON, "FIFAWC2026_*.xlsx"))):
        name = os.path.basename(f).replace("FIFAWC2026_", "").replace(".xlsx", "")
        total, bd = score_participant(f, truth, group_matches)
        results[name] = {"total": total, "bd": bd}
    print(f"\nScored {len(results)} participants independently.")

    # Cross-check against the live engine (generate_leaderboard.py). This is
    # the actual regression check: if these two never diverge, a change to
    # either implementation alone can't silently corrupt the live leaderboard.
    sys.path.insert(0, BASE)
    import generate_leaderboard as gen
    rows, _ = gen.compute_leaderboard_data(gen.MODEL, gen.PRON)
    official = {r["key"]: {"total": r["total"], "bd": r["bd"]} for r in rows}

    if set(results) != set(official):
        print(f"\nFAIL: participant set differs. independent-only={set(results)-set(official)} "
              f"official-only={set(official)-set(results)}")
        sys.exit(1)

    mismatches = [k for k in results if results[k] != official[k]]
    print(f"\n{'Participant':<15}{'Independent':<14}{'Official':<12}{'Match?'}")
    for k in sorted(results):
        m = "OK" if k not in mismatches else "MISMATCH"
        print(f"{k:<15}{results[k]['total']:<14}{official[k]['total']:<12}{m}")

    if mismatches:
        print(f"\nFAIL: {len(mismatches)} participant(s) disagree between the independent "
              "reimplementation and the live engine:")
        for k in mismatches:
            print(f"  {k}: independent={results[k]}  official={official[k]}")
        sys.exit(1)

    print(f"\nPASS: all {len(results)} participants match exactly (total + full category "
          "breakdown) between this independent reimplementation and the live engine.")


if __name__ == "__main__":
    main()
