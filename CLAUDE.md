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
  - Database config (`config/database.php`, `DB_*` in `.env`) connects to Supabase's **transaction pooler** (port 6543), not the direct connection (port 5432), with `DB_SSLMODE=require`. The connection is persistent (`PDO::ATTR_PERSISTENT`) so a long-lived PHP process (Sail's container) reuses one connection across requests instead of paying a ~1s TCP+TLS+Postgres handshake every time. This surfaces a real gotcha once persistence is genuinely working: the transaction pooler (PgBouncer, transaction mode) can route a persistent connection's queries to a different backend Postgres session between requests, and server-side prepared statements are pinned to one specific backend — so a stale one causes `SQLSTATE[08P01]` "prepared statement requires N parameters" errors. `PDO::ATTR_EMULATE_PREPARES => true` avoids this by preparing client-side instead of server-side.
  - `config/cors.php` restricts cross-origin requests to `FRONTEND_URL` (defaults to the Vite dev server origin) — this replaces what used to be hand-written CORS header code; Laravel's `HandleCors` middleware and preflight handling are automatic.
  - Session/cache/queue drivers are deliberately non-database (`file`/`file`/`sync` — see `.env`): the API is stateless (bearer-token auth, no cookies), so there's no reason for Laravel's own bookkeeping tables (sessions, cache, jobs) to exist alongside the real domain schema. `database/migrations/` is intentionally empty for the same reason — see below.
- **Database schema/migrations are owned entirely by the Supabase CLI, not Laravel.** They live in `supabase/migrations/` (repo root, not under `backend/`) as plain SQL files. The Supabase CLI is a root-level npm dev dependency (run as `npx supabase ...`, not installed globally). `npx supabase link --project-ref <ref>` connects the local repo to the hosted project (one-time, requires interactive login); `npx supabase db push` applies any migrations not yet recorded in the project's `supabase_migrations.schema_migrations` tracking table; `npx supabase migration new <name>` scaffolds a new timestamped file. Never run `php artisan migrate` against the real database — Laravel has no migrations of its own here, and none should be added; if a schema change is needed, it's a new file in `supabase/migrations/`.
- **Postgres hosting is deliberately kept swappable**; Supabase *Auth* is not. The DB connection is just host/port/user/password/database, and the migration SQL is plain Postgres DDL with no Supabase-specific syntax — moving to a different Postgres host is an `.env` change. The one intentional exception is `auth.users` (Supabase Auth's schema), which only exists where Supabase's Auth service runs — accepted as a deliberate trade-off rather than rolling custom auth. If the app is ever forked onto a different provider without Supabase, that's expected to come with revisiting auth too.
- Auth is handled by Supabase Auth, not custom code. `public.users` is a profile table (see above). A DB trigger (`on_auth_user_created`) creates the profile row on signup, always defaulting `user_type` to `student` regardless of client-supplied metadata; only the backend (via the service-role key) can promote a profile to `faculty`/`superuser`. Row Level Security is enabled with no policies (default-deny) on every table, since the Supabase anon key ships in the frontend bundle for Auth calls — RLS is what stops that key from being used to query tables directly via PostgREST, bypassing the backend.

## Commands

All commands below run from **inside WSL** (see Local environment) — the whole repo lives in WSL's native filesystem now, not the Windows-mounted one.

Frontend (`frontend/`):
- `npm run dev` — Vite dev server at http://localhost:5173
- `npm run build` — production build
- `npm run lint` — oxlint
- `npm run preview` — preview the production build

Backend (`backend/`), via Laravel Sail (Docker) — requires Docker Desktop running:
- `./vendor/bin/sail up -d` — start the containerized API on http://localhost:8000 (detached; `sail up` without `-d` runs in the foreground)
- `./vendor/bin/sail down` — stop it
- `./vendor/bin/sail artisan ...` — run artisan commands inside the container (e.g. `sail artisan test`, `sail artisan tinker`)
- `./vendor/bin/sail composer ...` — run Composer inside the container, matching the exact PHP version/extensions the app actually runs under
- `./vendor/bin/sail artisan test` — run the PHPUnit suite (`tests/Feature`); uses an in-memory SQLite DB (see `phpunit.xml`), not the real Supabase database

**Why Docker instead of `php artisan serve`**: every request to the real Supabase database costs a ~1s round trip if a fresh connection has to be established (network distance to the `eu-central-1` pooler, confirmed via direct timing — not something fixable in app code). `php artisan serve` re-boots the whole application on every request, so there's no long-lived process for `PDO::ATTR_PERSISTENT` to actually stay warm across requests — measured repeatedly, with zero improvement across successive requests even with multiple workers (`--no-reload` + `PHP_CLI_SERVER_WORKERS`). Laravel Octane was evaluated as a fix and rejected: it doesn't run at all on native Windows (`artisan octane:start` unconditionally references `pcntl` signal constants, which don't exist outside WSL/Linux, regardless of RoadRunner vs. Swoole). Sail's container runs a real, long-lived Linux process, so persistent connections actually work — measured average dropped from ~900ms/request to ~200ms/request, and concurrent requests (e.g. the admin panel's parallel fetches) from ~2.1s to ~0.2-0.5s. One critical condition for this to work: **the project must live in WSL's native filesystem**, not be bind-mounted from `/mnt/c/...` — accessing Windows files through WSL2's DrvFs bridge is slow enough (average ~1.3s/request measured) to erase the entire benefit; this was the actual biggest lever in the whole investigation, bigger than the persistent-connection fix itself.

Database (repo root):
- `npm install` — installs the Supabase CLI (the only purpose of the root `package.json`; it is not part of either app)
- `npx supabase db push` — apply pending migrations from `supabase/migrations/` to the linked project
- `npx supabase migration new <name>` — scaffold a new timestamped migration file

No test suite exists yet in the frontend.

## Local environment

Developed on Windows with **WSL2 required** (Ubuntu distro) — this is a hard requirement, not a preference; see the Docker/Sail note above for why. Docker Desktop must be running, with WSL integration enabled for the Ubuntu distro (Docker Desktop settings → Resources → WSL Integration).

- **The canonical copy of this repo lives inside WSL's native filesystem** (`~/projects/student-query-app`), not under `/mnt/c/...`. There is no separate Windows-side checkout kept in sync — this is the one working tree, for both frontend and backend.
- Edit via VS Code's **Remote-WSL** extension (`ms-vscode-remote.remote-wsl`) — open the project from a WSL terminal with `code .`, or "WSL: Reopen Folder in WSL" from the command palette. This gives a normal local-feeling editing experience (IntelliSense, integrated terminal, Source Control panel, GitHub Pull Requests extension) running against the WSL-hosted files; VS Code automatically uses the WSL-side `git` binary once the window is opened this way.
- Node/npm, PHP, Composer, and `gh` are all installed **inside WSL** (`apt install nodejs npm php-cli php-pgsql php-curl php-mbstring php-intl php-xml php-sqlite3 unzip`, Composer via the official installer script into `~/composer.phar` with a `~/.local/bin/composer` wrapper, `gh` via GitHub's own apt repo). `gh auth login` and `git config --global user.name/user.email` need to be set up inside WSL separately from any Windows-side installs — they don't share credentials/config automatically.
  - The WSL-side PHP/Composer are only the *control plane* for running `composer`, `artisan`, and `sail` commands — they're not what actually runs the app. The app itself runs entirely inside the Sail/Docker container (PHP 8.2, pinned via `sail:install --php=8.2`), so the WSL-native PHP version doesn't need to match.
- A Windows-native PHP/Composer/Node toolchain (XAMPP at `C:\xampp\php`, Windows Node) was set up earlier in this project's history and still exists on disk, but is no longer used for this project — Docker/Sail replaced it for the backend, and the frontend now runs from WSL too for filesystem-performance reasons (see above). Kept installed as a vestigial fallback, not maintained.
- In the Bash tool specifically (Git Bash/MSYS), reach into WSL via `wsl -d Ubuntu -- <command>` (or `wsl -d Ubuntu -- bash -c "..."` for anything using shell features like `&&`/pipes/redirects, since unquoted commands are parsed by Git Bash first). Paths starting with `~` get expanded by Git Bash itself before reaching `wsl.exe`, resolving against the Windows home directory instead of the Linux one — use an explicit `/home/<user>/...` path instead when it matters. File tools (Read/Write/Edit) work directly against WSL paths via the UNC form `\\wsl.localhost\Ubuntu\home\<user>\...` — confirmed working (round-tripped content, correct ownership/permissions) — so editing WSL-hosted files doesn't require falling back to shell commands.
