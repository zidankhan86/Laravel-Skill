<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Corresponds to 012_media_lead_versions.sql
     */
    public function up(): void
    {
        if (Schema::hasTable('media') && !Schema::hasColumn('media', 'version')) {
            Schema::table('media', function (Blueprint $table) {
                $table->integer('version')->default(1)->after('created_at');
            });
        }

        if (Schema::hasTable('requests') && !Schema::hasColumn('requests', 'version')) {
            Schema::table('requests', function (Blueprint $table) {
                $table->integer('version')->default(1)->after('updated_at');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
    }
};
