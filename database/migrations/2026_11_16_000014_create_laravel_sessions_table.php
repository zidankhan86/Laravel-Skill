<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Dedicated persistent database session table for Laravel 12.
     * Preserves original Express sessions table without naming collision.
     */
    public function up(): void
    {
        if (!Schema::hasTable('laravel_sessions')) {
            Schema::create('laravel_sessions', function (Blueprint $table) {
                $table->string('id')->primary();
                $table->char('user_id', 36)->nullable()->index();
                $table->string('ip_address', 45)->nullable();
                $table->text('user_agent')->nullable();
                $table->longText('payload');
                $table->integer('last_activity')->index();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('laravel_sessions');
    }
};
