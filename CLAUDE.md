# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

An app developed as part of a Master's thesis to streamline student inquiries and let faculty process them more efficiently. React frontend, PHP backend, Supabase (hosted Postgres) as the database.

## Architecture

- `frontend/` — React app (Vite, React 19). Talks only to the PHP backend's HTTP API; it never calls Supabase directly.
- `backend/` — PHP API. Sole gateway to the database: it connects to Supabase's Postgres via PDO (`pgsql` driver) and is the only thing that ever talks to Supabase. `backend/public/index.php` is the single front-controller/router (checked against `$_SERVER['REQUEST_URI']`); routes are added there as `if ($uri === '/api/...')` blocks. `backend/config/database.php` exposes `getDbConnection(): PDO`, reading credentials from environment variables loaded via `vlucas/phpdotenv`. `backend/src/` is the PSR-4 root for the `App\` namespace, for backend classes as they're added.
- Database credentials live in `backend/.env` (gitignored; `backend/.env.example` documents the required keys). Uses Supabase's **transaction pooler** connection (port 6543), not the direct connection (port 5432).
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
