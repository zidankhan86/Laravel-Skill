<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Corresponds to 010_editor_form_labels.sql
     */
    public function up(): void
    {
        if (Schema::hasTable('settings')) {
            $formLabels = [
                'bookingHeading' => 'Request a strategy call',
                'contactHeading' => 'Send a message',
                'nameLabel' => 'Name',
                'emailLabel' => 'Email',
                'phoneLabel' => 'Phone (optional)',
                'sendBooking' => 'Send booking request',
                'sendContact' => 'Send message',
                'freeLabel' => 'Free',
                'paidLabel' => 'Paid',
                'previewUnavailable' => 'Preview unavailable',
                'dateLabel' => 'Preferred date and time',
                'datePlaceholder' => 'Choose a date and time',
                'timezoneLabel' => 'Your timezone:',
                'bookingNotice' => 'A request is not a confirmed appointment.',
            ];

            foreach ($formLabels as $field => $label) {
                DB::statement("
                    UPDATE settings
                    SET value = JSON_SET(value, '$.{$field}', ?),
                        version = version + 1
                    WHERE id = 'ui' AND JSON_CONTAINS_PATH(value, 'one', '$.{$field}') = 0
                ", [$label]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
    }
};
