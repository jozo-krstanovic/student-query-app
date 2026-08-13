# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

An app developed as part of a Master's thesis to streamline student inquiries and let faculty process them more efficiently. React frontend, PHP backend, Supabase (hosted Postgres) as the database.

## Architecture

- `frontend/` — React app (Vite, React 19). Talks to the PHP backend's HTTP API for all data access; it never queries Supabase's database directly. The one exception is auth: the frontend uses `supabase-js` directly against Supabase Auth (login/signup/session refresh) and sends the resulting JWT to PHP on every request.
- `backend/` — PHP API. Sole gateway to the database: it connects to Supabase's Postgres via PDO (`pgsql` driver) and is the only thing that ever talks to Supabase's data tables. `backend/public/index.php` is the single front-controller/router (checked against `$_SERVER['REQUEST_URI']`); routes are added there as `if ($uri === '/api/...')` blocks. `backend/config/database.php` exposes `getDbConnection(): PDO`, reading credentials from environment variables loaded via `vlucas/phpdotenv`. `backend/src/` is the PSR-4 root for the `App\` namespace, for backend classes as they're added. PHP also verifies the Supabase JWT on each request (stateless, via the project's JWT secret) to identify the caller, and uses the Supabase Auth Admin API (service-role key) to provision faculty/superuser accounts — see `backend/db/migrations/0001_init.sql` for the full rationale.
- Database credentials live in `backend/.env` (gitignored; `backend/.env.example` documents the required keys). Uses Supabase's **transaction pooler** connection (port 6543), not the direct connection (port 5432).
- Auth is handled by Supabase Auth, not custom code. `public.users` is a profile table keyed by `UUID REFERENCES auth.users(id)`, not an identity table — it has no password column. A DB trigger (`on_auth_user_created`) creates the profile row on signup, always defaulting `user_type` to `student` regardless of client-supplied metadata; only PHP (via the service-role key) can promote a profile to `faculty`/`superuser`. Row Level Security is enabled with no policies (default-deny) on every table, since the Supabase anon key ships in the frontend bundle for Auth calls — RLS is what stops that key from being used to query tables directly via PostgREST, bypassing PHP.
- Database schema/migrations live in `backend/db/migrations/` as plain SQL files, applied manually via the Supabase SQL editor (no migration runner yet).
- CORS in `index.php` is currently hardcoded to allow `http://localhost:5173` (the Vite dev server origin).

## Commands

Frontend (`frontend/`):
- `npm run dev` — Vite dev server at http://localhost:5173
- `npm run build` — production build
- `npm run lint` — oxlint
- `npm run preview` — preview the production build

Backend (`backend/`):
- `composer install` — install PHP dependencies
- `php -S localhost:8000 -t public` — run the API on http://localhost:8000 using PHP's built-in dev server (no Apache/XAMPP vhost needed for local dev, even though XAMPP is the local PHP distribution)

No test suite exists yet in either frontend or backend.

## Local environment

Developed on Windows without WSL. Node, npm, and Composer are on PATH; PHP comes from a XAMPP install at `C:\xampp\php` (also added to PATH) — XAMPP's bundled Apache/MySQL are not used, only its PHP runtime, since the database is Supabase.
