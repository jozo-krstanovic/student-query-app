<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InquiryDocument extends Model
{
    // No updated_at column on inquiry_documents -- uploads are immutable.
    const UPDATED_AT = null;

    protected $fillable = [
        'inquiry_id',
        'comment_id',
        'uploaded_by',
        'storage_path',
        'file_name',
        'mime_type',
        'file_size',
    ];

    public function inquiry(): BelongsTo
    {
        return $this->belongsTo(Inquiry::class);
    }

    public function comment(): BelongsTo
    {
        return $this->belongsTo(InquiryComment::class, 'comment_id');
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
