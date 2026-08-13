<?php

namespace Tests\Feature;

use App\Http\Middleware\EnsureUserIsSuperuser;
use Illuminate\Http\Request;
use Tests\TestCase;

class EnsureUserIsSuperuserTest extends TestCase
{
    public function test_allows_superuser(): void
    {
        $response = $this->callMiddlewareAs((object) ['user_type' => 'superuser']);

        $this->assertSame(200, $response->getStatusCode());
    }

    public function test_blocks_non_superuser(): void
    {
        $response = $this->callMiddlewareAs((object) ['user_type' => 'student']);

        $this->assertSame(403, $response->getStatusCode());
    }

    public function test_blocks_guest(): void
    {
        $response = $this->callMiddlewareAs(null);

        $this->assertSame(403, $response->getStatusCode());
    }

    private function callMiddlewareAs(?object $user)
    {
        $request = Request::create('/api/admin/roles');
        $request->setUserResolver(fn () => $user);

        return (new EnsureUserIsSuperuser())->handle($request, fn ($req) => response()->json(['ok' => true]));
    }
}
