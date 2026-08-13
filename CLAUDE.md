# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

An app developed as part of a Master's thesis to streamline student inquiries and let faculty process them more efficiently. React frontend, Laravel backend, Supabase (hosted Postgres + Auth) as the database and identity provider.

## Architecture

- `frontend/` — React app (Vite, React 19). Talks to the Laravel backend's HTTP API for all data access; it never queries Supabase's database directly. The one exception is auth: the frontend uses `supabase-js` directly against Supabase Auth (login/signup/session refresh) and sends the resulting JWT to the backend on every request (`frontend/src/lib/api.js`).
- `backend/` — Laravel API (API-only: no Blade views, `routes/web.php` is unused). Sole gateway to the database — it's the only thing that ever queries Supabase's data tables directly.
  - `routes/api.php` — all routes, prefixed `/api` automatically. Protected routes use the `auth:api` middleware.
  - `app/Auth/SupabaseGuard.php` — a custom Laravel auth Guard (registered in `AppServiceProvider`, configured as the `api` guard in `config/auth.php`) that verifies the incoming bearer JWT against Supabase's public JWKS (`config('services.supabase.url')`, cached via `Cache::remember`) and resolves it to an `App\Models\User`. No shared secret involved — Supabase signs tokens with an asymmetric key (ES256).
  - `app/Models/User.php` — Eloquent model over `public.users`. UUID primary key (`auth.users.id`), not auto-incrementing, and deliberately has no password field — Supabase Auth owns credentials entirely, this table is a profile row over it (see the `on_auth_user_created` trigger in the schema migration). Faculty/superuser promotion happens via the Supabase Auth Admin API (service-role key) from the backend, never from the frontend.
  - Database config (`config/database.php`, `DB_*` in `.env`) connects to Supabase's **transaction pooler** (port 6543), not the direct connection (port 5432), with `DB_SSLMODE=require`.
  - `config/cors.php` restricts cross-origin requests to `FRONTEND_URL` (defaults to the Vite dev server origin) — this replaces what used to be hand-written CORS header code; Laravel's `HandleCors` middleware and preflight handling are automatic.
  - Session/cache/queue drivers are deliberately non-database (`file`/`file`/`sync` — see `.env`): the API is stateless (bearer-token auth, no cookies), so there's no reason for Laravel's own bookkeeping tables (sessions, cache, jobs) to exist alongside the real domain schema. `database/migrations/` is intentionally empty for the same reason — see below.
- **Database schema/migrations are owned entirely by the Supabase CLI, not Laravel.** They live in `supabase/migrations/` (repo root, not under `backend/`) as plain SQL files. The Supabase CLI is a root-level npm dev dependency (run as `npx supabase ...`, not installed globally). `npx supabase link --project-ref <ref>` connects the local repo to the hosted project (one-time, requires interactive login); `npx supabase db push` applies any migrations not yet recorded in the project's `supabase_migrations.schema_migrations` tracking table; `npx supabase migration new <name>` scaffolds a new timestamped file. Never run `php artisan migrate` against the real database — Laravel has no migrations of its own here, and none should be added; if a schema change is needed, it's a new file in `supabase/migrations/`.
- **Postgres hosting is deliberately kept swappable**; Supabase *Auth* is not. The DB connection is just host/port/user/password/database, and the migration SQL is plain Postgres DDL with no Supabase-specific syntax — moving to a different Postgres host is an `.env` change. The one intentional exception is `auth.users` (Supabase Auth's schema), which only exists where Supabase's Auth service runs — accepted as a deliberate trade-off rather than rolling custom auth. If the app is ever forked onto a different provider without Supabase, that's expected to come with revisiting auth too.
- Auth is handled by Supabase Auth, not custom code. `public.users` is a profile table (see above). A DB trigger (`on_auth_user_created`) creates the profile row on signup, always defaulting `user_type` to `student` regardless of client-supplied metadata; only the backend (via the service-role key) can promote a profile to `faculty`/`superuser`. Row Level Security is enabled with no policies (default-deny) on every table, since the Supabase anon key ships in the frontend bundle for Auth calls — RLS is what stops that key from being used to query tables directly via PostgREST, bypassing the backend.

## Commands

Frontend (`frontend/`):
- `npm run dev` — Vite dev server at http://localhost:5173
- `npm run build` — production build
- `npm run lint` — oxlint
- `npm run preview` — preview the production build

Backend (`backend/`):
- `composer install` — install PHP dependencies
- `php artisan serve --no-reload` — run the API on http://localhost:8000. The `--no-reload` flag matters: without it, Laravel silently ignores `PHP_CLI_SERVER_WORKERS` (see `.env`) and falls back to a single worker, serializing concurrent requests.
- `php artisan test` — run the PHPUnit suite (`tests/Feature`); uses an in-memory SQLite DB (see `phpunit.xml`), not the real Supabase database

**Known local-dev latency characteristic**: every request to the real Supabase database costs roughly 1s round-trip (network distance to the `eu-central-1` Postgres pooler, not something in the app code — confirmed via direct timing: connection setup alone is ~700-1000ms, a query on an already-open connection is ~300ms). `php artisan serve` re-boots the whole application fresh on every request, so unlike a persistent Node process, there's no long-lived connection for `PDO::ATTR_PERSISTENT` (set in `config/database.php`) to actually stay warm across requests — measured repeatedly, with no improvement over successive requests even with multiple `--no-reload` workers. The JWKS cache (`Cache::remember('supabase.jwks', ...)`, `file` driver) *does* work correctly across requests/processes and was ruled out as a contributor. The real fix, if this becomes painful enough to justify it, is Laravel Octane (RoadRunner, not Swoole — Swoole doesn't support Windows without WSL) to keep the app and its DB connections alive across requests; this is a deliberate open question, not yet decided. This is a local-dev-only characteristic — a real deployment has the app server and database co-located, avoiding this latency.

Database (repo root):
- `npm install` — installs the Supabase CLI (the only purpose of the root `package.json`; it is not part of either app)
- `npx supabase db push` — apply pending migrations from `supabase/migrations/` to the linked project
- `npx supabase migration new <name>` — scaffold a new timestamped migration file

No test suite exists yet in the frontend.

## Local environment

Developed on Windows without WSL. Node, npm, and Composer are on PATH; PHP comes from a XAMPP install at `C:\xampp\php` (also added to PATH) — XAMPP's bundled Apache/MySQL are not used, only its PHP runtime, since the database is Supabase. In the Bash tool specifically (Git Bash/MSYS), newly-added Windows PATH entries and `.bat` shims (Composer, GitHub CLI) often aren't picked up in a fresh shell — prefix the command with `export PATH="/c/xampp/php:$PATH"` or invoke `composer.phar` via `php` directly rather than relying on the `composer`/`gh` shims resolving.
