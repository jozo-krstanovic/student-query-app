<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $notifications = $request->user()->notifications()->limit(50)->get();

        return response()->json(['status' => 'ok', 'notifications' => $notifications]);
    }

    public function markRead(Request $request, Notification $notification)
    {
        if (! static::isOwner($notification->user_id, $request->user()->id)) {
            return response()->json(['status' => 'error', 'message' => 'Forbidden.'], 403);
        }

        // A bound PHP `true` hits the same boolean/integer binding mismatch
        // as SubjectController's is_active query (see NotificationService) --
        // DB::raw() inlines the literal instead of binding it as a parameter.
        // Re-set the attribute afterward so the in-memory model (returned
        // below) holds a real boolean rather than the raw SQL expression.
        $notification->update(['is_read' => DB::raw('true')]);
        $notification->is_read = true;

        return response()->json(['status' => 'ok', 'notification' => $notification]);
    }

    public function markAllRead(Request $request)
    {
        $request->user()->notifications()
            ->whereRaw('is_read::int = 0')
            ->update(['is_read' => DB::raw('true')]);

        return response()->json(['status' => 'ok']);
    }

    /**
     * Pure form of the ownership check, kept separate so it's testable
     * without a database -- same shape as CommentController::isAuthor.
     */
    public static function isOwner(string $notificationUserId, string $userId): bool
    {
        return $notificationUserId === $userId;
    }
}
