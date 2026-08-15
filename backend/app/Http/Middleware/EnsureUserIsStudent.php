<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsStudent
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->user_type !== 'student') {
            return response()->json(['status' => 'error', 'message' => 'Forbidden.'], 403);
        }

        return $next($request);
    }
}
