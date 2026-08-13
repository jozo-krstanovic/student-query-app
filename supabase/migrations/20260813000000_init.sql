-- ===== Lookup / config tables =====

CREATE TYPE user_type AS ENUM ('student', 'faculty', 'superuser');

CREATE TABLE roles (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE permissions (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    key         TEXT NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE role_permissions (
    role_id       BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- ===== Users: profile row extending Supabase Auth's auth.users, not an identity table =====

CREATE TABLE users (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    user_type   user_type NOT NULL DEFAULT 'student',
    role_id     BIGINT REFERENCES roles(id),   -- only set when user_type = 'faculty'
    email       TEXT NOT NULL,                 -- cached from auth.users at creation, for display/joins
    full_name   TEXT NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT role_only_for_faculty CHECK (
        (user_type = 'faculty' AND role_id IS NOT NULL) OR
        (user_type <> 'faculty' AND role_id IS NULL)
    )
);

-- Auto-create a profile row whenever Supabase Auth creates a user.
-- Always defaults to 'student' -- client-supplied metadata is never trusted for user_type.
-- PHP promotes faculty/superuser accounts afterward via the service-role key.
CREATE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, user_type, email, full_name)
    VALUES (
        NEW.id,
        'student',
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ===== Approval chain templates =====

CREATE TABLE chains (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE chain_steps (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    chain_id   BIGINT NOT NULL REFERENCES chains(id) ON DELETE CASCADE,
    step_order INT NOT NULL,
    role_id    BIGINT NOT NULL REFERENCES roles(id),
    label      TEXT,
    UNIQUE (chain_id, step_order)
);

CREATE TABLE subjects (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE,
    description TEXT,
    chain_id    BIGINT REFERENCES chains(id),   -- nullable: subject can exist before a chain is assigned
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== Inquiries =====

CREATE TYPE inquiry_status AS ENUM ('in_progress', 'completed');

CREATE TABLE inquiries (
    id                     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    student_id             UUID NOT NULL REFERENCES users(id),
    subject_id             BIGINT NOT NULL REFERENCES subjects(id),
    chain_id               BIGINT NOT NULL REFERENCES chains(id),      -- snapshotted at creation
    current_chain_step_id  BIGINT REFERENCES chain_steps(id),          -- null once completed
    cycle_number           INT NOT NULL DEFAULT 1,
    status                 inquiry_status NOT NULL DEFAULT 'in_progress',
    body                   TEXT NOT NULL,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE inquiry_documents (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    inquiry_id   BIGINT NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
    uploaded_by  UUID NOT NULL REFERENCES users(id),
    storage_path TEXT NOT NULL,   -- key/path in Supabase Storage
    file_name    TEXT NOT NULL,
    mime_type    TEXT,
    file_size    BIGINT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE inquiry_comments (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    inquiry_id BIGINT NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
    author_id  UUID NOT NULL REFERENCES users(id),
    body       TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE chain_action AS ENUM ('submit', 'approve', 'reset');

CREATE TABLE inquiry_step_history (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    inquiry_id    BIGINT NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
    chain_step_id BIGINT REFERENCES chain_steps(id),   -- null for 'submit'
    cycle_number  INT NOT NULL,
    action        chain_action NOT NULL,
    actor_id      UUID NOT NULL REFERENCES users(id),
    note          TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== Notifications =====

CREATE TYPE notification_type AS ENUM (
    'inquiry_submitted', 'inquiry_commented', 'inquiry_approved',
    'inquiry_reset', 'inquiry_completed'
);

CREATE TABLE notifications (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    inquiry_id BIGINT NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
    type       notification_type NOT NULL,
    message    TEXT NOT NULL,
    is_read    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== Indexes for the app's known access patterns =====

CREATE INDEX idx_inquiries_student ON inquiries (student_id);
CREATE INDEX idx_inquiries_current_step ON inquiries (current_chain_step_id) WHERE status = 'in_progress';
CREATE INDEX idx_chain_steps_role ON chain_steps (role_id);
CREATE INDEX idx_inquiry_comments_inquiry ON inquiry_comments (inquiry_id);
CREATE INDEX idx_inquiry_documents_inquiry ON inquiry_documents (inquiry_id);
CREATE INDEX idx_step_history_inquiry ON inquiry_step_history (inquiry_id, cycle_number);
CREATE INDEX idx_notifications_user_unread ON notifications (user_id, is_read) WHERE is_read = FALSE;

-- ===== RLS: default-deny on every table =====
-- The anon key ships in the frontend bundle (supabase-js needs it for Auth calls), so this is
-- load-bearing, not just defense-in-depth: with no policies defined, the anon/authenticated key
-- cannot read or write any row via PostgREST. Only the service-role key (held by PHP) can.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE chain_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiry_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiry_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiry_step_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
