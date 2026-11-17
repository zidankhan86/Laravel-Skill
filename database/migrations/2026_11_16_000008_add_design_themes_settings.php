<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Corresponds to 008_design_themes.sql
     */
    public function up(): void
    {
        if (Schema::hasTable('settings')) {
            DB::statement("UPDATE settings SET value=JSON_SET(value, '$.websiteDesign', 'editorial'), version=version+1 WHERE id='appearance' AND JSON_CONTAINS_PATH(value, 'one', '$.websiteDesign')=0");
            DB::statement("UPDATE settings SET value=JSON_SET(value, '$.websiteDensity', 'comfortable'), version=version+1 WHERE id='appearance' AND JSON_CONTAINS_PATH(value, 'one', '$.websiteDensity')=0");
            DB::statement("UPDATE settings SET value=JSON_SET(value, '$.websiteCorners', 'rounded'), version=version+1 WHERE id='appearance' AND JSON_CONTAINS_PATH(value, 'one', '$.websiteCorners')=0");
            DB::statement("UPDATE settings SET value=JSON_SET(value, '$.websiteMotion', 'subtle'), version=version+1 WHERE id='appearance' AND JSON_CONTAINS_PATH(value, 'one', '$.websiteMotion')=0");
            DB::statement("UPDATE settings SET value=JSON_SET(value, '$.studioPortraitShape', 'oval'), version=version+1 WHERE id='appearance' AND JSON_CONTAINS_PATH(value, 'one', '$.studioPortraitShape')=0");
            DB::statement("UPDATE settings SET value=JSON_SET(value, '$.executivePortraitSide', 'left'), version=version+1 WHERE id='appearance' AND JSON_CONTAINS_PATH(value, 'one', '$.executivePortraitSide')=0");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
    }
};
