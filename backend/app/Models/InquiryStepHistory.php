<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InquiryStepHistory extends Model
{
    protected $table = 'inquiry_step_history';

    const UPDATED_AT = null;

    protected $fillable = [
        'inquiry_id',
        'chain_step_id',
        'cycle_number',
        'action',
        'actor_id',
        'note',
    ];

    public function inquiry(): BelongsTo
    {
        return $this->belongsTo(Inquiry::class);
    }

    public function chainStep(): BelongsTo
    {
        return $this->belongsTo(ChainStep::class);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
