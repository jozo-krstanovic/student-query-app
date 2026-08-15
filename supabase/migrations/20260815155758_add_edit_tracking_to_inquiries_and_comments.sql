-- inquiries.updated_at already changes on every chain action (approve/resolve/
-- reset), so it can't signal "the body was edited" -- a dedicated column is
-- needed for that specific event.
ALTER TABLE inquiries ADD COLUMN body_edited_at TIMESTAMPTZ;

-- Comments were originally append-only (no updated_at at all). Editing needs
-- one; unlike inquiries, nothing else touches a comment row, so plain
-- updated_at is an unambiguous "was this edited" signal on its own.
ALTER TABLE inquiry_comments ADD COLUMN updated_at TIMESTAMPTZ;
