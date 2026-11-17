<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Corresponds to 003_appearance.sql
     */
    public function up(): void
    {
        if (Schema::hasTable('settings')) {
            DB::statement("
                INSERT IGNORE INTO settings (id, value)
                VALUES ('appearance', '{\"websitePrimaryColor\": \"#dc143c\", \"adminPrimaryColor\": \"#d8ef89\", \"websiteTheme\": \"dark\", \"adminTheme\": \"light\"}')
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
