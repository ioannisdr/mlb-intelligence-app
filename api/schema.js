// Database Schema Migration SQL for Neon PostgreSQL
export const SCHEMA_SQL = `
-- 1. Games table
CREATE TABLE IF NOT EXISTS games (
  id          TEXT PRIMARY KEY,  -- e.g. "2026-07-30-KC-MIN"
  game_date   DATE NOT NULL,
  away        TEXT NOT NULL,
  home        TEXT NOT NULL,
  game_time   TIMESTAMPTZ,
  status      TEXT DEFAULT 'Scheduled',
  away_score  INT DEFAULT 0,
  home_score  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Odds snapshots table
CREATE TABLE IF NOT EXISTS odds_snapshots (
  id            BIGSERIAL PRIMARY KEY,
  game_id       TEXT REFERENCES games(id) ON DELETE CASCADE,
  captured_at   TIMESTAMPTZ DEFAULT NOW(),
  snapshot_type TEXT DEFAULT 'rolling', -- 'opening' | 'rolling' | 'closing'
  book          TEXT DEFAULT 'draftkings',
  ml_home       INT,
  ml_away       INT,
  ou_line       NUMERIC(4,1),
  ou_home_odds  INT DEFAULT -110,
  ou_away_odds  INT DEFAULT -110
);

-- 3. Predictions table (server-calculated picks locked pre-game)
CREATE TABLE IF NOT EXISTS predictions (
  id           BIGSERIAL PRIMARY KEY,
  game_id      TEXT REFERENCES games(id) ON DELETE CASCADE,
  captured_at  TIMESTAMPTZ DEFAULT NOW(),
  is_closing   BOOLEAN DEFAULT FALSE,
  best_pick    TEXT,
  best_ev      NUMERIC(6,4),
  best_signal  TEXT,
  best_is_ou   BOOLEAN,
  ml_pick      TEXT,
  ml_ev        NUMERIC(6,4),
  ml_signal    TEXT,
  ml_odds      INT,
  ou_pick      TEXT,
  ou_ev        NUMERIC(6,4),
  ou_signal    TEXT,
  ou_line      NUMERIC(4,1),
  proj_total   NUMERIC(4,1),
  home_prob    NUMERIC(5,4),
  away_prob    NUMERIC(5,4)
);

-- 4. Backtest results ledger
CREATE TABLE IF NOT EXISTS backtest_results (
  id           BIGSERIAL PRIMARY KEY,
  game_id      TEXT REFERENCES games(id) ON DELETE CASCADE,
  market       TEXT NOT NULL, -- 'ML' | 'OU' | 'RL'
  pick         TEXT NOT NULL,
  signal       TEXT NOT NULL,
  ev           NUMERIC(6,4),
  hit          BOOLEAN NOT NULL,
  profit       NUMERIC(6,4) NOT NULL,
  game_date    DATE NOT NULL,
  recorded_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_games_date ON games(game_date);
CREATE INDEX IF NOT EXISTS idx_odds_game ON odds_snapshots(game_id);
CREATE INDEX IF NOT EXISTS idx_pred_game ON predictions(game_id);
CREATE INDEX IF NOT EXISTS idx_pred_closing ON predictions(is_closing) WHERE is_closing = TRUE;
CREATE INDEX IF NOT EXISTS idx_bt_date ON backtest_results(game_date);
CREATE INDEX IF NOT EXISTS idx_bt_sig ON backtest_results(signal, market);
`;
