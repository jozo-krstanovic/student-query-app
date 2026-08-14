# student-query-app

An app developed as part of a Master's thesis to streamline student inquiries and let faculty process them more efficiently.

## Tech stack

- **Frontend**: React 19 + Vite
- **Backend**: Laravel 12 (PHP 8.2), running via [Laravel Sail](https://laravel.com/docs/sail) (Docker)
- **Database & Auth**: [Supabase](https://supabase.com) — hosted Postgres + Auth
- **Local dev**: Docker Desktop + WSL2 (Windows) — the backend runs in a real container instead of PHP's built-in dev server, for both a production-like environment and much better performance against the remote database

## Prerequisites

- [Node.js](https://nodejs.org) (v20+) and npm
- [Docker Desktop](https://www.docker.com/products/docker-desktop/), with WSL2 backend enabled on Windows
- PHP 8.2+ and [Composer](https://getcomposer.org) — only needed on the host to bootstrap `vendor/bin/sail`; the app itself runs inside the Docker container, so the host PHP version doesn't need to match exactly
- A [Supabase](https://supabase.com) project (free tier works)
- **On Windows**: WSL2 with a Linux distro (e.g. Ubuntu). Clone and run the project from inside WSL's own filesystem, not a Windows-mounted path (`/mnt/c/...`) — the latter is slow enough to erase most of the performance benefit of running in Docker at all.

## Setup

1. **Clone the repo** (inside WSL if on Windows):
   ```
   git clone https://github.com/jozo-krstanovic/student-query-app.git
   cd student-query-app
   ```

2. **Set up the database schema** (repo root):
   ```
   npm install
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```

3. **Backend** (`backend/`):
   ```
   cd backend
   composer install
   cp .env.example .env
   # fill in DB_*, SUPABASE_URL from your Supabase project settings
   php artisan key:generate
   ./vendor/bin/sail up -d
   ```
   API runs at http://localhost:8000.

4. **Frontend** (`frontend/`):
   ```
   cd frontend
   npm install
   cp .env.example .env
   # fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY from your Supabase project settings
   npm run dev
   ```
   App runs at http://localhost:5173.

## Running tests

```
cd backend
./vendor/bin/sail artisan test
```

See `CLAUDE.md` for full architecture notes and local-environment details.
