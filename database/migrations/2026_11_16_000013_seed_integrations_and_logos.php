<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Corresponds to 013_integrations_logos.sql
     */
    public function up(): void
    {
        if (Schema::hasTable('settings')) {
            DB::statement("
                INSERT IGNORE INTO settings (id, value)
                VALUES ('integrations', '{\"facebookEnabled\": \"off\", \"facebookId\": \"\", \"gtmEnabled\": \"off\", \"gtmId\": \"\", \"tiktokEnabled\": \"off\", \"tiktokId\": \"\"}')
            ");

            DB::statement("
                INSERT IGNORE INTO settings (id, value)
                VALUES ('customCode', '{\"enabled\": \"off\", \"headerHtml\": \"\", \"headerCss\": \"\", \"headerJs\": \"\", \"bodyHtml\": \"\", \"bodyCss\": \"\", \"bodyJs\": \"\"}')
            ");

            DB::statement("
                INSERT IGNORE INTO settings (id, value)
                VALUES ('logos', '{\"headerMode\": \"text\", \"headerImage\": \"\", \"headerAlt\": \"\", \"footerMode\": \"text\", \"footerImage\": \"\", \"footerAlt\": \"\"}')
            ");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
    }
};
