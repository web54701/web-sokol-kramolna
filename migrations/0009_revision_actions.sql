-- CMS: revize obsahu nesou zone/type a druh události (přežijí smazání prvku)

ALTER TABLE content_revisions ADD COLUMN zone TEXT NOT NULL DEFAULT '';
ALTER TABLE content_revisions ADD COLUMN type TEXT NOT NULL DEFAULT '';
ALTER TABLE content_revisions ADD COLUMN action TEXT NOT NULL DEFAULT 'update';

UPDATE content_revisions SET
  zone = COALESCE((SELECT o.zone FROM content_objects o WHERE o.id = object_id), ''),
  type = COALESCE((SELECT o.type FROM content_objects o WHERE o.id = object_id), '');
