<?php

namespace Tests\Unit;

use App\Http\Controllers\CommentController;
use PHPUnit\Framework\TestCase;

class CommentControllerTest extends TestCase
{
    public function test_author_can_edit_their_own_comment(): void
    {
        $this->assertTrue(CommentController::isAuthor('user-1', 'user-1'));
    }

    public function test_non_author_cannot_edit(): void
    {
        $this->assertFalse(CommentController::isAuthor('user-1', 'user-2'));
    }
}
