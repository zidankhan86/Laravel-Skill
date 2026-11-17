<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminWebController extends Controller
{
    public function index(Request $request): Response
    {
        $userId = $request->session()->get('userId') ?? $request->user()?->id;

        $settings = Setting::all()->mapWithKeys(function (Setting $s) {
            return [$s->id => $s->value];
        });

        return Inertia::render('Admin', [
            'isAuthenticated' => !empty($userId),
            'settings' => $settings,
        ]);
    }
}
