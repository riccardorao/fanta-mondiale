-- =============================================================================
-- SEED DATA: FIFA World Cup 2026
-- Groups, Teams, Group Stage Matches (1-72), Knockout Shells (73-104)
--
-- Data source: 2026 FIFA World Cup Final Draw, held 5 December 2025 at the
-- Kennedy Center, Washington, D.C. Group compositions cross-referenced from
-- multiple public reports of the draw (NBC Sports, DAZN, MLSSoccer, beIN
-- Sports, England Football, and per-group Wikipedia pages) and the March 2026
-- play-off results.
--
-- The six Pot 4 play-off placeholders that were undecided at draw time were
-- resolved by the March 2026 play-offs and are now filled with the real
-- qualifiers:
--   UEFA Path A -> Bosnia and Herzegovina (beat Italy)  -> Group B
--   UEFA Path B -> Sweden               (beat Poland)   -> Group F
--   UEFA Path C -> Türkiye              (beat Kosovo)    -> Group D
--   UEFA Path D -> Czechia              (beat Denmark)   -> Group A
--   FIFA Play-off 1 -> DR Congo         (beat Jamaica)   -> Group K
--   FIFA Play-off 2 -> Iraq             (beat Bolivia)   -> Group I
-- No TBD/placeholder slots remain.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. GROUPS (A through L)
-- -----------------------------------------------------------------------------
INSERT INTO public.groups (name) VALUES
  ('A'),
  ('B'),
  ('C'),
  ('D'),
  ('E'),
  ('F'),
  ('G'),
  ('H'),
  ('I'),
  ('J'),
  ('K'),
  ('L');

-- -----------------------------------------------------------------------------
-- 2. TEAMS (48 total, 4 per group) -- real 2026 World Cup draw
-- Group A: Mexico, South Africa, South Korea, Czechia
-- Group B: Canada, Bosnia and Herzegovina, Qatar, Switzerland
-- Group C: Brazil, Morocco, Haiti, Scotland
-- Group D: USA, Paraguay, Australia, Türkiye
-- Group E: Germany, Curaçao, Côte d'Ivoire, Ecuador
-- Group F: Netherlands, Japan, Sweden, Tunisia
-- Group G: Belgium, Egypt, Iran, New Zealand
-- Group H: Spain, Cape Verde, Saudi Arabia, Uruguay
-- Group I: France, Senegal, Iraq, Norway
-- Group J: Argentina, Algeria, Austria, Jordan
-- Group K: Portugal, DR Congo, Uzbekistan, Colombia
-- Group L: England, Croatia, Ghana, Panama
-- -----------------------------------------------------------------------------
INSERT INTO public.teams (name, code, flag_emoji, group_id, confederation) VALUES
  ('Mexico',         'MEX', '🇲🇽', (SELECT id FROM public.groups WHERE name = 'A'), 'CONCACAF'),
  ('South Africa',   'RSA', '🇿🇦', (SELECT id FROM public.groups WHERE name = 'A'), 'CAF'),
  ('South Korea',    'KOR', '🇰🇷', (SELECT id FROM public.groups WHERE name = 'A'), 'AFC'),
  ('Czechia',        'CZE', '🇨🇿', (SELECT id FROM public.groups WHERE name = 'A'), 'UEFA'),

  ('Canada',         'CAN', '🇨🇦', (SELECT id FROM public.groups WHERE name = 'B'), 'CONCACAF'),
  ('Bosnia and Herzegovina', 'BIH', '🇧🇦', (SELECT id FROM public.groups WHERE name = 'B'), 'UEFA'),
  ('Qatar',          'QAT', '🇶🇦', (SELECT id FROM public.groups WHERE name = 'B'), 'AFC'),
  ('Switzerland',    'SUI', '🇨🇭', (SELECT id FROM public.groups WHERE name = 'B'), 'UEFA'),

  ('Brazil',         'BRA', '🇧🇷', (SELECT id FROM public.groups WHERE name = 'C'), 'CONMEBOL'),
  ('Morocco',        'MAR', '🇲🇦', (SELECT id FROM public.groups WHERE name = 'C'), 'CAF'),
  ('Haiti',          'HAI', '🇭🇹', (SELECT id FROM public.groups WHERE name = 'C'), 'CONCACAF'),
  ('Scotland',       'SCO', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', (SELECT id FROM public.groups WHERE name = 'C'), 'UEFA'),

  ('USA',            'USA', '🇺🇸', (SELECT id FROM public.groups WHERE name = 'D'), 'CONCACAF'),
  ('Paraguay',       'PAR', '🇵🇾', (SELECT id FROM public.groups WHERE name = 'D'), 'CONMEBOL'),
  ('Australia',      'AUS', '🇦🇺', (SELECT id FROM public.groups WHERE name = 'D'), 'AFC'),
  ('Türkiye',        'TUR', '🇹🇷', (SELECT id FROM public.groups WHERE name = 'D'), 'UEFA'),

  ('Germany',        'GER', '🇩🇪', (SELECT id FROM public.groups WHERE name = 'E'), 'UEFA'),
  ('Curaçao',        'CUW', '🇨🇼', (SELECT id FROM public.groups WHERE name = 'E'), 'CONCACAF'),
  ('Côte d''Ivoire', 'CIV', '🇨🇮', (SELECT id FROM public.groups WHERE name = 'E'), 'CAF'),
  ('Ecuador',        'ECU', '🇪🇨', (SELECT id FROM public.groups WHERE name = 'E'), 'CONMEBOL'),

  ('Netherlands',    'NED', '🇳🇱', (SELECT id FROM public.groups WHERE name = 'F'), 'UEFA'),
  ('Japan',          'JPN', '🇯🇵', (SELECT id FROM public.groups WHERE name = 'F'), 'AFC'),
  ('Sweden',         'SWE', '🇸🇪', (SELECT id FROM public.groups WHERE name = 'F'), 'UEFA'),
  ('Tunisia',        'TUN', '🇹🇳', (SELECT id FROM public.groups WHERE name = 'F'), 'CAF'),

  ('Belgium',        'BEL', '🇧🇪', (SELECT id FROM public.groups WHERE name = 'G'), 'UEFA'),
  ('Egypt',          'EGY', '🇪🇬', (SELECT id FROM public.groups WHERE name = 'G'), 'CAF'),
  ('Iran',           'IRN', '🇮🇷', (SELECT id FROM public.groups WHERE name = 'G'), 'AFC'),
  ('New Zealand',    'NZL', '🇳🇿', (SELECT id FROM public.groups WHERE name = 'G'), 'OFC'),

  ('Spain',          'ESP', '🇪🇸', (SELECT id FROM public.groups WHERE name = 'H'), 'UEFA'),
  ('Cape Verde',     'CPV', '🇨🇻', (SELECT id FROM public.groups WHERE name = 'H'), 'CAF'),
  ('Saudi Arabia',   'KSA', '🇸🇦', (SELECT id FROM public.groups WHERE name = 'H'), 'AFC'),
  ('Uruguay',        'URU', '🇺🇾', (SELECT id FROM public.groups WHERE name = 'H'), 'CONMEBOL'),

  ('France',         'FRA', '🇫🇷', (SELECT id FROM public.groups WHERE name = 'I'), 'UEFA'),
  ('Senegal',        'SEN', '🇸🇳', (SELECT id FROM public.groups WHERE name = 'I'), 'CAF'),
  ('Iraq',           'IRQ', '🇮🇶', (SELECT id FROM public.groups WHERE name = 'I'), 'AFC'),
  ('Norway',         'NOR', '🇳🇴', (SELECT id FROM public.groups WHERE name = 'I'), 'UEFA'),

  ('Argentina',      'ARG', '🇦🇷', (SELECT id FROM public.groups WHERE name = 'J'), 'CONMEBOL'),
  ('Algeria',        'ALG', '🇩🇿', (SELECT id FROM public.groups WHERE name = 'J'), 'CAF'),
  ('Austria',        'AUT', '🇦🇹', (SELECT id FROM public.groups WHERE name = 'J'), 'UEFA'),
  ('Jordan',         'JOR', '🇯🇴', (SELECT id FROM public.groups WHERE name = 'J'), 'AFC'),

  ('Portugal',       'POR', '🇵🇹', (SELECT id FROM public.groups WHERE name = 'K'), 'UEFA'),
  ('DR Congo',       'COD', '🇨🇩', (SELECT id FROM public.groups WHERE name = 'K'), 'CAF'),
  ('Uzbekistan',     'UZB', '🇺🇿', (SELECT id FROM public.groups WHERE name = 'K'), 'AFC'),
  ('Colombia',       'COL', '🇨🇴', (SELECT id FROM public.groups WHERE name = 'K'), 'CONMEBOL'),

  ('England',        'ENG', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', (SELECT id FROM public.groups WHERE name = 'L'), 'UEFA'),
  ('Croatia',        'CRO', '🇭🇷', (SELECT id FROM public.groups WHERE name = 'L'), 'UEFA'),
  ('Ghana',          'GHA', '🇬🇭', (SELECT id FROM public.groups WHERE name = 'L'), 'CAF'),
  ('Panama',         'PAN', '🇵🇦', (SELECT id FROM public.groups WHERE name = 'L'), 'CONCACAF');

-- -----------------------------------------------------------------------------
-- 3. GROUP STAGE MATCHES (72 matches, numbers 1–72)
--
-- Match pattern per group (teams in order T1, T2, T3, T4):
--   MD1 Match 1: T1 vs T2  (15:00Z)
--   MD1 Match 2: T3 vs T4  (19:00Z)
--   MD2 Match 3: T1 vs T3  (15:00Z)
--   MD2 Match 4: T2 vs T4  (19:00Z)
--   MD3 Match 5: T1 vs T4  (19:00Z) -- simultaneous
--   MD3 Match 6: T2 vs T3  (19:00Z) -- simultaneous
--
-- MD1 dates: A=Jun11, B=Jun12, C=Jun13, D=Jun12, E=Jun13, F=Jun14,
--            G=Jun14, H=Jun15, I=Jun15, J=Jun16, K=Jun16, L=Jun17
-- MD2 dates: A=Jun18, B=Jun18, C=Jun19, D=Jun19, E=Jun20, F=Jun20,
--            G=Jun21, H=Jun21, I=Jun22, J=Jun22, K=Jun23, L=Jun23
-- MD3 dates: A=Jun24, B=Jun24, C=Jun25, D=Jun25, E=Jun26, F=Jun26,
--            G=Jun26, H=Jun26, I=Jun27, J=Jun27, K=Jun27, L=Jun27
-- -----------------------------------------------------------------------------

-- GROUP A  (Mexico, South Africa, South Korea, Czechia)  matches 1–6
INSERT INTO public.matches (stage, group_id, match_number, home_team_id, away_team_id, scheduled_at, venue) VALUES
  ('group', (SELECT id FROM public.groups WHERE name = 'A'), 1,
   (SELECT id FROM public.teams WHERE code = 'MEX'),
   (SELECT id FROM public.teams WHERE code = 'RSA'),
   '2026-06-11T19:00:00Z', 'Estadio Azteca, Mexico City'),

  ('group', (SELECT id FROM public.groups WHERE name = 'A'), 2,
   (SELECT id FROM public.teams WHERE code = 'KOR'),
   (SELECT id FROM public.teams WHERE code = 'CZE'),
   '2026-06-11T23:00:00Z', 'Estadio Akron, Guadalajara'),

  ('group', (SELECT id FROM public.groups WHERE name = 'A'), 3,
   (SELECT id FROM public.teams WHERE code = 'MEX'),
   (SELECT id FROM public.teams WHERE code = 'KOR'),
   '2026-06-18T19:00:00Z', 'Estadio Akron, Guadalajara'),

  ('group', (SELECT id FROM public.groups WHERE name = 'A'), 4,
   (SELECT id FROM public.teams WHERE code = 'RSA'),
   (SELECT id FROM public.teams WHERE code = 'CZE'),
   '2026-06-18T16:00:00Z', 'Mercedes-Benz Stadium, Atlanta'),

  ('group', (SELECT id FROM public.groups WHERE name = 'A'), 5,
   (SELECT id FROM public.teams WHERE code = 'MEX'),
   (SELECT id FROM public.teams WHERE code = 'CZE'),
   '2026-06-24T19:00:00Z', 'Estadio Azteca, Mexico City'),

  ('group', (SELECT id FROM public.groups WHERE name = 'A'), 6,
   (SELECT id FROM public.teams WHERE code = 'RSA'),
   (SELECT id FROM public.teams WHERE code = 'KOR'),
   '2026-06-24T19:00:00Z', 'Estadio Akron, Guadalajara');

-- GROUP B  (Canada, Bosnia and Herzegovina, Qatar, Switzerland)  matches 7–12
INSERT INTO public.matches (stage, group_id, match_number, home_team_id, away_team_id, scheduled_at, venue) VALUES
  ('group', (SELECT id FROM public.groups WHERE name = 'B'), 7,
   (SELECT id FROM public.teams WHERE code = 'CAN'),
   (SELECT id FROM public.teams WHERE code = 'BIH'),
   '2026-06-12T23:00:00Z', 'BMO Field, Toronto'),

  ('group', (SELECT id FROM public.groups WHERE name = 'B'), 8,
   (SELECT id FROM public.teams WHERE code = 'QAT'),
   (SELECT id FROM public.teams WHERE code = 'SUI'),
   '2026-06-12T19:00:00Z', 'BC Place, Vancouver'),

  ('group', (SELECT id FROM public.groups WHERE name = 'B'), 9,
   (SELECT id FROM public.teams WHERE code = 'CAN'),
   (SELECT id FROM public.teams WHERE code = 'QAT'),
   '2026-06-18T23:00:00Z', 'BC Place, Vancouver'),

  ('group', (SELECT id FROM public.groups WHERE name = 'B'), 10,
   (SELECT id FROM public.teams WHERE code = 'BIH'),
   (SELECT id FROM public.teams WHERE code = 'SUI'),
   '2026-06-18T19:00:00Z', 'BMO Field, Toronto'),

  ('group', (SELECT id FROM public.groups WHERE name = 'B'), 11,
   (SELECT id FROM public.teams WHERE code = 'CAN'),
   (SELECT id FROM public.teams WHERE code = 'SUI'),
   '2026-06-24T23:00:00Z', 'BC Place, Vancouver'),

  ('group', (SELECT id FROM public.groups WHERE name = 'B'), 12,
   (SELECT id FROM public.teams WHERE code = 'BIH'),
   (SELECT id FROM public.teams WHERE code = 'QAT'),
   '2026-06-24T23:00:00Z', 'Lumen Field, Seattle');

-- GROUP C  (Brazil, Morocco, Haiti, Scotland)  matches 13–18
INSERT INTO public.matches (stage, group_id, match_number, home_team_id, away_team_id, scheduled_at, venue) VALUES
  ('group', (SELECT id FROM public.groups WHERE name = 'C'), 13,
   (SELECT id FROM public.teams WHERE code = 'BRA'),
   (SELECT id FROM public.teams WHERE code = 'MAR'),
   '2026-06-13T19:00:00Z', 'Mercedes-Benz Stadium, Atlanta'),

  ('group', (SELECT id FROM public.groups WHERE name = 'C'), 14,
   (SELECT id FROM public.teams WHERE code = 'HAI'),
   (SELECT id FROM public.teams WHERE code = 'SCO'),
   '2026-06-13T15:00:00Z', 'Lincoln Financial Field, Philadelphia'),

  ('group', (SELECT id FROM public.groups WHERE name = 'C'), 15,
   (SELECT id FROM public.teams WHERE code = 'BRA'),
   (SELECT id FROM public.teams WHERE code = 'HAI'),
   '2026-06-19T19:00:00Z', 'Hard Rock Stadium, Miami'),

  ('group', (SELECT id FROM public.groups WHERE name = 'C'), 16,
   (SELECT id FROM public.teams WHERE code = 'MAR'),
   (SELECT id FROM public.teams WHERE code = 'SCO'),
   '2026-06-19T15:00:00Z', 'Lincoln Financial Field, Philadelphia'),

  ('group', (SELECT id FROM public.groups WHERE name = 'C'), 17,
   (SELECT id FROM public.teams WHERE code = 'BRA'),
   (SELECT id FROM public.teams WHERE code = 'SCO'),
   '2026-06-25T19:00:00Z', 'Hard Rock Stadium, Miami'),

  ('group', (SELECT id FROM public.groups WHERE name = 'C'), 18,
   (SELECT id FROM public.teams WHERE code = 'MAR'),
   (SELECT id FROM public.teams WHERE code = 'HAI'),
   '2026-06-25T19:00:00Z', 'Mercedes-Benz Stadium, Atlanta');

-- GROUP D  (USA, Paraguay, Australia, Türkiye)  matches 19–24
INSERT INTO public.matches (stage, group_id, match_number, home_team_id, away_team_id, scheduled_at, venue) VALUES
  ('group', (SELECT id FROM public.groups WHERE name = 'D'), 19,
   (SELECT id FROM public.teams WHERE code = 'USA'),
   (SELECT id FROM public.teams WHERE code = 'PAR'),
   '2026-06-12T23:00:00Z', 'SoFi Stadium, Los Angeles'),

  ('group', (SELECT id FROM public.groups WHERE name = 'D'), 20,
   (SELECT id FROM public.teams WHERE code = 'AUS'),
   (SELECT id FROM public.teams WHERE code = 'TUR'),
   '2026-06-12T19:00:00Z', 'Levi''s Stadium, San Francisco'),

  ('group', (SELECT id FROM public.groups WHERE name = 'D'), 21,
   (SELECT id FROM public.teams WHERE code = 'USA'),
   (SELECT id FROM public.teams WHERE code = 'AUS'),
   '2026-06-19T23:00:00Z', 'SoFi Stadium, Los Angeles'),

  ('group', (SELECT id FROM public.groups WHERE name = 'D'), 22,
   (SELECT id FROM public.teams WHERE code = 'PAR'),
   (SELECT id FROM public.teams WHERE code = 'TUR'),
   '2026-06-19T19:00:00Z', 'Levi''s Stadium, San Francisco'),

  ('group', (SELECT id FROM public.groups WHERE name = 'D'), 23,
   (SELECT id FROM public.teams WHERE code = 'USA'),
   (SELECT id FROM public.teams WHERE code = 'TUR'),
   '2026-06-25T23:00:00Z', 'SoFi Stadium, Los Angeles'),

  ('group', (SELECT id FROM public.groups WHERE name = 'D'), 24,
   (SELECT id FROM public.teams WHERE code = 'PAR'),
   (SELECT id FROM public.teams WHERE code = 'AUS'),
   '2026-06-25T23:00:00Z', 'Levi''s Stadium, San Francisco');

-- GROUP E  (Germany, Curaçao, Côte d'Ivoire, Ecuador)  matches 25–30
INSERT INTO public.matches (stage, group_id, match_number, home_team_id, away_team_id, scheduled_at, venue) VALUES
  ('group', (SELECT id FROM public.groups WHERE name = 'E'), 25,
   (SELECT id FROM public.teams WHERE code = 'GER'),
   (SELECT id FROM public.teams WHERE code = 'CUW'),
   '2026-06-13T19:00:00Z', 'MetLife Stadium, New York/New Jersey'),

  ('group', (SELECT id FROM public.groups WHERE name = 'E'), 26,
   (SELECT id FROM public.teams WHERE code = 'CIV'),
   (SELECT id FROM public.teams WHERE code = 'ECU'),
   '2026-06-13T23:00:00Z', 'Gillette Stadium, Boston'),

  ('group', (SELECT id FROM public.groups WHERE name = 'E'), 27,
   (SELECT id FROM public.teams WHERE code = 'GER'),
   (SELECT id FROM public.teams WHERE code = 'CIV'),
   '2026-06-20T19:00:00Z', 'Gillette Stadium, Boston'),

  ('group', (SELECT id FROM public.groups WHERE name = 'E'), 28,
   (SELECT id FROM public.teams WHERE code = 'CUW'),
   (SELECT id FROM public.teams WHERE code = 'ECU'),
   '2026-06-20T15:00:00Z', 'MetLife Stadium, New York/New Jersey'),

  ('group', (SELECT id FROM public.groups WHERE name = 'E'), 29,
   (SELECT id FROM public.teams WHERE code = 'GER'),
   (SELECT id FROM public.teams WHERE code = 'ECU'),
   '2026-06-26T19:00:00Z', 'MetLife Stadium, New York/New Jersey'),

  ('group', (SELECT id FROM public.groups WHERE name = 'E'), 30,
   (SELECT id FROM public.teams WHERE code = 'CUW'),
   (SELECT id FROM public.teams WHERE code = 'CIV'),
   '2026-06-26T19:00:00Z', 'Gillette Stadium, Boston');

-- GROUP F  (Netherlands, Japan, Sweden, Tunisia)  matches 31–36
INSERT INTO public.matches (stage, group_id, match_number, home_team_id, away_team_id, scheduled_at, venue) VALUES
  ('group', (SELECT id FROM public.groups WHERE name = 'F'), 31,
   (SELECT id FROM public.teams WHERE code = 'NED'),
   (SELECT id FROM public.teams WHERE code = 'JPN'),
   '2026-06-14T19:00:00Z', 'Hard Rock Stadium, Miami'),

  ('group', (SELECT id FROM public.groups WHERE name = 'F'), 32,
   (SELECT id FROM public.teams WHERE code = 'SWE'),
   (SELECT id FROM public.teams WHERE code = 'TUN'),
   '2026-06-14T15:00:00Z', 'Mercedes-Benz Stadium, Atlanta'),

  ('group', (SELECT id FROM public.groups WHERE name = 'F'), 33,
   (SELECT id FROM public.teams WHERE code = 'NED'),
   (SELECT id FROM public.teams WHERE code = 'SWE'),
   '2026-06-20T19:00:00Z', 'Hard Rock Stadium, Miami'),

  ('group', (SELECT id FROM public.groups WHERE name = 'F'), 34,
   (SELECT id FROM public.teams WHERE code = 'JPN'),
   (SELECT id FROM public.teams WHERE code = 'TUN'),
   '2026-06-20T23:00:00Z', 'Mercedes-Benz Stadium, Atlanta'),

  ('group', (SELECT id FROM public.groups WHERE name = 'F'), 35,
   (SELECT id FROM public.teams WHERE code = 'NED'),
   (SELECT id FROM public.teams WHERE code = 'TUN'),
   '2026-06-26T19:00:00Z', 'Hard Rock Stadium, Miami'),

  ('group', (SELECT id FROM public.groups WHERE name = 'F'), 36,
   (SELECT id FROM public.teams WHERE code = 'JPN'),
   (SELECT id FROM public.teams WHERE code = 'SWE'),
   '2026-06-26T19:00:00Z', 'Mercedes-Benz Stadium, Atlanta');

-- GROUP G  (Belgium, Egypt, Iran, New Zealand)  matches 37–42
INSERT INTO public.matches (stage, group_id, match_number, home_team_id, away_team_id, scheduled_at, venue) VALUES
  ('group', (SELECT id FROM public.groups WHERE name = 'G'), 37,
   (SELECT id FROM public.teams WHERE code = 'BEL'),
   (SELECT id FROM public.teams WHERE code = 'EGY'),
   '2026-06-14T23:00:00Z', 'SoFi Stadium, Los Angeles'),

  ('group', (SELECT id FROM public.groups WHERE name = 'G'), 38,
   (SELECT id FROM public.teams WHERE code = 'IRN'),
   (SELECT id FROM public.teams WHERE code = 'NZL'),
   '2026-06-14T19:00:00Z', 'Levi''s Stadium, San Francisco'),

  ('group', (SELECT id FROM public.groups WHERE name = 'G'), 39,
   (SELECT id FROM public.teams WHERE code = 'BEL'),
   (SELECT id FROM public.teams WHERE code = 'IRN'),
   '2026-06-21T19:00:00Z', 'SoFi Stadium, Los Angeles'),

  ('group', (SELECT id FROM public.groups WHERE name = 'G'), 40,
   (SELECT id FROM public.teams WHERE code = 'EGY'),
   (SELECT id FROM public.teams WHERE code = 'NZL'),
   '2026-06-21T23:00:00Z', 'Levi''s Stadium, San Francisco'),

  ('group', (SELECT id FROM public.groups WHERE name = 'G'), 41,
   (SELECT id FROM public.teams WHERE code = 'BEL'),
   (SELECT id FROM public.teams WHERE code = 'NZL'),
   '2026-06-26T19:00:00Z', 'SoFi Stadium, Los Angeles'),

  ('group', (SELECT id FROM public.groups WHERE name = 'G'), 42,
   (SELECT id FROM public.teams WHERE code = 'EGY'),
   (SELECT id FROM public.teams WHERE code = 'IRN'),
   '2026-06-26T19:00:00Z', 'Levi''s Stadium, San Francisco');

-- GROUP H  (Spain, Cape Verde, Saudi Arabia, Uruguay)  matches 43–48
INSERT INTO public.matches (stage, group_id, match_number, home_team_id, away_team_id, scheduled_at, venue) VALUES
  ('group', (SELECT id FROM public.groups WHERE name = 'H'), 43,
   (SELECT id FROM public.teams WHERE code = 'ESP'),
   (SELECT id FROM public.teams WHERE code = 'CPV'),
   '2026-06-15T19:00:00Z', 'AT&T Stadium, Dallas'),

  ('group', (SELECT id FROM public.groups WHERE name = 'H'), 44,
   (SELECT id FROM public.teams WHERE code = 'KSA'),
   (SELECT id FROM public.teams WHERE code = 'URU'),
   '2026-06-15T23:00:00Z', 'NRG Stadium, Houston'),

  ('group', (SELECT id FROM public.groups WHERE name = 'H'), 45,
   (SELECT id FROM public.teams WHERE code = 'ESP'),
   (SELECT id FROM public.teams WHERE code = 'KSA'),
   '2026-06-21T19:00:00Z', 'AT&T Stadium, Dallas'),

  ('group', (SELECT id FROM public.groups WHERE name = 'H'), 46,
   (SELECT id FROM public.teams WHERE code = 'CPV'),
   (SELECT id FROM public.teams WHERE code = 'URU'),
   '2026-06-21T15:00:00Z', 'NRG Stadium, Houston'),

  ('group', (SELECT id FROM public.groups WHERE name = 'H'), 47,
   (SELECT id FROM public.teams WHERE code = 'ESP'),
   (SELECT id FROM public.teams WHERE code = 'URU'),
   '2026-06-26T19:00:00Z', 'AT&T Stadium, Dallas'),

  ('group', (SELECT id FROM public.groups WHERE name = 'H'), 48,
   (SELECT id FROM public.teams WHERE code = 'CPV'),
   (SELECT id FROM public.teams WHERE code = 'KSA'),
   '2026-06-26T19:00:00Z', 'NRG Stadium, Houston');

-- GROUP I  (France, Senegal, Iraq, Norway)  matches 49–54
INSERT INTO public.matches (stage, group_id, match_number, home_team_id, away_team_id, scheduled_at, venue) VALUES
  ('group', (SELECT id FROM public.groups WHERE name = 'I'), 49,
   (SELECT id FROM public.teams WHERE code = 'FRA'),
   (SELECT id FROM public.teams WHERE code = 'SEN'),
   '2026-06-15T15:00:00Z', 'Lincoln Financial Field, Philadelphia'),

  ('group', (SELECT id FROM public.groups WHERE name = 'I'), 50,
   (SELECT id FROM public.teams WHERE code = 'IRQ'),
   (SELECT id FROM public.teams WHERE code = 'NOR'),
   '2026-06-15T19:00:00Z', 'Gillette Stadium, Boston'),

  ('group', (SELECT id FROM public.groups WHERE name = 'I'), 51,
   (SELECT id FROM public.teams WHERE code = 'FRA'),
   (SELECT id FROM public.teams WHERE code = 'IRQ'),
   '2026-06-22T19:00:00Z', 'MetLife Stadium, New York/New Jersey'),

  ('group', (SELECT id FROM public.groups WHERE name = 'I'), 52,
   (SELECT id FROM public.teams WHERE code = 'SEN'),
   (SELECT id FROM public.teams WHERE code = 'NOR'),
   '2026-06-22T15:00:00Z', 'Gillette Stadium, Boston'),

  ('group', (SELECT id FROM public.groups WHERE name = 'I'), 53,
   (SELECT id FROM public.teams WHERE code = 'FRA'),
   (SELECT id FROM public.teams WHERE code = 'NOR'),
   '2026-06-27T19:00:00Z', 'MetLife Stadium, New York/New Jersey'),

  ('group', (SELECT id FROM public.groups WHERE name = 'I'), 54,
   (SELECT id FROM public.teams WHERE code = 'SEN'),
   (SELECT id FROM public.teams WHERE code = 'IRQ'),
   '2026-06-27T19:00:00Z', 'Lincoln Financial Field, Philadelphia');

-- GROUP J  (Argentina, Algeria, Austria, Jordan)  matches 55–60
INSERT INTO public.matches (stage, group_id, match_number, home_team_id, away_team_id, scheduled_at, venue) VALUES
  ('group', (SELECT id FROM public.groups WHERE name = 'J'), 55,
   (SELECT id FROM public.teams WHERE code = 'ARG'),
   (SELECT id FROM public.teams WHERE code = 'ALG'),
   '2026-06-16T19:00:00Z', 'Arrowhead Stadium, Kansas City'),

  ('group', (SELECT id FROM public.groups WHERE name = 'J'), 56,
   (SELECT id FROM public.teams WHERE code = 'AUT'),
   (SELECT id FROM public.teams WHERE code = 'JOR'),
   '2026-06-16T15:00:00Z', 'NRG Stadium, Houston'),

  ('group', (SELECT id FROM public.groups WHERE name = 'J'), 57,
   (SELECT id FROM public.teams WHERE code = 'ARG'),
   (SELECT id FROM public.teams WHERE code = 'AUT'),
   '2026-06-23T19:00:00Z', 'Arrowhead Stadium, Kansas City'),

  ('group', (SELECT id FROM public.groups WHERE name = 'J'), 58,
   (SELECT id FROM public.teams WHERE code = 'ALG'),
   (SELECT id FROM public.teams WHERE code = 'JOR'),
   '2026-06-23T15:00:00Z', 'NRG Stadium, Houston'),

  ('group', (SELECT id FROM public.groups WHERE name = 'J'), 59,
   (SELECT id FROM public.teams WHERE code = 'ARG'),
   (SELECT id FROM public.teams WHERE code = 'JOR'),
   '2026-06-27T19:00:00Z', 'Arrowhead Stadium, Kansas City'),

  ('group', (SELECT id FROM public.groups WHERE name = 'J'), 60,
   (SELECT id FROM public.teams WHERE code = 'ALG'),
   (SELECT id FROM public.teams WHERE code = 'AUT'),
   '2026-06-27T19:00:00Z', 'NRG Stadium, Houston');

-- GROUP K  (Portugal, DR Congo, Uzbekistan, Colombia)  matches 61–66
INSERT INTO public.matches (stage, group_id, match_number, home_team_id, away_team_id, scheduled_at, venue) VALUES
  ('group', (SELECT id FROM public.groups WHERE name = 'K'), 61,
   (SELECT id FROM public.teams WHERE code = 'POR'),
   (SELECT id FROM public.teams WHERE code = 'COD'),
   '2026-06-16T23:00:00Z', 'Levi''s Stadium, San Francisco'),

  ('group', (SELECT id FROM public.groups WHERE name = 'K'), 62,
   (SELECT id FROM public.teams WHERE code = 'UZB'),
   (SELECT id FROM public.teams WHERE code = 'COL'),
   '2026-06-17T15:00:00Z', 'AT&T Stadium, Dallas'),

  ('group', (SELECT id FROM public.groups WHERE name = 'K'), 63,
   (SELECT id FROM public.teams WHERE code = 'POR'),
   (SELECT id FROM public.teams WHERE code = 'UZB'),
   '2026-06-24T19:00:00Z', 'SoFi Stadium, Los Angeles'),

  ('group', (SELECT id FROM public.groups WHERE name = 'K'), 64,
   (SELECT id FROM public.teams WHERE code = 'COD'),
   (SELECT id FROM public.teams WHERE code = 'COL'),
   '2026-06-24T15:00:00Z', 'AT&T Stadium, Dallas'),

  ('group', (SELECT id FROM public.groups WHERE name = 'K'), 65,
   (SELECT id FROM public.teams WHERE code = 'POR'),
   (SELECT id FROM public.teams WHERE code = 'COL'),
   '2026-06-27T19:00:00Z', 'Levi''s Stadium, San Francisco'),

  ('group', (SELECT id FROM public.groups WHERE name = 'K'), 66,
   (SELECT id FROM public.teams WHERE code = 'COD'),
   (SELECT id FROM public.teams WHERE code = 'UZB'),
   '2026-06-27T19:00:00Z', 'AT&T Stadium, Dallas');

-- GROUP L  (England, Croatia, Ghana, Panama)  matches 67–72
INSERT INTO public.matches (stage, group_id, match_number, home_team_id, away_team_id, scheduled_at, venue) VALUES
  ('group', (SELECT id FROM public.groups WHERE name = 'L'), 67,
   (SELECT id FROM public.teams WHERE code = 'ENG'),
   (SELECT id FROM public.teams WHERE code = 'CRO'),
   '2026-06-17T19:00:00Z', 'Gillette Stadium, Boston'),

  ('group', (SELECT id FROM public.groups WHERE name = 'L'), 68,
   (SELECT id FROM public.teams WHERE code = 'GHA'),
   (SELECT id FROM public.teams WHERE code = 'PAN'),
   '2026-06-17T23:00:00Z', 'MetLife Stadium, New York/New Jersey'),

  ('group', (SELECT id FROM public.groups WHERE name = 'L'), 69,
   (SELECT id FROM public.teams WHERE code = 'ENG'),
   (SELECT id FROM public.teams WHERE code = 'GHA'),
   '2026-06-23T19:00:00Z', 'Gillette Stadium, Boston'),

  ('group', (SELECT id FROM public.groups WHERE name = 'L'), 70,
   (SELECT id FROM public.teams WHERE code = 'CRO'),
   (SELECT id FROM public.teams WHERE code = 'PAN'),
   '2026-06-23T23:00:00Z', 'MetLife Stadium, New York/New Jersey'),

  ('group', (SELECT id FROM public.groups WHERE name = 'L'), 71,
   (SELECT id FROM public.teams WHERE code = 'ENG'),
   (SELECT id FROM public.teams WHERE code = 'PAN'),
   '2026-06-27T19:00:00Z', 'Gillette Stadium, Boston'),

  ('group', (SELECT id FROM public.groups WHERE name = 'L'), 72,
   (SELECT id FROM public.teams WHERE code = 'CRO'),
   (SELECT id FROM public.teams WHERE code = 'GHA'),
   '2026-06-27T19:00:00Z', 'MetLife Stadium, New York/New Jersey');

-- -----------------------------------------------------------------------------
-- 4. KNOCKOUT STAGE SHELLS (matches 73–104, no teams assigned yet)
-- Real 2026 World Cup knockout window: R32 Jun 28 – Jul 3, R16 Jul 4 – 7,
-- QF Jul 9 – 11, SF Jul 14 – 15, third place Jul 18, final Jul 19.
-- -----------------------------------------------------------------------------

-- ROUND OF 32 (16 matches: 73–88)
-- June 28 – July 3, 2026
INSERT INTO public.matches (stage, match_number, scheduled_at, venue) VALUES
  ('r32', 73,  '2026-06-28T19:00:00Z', 'Estadio Azteca, Mexico City'),
  ('r32', 74,  '2026-06-28T23:00:00Z', 'SoFi Stadium, Los Angeles'),
  ('r32', 75,  '2026-06-29T19:00:00Z', 'Gillette Stadium, Boston'),
  ('r32', 76,  '2026-06-29T23:00:00Z', 'Levi''s Stadium, San Francisco'),
  ('r32', 77,  '2026-06-30T19:00:00Z', 'AT&T Stadium, Dallas'),
  ('r32', 78,  '2026-06-30T23:00:00Z', 'BC Place, Vancouver'),
  ('r32', 79,  '2026-07-01T19:00:00Z', 'NRG Stadium, Houston'),
  ('r32', 80,  '2026-07-01T23:00:00Z', 'Lumen Field, Seattle'),
  ('r32', 81,  '2026-07-02T19:00:00Z', 'Mercedes-Benz Stadium, Atlanta'),
  ('r32', 82,  '2026-07-02T23:00:00Z', 'Estadio Akron, Guadalajara'),
  ('r32', 83,  '2026-07-02T16:00:00Z', 'Lincoln Financial Field, Philadelphia'),
  ('r32', 84,  '2026-07-03T19:00:00Z', 'MetLife Stadium, New York/New Jersey'),
  ('r32', 85,  '2026-07-03T23:00:00Z', 'Hard Rock Stadium, Miami'),
  ('r32', 86,  '2026-07-03T16:00:00Z', 'Arrowhead Stadium, Kansas City'),
  ('r32', 87,  '2026-07-01T16:00:00Z', 'Estadio BBVA, Monterrey'),
  ('r32', 88,  '2026-06-30T16:00:00Z', 'BMO Field, Toronto');

-- ROUND OF 16 (8 matches: 89–96)
-- July 4–7, 2026  (2 matches per day)
INSERT INTO public.matches (stage, match_number, scheduled_at, venue) VALUES
  ('r16', 89,  '2026-07-04T19:00:00Z', 'AT&T Stadium, Dallas'),
  ('r16', 90,  '2026-07-04T23:00:00Z', 'SoFi Stadium, Los Angeles'),
  ('r16', 91,  '2026-07-05T19:00:00Z', 'MetLife Stadium, New York/New Jersey'),
  ('r16', 92,  '2026-07-05T23:00:00Z', 'Levi''s Stadium, San Francisco'),
  ('r16', 93,  '2026-07-06T19:00:00Z', 'Mercedes-Benz Stadium, Atlanta'),
  ('r16', 94,  '2026-07-06T23:00:00Z', 'Lumen Field, Seattle'),
  ('r16', 95,  '2026-07-07T19:00:00Z', 'Hard Rock Stadium, Miami'),
  ('r16', 96,  '2026-07-07T23:00:00Z', 'NRG Stadium, Houston');

-- QUARTER-FINALS (4 matches: 97–100)
-- July 9–11, 2026
INSERT INTO public.matches (stage, match_number, scheduled_at, venue) VALUES
  ('qf',  97,  '2026-07-09T23:00:00Z', 'SoFi Stadium, Los Angeles'),
  ('qf',  98,  '2026-07-10T19:00:00Z', 'Gillette Stadium, Boston'),
  ('qf',  99,  '2026-07-11T19:00:00Z', 'AT&T Stadium, Dallas'),
  ('qf', 100,  '2026-07-11T23:00:00Z', 'Arrowhead Stadium, Kansas City');

-- SEMI-FINALS (2 matches: 101–102)
-- July 14–15, 2026
INSERT INTO public.matches (stage, match_number, scheduled_at, venue) VALUES
  ('sf', 101,  '2026-07-14T19:00:00Z', 'AT&T Stadium, Dallas'),
  ('sf', 102,  '2026-07-15T19:00:00Z', 'Mercedes-Benz Stadium, Atlanta');

-- THIRD PLACE (1 match: 103)
-- July 18, 2026
INSERT INTO public.matches (stage, match_number, scheduled_at, venue) VALUES
  ('third_place', 103, '2026-07-18T19:00:00Z', 'Hard Rock Stadium, Miami');

-- FINAL (1 match: 104)
-- July 19, 2026
INSERT INTO public.matches (stage, match_number, scheduled_at, venue) VALUES
  ('final', 104, '2026-07-19T19:00:00Z', 'MetLife Stadium, New York/New Jersey');
