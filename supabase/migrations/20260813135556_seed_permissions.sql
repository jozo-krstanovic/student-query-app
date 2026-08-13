-- Fixed lookup of discrete actions a role can be granted via role_permissions.
-- Not superuser-editable -- adding a new permission always requires new
-- application code to check for it, so the set itself lives in a migration
-- rather than being creatable through the admin UI (see CLAUDE.md).

INSERT INTO permissions (key, description) VALUES
    ('inquiry.approve', 'Approve an inquiry at the current chain step, advancing it to the next step'),
    ('inquiry.reset', 'Reset an inquiry back to the start of its approval chain'),
    ('inquiry.comment', 'Add comments to an inquiry'),
    ('inquiry.view_assigned', 'View inquiries currently at this role''s step in the chain');
