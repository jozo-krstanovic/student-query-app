<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChainStep extends Model
{
    // No created_at/updated_at columns.
    public $timestamps = false;

    protected $fillable = [
        'chain_id',
        'step_order',
        'role_id',
        'label',
    ];

    public function chain(): BelongsTo
    {
        return $this->belongsTo(Chain::class);
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }
}
