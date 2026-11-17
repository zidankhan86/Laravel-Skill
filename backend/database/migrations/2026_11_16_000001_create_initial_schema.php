<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Corresponds to 001_initial.sql
     */
    public function up(): void
    {
        // 1. users
        if (!Schema::hasTable('users')) {
            Schema::create('users', function (Blueprint $table) {
                $table->char('id', 36)->primary();
                $table->string('email', 254)->unique('email');
                $table->string('password_hash', 255);
                $table->timestamp('created_at')->useCurrent();
            });
        }

        // 2. sessions (Preserve original Express session store schema)
        if (!Schema::hasTable('sessions')) {
            Schema::create('sessions', function (Blueprint $table) {
                $table->string('sid', 128)->primary();
                $table->mediumText('data');
                $table->bigInteger('expires_at');
                $table->index('expires_at', 'sessions_expiry');
            });
        }

        // 3. media
        if (!Schema::hasTable('media')) {
            Schema::create('media', function (Blueprint $table) {
                $table->char('id', 36)->primary();
                $table->string('name', 255);
                $table->string('mime', 100);
                $table->string('alt', 500)->default('');
                $table->integer('size');
                $table->timestamp('created_at')->useCurrent();
            });
            DB::statement('ALTER TABLE media ADD bytes MEDIUMBLOB NOT NULL AFTER size');
        }

        // 4. content
        if (!Schema::hasTable('content')) {
            Schema::create('content', function (Blueprint $table) {
                $table->char('id', 36)->primary();
                $table->string('collection', 32);
                $table->string('slug', 180);
                $table->string('title', 255);
                $table->text('summary');
                $table->mediumText('body');
                $table->string('status', 16)->default('draft');
                $table->boolean('featured')->default(false);
                $table->integer('sort_order')->default(0);
                $table->json('fields');
                $table->string('seo_title', 255)->default('');
                $table->string('seo_description', 500)->default('');
                $table->dateTime('published_at')->nullable();
                $table->dateTime('deleted_at')->nullable();
                $table->timestamp('created_at')->useCurrent();
                $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
                $table->integer('version')->default(1);

                $table->unique(['collection', 'slug'], 'content_slug');
                $table->index(['collection', 'status', 'deleted_at', 'sort_order'], 'public_content');
                $table->index('published_at', 'content_published');
            });
        }

        // 5. content_media
        if (!Schema::hasTable('content_media')) {
            Schema::create('content_media', function (Blueprint $table) {
                $table->char('content_id', 36);
                $table->char('media_id', 36);
                $table->primary(['content_id', 'media_id']);
                $table->index('media_id', 'media_id');
                $table->foreign('content_id')->references('id')->on('content')->cascadeOnDelete();
                $table->foreign('media_id')->references('id')->on('media')->restrictOnDelete();
            });
        }

        // 6. settings
        if (!Schema::hasTable('settings')) {
            Schema::create('settings', function (Blueprint $table) {
                $table->string('id', 32)->primary();
                $table->json('value');
                $table->integer('version')->default(1);
                $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
            });
        }

        // 7. settings_media
        if (!Schema::hasTable('settings_media')) {
            Schema::create('settings_media', function (Blueprint $table) {
                $table->string('settings_id', 32);
                $table->char('media_id', 36);
                $table->primary(['settings_id', 'media_id']);
                $table->index('media_id', 'media_id');
                $table->foreign('settings_id')->references('id')->on('settings')->cascadeOnDelete();
                $table->foreign('media_id')->references('id')->on('media')->restrictOnDelete();
            });
        }

        // 8. requests
        if (!Schema::hasTable('requests')) {
            Schema::create('requests', function (Blueprint $table) {
                $table->char('id', 36)->primary();
                $table->string('kind', 16);
                $table->string('name', 150);
                $table->string('email', 254);
                $table->string('phone', 50)->default('');
                $table->string('service', 255)->default('');
                $table->text('message');
                $table->dateTime('requested_at')->nullable();
                $table->string('timezone', 100);
                $table->string('status', 16)->default('new');
                $table->text('notes');
                $table->char('dedup_key', 36);
                $table->unique('dedup_key', 'dedup_key');
                $table->timestamp('created_at')->useCurrent();
                $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

                $table->index(['kind', 'status', 'created_at'], 'requests_status');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Safe down: preserve tables to protect production data
    }
};
