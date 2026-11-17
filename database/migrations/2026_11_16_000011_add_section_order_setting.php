<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Corresponds to 011_section_order.sql
     */
    public function up(): void
    {
        if (Schema::hasTable('settings')) {
            DB::statement("
                UPDATE settings
                SET value = JSON_SET(value, '$.sectionOrder', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(value, '$.sections')), '')),
                    version = version + 1
                WHERE id = 'homepage' AND JSON_CONTAINS_PATH(value, 'one', '$.sectionOrder') = 0
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
