<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Permission extends Model
{
    // No created_at/updated_at columns -- this is a fixed lookup seeded via
    // a migration (supabase/migrations/), not created through the app.
    public $timestamps = false;

    protected $fillable = [];

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'role_permissions');
    }
}
