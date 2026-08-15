<?php

namespace App\Http\Controllers;

use App\Models\InquiryComment;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    /**
     * Editing a comment only depends on authorship, not role or chain state
     * -- a comment isn't a decision-anchoring document the way the original
     * inquiry body is, so there's no lock window. One shared endpoint for
     * students, faculty, and superusers alike, rather than duplicating this
     * into both InquiryController and Faculty\InquiryController.
     */
    public function update(Request $request, InquiryComment $comment)
    {
        if ($comment->author_id !== $request->user()->id) {
            return response()->json(['status' => 'error', 'message' => 'Forbidden.'], 403);
        }

        $data = $request->validate(['body' => 'required|string']);

        $comment->update(['body' => $data['body']]);
        $comment->load('author');

        return response()->json(['status' => 'ok', 'comment' => $comment]);
    }
}
