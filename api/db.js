import pg from 'pg';
const { Pool } = pg;

let pool;

export function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is missing.');
    }
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });
  }
  return pool;
}

export async function query(text, params) {
  const p = getPool();
  return p.query(text, params);
}

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS games (
  id          TEXT PRIMARY KEY,
  game_date   DATE NOT NULL,
  away        TEXT NOT NULL,
  home        TEXT NOT NULL,
  game_time   TIMESTAMPTZ,
  status      TEXT DEFAULT 'Scheduled',
  away_score  INT DEFAULT 0,
  home_score  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS odds_snapshots (
  id            BIGSERIAL PRIMARY KEY,
  game_id       TEXT REFERENCES games(id) ON DELETE CASCADE,
  captured_at   TIMESTAMPTZ DEFAULT NOW(),
  snapshot_type TEXT DEFAULT 'rolling',
  book          TEXT DEFAULT 'draftkings',
  ml_home       INT,
  ml_away       INT,
  ou_line       NUMERIC(4,1),
  ou_home_odds  INT DEFAULT -110,
  ou_away_odds  INT DEFAULT -110
);

CREATE TABLE IF NOT EXISTS odds_cache (
  game_id         TEXT PRIMARY KEY,
  game_date       TEXT,
  away            TEXT,
  home            TEXT,
  away_pitcher    TEXT,
  home_pitcher    TEXT,
  ml_home         INT,
  ml_away         INT,
  rl_home_line    TEXT,
  rl_home_price   INT,
  rl_away_line    TEXT,
  rl_away_price   INT,
  ou_line         NUMERIC(4,1),
  ou_over_price   INT,
  ou_under_price  INT,
  ml_home_open    INT,
  ml_away_open    INT,
  ou_line_open    NUMERIC(4,1),
  ou_over_open    INT,
  ou_under_open   INT,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS backtest_results (
  id           BIGSERIAL PRIMARY KEY,
  game_id      TEXT REFERENCES games(id) ON DELETE CASCADE,
  market       TEXT NOT NULL,
  pick         TEXT NOT NULL,
  signal       TEXT NOT NULL,
  ev           NUMERIC(6,4),
  hit          BOOLEAN NOT NULL,
  profit       NUMERIC(6,4) NOT NULL,
  game_date    DATE NOT NULL,
  recorded_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_games_date ON games(game_date);
CREATE INDEX IF NOT EXISTS idx_odds_game ON odds_snapshots(game_id);
CREATE INDEX IF NOT EXISTS idx_pred_game ON predictions(game_id);
CREATE INDEX IF NOT EXISTS idx_pred_closing ON predictions(is_closing) WHERE is_closing = TRUE;
CREATE INDEX IF NOT EXISTS idx_bt_date ON backtest_results(game_date);
CREATE INDEX IF NOT EXISTS idx_bt_sig ON backtest_results(signal, market);
`;

export async function initDb() {
  await query(SCHEMA_SQL);
}
