-- Standalone Excel-derived leaderboard tables (separate from the main app schema).
-- Fed by push_to_supabase.py; read publicly by the Vercel frontend.

create table if not exists public.xl_leaderboard (
  key               text primary key,
  name              text not null,
  rank              int  not null default 0,
  total             int  not null default 0,
  correct_score     int  not null default 0,
  correct_outcome   int  not null default 0,
  group_positions   int  not null default 0,
  knockouts         int  not null default 0,
  final_standings   int  not null default 0,
  top_scorer        int  not null default 0,
  updated_at        timestamptz not null default now()
);

create table if not exists public.xl_leaderboard_meta (
  id              int primary key default 1,
  generated       text,
  matches_played  int,
  groups_complete int,
  participants    int,
  max_possible    int,
  tournament_max  int,
  updated_at      timestamptz not null default now(),
  constraint xl_single_row check (id = 1)
);

alter table public.xl_leaderboard      enable row level security;
alter table public.xl_leaderboard_meta enable row level security;

drop policy if exists "public read xl_leaderboard" on public.xl_leaderboard;
create policy "public read xl_leaderboard" on public.xl_leaderboard
  for select using (true);

drop policy if exists "public read xl_leaderboard_meta" on public.xl_leaderboard_meta;
create policy "public read xl_leaderboard_meta" on public.xl_leaderboard_meta
  for select using (true);
