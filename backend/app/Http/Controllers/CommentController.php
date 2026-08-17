<?php

namespace App\Http\Controllers;

use App\Models\InquiryComment;
use App\Services\SupabaseStorage;
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
        if (! static::isAuthor($comment->author_id, $request->user()->id)) {
            return response()->json(['status' => 'error', 'message' => 'Forbidden.'], 403);
        }

        $data = $request->validate(['body' => 'required|string']);

        $comment->update(['body' => $data['body']]);
        $comment->load('author');

        return response()->json(['status' => 'ok', 'comment' => $comment]);
    }

    public function destroy(Request $request, InquiryComment $comment, SupabaseStorage $storage)
    {
        if (! static::isAuthor($comment->author_id, $request->user()->id)) {
            return response()->json(['status' => 'error', 'message' => 'Forbidden.'], 403);
        }

        // The DB row cascades away with the comment (ON DELETE CASCADE on
        // inquiry_documents.comment_id), but that's a raw FK cascade -- it
        // never calls back into app code, so the actual Storage object has
        // to be deleted here or it's orphaned in the bucket forever.
        foreach ($comment->documents as $document) {
            $storage->delete($document->storage_path);
        }

        $comment->delete();

        return response()->json(['status' => 'ok']);
    }

    /**
     * Pure form of the authorship check, kept separate so it's testable
     * without a database.
     */
    public static function isAuthor(string $commentAuthorId, string $userId): bool
    {
        return $commentAuthorId === $userId;
    }
}
