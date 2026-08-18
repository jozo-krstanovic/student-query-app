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

        // Not $notification->update(...): Model::update() on an already-
        // loaded instance runs Eloquent's dirty-check first, which casts
        // old and new values through the boolean cast before comparing --
        // and any object (including a DB::raw() expression, needed here for
        // the same boolean/integer binding mismatch as SubjectController's
        // is_active query) casts truthy in PHP, so it can look "unchanged"
        // and get silently dropped. A query-builder mass update has no such
        // per-instance dirty-tracking to fool.
        Notification::whereKey($notification->id)->update(['is_read' => DB::raw('true')]);
        $notification->refresh();

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
