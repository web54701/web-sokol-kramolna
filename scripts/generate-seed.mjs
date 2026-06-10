// Vygeneruje migrations/0007_content.sql z src/content/default-content.mjs.
// Spustit po každé změně výchozího obsahu: node scripts/generate-seed.mjs
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { DEFAULT_CONTENT } from '../src/content/default-content.mjs';

const esc = (s) => s.replace(/'/g, "''");

const sortByZone = new Map();
const values = DEFAULT_CONTENT.map((o) => {
  const sort = sortByZone.get(o.zone) ?? 0;
  sortByZone.set(o.zone, sort + 1);
  return `  ('${esc(o.zone)}', '${esc(o.type)}', ${sort}, '${esc(JSON.stringify(o.data))}')`;
}).join(',\n');

const sql = `-- VYGENEROVÁNO scripts/generate-seed.mjs — needitovat ručně, upravit src/content/default-content.mjs.
-- CMS: obsahové objekty webu + revize

CREATE TABLE IF NOT EXISTS content_objects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  zone TEXT NOT NULL,
  type TEXT NOT NULL,
  sort INTEGER NOT NULL DEFAULT 0,
  hidden INTEGER NOT NULL DEFAULT 0,
  visibility TEXT NOT NULL DEFAULT 'all' CHECK (visibility IN ('all','desktop','mobile')),
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_content_zone ON content_objects(zone, sort);

CREATE TABLE IF NOT EXISTS content_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  object_id INTEGER NOT NULL,
  data TEXT NOT NULL,
  saved_by TEXT NOT NULL DEFAULT '',
  saved_at TEXT NOT NULL
);

-- Seed: naplní jen úplně prázdnou tabulku (idempotentní).
INSERT INTO content_objects (zone, type, sort, hidden, visibility, data, updated_at)
SELECT column1, column2, column3, 0, 'all', column4, datetime('now')
FROM (VALUES
${values}
)
WHERE NOT EXISTS (SELECT 1 FROM content_objects);
`;

const out = fileURLToPath(new URL('../migrations/0007_content.sql', import.meta.url));
writeFileSync(out, sql, 'utf8');
console.log(`Zapsáno ${DEFAULT_CONTENT.length} objektů do migrations/0007_content.sql`);
