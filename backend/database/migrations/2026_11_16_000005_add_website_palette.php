<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Corresponds to 005_website_palette.sql
     */
    public function up(): void
    {
        if (Schema::hasTable('settings')) {
            DB::statement("UPDATE settings SET value=JSON_SET(value, '$.websiteGreenColor', '#103b2a'), version=version+1 WHERE id='appearance' AND JSON_CONTAINS_PATH(value, 'one', '$.websiteGreenColor')=0");
            DB::statement("UPDATE settings SET value=JSON_SET(value, '$.websiteLimeColor', '#d0f56a'), version=version+1 WHERE id='appearance' AND JSON_CONTAINS_PATH(value, 'one', '$.websiteLimeColor')=0");
            DB::statement("UPDATE settings SET value=JSON_SET(value, '$.websiteLavenderColor', '#d8cdf3'), version=version+1 WHERE id='appearance' AND JSON_CONTAINS_PATH(value, 'one', '$.websiteLavenderColor')=0");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
    }
};
