#!/usr/bin/env python3
"""
FIFAWC2026 — automated leaderboard generator.

Reads OFFICIAL results from FIFAWC2026_Model.xlsx (truth) and every participant
file in Pronostici/, scores them, and writes a single self-contained, beautiful
HTML leaderboard (FIFAWC2026_Leaderboard.html) you can share directly.

Run:  python3 generate_leaderboard.py
Re-run any time after updating results in the Model — the HTML regenerates.

SCORING (per the agreed rules):
  GROUP STAGE (per played match, i.e. both goals present in the Model):
    - Correct Score : +5 for EACH team whose exact goals match (perfect = 10)
    - Correct 1X2   : +10 if the result sign matches (independent, stacks)
  GROUP POSITIONS: +10 per correct final-table slot, ONLY once ALL 72
    group-stage matches have been played (gated tournament-wide, not
    per-group) and that group's standings are fully entered (col G).
  KNOCKOUTS / FINAL STANDINGS / TOP SCORER: auto-activate when their truth
    cells are populated in the Model (gated; 0 until then).
"""
import os, glob, json, datetime
import openpyxl
from openpyxl.utils import column_index_from_string as ci

# Paths — relative to this script's directory (so you can run from anywhere)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.expanduser("~/Desktop/FIFAWC2026")  # or set to SCRIPT_DIR for repo-based
MODEL = os.path.join(BASE, "FIFAWC2026_Model.xlsx")
PRON = os.path.join(BASE, "Pronostici")
OUT = os.path.join(BASE, "FIFAWC2026_Leaderboard.html")

# -------------------------------------------------------------- POINTS (edit) --
POINTS = {
    "score_per_team": 5, "outcome": 10, "position": 10,
    "r32_correct": 10, "r32_wrong": 5,
    "r16_correct": 15, "r16_wrong": 10,
    "qf_correct": 30,  "qf_wrong": 15,
    "sf_correct": 60,  "sf_wrong": 25,
    "final_correct": 90, "final_wrong": 40,
    "standing_1st": 100, "standing_2nd": 60, "standing_3rd": 40, "standing_4th": 20,
    "topscorer_player": 80, "topscorer_goals": 20,
}

# Map the file surname -> full "Name Surname" shown on the leaderboard.
# Fill these in; any surname left out falls back to just the surname.
# (RaoR = Riccardo Rao / RaoT = Tommaso Rao were disambiguated earlier.)
FULL_NAMES = {
    "Antonini": "Stefano Antonini",
    "Bechelli": "Lorenzo Bechelli",
    "Bonaffini": "Edoardo Bonaffini",                 # first name unknown
    "Bose": "Shatanik Bose",
    "Cairoli": "Alessandro Cairoli",
    "Capriotti": "Alessandro Capriotti",
    "Castelli": "Giovanni Castelli",
    "Cernotto": "Giovanni Cernotto",
    "DAmbra": "Francesco D'Ambra",
    "Lima": "Mayara Lima",                           # first name unknown
    "Marchini": "Saverio Marchini",
    "Martinoli": "Francesco Martinoli",
    "Mastrorilli": "Marco Mastrorilli",
    "Parravicini": "Pierpaolo Parravicini",
    "Piergallini": "Eugenio Piergallini",             # first name unknown
    "Polletta": "Matteo Polletta",
    "Priandi": "Bobby Priandi",
    "RaoR": "Riccardo Rao",
    "RaoT": "Tommaso Rao",
    "Redaelli": "Daniele Redaelli",
    "Reuters": "Franziska Reuter",
    "Rigoni": "Alessandro Rigoni",
    "Rola": "Davide Rola",
    "Roncaglia": "Gianluca Roncaglia",
    "Rotellini": "Giorgio Rotellini",                 # first name unknown
    "Silecchia": "Ambrogio Silecchia",
    "Staderini": "Lorenzo Staderini",
    "Stampone": "Valentino Stampone",
    "Trabona": "Tommaso Trabona",
}

GH = {g: r for g, r in zip("ABCDEFGHIJKL", [4, 11, 18, 25, 32, 39, 46, 53, 60, 67, 74, 81])}

# ---- Tournament structure (2026: 48 teams, 12 groups of 4) ----
N_GROUPS = 12
GROUP_MATCHES_TOTAL = 72          # 12 groups x C(4,2)=6
KO_SLOTS = {"r32": 32, "r16": 16, "qf": 8, "sf": 4, "final": 2}  # teams reaching each round


def tournament_max(P):
    """Maximum points achievable across the WHOLE tournament (best case)."""
    group = (GROUP_MATCHES_TOTAL * 2 * P["score_per_team"]      # 720  per-team exact
             + GROUP_MATCHES_TOTAL * P["outcome"]               # 720  outcome
             + N_GROUPS * 4 * P["position"])                    # 480  positions
    ko = (KO_SLOTS["r32"] * P["r32_correct"] + KO_SLOTS["r16"] * P["r16_correct"]
          + KO_SLOTS["qf"] * P["qf_correct"] + KO_SLOTS["sf"] * P["sf_correct"]
          + KO_SLOTS["final"] * P["final_correct"])             # 1220
    standings = P["standing_1st"] + P["standing_2nd"] + P["standing_3rd"] + P["standing_4th"]  # 220
    topscorer = P["topscorer_player"] + P["topscorer_goals"]    # 100
    return group + ko + standings + topscorer                  # 3460 with defaults


def norm(v):
    return str(v).strip().upper() if v not in (None, "") else None


def outcome(h, a):
    if h is None or a is None:
        return None
    try:
        h = float(h); a = float(a)
    except (TypeError, ValueError):
        return None
    return "H" if h > a else ("A" if h < a else "D")


def is_num(v):
    if v is None or v == "":
        return False
    try:
        float(v); return True
    except (TypeError, ValueError):
        return False


def read_truth(ws):
    """Returns truth dict: played matches, completed group standings."""
    matches = []       # (row, gh, ga, outcome)
    raw_positions = {} # group -> {row: team}  (only if all 4 slots present)
    for g, base in GH.items():
        for i in range(1, 7):
            r = base + i
            d, e = ws.cell(r, ci("D")).value, ws.cell(r, ci("E")).value
            if is_num(d) and is_num(e):
                matches.append((r, float(d), float(e), outcome(d, e)))
        slots = {}
        for i in range(1, 5):
            r = base + i
            t = norm(ws.cell(r, ci("G")).value)
            if t:
                slots[r] = t
        if len(slots) == 4:          # group standings finalised
            raw_positions[g] = slots
    # Group positions only count once the ENTIRE group stage is played —
    # partial standings (predicted, not yet locked in) don't score early.
    group_stage_complete = len(matches) == GROUP_MATCHES_TOTAL
    positions = raw_positions if group_stage_complete else {}
    return matches, positions


def score_file(path, matches, positions):
    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb["Bracket"] if "Bracket" in wb.sheetnames else wb.active
    bd = {"Correct Score": 0, "Correct Outcome": 0, "Group Positions": 0,
          "Knockouts": 0, "Final Standings": 0, "Top Scorer": 0}
    # group scores + outcome
    for (r, gh, ga, gout) in matches:
        ph, pa = ws.cell(r, ci("D")).value, ws.cell(r, ci("E")).value
        if not (is_num(ph) and is_num(pa)):
            continue
        ph, pa = float(ph), float(pa)
        if ph == gh:
            bd["Correct Score"] += POINTS["score_per_team"]
        if pa == ga:
            bd["Correct Score"] += POINTS["score_per_team"]
        if outcome(ph, pa) == gout:
            bd["Correct Outcome"] += POINTS["outcome"]
    # group positions (only completed groups)
    for g, slots in positions.items():
        for r, true_team in slots.items():
            if norm(ws.cell(r, ci("G")).value) == true_team:
                bd["Group Positions"] += POINTS["position"]
    total = sum(bd.values())
    return total, bd


def main():
    wbM = openpyxl.load_workbook(MODEL, data_only=True)
    wsM = wbM["Bracket"]
    matches, positions = read_truth(wsM)

    rows = []
    for f in sorted(glob.glob(os.path.join(PRON, "FIFAWC2026_*.xlsx"))):
        name = os.path.basename(f).replace("FIFAWC2026_", "").replace(".xlsx", "")
        display = FULL_NAMES.get(name, name)
        try:
            total, bd = score_file(f, matches, positions)
            rows.append({"name": display, "key": name, "total": total, "bd": bd})
        except Exception as ex:
            rows.append({"name": display, "key": name, "total": -1, "bd": {}, "error": str(ex)})

    # ---- maximum points ANYONE could have earned up to the current round ----
    # Each played group match: max = 2*score_per_team (perfect score) + outcome.
    max_possible = len(matches) * (2 * POINTS["score_per_team"] + POINTS["outcome"])
    # Completed-group standings: 4 slots * position points per finalised group.
    max_possible += len(positions) * 4 * POINTS["position"]
    # (knockouts/standings/top-scorer add here automatically once activated)
    max_possible = max(max_possible, 1)

    rows.sort(key=lambda x: -x["total"])
    # dense ranking
    rank = 0; prev = None
    for i, r in enumerate(rows):
        if r["total"] != prev:
            rank = i + 1; prev = r["total"]
        r["rank"] = rank

    meta = {
        "generated": datetime.datetime.now().strftime("%d %b %Y, %H:%M"),
        "matches_played": len(matches),
        "groups_complete": len(positions),
        "participants": len(rows),
        "max_total": max((r["total"] for r in rows), default=0) or 1,
        "max_possible": max_possible,
        "tournament_max": tournament_max(POINTS),
    }
    html = render_html(rows, meta)
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write(html)
    print("Wrote", OUT)
    print(f"{meta['participants']} participants, {meta['matches_played']} matches scored")
    for r in rows[:5]:
        print(f"  #{r['rank']:<2} {r['name']:<14} {r['total']}")


# ----------------------------------------------------------------- HTML render -
def render_html(rows, meta):
    data_json = json.dumps(rows)
    meta_json = json.dumps(meta)
    cats = ["Correct Score", "Correct Outcome", "Group Positions",
            "Knockouts", "Final Standings", "Top Scorer"]
    cats_json = json.dumps(cats)
    return TEMPLATE.replace("__DATA__", data_json)\
                   .replace("__META__", meta_json)\
                   .replace("__CATS__", cats_json)


TEMPLATE = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>FIFA WC 2026 · Fantamondiale Leaderboard</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Inter:wght@400;500;600;700;800;900&display=swap');
  :root{
    --bg:#0a4d2f;
    --accent:#00ff00;
    --txt:#ffffff;
    --dim:#a8d5ba;
    --border:#00ff00;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  html{background:#000}
  body{
    font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
    background:linear-gradient(135deg,var(--bg) 0%,#0d5f39 100%);
    color:var(--txt);min-height:100vh;padding:40px 20px 60px;
  }
  .wrap{max-width:1100px;margin:0 auto}
  header{text-align:center;margin-bottom:40px;position:relative}
  h1{font-family:'Press Start 2P',monospace;font-size:clamp(28px,6vw,52px);line-height:1.1;
    color:var(--accent);letter-spacing:3px;font-weight:900;
    text-shadow:0 0 20px var(--accent),2px 2px 0 #000;margin-bottom:12px}
  .sub{display:none}
  .stats{display:none}
  .podium{display:flex;gap:24px;justify-content:center;align-items:flex-end;margin:50px 0 40px;flex-wrap:wrap}
  .pod{flex:1;min-width:180px;max-width:240px;padding:24px 20px;text-align:center;
    border:2px solid var(--border);background:rgba(10,77,47,0.6);backdrop-filter:blur(8px);
    border-radius:8px;transform:translateY(30px);opacity:0;animation:rise .7s ease-out forwards}
  .pod .medal{font-size:44px;margin-bottom:8px}
  .pod .pname{font-weight:700;font-size:14px;margin:8px 0;color:var(--dim);letter-spacing:0.5px}
  .pod .ppts{font-family:'Press Start 2P',monospace;font-size:32px;letter-spacing:2px;font-weight:900;margin:12px 0;color:var(--accent);text-shadow:0 0 10px var(--accent)}
  .pod .plabel{display:none}
  @keyframes rise{to{transform:translateY(0);opacity:1}}
  .board{display:flex;flex-direction:column;gap:12px;margin-top:12px}
  .row{background:rgba(10,77,47,0.4);border:2px solid var(--border);border-radius:8px;overflow:hidden;
    opacity:0;transform:translateY(12px);animation:fade .5s ease-out forwards;transition:background .2s}
  .row:hover{background:rgba(10,77,47,0.6)}
  @keyframes fade{to{opacity:1;transform:none}}
  .rmain{display:grid;grid-template-columns:48px 1fr auto 36px;align-items:center;gap:16px;padding:16px 20px;cursor:pointer;transition:background .2s}
  .rank{font-family:'Press Start 2P',monospace;font-size:16px;font-weight:900;color:var(--accent);text-align:center;text-shadow:0 0 8px var(--accent)}
  .who{font-weight:600;font-size:15px;color:var(--txt)}
  .barwrap{height:14px;background:rgba(0,0,0,0.4);border:1px solid var(--border);border-radius:4px;margin-top:8px;overflow:hidden;width:min(500px,48vw)}
  .bar{height:100%;width:0;transition:width 1.2s cubic-bezier(.25,.8,.25,1);box-shadow:0 0 12px currentColor}
  .pts{font-family:'Press Start 2P',monospace;font-size:16px;font-weight:900;text-align:right;color:var(--accent);text-shadow:0 0 8px var(--accent)}
  .chev{color:var(--accent);transition:transform .25s;text-align:center;font-weight:700;font-size:12px;opacity:0.7}
  .row.open .chev{transform:rotate(180deg)}
  .detail{max-height:0;overflow:hidden;transition:max-height .35s ease}
  .row.open .detail{max-height:400px}
  .cats{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;padding:20px;background:rgba(0,0,0,0.3);border-top:2px solid var(--border)}
  @media (min-width:700px){
    .cats{grid-template-columns:repeat(6,1fr)}
  }
  .cat{background:rgba(10,77,47,0.5);border:1px solid var(--border);border-radius:6px;padding:14px;text-align:center;transition:background .2s}
  .cat:hover{background:rgba(10,77,47,0.8)}
  .cat .cl{font-size:9px;color:var(--dim);text-transform:uppercase;letter-spacing:1px;font-weight:600;margin-bottom:6px;display:block}
  .cat .cv{font-family:'Press Start 2P',monospace;font-size:16px;color:var(--accent);font-weight:900;text-shadow:0 0 6px var(--accent)}
  .cat.zero{opacity:.3}
  .ctx{padding:12px 20px;font-size:11px;color:var(--dim);background:rgba(0,0,0,0.3);border-top:1px solid var(--border);letter-spacing:0.3px}
  footer{text-align:center;color:var(--dim);font-size:11px;margin-top:40px;line-height:1.6;letter-spacing:0.5px;font-weight:500}
  @media (max-width:699px){
    .podium{flex-direction:column;align-items:stretch;gap:16px}
    .pod{max-width:100%}
  }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <h1>LEADERBOARD</h1>
    <div class="sub" id="sub"></div>
    <div class="stats" id="stats"></div>
  </header>

  <div class="podium" id="podium"></div>
  <div class="board" id="board"></div>

  <footer id="foot"></footer>
</div>

<script>
const DATA = __DATA__;
const META = __META__;
const CATS = __CATS__;
const maxT = Math.max(1, META.max_possible || 1);

document.getElementById('foot').innerHTML = `LIVE · UPDATED ${META.generated} · ${META.participants||0} PLAYERS`;

const podEl = document.getElementById('podium');
const medal=['🥇','🥈','🥉'];
podEl.innerHTML='';
DATA.slice(0,3).forEach((d,i)=>{
  const el=document.createElement('div'); el.className='pod';
  el.innerHTML=`<div class="medal">${medal[i]}</div><div class="pname">${d.name}</div><div class="ppts">${d.total}</div>`;
  podEl.appendChild(el);
});

const board=document.getElementById('board');
function build(list){
  board.innerHTML='';
  const maxScore = Math.max(...list.map(x => x.total || 0), 1);
  list.forEach((d,idx)=>{
    const row=document.createElement('div'); row.className='row'; row.style.animationDelay=(idx*0.03)+'s';
    const pctN = Math.round(100*d.total/maxT);
    const pctScore = d.total / maxScore;
    const hue = Math.round(120 * pctScore);
    const barColor = `hsl(${hue}, 100%, 50%)`;
    const cats=CATS.map(([k,label])=>{
      const v=d[k]||0;
      return `<div class="cat ${v===0?'zero':''}"><span class="cl">${label}</span><div class="cv">${v}</div></div>`;
    }).join('');
    row.innerHTML=`
      <div class="rmain">
        <div class="rank">${d.rank}</div>
        <div><div class="who">${d.name}</div>
          <div class="barwrap"><div class="bar" style="background:${barColor}" data-w="${pctN}"></div></div></div>
        <div class="pts">${d.total}</div>
        <div class="chev">▸</div>
      </div>
      <div class="detail"><div class="cats">${cats}</div><div class="ctx">${d.total} / ${META.max_possible||0} · ${pctN}%</div></div>`;
    row.querySelector('.rmain').onclick=()=>row.classList.toggle('open');
    board.appendChild(row);
  });
  requestAnimationFrame(()=>document.querySelectorAll('.bar').forEach(b=>b.style.width=b.dataset.w+'%'));
}
build(DATA);
</script>
</body>
</html>"""


if __name__ == "__main__":
    main()
