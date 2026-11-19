<?php

namespace Database\Seeders;

use App\Models\Content;
use App\Models\Setting;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class InitialContentSeeder extends Seeder
{
    /**
     * Seed initial content and settings for fresh installations safely and idempotently.
     */
    public function run(): void
    {
        $this->seedSettings();
        $this->seedContent();
    }

    /**
     * Seed default settings if not already present.
     */
    protected function seedSettings(): void
    {
        $seedFile = base_path('server/settings-seed.json');
        $seedData = [];

        if (file_exists($seedFile)) {
            $raw = file_get_contents($seedFile);
            $seedData = json_decode($raw, true) ?: [];
        }

        // Repair encoding in seed data if necessary
        foreach ($seedData as $key => $values) {
            $existing = Setting::find($key);
            if (!$existing && is_array($values)) {
                Setting::create([
                    'id' => $key,
                    'value' => $values,
                    'version' => 1,
                ]);
            }
        }

        // Ensure critical baseline settings exist even if file was missing
        $defaults = [
            'brand' => Setting::defaultBrand(),
            'appearance' => [
                'websiteDesign' => 'editorial',
                'websiteTheme' => 'dark',
                'websitePrimaryColor' => '#dc143c',
                'websiteCorners' => 'square',
                'adminTheme' => 'light',
                'adminPrimaryColor' => '#d8ef89',
            ],
            'navigation' => [
                'navTitle' => 'TANVIR.',
                'navSubtitle' => 'eCommerce Architect',
                'navCtaLabel' => 'Book Call',
                'navCtaUrl' => '#booking',
                'Footer_18' => '© ',
            ],
            'homepage' => [
                'Hero_1' => 'Experience',
                'Hero_2' => '5+ Years',
                'Hero_3' => 'Available for New Projects',
                'Hero_4' => ' Founder, ',
                'Hero_5' => 'eCommerce Website Architect & ',
                'Hero_6' => ' Automation Specialist',
                'Hero_7' => 'আমি শুধু ওয়েবসাইট বানাই না। আমি কাস্টমারের সাইকোলজি, অটোমেশন এবং সিস্টেম ব্যবহার করে একটি ওয়েবসাইটকে ',
                'Hero_8' => 'Ultimate Sales Machine',
                'Hero_9' => ' এ রূপান্তর করি।',
                'Hero_10' => ' Book a Strategy Call',
                'Hero_11' => ' Contact Me',
                'Hero_12' => '❝ I don’t sell websites. I design how customers think, trust and buy. ❞',
                'sections' => 'hero,trust,about,journey,services,videos,projects,deals,resources,testimonials,booking,gallery,closingCta,blog,navigation,footer,floatingActions',
            ],
        ];

        foreach ($defaults as $id => $val) {
            if (!Setting::find($id)) {
                Setting::create([
                    'id' => $id,
                    'value' => $val,
                    'version' => 1,
                ]);
            }
        }
    }

    /**
     * Seed initial content collections if the table is empty.
     */
    protected function seedContent(): void
    {
        if (Content::count() > 0) {
            return; // Preserve existing customer content
        }

        $items = [
            // Services
            [
                'collection' => 'services',
                'slug' => 'high-converting-ecommerce-website',
                'title' => 'High Converting eCommerce Website',
                'summary' => 'Psychology + CRO + Automation for maximum sales impact.',
                'body' => 'Complete high-performance eCommerce website architected to turn visitors into repeat buyers.',
                'fields' => [
                    'icon' => 'ShoppingBag',
                    'features' => ['Custom UI/UX', 'Conversion Optimized', 'Fast Performance'],
                    'ctaLabel' => 'Book Now',
                ],
            ],
            [
                'collection' => 'services',
                'slug' => 'advanced-landing-page-funnel',
                'title' => 'Advanced Landing Page Funnel',
                'summary' => 'Multi-stage funnels designed for Lead → Conversion → Retention.',
                'body' => 'High-converting funnel systems designed to capture attention and convert prospects into loyal customers.',
                'fields' => [
                    'icon' => 'Layers',
                    'features' => ['Sales Copywriting', 'A/B Testing', 'Email Automation'],
                    'ctaLabel' => 'Book Now',
                ],
            ],
            [
                'collection' => 'services',
                'slug' => 'custom-ecommerce-system-laravel',
                'title' => 'Custom eCommerce System (Laravel)',
                'summary' => 'Scalable, secure, and tailor-made for specific business needs.',
                'body' => 'Bespoke backend and inventory automation built with Laravel and high-concurrency architecture.',
                'fields' => [
                    'icon' => 'Code',
                    'features' => ['API Integration', 'Scalable Database', 'Enterprise Security'],
                    'ctaLabel' => 'Book Now',
                ],
            ],
            // Videos
            [
                'collection' => 'videos',
                'slug' => 'why-90-percent-ecommerce-fails',
                'title' => 'কেন ৯০% eCommerce fail করে?',
                'summary' => 'Deep dive into why online businesses struggle and how proper systems fix bottlenecks.',
                'body' => '',
                'fields' => [
                    'duration' => '12:45',
                    'youtubeUrl' => 'https://www.youtube.com',
                ],
            ],
            [
                'collection' => 'videos',
                'slug' => 'how-automation-saves-profit',
                'title' => 'Automation কিভাবে profit বাঁচায়?',
                'summary' => 'How inventory and marketing automations reduce operational costs and maximize margin.',
                'body' => '',
                'fields' => [
                    'duration' => '10:10',
                    'youtubeUrl' => 'https://www.youtube.com',
                ],
            ],
            // Testimonials
            [
                'collection' => 'testimonials',
                'slug' => 'rahat-ahmed-review',
                'title' => 'Rahat Ahmed',
                'summary' => 'Tanvir didn\'t just build a site; he built a system that saves me 4 hours daily. The automation is incredible.',
                'body' => '',
                'fields' => [
                    'name' => 'Rahat Ahmed',
                    'role' => 'CEO, TechWear BD',
                    'rating' => 5,
                ],
            ],
        ];

        foreach ($items as $idx => $item) {
            Content::create([
                'id' => (string) Str::uuid(),
                'collection' => $item['collection'],
                'slug' => $item['slug'],
                'title' => $item['title'],
                'summary' => $item['summary'],
                'body' => $item['body'] ?? '',
                'status' => 'published',
                'featured' => true,
                'sort_order' => $idx,
                'fields' => $item['fields'],
                'version' => 1,
            ]);
        }
    }
}
