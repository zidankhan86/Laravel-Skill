<?php

use App\Http\Controllers\Api\MediaController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'name' => 'Tanvir Portfolio CMS API',
        'framework' => 'Laravel 12',
        'status' => 'operational',
    ]);
});

Route::get('/media/{id}', [MediaController::class, 'show']);
Route::get('/robots.txt', [\App\Http\Controllers\Api\PublicController::class, 'robots']);
Route::get('/sitemap.xml', [\App\Http\Controllers\Api\PublicController::class, 'sitemap']);
