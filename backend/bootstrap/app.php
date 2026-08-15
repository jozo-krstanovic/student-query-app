<?php

use App\Http\Middleware\EnsureUserIsStudent;
use App\Http\Middleware\EnsureUserIsSuperuser;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Laravel's default guest-redirect callback unconditionally calls
        // route('login'), with no check on the client's Accept header --
        // this is an API-only backend with no such route, so that would
        // throw RouteNotFoundException (a 500) on every unauthenticated
        // request instead of a clean 401. Disable the redirect entirely.
        $middleware->redirectGuestsTo(fn () => null);

        $middleware->alias([
            'superuser' => EnsureUserIsSuperuser::class,
            'student' => EnsureUserIsStudent::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // With the redirect disabled above, an unauthenticated request
        // throws AuthenticationException with no redirect target. Render
        // that as JSON for every /api/* route.
        $exceptions->render(function (AuthenticationException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json(['status' => 'error', 'message' => 'Unauthenticated.'], 401);
            }
        });
    })->create();
