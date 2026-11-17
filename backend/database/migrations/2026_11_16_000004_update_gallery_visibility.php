<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Corresponds to 004_gallery_visibility.sql
     */
    public function up(): void
    {
        if (Schema::hasTable('settings')) {
            DB::statement("
                UPDATE settings SET value = JSON_SET(value,
                    '$.galleryTitle', 'Events & Activities',
                    '$.galleryDescription', '',
                    '$.sections', CONCAT_WS(',', NULLIF(JSON_UNQUOTE(JSON_EXTRACT(value, '$.sections')), ''), 'gallery,closingCta,blog,navigation,footer,floatingActions')),
                    version = version + 1
                WHERE id = 'homepage' AND JSON_CONTAINS_PATH(value, 'one', '$.galleryTitle') = 0
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
