<?php

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

// Overrides the framework's default web/session-guarded broadcasting auth
// route -- this API is stateless bearer-token auth (SupabaseGuard), so the
// auth check on /broadcasting/auth needs to run under the same guard as
// every other route, not the session-based 'web' guard it uses by default.
Broadcast::routes(['middleware' => ['auth:api']]);

Broadcast::channel('user.{id}', function (User $user, string $id) {
    return (string) $user->id === $id;
});
