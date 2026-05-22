-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- GROUPS (A-L)
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique, -- 'A' through 'L'
  created_at timestamptz default now()
);

-- TEAMS
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null, -- 3-letter code e.g. 'USA', 'FRA'
  flag_emoji text not null default '🏳',
  group_id uuid references public.groups(id),
  confederation text not null, -- 'UEFA','CONMEBOL','CONCACAF','AFC','CAF','OFC','Intercon'
  created_at timestamptz default now()
);

-- MATCHES
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  stage text not null check (stage in ('group','r32','r16','qf','sf','third_place','final')),
  group_id uuid references public.groups(id),
  match_number integer not null,
  home_team_id uuid references public.teams(id),
  away_team_id uuid references public.teams(id),
  scheduled_at timestamptz,
  venue text,
  home_score integer,
  away_score integer,
  home_penalties integer,
  away_penalties integer,
  winner_id uuid references public.teams(id),
  status text not null default 'upcoming' check (status in ('upcoming','live','completed')),
  created_at timestamptz default now()
);
create index on public.matches(stage);
create index on public.matches(group_id);
create index on public.matches(status);

-- USER PROFILES (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  surname text not null,
  email text not null,
  is_admin boolean not null default false,
  created_at timestamptz default now()
);

-- GROUP STAGE PREDICTIONS (1/X/2 per game)
create table public.group_predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  predicted_outcome text not null check (predicted_outcome in ('1','X','2')),
  predicted_home_score integer,
  predicted_away_score integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, match_id)
);
create index on public.group_predictions(user_id);
create index on public.group_predictions(match_id);

-- BRACKET PREDICTIONS (who wins each knockout match)
create table public.bracket_predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  predicted_winner_id uuid not null references public.teams(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, match_id)
);
create index on public.bracket_predictions(user_id);

-- LEADERBOARD (cached scores, recomputed on result updates)
create table public.leaderboard (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  total_points integer not null default 0,
  group_stage_points integer not null default 0,
  r32_points integer not null default 0,
  r16_points integer not null default 0,
  qf_points integer not null default 0,
  sf_points integer not null default 0,
  final_points integer not null default 0,
  exact_score_bonus integer not null default 0,
  updated_at timestamptz default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.teams enable row level security;
alter table public.matches enable row level security;
alter table public.group_predictions enable row level security;
alter table public.bracket_predictions enable row level security;
alter table public.leaderboard enable row level security;

-- Public read for reference tables
create policy "Public read groups" on public.groups for select using (true);
create policy "Public read teams" on public.teams for select using (true);
create policy "Public read matches" on public.matches for select using (true);
create policy "Public read leaderboard" on public.leaderboard for select using (true);
create policy "Public read profiles" on public.profiles for select using (true);

-- Profiles: user manages own
create policy "Insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Update own profile" on public.profiles for update using (auth.uid() = id);

-- Group predictions: user manages own, can read all
create policy "Read all group predictions" on public.group_predictions for select using (true);
create policy "Insert own group prediction" on public.group_predictions for insert with check (auth.uid() = user_id);
create policy "Update own group prediction" on public.group_predictions for update using (auth.uid() = user_id);

-- Bracket predictions: user manages own, can read all
create policy "Read all bracket predictions" on public.bracket_predictions for select using (true);
create policy "Insert own bracket prediction" on public.bracket_predictions for insert with check (auth.uid() = user_id);
create policy "Update own bracket prediction" on public.bracket_predictions for update using (auth.uid() = user_id);

-- Matches admin update (use service role key from API routes for this)
-- Leaderboard admin update (use service role key from API routes)

-- Function: auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, surname, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'surname', ''),
    new.email
  );
  insert into public.leaderboard (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
