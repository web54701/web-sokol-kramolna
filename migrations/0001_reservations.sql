CREATE TABLE IF NOT EXISTS reservations (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  activity    TEXT NOT NULL,
  date        TEXT NOT NULL,
  hours       TEXT NOT NULL,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT NOT NULL DEFAULT '',
  note        TEXT NOT NULL DEFAULT '',
  payment     TEXT NOT NULL,
  price       INTEGER NOT NULL,
  created_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reservations_activity_date ON reservations (activity, date);
