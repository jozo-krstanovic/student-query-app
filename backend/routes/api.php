<?php

use App\Http\Controllers\Admin\ChainController;
use App\Http\Controllers\Admin\PermissionController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\SubjectController as AdminSubjectController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Faculty\InquiryController as FacultyInquiryController;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\InquiryController;
use App\Http\Controllers\MeController;
use App\Http\Controllers\SubjectController;
use Illuminate\Support\Facades\Route;

Route::get('/health', [HealthController::class, 'show']);

Route::middleware('auth:api')->group(function () {
    Route::get('/me', [MeController::class, 'show']);

    Route::get('/subjects', [SubjectController::class, 'index']);

    Route::middleware('student')->group(function () {
        Route::get('/inquiries', [InquiryController::class, 'index']);
        Route::post('/inquiries', [InquiryController::class, 'store']);
        Route::get('/inquiries/{inquiry}', [InquiryController::class, 'show']);
        Route::post('/inquiries/{inquiry}/comments', [InquiryController::class, 'comment']);
    });

    Route::prefix('faculty')->group(function () {
        Route::get('/inquiries', [FacultyInquiryController::class, 'index']);
        Route::get('/inquiries/{inquiry}', [FacultyInquiryController::class, 'show']);
        Route::post('/inquiries/{inquiry}/approve', [FacultyInquiryController::class, 'approve']);
        Route::post('/inquiries/{inquiry}/resolve', [FacultyInquiryController::class, 'resolve']);
        Route::post('/inquiries/{inquiry}/reset', [FacultyInquiryController::class, 'reset']);
        Route::post('/inquiries/{inquiry}/comments', [FacultyInquiryController::class, 'comment']);
    });

    Route::middleware('superuser')->prefix('admin')->group(function () {
        Route::get('/permissions', [PermissionController::class, 'index']);

        Route::get('/users', [AdminUserController::class, 'index']);
        Route::put('/users/{user}', [AdminUserController::class, 'update']);

        Route::get('/roles', [RoleController::class, 'index']);
        Route::post('/roles', [RoleController::class, 'store']);
        Route::put('/roles/{role}', [RoleController::class, 'update']);
        Route::put('/roles/{role}/permissions', [RoleController::class, 'syncPermissions']);

        Route::get('/subjects', [AdminSubjectController::class, 'index']);
        Route::post('/subjects', [AdminSubjectController::class, 'store']);
        Route::put('/subjects/{subject}', [AdminSubjectController::class, 'update']);

        Route::get('/chains', [ChainController::class, 'index']);
        Route::post('/chains', [ChainController::class, 'store']);
        Route::get('/chains/{chain}', [ChainController::class, 'show']);
    });
});
