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
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Rubik:wght@400;600;800;900&display=swap');
  :root{
    --field:#e7f5dd; --field2:#d7ecc4; --ink:#0f2a1a; --card:#ffffff; --card2:#fff8dc;
    --gold:#ffcc00; --goldDark:#9c7a00; --silver:#c8d2cc; --silverDark:#5b6b63;
    --bronze:#cd7f32; --bronzeDark:#7a4a18;
    --green:#1f9d4d; --green2:#127a38;
    --txt:#0f2a1a; --dim:#516a5a; --line:#0f2a1a;
    --accent:#1f9d4d; --accent2:#ffcc00;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  body{
    font-family:'Rubik',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
    background:repeating-linear-gradient(90deg,var(--field) 0 64px,var(--field2) 64px 128px);
    color:var(--txt); min-height:100vh; padding:32px 16px 80px;
    -webkit-font-smoothing:antialiased;
  }
  .wrap{max-width:1180px;margin:0 auto}
  header{text-align:center;margin-bottom:36px;position:relative}
  .kicker{font-weight:800;letter-spacing:.32em;font-size:12px;color:var(--green2);
    text-transform:uppercase;margin-bottom:14px}
  h1{font-family:'Press Start 2P',monospace;font-size:clamp(18px,5.2vw,40px);line-height:1.4;
    color:var(--gold);text-shadow:3px 3px 0 var(--ink);letter-spacing:1px}
  .sub{color:var(--dim);margin-top:16px;font-size:15px;font-weight:600}
  .stats{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:22px}
  .pill{background:#fff;border:3px solid var(--line);border-radius:10px;
    padding:9px 18px;font-size:13px;color:var(--dim);font-weight:700;box-shadow:3px 3px 0 var(--line)}
  .pill b{color:var(--green2)}

  /* podium */
  .podium{display:flex;gap:18px;justify-content:center;align-items:flex-end;
    margin:40px 0 30px;flex-wrap:wrap}
  .pod{flex:1;min-width:180px;max-width:280px;border-radius:14px;padding:26px 20px;
    text-align:center;position:relative;border:3px solid var(--line);
    background:#fff;box-shadow:5px 5px 0 var(--line);
    transform:translateY(24px);opacity:0;animation:rise .7s forwards}
  .pod .medal{font-size:40px;margin-bottom:6px}
  .pod .pname{font-weight:800;font-size:18px;margin:6px 0;color:var(--ink)}
  .pod .ppts{font-family:'Press Start 2P',monospace;font-size:26px;letter-spacing:-1px}
  .pod .plabel{font-size:11px;color:var(--dim);text-transform:uppercase;letter-spacing:.12em;font-weight:700}
  .pod.gold{background:linear-gradient(180deg,#fff6c7,#fff);border-color:var(--goldDark);
    box-shadow:5px 5px 0 var(--goldDark);padding-top:34px}
  .pod.gold .ppts{color:var(--goldDark)} .pod.silver .ppts{color:var(--silverDark)}
  .pod.bronze .ppts{color:var(--bronzeDark)}
  .pod.silver{background:linear-gradient(180deg,#eef2ef,#fff);border-color:var(--silverDark);
    box-shadow:5px 5px 0 var(--silverDark)}
  .pod.bronze{background:linear-gradient(180deg,#ffe3c2,#fff);border-color:var(--bronzeDark);
    box-shadow:5px 5px 0 var(--bronzeDark)}
  .pod.gold{order:2} .pod.silver{order:1} .pod.bronze{order:3}
  .pod:nth-child(1){animation-delay:.15s}.pod:nth-child(2){animation-delay:.05s}
  .pod:nth-child(3){animation-delay:.25s}
  @keyframes rise{to{transform:translateY(0);opacity:1}}
  @media (max-width:699px){
    .podium{flex-direction:column;align-items:stretch}
    .pod{max-width:100%;padding-top:26px}
    .pod.gold,.pod.silver,.pod.bronze{order:0}
  }

  /* list */
  .board{display:flex;flex-direction:column;gap:12px;margin-top:10px}
  .row{background:#fff;border:3px solid var(--line);border-radius:12px;
    overflow:hidden;box-shadow:4px 4px 0 var(--line);
    opacity:0;transform:translateY(10px);animation:fade .5s forwards}
  @keyframes fade{to{opacity:1;transform:none}}
  .rmain{display:grid;grid-template-columns:56px 1fr auto 40px;align-items:center;
    gap:14px;padding:16px 18px;cursor:pointer;transition:background .15s}
  .rmain:hover{background:#fbf8e8}
  .rank{font-family:'Press Start 2P',monospace;font-size:18px;color:var(--dim);text-align:center}
  .top1 .rank{color:var(--goldDark)} .top2 .rank{color:var(--silverDark)} .top3 .rank{color:var(--bronzeDark)}
  .who{font-weight:800;font-size:17px;color:var(--ink)}
  .barwrap{height:10px;background:#eef3ec;border:2px solid var(--line);border-radius:5px;margin-top:8px;overflow:hidden;width:min(480px,46vw)}
  .bar{height:100%;background:linear-gradient(90deg,var(--green),var(--gold));
    width:0;transition:width 1.1s cubic-bezier(.2,.8,.2,1)}
  .top1 .bar{background:linear-gradient(90deg,var(--gold),#ffe27a)}
  .pts{font-family:'Press Start 2P',monospace;font-size:18px;text-align:right;color:var(--green2)}
  .chev{color:var(--dim);transition:transform .25s;text-align:center;font-weight:900}
  .row.open .chev{transform:rotate(180deg)}
  .detail{max-height:0;overflow:hidden;transition:max-height .35s ease;
    border-top:0 solid transparent}
  .row.open .detail{max-height:420px;border-top:3px solid var(--line)}
  .cats{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;padding:18px;background:#fbf8e8}
  @media (min-width:700px){
    .cats{grid-template-columns:repeat(6,1fr)}
  }
  .cat{background:#fff;border:2px solid var(--line);border-radius:8px;padding:12px}
  .cat .cl{font-size:10.5px;color:var(--dim);text-transform:uppercase;letter-spacing:.06em;font-weight:700}
  .cat .cv{font-family:'Press Start 2P',monospace;font-size:17px;margin-top:6px;color:var(--green2)}
  .cat.zero{opacity:.45}
  footer{text-align:center;color:var(--dim);font-size:12.5px;margin-top:44px;line-height:1.7;font-weight:600}
  .search{display:block;margin:28px auto 6px;width:min(420px,90%);background:#fff;
    border:3px solid var(--line);color:var(--ink);border-radius:10px;padding:12px 18px;
    font-size:15px;outline:none;font-weight:600;box-shadow:3px 3px 0 var(--line)}
  .search:focus{border-color:var(--green)}
</style>
</head>
<body>
<div class="wrap">
  <header>
    <div class="kicker">Fantamondiale · World Cup 2026</div>
    <h1>The Leaderboard</h1>
    <div class="sub" id="sub"></div>
    <div class="stats" id="stats"></div>
  </header>

  <div class="podium" id="podium"></div>
  <input class="search" id="search" placeholder="Search a participant…"/>
  <div class="board" id="board"></div>

  <footer id="foot"></footer>
</div>

<script>
const DATA = __DATA__;
const META = __META__;
const CATS = __CATS__;
const maxT = Math.max(1, META.max_possible || 1);

// header meta
document.getElementById('sub').textContent =
  `${META.participants} participants · ${META.matches_played} group matches scored · `
  + `${META.groups_complete} groups finalised`;
document.getElementById('stats').innerHTML =
  `<span class="pill">Updated <b>${META.generated}</b></span>`
  + `<span class="pill">Leader <b>${DATA[0]?DATA[0].total:0}</b> / ${META.max_possible} so far</span>`
  + `<span class="pill">Tournament max <b>${META.tournament_max}</b> pts</span>`
  + `<span class="pill"><b>${META.participants}</b> playing</span>`;
document.getElementById('foot').innerHTML =
  `Auto-generated from the Pronostici folder · Truth from FIFAWC2026_Model.xlsx<br>`
  + `Group scoring live · knockouts & standings activate as results are entered`;

// podium (top 3)
const podEl = document.getElementById('podium');
const medal = ['🥇','🥈','🥉']; const cls=['gold','silver','bronze'];
DATA.slice(0,3).forEach((d,i)=>{
  const el=document.createElement('div');
  el.className='pod '+cls[i];
  el.innerHTML=`<div class="medal">${medal[i]}</div>
    <div class="plabel">#${d.rank}</div>
    <div class="pname">${d.name}</div>
    <div class="ppts">${d.total}</div>
    <div class="plabel">points</div>`;
  podEl.appendChild(el);
});

// full board
const board=document.getElementById('board');
function build(list){
  board.innerHTML='';
  list.forEach((d,idx)=>{
    const topcls = d.rank<=3 ? ('top'+d.rank) : '';
    const row=document.createElement('div');
    row.className='row '+topcls; row.style.animationDelay=(idx*0.03)+'s';
    const catsHtml = CATS.map(c=>{
      const v=(d.bd&&d.bd[c])||0;
      return `<div class="cat ${v===0?'zero':''}"><div class="cl">${c}</div>
              <div class="cv">${v}</div></div>`;
    }).join('');
    row.innerHTML=`
      <div class="rmain">
        <div class="rank">${d.rank}</div>
        <div><div class="who">${d.name}</div>
          <div class="barwrap"><div class="bar" data-w="${Math.round(100*d.total/maxT)}"></div></div>
        </div>
        <div class="pts">${d.total}</div>
        <div class="chev">▾</div>
      </div>
      <div class="detail">
        <div class="cats">${catsHtml}</div>
        <div style="padding:0 16px 16px;font-size:12px;color:var(--dim)">
          ${d.total} of ${META.tournament_max} tournament points
          (${(100*d.total/META.tournament_max).toFixed(1)}%) ·
          ${d.total} of ${META.max_possible} available so far
          (${Math.round(100*d.total/META.max_possible)}%)
        </div>
      </div>`;
    row.querySelector('.rmain').onclick=()=>row.classList.toggle('open');
    board.appendChild(row);
  });
  requestAnimationFrame(()=>{
    document.querySelectorAll('.bar').forEach(b=>b.style.width=b.dataset.w+'%');
  });
}
build(DATA);

// search
document.getElementById('search').oninput=e=>{
  const q=e.target.value.toLowerCase();
  build(DATA.filter(d=>d.name.toLowerCase().includes(q)));
};
</script>
</body>
</html>"""


if __name__ == "__main__":
    main()
