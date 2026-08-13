<?php

namespace Tests\Feature;

use Tests\TestCase;

class MeTest extends TestCase
{
    public function test_me_requires_authentication(): void
    {
        $this->getJson('/api/me')
            ->assertUnauthorized()
            ->assertJson(['status' => 'error', 'message' => 'Unauthenticated.']);
    }

    // The authenticated path isn't covered here yet: public.users rows have a
    // hard FK to auth.users, so a test can't just create a User row directly
    // without a matching real Supabase Auth user. Covering it properly needs
    // either a seeded Supabase test account or a fake bound in place of
    // SupabaseGuard -- worth adding once there's more than one authenticated
    // route to justify the setup.
}
