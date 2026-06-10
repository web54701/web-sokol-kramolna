-- CMS: metadata nahraných médií (soubory žijí v R2 bucketu sokol-kramolna-media)
CREATE TABLE IF NOT EXISTS media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  uploaded_by TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
