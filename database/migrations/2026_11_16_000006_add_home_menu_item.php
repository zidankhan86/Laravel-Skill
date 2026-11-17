<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Corresponds to 006_home_menu.sql
     */
    public function up(): void
    {
        if (Schema::hasTable('settings')) {
            DB::statement("UPDATE settings SET value=JSON_SET(value, '$.menu', CONCAT('Home|/\\n', JSON_UNQUOTE(JSON_EXTRACT(value, '$.menu')))), version=version+1 WHERE id='navigation' AND LOCATE('Home|/', JSON_UNQUOTE(JSON_EXTRACT(value, '$.menu')))=0");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
    }
};
