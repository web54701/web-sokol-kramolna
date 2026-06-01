ALTER TABLE reservations ADD COLUMN cancel_token TEXT;
ALTER TABLE reservations ADD COLUMN confirmed_at TEXT;
CREATE UNIQUE INDEX idx_reservations_cancel_token ON reservations(cancel_token)
  WHERE cancel_token IS NOT NULL;
