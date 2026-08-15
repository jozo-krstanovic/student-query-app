<?php

namespace Tests\Unit;

use App\Http\Controllers\InquiryController;
use PHPUnit\Framework\TestCase;

class InquiryControllerTest extends TestCase
{
    public function test_editable_before_any_faculty_action(): void
    {
        $this->assertTrue(InquiryController::bodyIsEditable(['submit']));
    }

    public function test_editable_with_no_history_at_all(): void
    {
        $this->assertTrue(InquiryController::bodyIsEditable([]));
    }

    public function test_locked_once_approved(): void
    {
        $this->assertFalse(InquiryController::bodyIsEditable(['submit', 'approve']));
    }

    public function test_locked_once_resolved(): void
    {
        $this->assertFalse(InquiryController::bodyIsEditable(['submit', 'resolve']));
    }

    public function test_locked_once_reset(): void
    {
        $this->assertFalse(InquiryController::bodyIsEditable(['submit', 'approve', 'reset']));
    }
}
