<?php

use App\Http\Controllers\Api\Admin\ContentController;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\EditorController;
use App\Http\Controllers\Api\Admin\LeadController;
use App\Http\Controllers\Api\Admin\MediaAdminController;
use App\Http\Controllers\Api\Admin\SettingController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\MediaController;
use App\Http\Controllers\Api\PublicController;
use App\Http\Controllers\Api\RequestController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - Tanvir Portfolio CMS (Laravel 12)
|--------------------------------------------------------------------------
*/

// Public Endpoints
Route::get('/health', [PublicController::class, 'health']);
Route::get('/public/appearance', [PublicController::class, 'appearance']);
Route::get('/public/site', [PublicController::class, 'site']);
Route::get('/public/{collection}/{slug}', [PublicController::class, 'detail']);
Route::post('/requests', [RequestController::class, 'store'])->middleware(['origin']);

// Authentication Endpoints
Route::prefix('auth')->group(function () {
    Route::get('/session', [AuthController::class, 'session']);
    Route::post('/login', [AuthController::class, 'login'])->middleware(['origin']);
    Route::post('/logout', [AuthController::class, 'logout'])->middleware(['auth.custom', 'origin', 'custom.csrf']);
    Route::post('/password', [AuthController::class, 'changePassword'])->middleware(['auth.custom', 'origin', 'custom.csrf']);
});

// Admin CMS Endpoints
Route::prefix('admin')->middleware(['auth.custom', 'origin', 'custom.csrf'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Content Management
    Route::get('/content/{collection}', [ContentController::class, 'index']);
    Route::post('/content/{collection}', [ContentController::class, 'store']);
    Route::put('/content/{collection}/{id}', [ContentController::class, 'update']);
    Route::post('/content/{collection}/{id}/{action}', [ContentController::class, 'action']);

    // Module Settings
    Route::get('/settings', [SettingController::class, 'index']);
    Route::put('/settings/{id}', [SettingController::class, 'update']);

    // CRM Leads & Booking Requests
    Route::get('/requests', [LeadController::class, 'index']);
    Route::get('/requests/{id}', [LeadController::class, 'show']);
    Route::put('/requests/{id}', [LeadController::class, 'update']);
    Route::patch('/requests/{id}', [LeadController::class, 'update']);

    // Media Library
    Route::get('/media', [MediaAdminController::class, 'index']);
    Route::post('/media', [MediaAdminController::class, 'store']);
    Route::put('/media/{id}', [MediaAdminController::class, 'update']);
    Route::match(['put', 'post'], '/media/{id}/file', [MediaAdminController::class, 'replace']);
    Route::get('/media/{id}/usage', [MediaAdminController::class, 'usage']);
    Route::delete('/media/{id}', [MediaAdminController::class, 'destroy']);
    Route::get('/media/{id}/file', [MediaController::class, 'file']);

    // In-Place Visual Editor
    Route::get('/editor', [EditorController::class, 'snapshot']);
    Route::patch('/editor', [EditorController::class, 'batchSave']);
});

// Automated Web Installer API Endpoints
Route::prefix('installer')->middleware([\App\Http\Middleware\RedirectIfInstalled::class, 'throttle:60,1'])->group(function () {
    Route::get('/requirements', [\App\Http\Controllers\Installer\InstallerController::class, 'checkRequirements']);
    Route::post('/test-database', [\App\Http\Controllers\Installer\InstallerController::class, 'testDatabase']);
    Route::post('/verify-hosting', [\App\Http\Controllers\Installer\InstallerController::class, 'verifyHosting']);
    Route::post('/create-database', [\App\Http\Controllers\Installer\InstallerController::class, 'createHostingDatabase']);
    Route::post('/step', [\App\Http\Controllers\Installer\InstallerController::class, 'executeStep']);
    Route::get('/state', [\App\Http\Controllers\Installer\InstallerController::class, 'getState']);
});
