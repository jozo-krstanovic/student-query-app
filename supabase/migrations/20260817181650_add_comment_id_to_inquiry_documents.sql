-- Documents can attach to a specific comment, not just the inquiry as a
-- whole, per the document-uploads design agreed alongside the schema.
ALTER TABLE inquiry_documents ADD COLUMN comment_id BIGINT REFERENCES inquiry_comments(id) ON DELETE CASCADE;
CREATE INDEX idx_inquiry_documents_comment ON inquiry_documents (comment_id);
