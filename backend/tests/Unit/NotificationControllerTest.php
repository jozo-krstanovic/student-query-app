<?php

namespace Tests\Unit;

use App\Http\Controllers\NotificationController;
use PHPUnit\Framework\TestCase;

class NotificationControllerTest extends TestCase
{
    public function test_owner_can_mark_their_own_notification_read(): void
    {
        $this->assertTrue(NotificationController::isOwner('user-1', 'user-1'));
    }

    public function test_non_owner_cannot_mark_it_read(): void
    {
        $this->assertFalse(NotificationController::isOwner('user-1', 'user-2'));
    }
}
