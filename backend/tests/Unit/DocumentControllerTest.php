<?php

namespace Tests\Unit;

use App\Http\Controllers\DocumentController;
use PHPUnit\Framework\TestCase;

class DocumentControllerTest extends TestCase
{
    public function test_uploader_can_delete_their_own_document(): void
    {
        $this->assertTrue(DocumentController::isUploader('user-1', 'user-1'));
    }

    public function test_non_uploader_cannot_delete(): void
    {
        $this->assertFalse(DocumentController::isUploader('user-1', 'user-2'));
    }
}
