<?php

use App\Http\Controllers\Api\MediaController;
use App\Http\Controllers\Api\PublicController;
use App\Http\Controllers\Web\AdminWebController;
use App\Http\Controllers\Web\DetailController;
use App\Http\Controllers\Web\HomeController;
use App\Http\Controllers\Web\PageController;
use Illuminate\Support\Facades\Route;

// SEO
Route::get('/robots.txt', [PublicController::class, 'robots']);
Route::get('/sitemap.xml', [PublicController::class, 'sitemap']);

// Binary media streaming
Route::get('/media/{id}', [MediaController::class, 'show'])->name('media.show');

// Public Pages via Inertia.js
Route::get('/', [HomeController::class, 'index'])->name('home');
Route::get('/about', [PageController::class, 'about'])->name('about');
Route::get('/services', [PageController::class, 'services'])->name('services');
Route::get('/projects', [PageController::class, 'projects'])->name('projects');
Route::get('/deals', [PageController::class, 'deals'])->name('deals');
Route::get('/resources', [PageController::class, 'resources'])->name('resources');
Route::get('/booking', [PageController::class, 'booking'])->name('booking');
Route::get('/contact', [PageController::class, 'contact'])->name('contact');
Route::get('/blog', [PageController::class, 'blog'])->name('blog');

// Dynamic Single Item Routes
Route::get('/{collection}/{slug}', [DetailController::class, 'show'])->name('detail')
    ->whereIn('collection', ['gallery', 'services', 'projects', 'blog', 'resources', 'videos', 'deals', 'testimonials']);

// Admin Workspace
Route::get('/admin', [AdminWebController::class, 'index'])->name('admin');

// Zero-Knowledge Web Installer
Route::get('/install', [\App\Http\Controllers\Installer\InstallerController::class, 'index'])
    ->name('installer.wizard')
    ->middleware([\App\Http\Middleware\RedirectIfInstalled::class]);
