<?php

namespace App\Http\Controllers;

use App\Models\Inquiry;
use App\Models\InquiryDocument;
use App\Models\User;
use App\Services\SupabaseStorage;
use Illuminate\Http\Request;

class DocumentController extends Controller
{
    public function download(Request $request, InquiryDocument $document, SupabaseStorage $storage)
    {
        if (! $this->canView($document->inquiry, $request->user())) {
            return response()->json(['status' => 'error', 'message' => 'Forbidden.'], 403);
        }

        return response()->json(['status' => 'ok', 'url' => $storage->signedUrl($document->storage_path)]);
    }

    public function destroy(Request $request, InquiryDocument $document, SupabaseStorage $storage)
    {
        if (! static::isUploader($document->uploaded_by, $request->user()->id)) {
            return response()->json(['status' => 'error', 'message' => 'Forbidden.'], 403);
        }

        $storage->delete($document->storage_path);
        $document->delete();

        return response()->json(['status' => 'ok']);
    }

    /**
     * Pure form of the authorship check, kept separate so it's testable
     * without a database -- same shape as CommentController::isAuthor.
     */
    public static function isUploader(string $documentUploaderId, string $userId): bool
    {
        return $documentUploaderId === $userId;
    }

    /**
     * A document is visible to whoever can see its inquiry: the student who
     * owns it, faculty whose role appears anywhere in the chain (current,
     * past, or not-yet-reached step), or a superuser. Mirrors
     * Faculty\InquiryController::hasVisibility, kept separate rather than
     * shared since this also needs the student-owns check that controller
     * doesn't.
     */
    private function canView(Inquiry $inquiry, User $user): bool
    {
        if ($inquiry->student_id === $user->id) {
            return true;
        }

        if ($user->user_type === 'superuser') {
            return true;
        }

        if (! $user->role_id) {
            return false;
        }

        return $inquiry->chain->steps()->where('role_id', $user->role_id)->exists();
    }
}
