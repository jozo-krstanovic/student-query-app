<?php

use App\Http\Controllers\Admin\ChainController;
use App\Http\Controllers\Admin\PermissionController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\SubjectController;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\MeController;
use Illuminate\Support\Facades\Route;

Route::get('/health', [HealthController::class, 'show']);

Route::middleware('auth:api')->group(function () {
    Route::get('/me', [MeController::class, 'show']);

    Route::middleware('superuser')->prefix('admin')->group(function () {
        Route::get('/permissions', [PermissionController::class, 'index']);

        Route::get('/roles', [RoleController::class, 'index']);
        Route::post('/roles', [RoleController::class, 'store']);
        Route::put('/roles/{role}', [RoleController::class, 'update']);
        Route::put('/roles/{role}/permissions', [RoleController::class, 'syncPermissions']);

        Route::get('/subjects', [SubjectController::class, 'index']);
        Route::post('/subjects', [SubjectController::class, 'store']);
        Route::put('/subjects/{subject}', [SubjectController::class, 'update']);

        Route::get('/chains', [ChainController::class, 'index']);
        Route::post('/chains', [ChainController::class, 'store']);
        Route::get('/chains/{chain}', [ChainController::class, 'show']);
    });
});
