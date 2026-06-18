import os, sys, json, urllib.request
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://ecqieaselexhcqkwbtcy.supabase.co").rstrip("/")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

if not SERVICE_KEY:
    sys.exit("SUPABASE_SERVICE_KEY not set")

url = f"{SUPABASE_URL}/rest/v1/xl_leaderboard_meta?id=eq.1"
req = urllib.request.Request(url, headers={
    "apikey": SERVICE_KEY,
    "Authorization": "Bearer " + SERVICE_KEY
})

try:
    with urllib.request.urlopen(req) as r:
        data = json.loads(r.read().decode())
        print(json.dumps(data, indent=2))
except Exception as e:
    print("Failed to fetch meta:", e)
