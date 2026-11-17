<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Corresponds to 007_loading_line.sql
     */
    public function up(): void
    {
        if (Schema::hasTable('settings')) {
            DB::statement("UPDATE settings SET value=JSON_SET(value, '$.websiteLoadingBar', 'on'), version=version+1 WHERE id='appearance' AND JSON_CONTAINS_PATH(value, 'one', '$.websiteLoadingBar')=0");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
    }
};
