<?php

namespace App\Services;

use App\Events\NotificationCreated;
use App\Models\Inquiry;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Collection;

class NotificationService
{
    /** @param iterable<User> $recipients */
    public static function notify(iterable $recipients, Inquiry $inquiry, string $type, string $message): void
    {
        foreach ($recipients as $recipient) {
            $notification = Notification::create([
                'user_id' => $recipient->id,
                'inquiry_id' => $inquiry->id,
                'type' => $type,
                'message' => $message,
            ]);

            NotificationCreated::dispatch($notification);
        }
    }

    /** @return Collection<int, User> */
    public static function usersWithRole(?int $roleId): Collection
    {
        if (! $roleId) {
            return collect();
        }

        // ->where('is_active', true) binds as integer 1 under
        // PDO::ATTR_EMULATE_PREPARES (see config/database.php), and Postgres
        // rejects "boolean = integer" -- cast the column instead of relying
        // on the bound parameter's type (same fix as SubjectController).
        return User::where('role_id', $roleId)->whereRaw('is_active::int = 1')->get();
    }
}
