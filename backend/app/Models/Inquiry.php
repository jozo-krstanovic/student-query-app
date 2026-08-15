<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Inquiry extends Model
{
    protected $fillable = [
        'student_id',
        'subject_id',
        'chain_id',
        'current_chain_step_id',
        'cycle_number',
        'status',
        'body',
        'body_edited_at',
    ];

    protected function casts(): array
    {
        return [
            'body_edited_at' => 'datetime',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function chain(): BelongsTo
    {
        return $this->belongsTo(Chain::class);
    }

    public function currentStep(): BelongsTo
    {
        return $this->belongsTo(ChainStep::class, 'current_chain_step_id');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(InquiryComment::class)->orderBy('created_at');
    }

    public function stepHistory(): HasMany
    {
        return $this->hasMany(InquiryStepHistory::class)->orderBy('created_at');
    }
}
