-- The ADD COLUMN in the previous migration had no default, so every comment
-- that existed before it ended up with updated_at = NULL. The frontend shows
-- "(edited)" whenever updated_at differs from created_at, so every
-- pre-existing comment was incorrectly flagged as edited. Backfill them to
-- match created_at, then make the column behave like a normal timestamp
-- (NOT NULL, defaults to now()) so this can't recur for future inserts that
-- bypass Eloquent's own timestamp handling.
UPDATE inquiry_comments SET updated_at = created_at WHERE updated_at IS NULL;
ALTER TABLE inquiry_comments ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE inquiry_comments ALTER COLUMN updated_at SET DEFAULT now();
