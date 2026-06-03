CREATE TABLE IF NOT EXISTS settings (
  activity TEXT PRIMARY KEY,
  email_verification INTEGER NOT NULL DEFAULT 1
);

INSERT OR IGNORE INTO settings (activity, email_verification) VALUES ('tenis', 1);
INSERT OR IGNORE INTO settings (activity, email_verification) VALUES ('gym', 1);
