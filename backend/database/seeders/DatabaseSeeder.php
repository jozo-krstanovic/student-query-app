<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * No user seeding here -- accounts are provisioned through Supabase Auth
     * (self-signup for students, the Admin API for faculty/superuser), not
     * created directly in the database. See CLAUDE.md for the provisioning
     * flow. Seed reference data (roles, subjects, chains) here as it's added.
     */
    public function run(): void
    {
        //
    }
}
