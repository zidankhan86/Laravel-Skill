<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Content;
use App\Models\Setting;
use Inertia\Inertia;
use Inertia\Response;

class PageController extends Controller
{
    /**
     * Helper to get full site content and settings.
     */
    protected function getSiteContext(): array
    {
        $content = Content::published()
            ->orderBy('sort_order')
            ->orderBy('created_at')
            ->get();

        $settings = Setting::allMapped();

        return compact('content', 'settings');
    }

    public function about(): Response
    {
        return Inertia::render('About', $this->getSiteContext());
    }

    public function services(): Response
    {
        return Inertia::render('Services', $this->getSiteContext());
    }

    public function projects(): Response
    {
        return Inertia::render('Projects', $this->getSiteContext());
    }

    public function deals(): Response
    {
        return Inertia::render('Deals', $this->getSiteContext());
    }

    public function resources(): Response
    {
        return Inertia::render('Resources', $this->getSiteContext());
    }

    public function booking(): Response
    {
        return Inertia::render('Booking', $this->getSiteContext());
    }

    public function contact(): Response
    {
        return Inertia::render('Contact', $this->getSiteContext());
    }

    public function blog(): Response
    {
        return Inertia::render('Blog', $this->getSiteContext());
    }
}
