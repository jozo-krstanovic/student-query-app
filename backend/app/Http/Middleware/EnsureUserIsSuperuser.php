<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsSuperuser
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->user_type !== 'superuser') {
            return response()->json(['status' => 'error', 'message' => 'Forbidden.'], 403);
        }

        return $next($request);
    }
}
