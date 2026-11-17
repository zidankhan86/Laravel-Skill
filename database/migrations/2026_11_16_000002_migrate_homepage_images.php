<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Corresponds to 002_homepage_images.sql
     */
    public function up(): void
    {
        if (Schema::hasTable('settings')) {
            DB::statement("
                UPDATE settings
                SET value = JSON_SET(value, '$.heroPortrait', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(value, '$.portrait')), '')),
                    version = version + 1
                WHERE id = 'settings' AND JSON_CONTAINS_PATH(value, 'one', '$.heroPortrait') = 0
            ");

            DB::statement("
                UPDATE settings
                SET value = JSON_SET(value, '$.journeyPortrait', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(value, '$.portrait')), '')),
                    version = version + 1
                WHERE id = 'settings' AND JSON_CONTAINS_PATH(value, 'one', '$.journeyPortrait') = 0
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
