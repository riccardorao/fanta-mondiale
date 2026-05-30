-- =============================================================================
-- SEED DATA: FIFA World Cup 2026
-- Groups, Teams, Group Stage Matches (1-72), Knockout Shells (73-104)
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
-- 2. TEAMS (48 total, 4 per group)
-- Group A: USA, Italy, Senegal, Japan
-- Group B: Mexico, Belgium, Egypt, South Korea
-- Group C: Canada, Croatia, Nigeria, Argentina
-- Group D: Panama, France, Morocco, Saudi Arabia
-- Group E: Honduras, England, Brazil, Uzbekistan
-- Group F: Costa Rica, Spain, Colombia, Iran
-- Group G: Germany, Switzerland, Uruguay, Tunisia
-- Group H: Portugal, Turkey, Venezuela, DR Congo
-- Group I: Netherlands, Czech Republic, Cameroon, Iraq
-- Group J: Denmark, Austria, South Africa, Australia
-- Group K: Hungary, Slovakia, Côte d'Ivoire, Jordan
-- Group L: Scotland, New Zealand, TBD1, TBD2
-- -----------------------------------------------------------------------------
INSERT INTO public.teams (name, code, flag_emoji, group_id, confederation) VALUES
  ('USA',            'USA', '🇺🇸', (SELECT id FROM public.groups WHERE name = 'A'), 'CONCACAF'),
  ('Italy',          'ITA', '🇮🇹', (SELECT id FROM public.groups WHERE name = 'A'), 'UEFA'),
  ('Senegal',        'SEN', '🇸🇳', (SELECT id FROM public.groups WHERE name = 'A'), 'CAF'),
  ('Japan',          'JPN', '🇯🇵', (SELECT id FROM public.groups WHERE name = 'A'), 'AFC'),

  ('Mexico',         'MEX', '🇲🇽', (SELECT id FROM public.groups WHERE name = 'B'), 'CONCACAF'),
  ('Belgium',        'BEL', '🇧🇪', (SELECT id FROM public.groups WHERE name = 'B'), 'UEFA'),
  ('Egypt',          'EGY', '🇪🇬', (SELECT id FROM public.groups WHERE name = 'B'), 'CAF'),
  ('South Korea',    'KOR', '🇰🇷', (SELECT id FROM public.groups WHERE name = 'B'), 'AFC'),

  ('Canada',         'CAN', '🇨🇦', (SELECT id FROM public.groups WHERE name = 'C'), 'CONCACAF'),
  ('Croatia',        'CRO', '🇭🇷', (SELECT id FROM public.groups WHERE name = 'C'), 'UEFA'),
  ('Nigeria',        'NGA', '🇳🇬', (SELECT id FROM public.groups WHERE name = 'C'), 'CAF'),
  ('Argentina',      'ARG', '🇦🇷', (SELECT id FROM public.groups WHERE name = 'C'), 'CONMEBOL'),

  ('Panama',         'PAN', '🇵🇦', (SELECT id FROM public.groups WHERE name = 'D'), 'CONCACAF'),
  ('France',         'FRA', '🇫🇷', (SELECT id FROM public.groups WHERE name = 'D'), 'UEFA'),
  ('Morocco',        'MAR', '🇲🇦', (SELECT id FROM public.groups WHERE name = 'D'), 'CAF'),
  ('Saudi Arabia',   'KSA', '🇸🇦', (SELECT id FROM public.groups WHERE name = 'D'), 'AFC'),

  ('Honduras',       'HON', '🇭🇳', (SELECT id FROM public.groups WHERE name = 'E'), 'CONCACAF'),
  ('England',        'ENG', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', (SELECT id FROM public.groups WHERE name = 'E'), 'UEFA'),
  ('Brazil',         'BRA', '🇧🇷', (SELECT id FROM public.groups WHERE name = 'E'), 'CONMEBOL'),
  ('Uzbekistan',     'UZB', '🇺🇿', (SELECT id FROM public.groups WHERE name = 'E'), 'AFC'),

  ('Costa Rica',     'CRC', '🇨🇷', (SELECT id FROM public.groups WHERE name = 'F'), 'CONCACAF'),
  ('Spain',          'ESP', '🇪🇸', (SELECT id FROM public.groups WHERE name = 'F'), 'UEFA'),
  ('Colombia',       'COL', '🇨🇴', (SELECT id FROM public.groups WHERE name = 'F'), 'CONMEBOL'),
  ('Iran',           'IRN', '🇮🇷', (SELECT id FROM public.groups WHERE name = 'F'), 'AFC'),

  ('Germany',        'GER', '🇩🇪', (SELECT id FROM public.groups WHERE name = 'G'), 'UEFA'),
  ('Switzerland',    'SUI', '🇨🇭', (SELECT id FROM public.groups WHERE name = 'G'), 'UEFA'),
  ('Uruguay',        'URU', '🇺🇾', (SELECT id FROM public.groups WHERE name = 'G'), 'CONMEBOL'),
  ('Tunisia',        'TUN', '🇹🇳', (SELECT id FROM public.groups WHERE name = 'G'), 'CAF'),

  ('Portugal',       'POR', '🇵🇹', (SELECT id FROM public.groups WHERE name = 'H'), 'UEFA'),
  ('Turkey',         'TUR', '🇹🇷', (SELECT id FROM public.groups WHERE name = 'H'), 'UEFA'),
  ('Venezuela',      'VEN', '🇻🇪', (SELECT id FROM public.groups WHERE name = 'H'), 'CONMEBOL'),
  ('DR Congo',       'COD', '🇨🇩', (SELECT id FROM public.groups WHERE name = 'H'), 'CAF'),

  ('Netherlands',    'NED', '🇳🇱', (SELECT id FROM public.groups WHERE name = 'I'), 'UEFA'),
  ('Czech Republic', 'CZE', '🇨🇿', (SELECT id FROM public.groups WHERE name = 'I'), 'UEFA'),
  ('Cameroon',       'CMR', '🇨🇲', (SELECT id FROM public.groups WHERE name = 'I'), 'CAF'),
  ('Iraq',           'IRQ', '🇮🇶', (SELECT id FROM public.groups WHERE name = 'I'), 'AFC'),

  ('Denmark',        'DEN', '🇩🇰', (SELECT id FROM public.groups WHERE name = 'J'), 'UEFA'),
  ('Austria',        'AUT', '🇦🇹', (SELECT id FROM public.groups WHERE name = 'J'), 'UEFA'),
  ('South Africa',   'RSA', '🇿🇦', (SELECT id FROM public.groups WHERE name = 'J'), 'CAF'),
  ('Australia',      'AUS', '🇦🇺', (SELECT id FROM public.groups WHERE name = 'J'), 'AFC'),

  ('Hungary',        'HUN', '🇭🇺', (SELECT id FROM public.groups WHERE name = 'K'), 'UEFA'),
  ('Slovakia',       'SVK', '🇸🇰', (SELECT id FROM public.groups WHERE name = 'K'), 'UEFA'),
  ('Côte d''Ivoire', 'CIV', '🇨🇮', (SELECT id FROM public.groups WHERE name = 'K'), 'CAF'),
  ('Jordan',         'JOR', '🇯🇴', (SELECT id FROM public.groups WHERE name = 'K'), 'AFC'),

  ('Scotland',       'SCO', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', (SELECT id FROM public.groups WHERE name = 'L'), 'UEFA'),
  ('New Zealand',    'NZL', '🇳🇿', (SELECT id FROM public.groups WHERE name = 'L'), 'OFC'),
  ('TBD1',           'TB1', '🏳',  (SELECT id FROM public.groups WHERE name = 'L'), 'Intercon'),
  ('TBD2',           'TB2', '🏳',  (SELECT id FROM public.groups WHERE name = 'L'), 'Intercon');

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
-- MD1 dates: A=Jun12, B=Jun13, C=Jun12, D=Jun13, E=Jun14, F=Jun14,
--            G=Jun15, H=Jun15, I=Jun16, J=Jun16, K=Jun17, L=Jun17
-- MD2 dates: A=Jun19, B=Jun19, C=Jun20, D=Jun20, E=Jun21 F=Jun21,
--            G=Jun22, H=Jun22, I=Jun23, J=Jun23, K=Jun24, L=Jun24
-- MD3 dates: A=Jun26, B=Jun26, C=Jun26, D=Jun26, E=Jun27, F=Jun27,
--            G=Jun27, H=Jun27, I=Jun28, J=Jun28, K=Jun28, L=Jun28
-- -----------------------------------------------------------------------------

-- GROUP A  (USA, Italy, Senegal, Japan)  matches 1–6
INSERT INTO public.matches (stage, group_id, match_number, home_team_id, away_team_id, scheduled_at, venue) VALUES
  ('group', (SELECT id FROM public.groups WHERE name = 'A'), 1,
   (SELECT id FROM public.teams WHERE code = 'USA'),
   (SELECT id FROM public.teams WHERE code = 'ITA'),
   '2026-06-12T15:00:00Z', 'SoFi Stadium, Los Angeles'),

  ('group', (SELECT id FROM public.groups WHERE name = 'A'), 2,
   (SELECT id FROM public.teams WHERE code = 'SEN'),
   (SELECT id FROM public.teams WHERE code = 'JPN'),
   '2026-06-12T19:00:00Z', 'MetLife Stadium, New York/New Jersey'),

  ('group', (SELECT id FROM public.groups WHERE name = 'A'), 3,
   (SELECT id FROM public.teams WHERE code = 'USA'),
   (SELECT id FROM public.teams WHERE code = 'SEN'),
   '2026-06-19T15:00:00Z', 'AT&T Stadium, Dallas'),

  ('group', (SELECT id FROM public.groups WHERE name = 'A'), 4,
   (SELECT id FROM public.teams WHERE code = 'ITA'),
   (SELECT id FROM public.teams WHERE code = 'JPN'),
   '2026-06-19T19:00:00Z', 'Levi''s Stadium, San Francisco'),

  ('group', (SELECT id FROM public.groups WHERE name = 'A'), 5,
   (SELECT id FROM public.teams WHERE code = 'USA'),
   (SELECT id FROM public.teams WHERE code = 'JPN'),
   '2026-06-26T19:00:00Z', 'Arrowhead Stadium, Kansas City'),

  ('group', (SELECT id FROM public.groups WHERE name = 'A'), 6,
   (SELECT id FROM public.teams WHERE code = 'ITA'),
   (SELECT id FROM public.teams WHERE code = 'SEN'),
   '2026-06-26T19:00:00Z', 'Empower Field, Denver');

-- GROUP B  (Mexico, Belgium, Egypt, South Korea)  matches 7–12
INSERT INTO public.matches (stage, group_id, match_number, home_team_id, away_team_id, scheduled_at, venue) VALUES
  ('group', (SELECT id FROM public.groups WHERE name = 'B'), 7,
   (SELECT id FROM public.teams WHERE code = 'MEX'),
   (SELECT id FROM public.teams WHERE code = 'BEL'),
   '2026-06-13T15:00:00Z', 'Estadio Akron, Guadalajara'),

  ('group', (SELECT id FROM public.groups WHERE name = 'B'), 8,
   (SELECT id FROM public.teams WHERE code = 'EGY'),
   (SELECT id FROM public.teams WHERE code = 'KOR'),
   '2026-06-13T19:00:00Z', 'Mercedes-Benz Stadium, Atlanta'),

  ('group', (SELECT id FROM public.groups WHERE name = 'B'), 9,
   (SELECT id FROM public.teams WHERE code = 'MEX'),
   (SELECT id FROM public.teams WHERE code = 'EGY'),
   '2026-06-19T15:00:00Z', 'Estadio BBVA, Monterrey'),

  ('group', (SELECT id FROM public.groups WHERE name = 'B'), 10,
   (SELECT id FROM public.teams WHERE code = 'BEL'),
   (SELECT id FROM public.teams WHERE code = 'KOR'),
   '2026-06-19T19:00:00Z', 'Hard Rock Stadium, Miami'),

  ('group', (SELECT id FROM public.groups WHERE name = 'B'), 11,
   (SELECT id FROM public.teams WHERE code = 'MEX'),
   (SELECT id FROM public.teams WHERE code = 'KOR'),
   '2026-06-26T19:00:00Z', 'Estadio Azteca, Mexico City'),

  ('group', (SELECT id FROM public.groups WHERE name = 'B'), 12,
   (SELECT id FROM public.teams WHERE code = 'BEL'),
   (SELECT id FROM public.teams WHERE code = 'EGY'),
   '2026-06-26T19:00:00Z', 'Lincoln Financial Field, Philadelphia');

-- GROUP C  (Canada, Croatia, Nigeria, Argentina)  matches 13–18
INSERT INTO public.matches (stage, group_id, match_number, home_team_id, away_team_id, scheduled_at, venue) VALUES
  ('group', (SELECT id FROM public.groups WHERE name = 'C'), 13,
   (SELECT id FROM public.teams WHERE code = 'CAN'),
   (SELECT id FROM public.teams WHERE code = 'CRO'),
   '2026-06-12T15:00:00Z', 'BC Place, Vancouver'),

  ('group', (SELECT id FROM public.groups WHERE name = 'C'), 14,
   (SELECT id FROM public.teams WHERE code = 'NGA'),
   (SELECT id FROM public.teams WHERE code = 'ARG'),
   '2026-06-12T19:00:00Z', 'MetLife Stadium, New York/New Jersey'),

  ('group', (SELECT id FROM public.groups WHERE name = 'C'), 15,
   (SELECT id FROM public.teams WHERE code = 'CAN'),
   (SELECT id FROM public.teams WHERE code = 'NGA'),
   '2026-06-20T15:00:00Z', 'BMO Field, Toronto'),

  ('group', (SELECT id FROM public.groups WHERE name = 'C'), 16,
   (SELECT id FROM public.teams WHERE code = 'CRO'),
   (SELECT id FROM public.teams WHERE code = 'ARG'),
   '2026-06-20T19:00:00Z', 'AT&T Stadium, Dallas'),

  ('group', (SELECT id FROM public.groups WHERE name = 'C'), 17,
   (SELECT id FROM public.teams WHERE code = 'CAN'),
   (SELECT id FROM public.teams WHERE code = 'ARG'),
   '2026-06-26T19:00:00Z', 'Gillette Stadium, Boston'),

  ('group', (SELECT id FROM public.groups WHERE name = 'C'), 18,
   (SELECT id FROM public.teams WHERE code = 'CRO'),
   (SELECT id FROM public.teams WHERE code = 'NGA'),
   '2026-06-26T19:00:00Z', 'SoFi Stadium, Los Angeles');

-- GROUP D  (Panama, France, Morocco, Saudi Arabia)  matches 19–24
INSERT INTO public.matches (stage, group_id, match_number, home_team_id, away_team_id, scheduled_at, venue) VALUES
  ('group', (SELECT id FROM public.groups WHERE name = 'D'), 19,
   (SELECT id FROM public.teams WHERE code = 'PAN'),
   (SELECT id FROM public.teams WHERE code = 'FRA'),
   '2026-06-13T15:00:00Z', 'Hard Rock Stadium, Miami'),

  ('group', (SELECT id FROM public.groups WHERE name = 'D'), 20,
   (SELECT id FROM public.teams WHERE code = 'MAR'),
   (SELECT id FROM public.teams WHERE code = 'KSA'),
   '2026-06-13T19:00:00Z', 'SoFi Stadium, Los Angeles'),

  ('group', (SELECT id FROM public.groups WHERE name = 'D'), 21,
   (SELECT id FROM public.teams WHERE code = 'PAN'),
   (SELECT id FROM public.teams WHERE code = 'MAR'),
   '2026-06-20T15:00:00Z', 'Levi''s Stadium, San Francisco'),

  ('group', (SELECT id FROM public.groups WHERE name = 'D'), 22,
   (SELECT id FROM public.teams WHERE code = 'FRA'),
   (SELECT id FROM public.teams WHERE code = 'KSA'),
   '2026-06-20T19:00:00Z', 'MetLife Stadium, New York/New Jersey'),

  ('group', (SELECT id FROM public.groups WHERE name = 'D'), 23,
   (SELECT id FROM public.teams WHERE code = 'PAN'),
   (SELECT id FROM public.teams WHERE code = 'KSA'),
   '2026-06-26T19:00:00Z', 'Arrowhead Stadium, Kansas City'),

  ('group', (SELECT id FROM public.groups WHERE name = 'D'), 24,
   (SELECT id FROM public.teams WHERE code = 'FRA'),
   (SELECT id FROM public.teams WHERE code = 'MAR'),
   '2026-06-26T19:00:00Z', 'AT&T Stadium, Dallas');

-- GROUP E  (Honduras, England, Brazil, Uzbekistan)  matches 25–30
INSERT INTO public.matches (stage, group_id, match_number, home_team_id, away_team_id, scheduled_at, venue) VALUES
  ('group', (SELECT id FROM public.groups WHERE name = 'E'), 25,
   (SELECT id FROM public.teams WHERE code = 'HON'),
   (SELECT id FROM public.teams WHERE code = 'ENG'),
   '2026-06-14T15:00:00Z', 'Estadio Universitario, Monterrey'),

  ('group', (SELECT id FROM public.groups WHERE name = 'E'), 26,
   (SELECT id FROM public.teams WHERE code = 'BRA'),
   (SELECT id FROM public.teams WHERE code = 'UZB'),
   '2026-06-14T19:00:00Z', 'MetLife Stadium, New York/New Jersey'),

  ('group', (SELECT id FROM public.groups WHERE name = 'E'), 27,
   (SELECT id FROM public.teams WHERE code = 'HON'),
   (SELECT id FROM public.teams WHERE code = 'BRA'),
   '2026-06-21T15:00:00Z', 'AT&T Stadium, Dallas'),

  ('group', (SELECT id FROM public.groups WHERE name = 'E'), 28,
   (SELECT id FROM public.teams WHERE code = 'ENG'),
   (SELECT id FROM public.teams WHERE code = 'UZB'),
   '2026-06-21T19:00:00Z', 'Levi''s Stadium, San Francisco'),

  ('group', (SELECT id FROM public.groups WHERE name = 'E'), 29,
   (SELECT id FROM public.teams WHERE code = 'HON'),
   (SELECT id FROM public.teams WHERE code = 'UZB'),
   '2026-06-27T19:00:00Z', 'Empower Field, Denver'),

  ('group', (SELECT id FROM public.groups WHERE name = 'E'), 30,
   (SELECT id FROM public.teams WHERE code = 'ENG'),
   (SELECT id FROM public.teams WHERE code = 'BRA'),
   '2026-06-27T19:00:00Z', 'Hard Rock Stadium, Miami');

-- GROUP F  (Costa Rica, Spain, Colombia, Iran)  matches 31–36
INSERT INTO public.matches (stage, group_id, match_number, home_team_id, away_team_id, scheduled_at, venue) VALUES
  ('group', (SELECT id FROM public.groups WHERE name = 'F'), 31,
   (SELECT id FROM public.teams WHERE code = 'CRC'),
   (SELECT id FROM public.teams WHERE code = 'ESP'),
   '2026-06-14T15:00:00Z', 'SoFi Stadium, Los Angeles'),

  ('group', (SELECT id FROM public.groups WHERE name = 'F'), 32,
   (SELECT id FROM public.teams WHERE code = 'COL'),
   (SELECT id FROM public.teams WHERE code = 'IRN'),
   '2026-06-14T19:00:00Z', 'Arrowhead Stadium, Kansas City'),

  ('group', (SELECT id FROM public.groups WHERE name = 'F'), 33,
   (SELECT id FROM public.teams WHERE code = 'CRC'),
   (SELECT id FROM public.teams WHERE code = 'COL'),
   '2026-06-21T15:00:00Z', 'Mercedes-Benz Stadium, Atlanta'),

  ('group', (SELECT id FROM public.groups WHERE name = 'F'), 34,
   (SELECT id FROM public.teams WHERE code = 'ESP'),
   (SELECT id FROM public.teams WHERE code = 'IRN'),
   '2026-06-21T19:00:00Z', 'MetLife Stadium, New York/New Jersey'),

  ('group', (SELECT id FROM public.groups WHERE name = 'F'), 35,
   (SELECT id FROM public.teams WHERE code = 'CRC'),
   (SELECT id FROM public.teams WHERE code = 'IRN'),
   '2026-06-27T19:00:00Z', 'Gillette Stadium, Boston'),

  ('group', (SELECT id FROM public.groups WHERE name = 'F'), 36,
   (SELECT id FROM public.teams WHERE code = 'ESP'),
   (SELECT id FROM public.teams WHERE code = 'COL'),
   '2026-06-27T19:00:00Z', 'AT&T Stadium, Dallas');

-- GROUP G  (Germany, Switzerland, Uruguay, Tunisia)  matches 37–42
INSERT INTO public.matches (stage, group_id, match_number, home_team_id, away_team_id, scheduled_at, venue) VALUES
  ('group', (SELECT id FROM public.groups WHERE name = 'G'), 37,
   (SELECT id FROM public.teams WHERE code = 'GER'),
   (SELECT id FROM public.teams WHERE code = 'SUI'),
   '2026-06-15T15:00:00Z', 'MetLife Stadium, New York/New Jersey'),

  ('group', (SELECT id FROM public.groups WHERE name = 'G'), 38,
   (SELECT id FROM public.teams WHERE code = 'URU'),
   (SELECT id FROM public.teams WHERE code = 'TUN'),
   '2026-06-15T19:00:00Z', 'Hard Rock Stadium, Miami'),

  ('group', (SELECT id FROM public.groups WHERE name = 'G'), 39,
   (SELECT id FROM public.teams WHERE code = 'GER'),
   (SELECT id FROM public.teams WHERE code = 'URU'),
   '2026-06-22T15:00:00Z', 'AT&T Stadium, Dallas'),

  ('group', (SELECT id FROM public.groups WHERE name = 'G'), 40,
   (SELECT id FROM public.teams WHERE code = 'SUI'),
   (SELECT id FROM public.teams WHERE code = 'TUN'),
   '2026-06-22T19:00:00Z', 'SoFi Stadium, Los Angeles'),

  ('group', (SELECT id FROM public.groups WHERE name = 'G'), 41,
   (SELECT id FROM public.teams WHERE code = 'GER'),
   (SELECT id FROM public.teams WHERE code = 'TUN'),
   '2026-06-27T19:00:00Z', 'Lincoln Financial Field, Philadelphia'),

  ('group', (SELECT id FROM public.groups WHERE name = 'G'), 42,
   (SELECT id FROM public.teams WHERE code = 'SUI'),
   (SELECT id FROM public.teams WHERE code = 'URU'),
   '2026-06-27T19:00:00Z', 'Levi''s Stadium, San Francisco');

-- GROUP H  (Portugal, Turkey, Venezuela, DR Congo)  matches 43–48
INSERT INTO public.matches (stage, group_id, match_number, home_team_id, away_team_id, scheduled_at, venue) VALUES
  ('group', (SELECT id FROM public.groups WHERE name = 'H'), 43,
   (SELECT id FROM public.teams WHERE code = 'POR'),
   (SELECT id FROM public.teams WHERE code = 'TUR'),
   '2026-06-15T15:00:00Z', 'Gillette Stadium, Boston'),

  ('group', (SELECT id FROM public.groups WHERE name = 'H'), 44,
   (SELECT id FROM public.teams WHERE code = 'VEN'),
   (SELECT id FROM public.teams WHERE code = 'COD'),
   '2026-06-15T19:00:00Z', 'Arrowhead Stadium, Kansas City'),

  ('group', (SELECT id FROM public.groups WHERE name = 'H'), 45,
   (SELECT id FROM public.teams WHERE code = 'POR'),
   (SELECT id FROM public.teams WHERE code = 'VEN'),
   '2026-06-22T15:00:00Z', 'MetLife Stadium, New York/New Jersey'),

  ('group', (SELECT id FROM public.groups WHERE name = 'H'), 46,
   (SELECT id FROM public.teams WHERE code = 'TUR'),
   (SELECT id FROM public.teams WHERE code = 'COD'),
   '2026-06-22T19:00:00Z', 'Mercedes-Benz Stadium, Atlanta'),

  ('group', (SELECT id FROM public.groups WHERE name = 'H'), 47,
   (SELECT id FROM public.teams WHERE code = 'POR'),
   (SELECT id FROM public.teams WHERE code = 'COD'),
   '2026-06-28T19:00:00Z', 'Empower Field, Denver'),

  ('group', (SELECT id FROM public.groups WHERE name = 'H'), 48,
   (SELECT id FROM public.teams WHERE code = 'TUR'),
   (SELECT id FROM public.teams WHERE code = 'VEN'),
   '2026-06-28T19:00:00Z', 'SoFi Stadium, Los Angeles');

-- GROUP I  (Netherlands, Czech Republic, Cameroon, Iraq)  matches 49–54
INSERT INTO public.matches (stage, group_id, match_number, home_team_id, away_team_id, scheduled_at, venue) VALUES
  ('group', (SELECT id FROM public.groups WHERE name = 'I'), 49,
   (SELECT id FROM public.teams WHERE code = 'NED'),
   (SELECT id FROM public.teams WHERE code = 'CZE'),
   '2026-06-16T15:00:00Z', 'Lincoln Financial Field, Philadelphia'),

  ('group', (SELECT id FROM public.groups WHERE name = 'I'), 50,
   (SELECT id FROM public.teams WHERE code = 'CMR'),
   (SELECT id FROM public.teams WHERE code = 'IRQ'),
   '2026-06-16T19:00:00Z', 'AT&T Stadium, Dallas'),

  ('group', (SELECT id FROM public.groups WHERE name = 'I'), 51,
   (SELECT id FROM public.teams WHERE code = 'NED'),
   (SELECT id FROM public.teams WHERE code = 'CMR'),
   '2026-06-23T15:00:00Z', 'Hard Rock Stadium, Miami'),

  ('group', (SELECT id FROM public.groups WHERE name = 'I'), 52,
   (SELECT id FROM public.teams WHERE code = 'CZE'),
   (SELECT id FROM public.teams WHERE code = 'IRQ'),
   '2026-06-23T19:00:00Z', 'Levi''s Stadium, San Francisco'),

  ('group', (SELECT id FROM public.groups WHERE name = 'I'), 53,
   (SELECT id FROM public.teams WHERE code = 'NED'),
   (SELECT id FROM public.teams WHERE code = 'IRQ'),
   '2026-06-28T19:00:00Z', 'MetLife Stadium, New York/New Jersey'),

  ('group', (SELECT id FROM public.groups WHERE name = 'I'), 54,
   (SELECT id FROM public.teams WHERE code = 'CZE'),
   (SELECT id FROM public.teams WHERE code = 'CMR'),
   '2026-06-28T19:00:00Z', 'Gillette Stadium, Boston');

-- GROUP J  (Denmark, Austria, South Africa, Australia)  matches 55–60
INSERT INTO public.matches (stage, group_id, match_number, home_team_id, away_team_id, scheduled_at, venue) VALUES
  ('group', (SELECT id FROM public.groups WHERE name = 'J'), 55,
   (SELECT id FROM public.teams WHERE code = 'DEN'),
   (SELECT id FROM public.teams WHERE code = 'AUT'),
   '2026-06-16T15:00:00Z', 'Arrowhead Stadium, Kansas City'),

  ('group', (SELECT id FROM public.groups WHERE name = 'J'), 56,
   (SELECT id FROM public.teams WHERE code = 'RSA'),
   (SELECT id FROM public.teams WHERE code = 'AUS'),
   '2026-06-16T19:00:00Z', 'Mercedes-Benz Stadium, Atlanta'),

  ('group', (SELECT id FROM public.groups WHERE name = 'J'), 57,
   (SELECT id FROM public.teams WHERE code = 'DEN'),
   (SELECT id FROM public.teams WHERE code = 'RSA'),
   '2026-06-23T15:00:00Z', 'Empower Field, Denver'),

  ('group', (SELECT id FROM public.groups WHERE name = 'J'), 58,
   (SELECT id FROM public.teams WHERE code = 'AUT'),
   (SELECT id FROM public.teams WHERE code = 'AUS'),
   '2026-06-23T19:00:00Z', 'BC Place, Vancouver'),

  ('group', (SELECT id FROM public.groups WHERE name = 'J'), 59,
   (SELECT id FROM public.teams WHERE code = 'DEN'),
   (SELECT id FROM public.teams WHERE code = 'AUS'),
   '2026-06-28T19:00:00Z', 'SoFi Stadium, Los Angeles'),

  ('group', (SELECT id FROM public.groups WHERE name = 'J'), 60,
   (SELECT id FROM public.teams WHERE code = 'AUT'),
   (SELECT id FROM public.teams WHERE code = 'RSA'),
   '2026-06-28T19:00:00Z', 'AT&T Stadium, Dallas');

-- GROUP K  (Hungary, Slovakia, Côte d'Ivoire, Jordan)  matches 61–66
INSERT INTO public.matches (stage, group_id, match_number, home_team_id, away_team_id, scheduled_at, venue) VALUES
  ('group', (SELECT id FROM public.groups WHERE name = 'K'), 61,
   (SELECT id FROM public.teams WHERE code = 'HUN'),
   (SELECT id FROM public.teams WHERE code = 'SVK'),
   '2026-06-17T15:00:00Z', 'MetLife Stadium, New York/New Jersey'),

  ('group', (SELECT id FROM public.groups WHERE name = 'K'), 62,
   (SELECT id FROM public.teams WHERE code = 'CIV'),
   (SELECT id FROM public.teams WHERE code = 'JOR'),
   '2026-06-17T19:00:00Z', 'Hard Rock Stadium, Miami'),

  ('group', (SELECT id FROM public.groups WHERE name = 'K'), 63,
   (SELECT id FROM public.teams WHERE code = 'HUN'),
   (SELECT id FROM public.teams WHERE code = 'CIV'),
   '2026-06-24T15:00:00Z', 'Levi''s Stadium, San Francisco'),

  ('group', (SELECT id FROM public.groups WHERE name = 'K'), 64,
   (SELECT id FROM public.teams WHERE code = 'SVK'),
   (SELECT id FROM public.teams WHERE code = 'JOR'),
   '2026-06-24T19:00:00Z', 'Lincoln Financial Field, Philadelphia'),

  ('group', (SELECT id FROM public.groups WHERE name = 'K'), 65,
   (SELECT id FROM public.teams WHERE code = 'HUN'),
   (SELECT id FROM public.teams WHERE code = 'JOR'),
   '2026-06-29T19:00:00Z', 'Arrowhead Stadium, Kansas City'),

  ('group', (SELECT id FROM public.groups WHERE name = 'K'), 66,
   (SELECT id FROM public.teams WHERE code = 'SVK'),
   (SELECT id FROM public.teams WHERE code = 'CIV'),
   '2026-06-29T19:00:00Z', 'Mercedes-Benz Stadium, Atlanta');

-- GROUP L  (Scotland, New Zealand, TBD1, TBD2)  matches 67–72
INSERT INTO public.matches (stage, group_id, match_number, home_team_id, away_team_id, scheduled_at, venue) VALUES
  ('group', (SELECT id FROM public.groups WHERE name = 'L'), 67,
   (SELECT id FROM public.teams WHERE code = 'SCO'),
   (SELECT id FROM public.teams WHERE code = 'NZL'),
   '2026-06-17T15:00:00Z', 'Gillette Stadium, Boston'),

  ('group', (SELECT id FROM public.groups WHERE name = 'L'), 68,
   (SELECT id FROM public.teams WHERE code = 'TB1'),
   (SELECT id FROM public.teams WHERE code = 'TB2'),
   '2026-06-17T19:00:00Z', 'Empower Field, Denver'),

  ('group', (SELECT id FROM public.groups WHERE name = 'L'), 69,
   (SELECT id FROM public.teams WHERE code = 'SCO'),
   (SELECT id FROM public.teams WHERE code = 'TB1'),
   '2026-06-24T15:00:00Z', 'AT&T Stadium, Dallas'),

  ('group', (SELECT id FROM public.groups WHERE name = 'L'), 70,
   (SELECT id FROM public.teams WHERE code = 'NZL'),
   (SELECT id FROM public.teams WHERE code = 'TB2'),
   '2026-06-24T19:00:00Z', 'BMO Field, Toronto'),

  ('group', (SELECT id FROM public.groups WHERE name = 'L'), 71,
   (SELECT id FROM public.teams WHERE code = 'SCO'),
   (SELECT id FROM public.teams WHERE code = 'TB2'),
   '2026-06-29T19:00:00Z', 'SoFi Stadium, Los Angeles'),

  ('group', (SELECT id FROM public.groups WHERE name = 'L'), 72,
   (SELECT id FROM public.teams WHERE code = 'NZL'),
   (SELECT id FROM public.teams WHERE code = 'TB1'),
   '2026-06-29T19:00:00Z', 'MetLife Stadium, New York/New Jersey');

-- -----------------------------------------------------------------------------
-- 4. KNOCKOUT STAGE SHELLS (matches 73–104, no teams assigned yet)
-- -----------------------------------------------------------------------------

-- ROUND OF 32 (16 matches: 73–88)
-- June 30 – July 4, 2026  (4 matches on Jun 30, 4 on Jul 1, 4 on Jul 2, 4 on Jul 3/4)
INSERT INTO public.matches (stage, match_number, scheduled_at, venue) VALUES
  ('r32', 73,  '2026-06-30T15:00:00Z', 'MetLife Stadium, New York/New Jersey'),
  ('r32', 74,  '2026-06-30T19:00:00Z', 'SoFi Stadium, Los Angeles'),
  ('r32', 75,  '2026-07-01T15:00:00Z', 'AT&T Stadium, Dallas'),
  ('r32', 76,  '2026-07-01T19:00:00Z', 'Hard Rock Stadium, Miami'),
  ('r32', 77,  '2026-07-02T15:00:00Z', 'Levi''s Stadium, San Francisco'),
  ('r32', 78,  '2026-07-02T19:00:00Z', 'Mercedes-Benz Stadium, Atlanta'),
  ('r32', 79,  '2026-07-03T15:00:00Z', 'Lincoln Financial Field, Philadelphia'),
  ('r32', 80,  '2026-07-03T19:00:00Z', 'Arrowhead Stadium, Kansas City'),
  ('r32', 81,  '2026-07-04T15:00:00Z', 'Empower Field, Denver'),
  ('r32', 82,  '2026-07-04T19:00:00Z', 'Gillette Stadium, Boston'),
  ('r32', 83,  '2026-07-05T15:00:00Z', 'BC Place, Vancouver'),
  ('r32', 84,  '2026-07-05T19:00:00Z', 'BMO Field, Toronto'),
  ('r32', 85,  '2026-07-06T15:00:00Z', 'MetLife Stadium, New York/New Jersey'),
  ('r32', 86,  '2026-07-06T19:00:00Z', 'SoFi Stadium, Los Angeles'),
  ('r32', 87,  '2026-07-07T15:00:00Z', 'AT&T Stadium, Dallas'),
  ('r32', 88,  '2026-07-07T19:00:00Z', 'Hard Rock Stadium, Miami');

-- ROUND OF 16 (8 matches: 89–96)
-- July 8–11, 2026  (2 matches per day)
INSERT INTO public.matches (stage, match_number, scheduled_at, venue) VALUES
  ('r16', 89,  '2026-07-08T15:00:00Z', 'MetLife Stadium, New York/New Jersey'),
  ('r16', 90,  '2026-07-08T19:00:00Z', 'SoFi Stadium, Los Angeles'),
  ('r16', 91,  '2026-07-09T15:00:00Z', 'AT&T Stadium, Dallas'),
  ('r16', 92,  '2026-07-09T19:00:00Z', 'Hard Rock Stadium, Miami'),
  ('r16', 93,  '2026-07-10T15:00:00Z', 'Levi''s Stadium, San Francisco'),
  ('r16', 94,  '2026-07-10T19:00:00Z', 'Mercedes-Benz Stadium, Atlanta'),
  ('r16', 95,  '2026-07-11T15:00:00Z', 'MetLife Stadium, New York/New Jersey'),
  ('r16', 96,  '2026-07-11T19:00:00Z', 'SoFi Stadium, Los Angeles');

-- QUARTER-FINALS (4 matches: 97–100)
-- July 12–13, 2026  (2 matches per day)
INSERT INTO public.matches (stage, match_number, scheduled_at, venue) VALUES
  ('qf',  97,  '2026-07-12T15:00:00Z', 'MetLife Stadium, New York/New Jersey'),
  ('qf',  98,  '2026-07-12T19:00:00Z', 'SoFi Stadium, Los Angeles'),
  ('qf',  99,  '2026-07-13T15:00:00Z', 'AT&T Stadium, Dallas'),
  ('qf', 100,  '2026-07-13T19:00:00Z', 'Hard Rock Stadium, Miami');

-- SEMI-FINALS (2 matches: 101–102)
-- July 15–16, 2026
INSERT INTO public.matches (stage, match_number, scheduled_at, venue) VALUES
  ('sf', 101,  '2026-07-15T19:00:00Z', 'MetLife Stadium, New York/New Jersey'),
  ('sf', 102,  '2026-07-16T19:00:00Z', 'SoFi Stadium, Los Angeles');

-- THIRD PLACE (1 match: 103)
-- July 18, 2026
INSERT INTO public.matches (stage, match_number, scheduled_at, venue) VALUES
  ('third_place', 103, '2026-07-18T19:00:00Z', 'AT&T Stadium, Dallas');

-- FINAL (1 match: 104)
-- July 19, 2026
INSERT INTO public.matches (stage, match_number, scheduled_at, venue) VALUES
  ('final', 104, '2026-07-19T19:00:00Z', 'MetLife Stadium, New York/New Jersey');
