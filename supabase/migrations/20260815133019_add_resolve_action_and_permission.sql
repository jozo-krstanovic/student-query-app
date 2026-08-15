-- A ticket-style "resolve" action: whoever holds the current chain step can
-- close the inquiry outright, regardless of how many steps remain -- distinct
-- from approve (advance one step) and reset (back to the start).

ALTER TYPE chain_action ADD VALUE 'resolve';

-- Separate from inquiry.approve so a superuser can grant one without the
-- other (e.g. a role that can comment/approve but not unilaterally close).
INSERT INTO permissions (key, description) VALUES
    ('inquiry.resolve', 'Resolve (close) an inquiry at the current chain step, regardless of remaining steps');
