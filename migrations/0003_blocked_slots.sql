CREATE TABLE IF NOT EXISTS blocked_slots (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  activity    TEXT    NOT NULL,
  type        TEXT    NOT NULL, -- 'recurring' | 'specific'
  dow         INTEGER,          -- 0=Ne … 6=So (jen recurring)
  date        TEXT,             -- YYYY-MM-DD (jen specific)
  hours       TEXT,             -- JSON pole čísel, NULL = celý den
  note        TEXT    NOT NULL DEFAULT '',
  note_public INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_activity ON blocked_slots (activity);
