<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Corresponds to 009_editor_labels.sql
     */
    public function up(): void
    {
        if (Schema::hasTable('settings')) {
            $uiLabels = [
                'Hero_1' => 'PERSONAL PORTFOLIO',
                'Hero_2' => 'eCommerce',
                'Hero_3' => 'Customer psychology',
                'Hero_4' => 'Automation & systems',
                'ServicesSection_1' => 'WHAT I DO',
                'ResourcesSection_1' => 'Download unavailable',
                'TestimonialsSection_1' => 'IN THEIR WORDS',
                'YouTubeSection_1' => 'INSIGHTS & IDEAS',
                'YouTubeSection_2' => 'Video link unavailable',
                'BookingSection_1' => 'LET’S BUILD SOMETHING BETTER',
                'DetailPage_1' => '← Back to Home',
                'DetailPage_2' => 'Blog',
                'DetailPage_3' => 'No articles published yet. Please check back soon.',
                'DetailPage_4' => 'Technologies:',
                'DetailPage_5' => 'Get on WhatsApp ↗',
                'DetailPage_6' => 'Private resource. Contact the owner for access.',
                'DetailPage_7' => 'Download resource ↓',
                'DetailPage_8' => 'Download unavailable',
                'DetailPage_9' => 'Live preview ↗',
                'DetailPage_10' => 'Page not found',
                'RequestForm_1' => 'I’d like to',
                'RequestForm_2' => 'Service interest',
                'RequestForm_3' => 'Message',
                'RequestForm_4' => 'Website',
            ];

            DB::statement(
                "INSERT IGNORE INTO settings (id, value) VALUES ('ui', ?)",
                [json_encode($uiLabels, JSON_UNESCAPED_UNICODE)]
            );
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
    }
};
