<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Seeds or resets the administrator login account with known secure credentials.
     */
    public function run(?string $email = null, ?string $password = null): void
    {
        $email = strtolower(trim($email ?: env('ADMIN_SEED_EMAIL', 'devtanvirhossain@gmail.com')));
        $password = $password ?: env('ADMIN_SEED_PASSWORD', 'AdminSecure2026!');

        $hash = Hash::make($password, ['rounds' => 12]);

        $existing = User::where('email', $email)->first();

        if ($existing) {
            $existing->password_hash = $hash;
            $existing->save();
            $this->command?->info("✓ Administrator password updated for: {$email}");
        } else {
            // If another owner exists, update that first user or create new
            $firstUser = User::first();
            if ($firstUser) {
                $firstUser->email = $email;
                $firstUser->password_hash = $hash;
                $firstUser->save();
                $this->command?->info("✓ Existing administrator record updated to: {$email}");
            } else {
                User::create([
                    'id' => (string) Str::uuid(),
                    'email' => $email,
                    'password_hash' => $hash,
                    'created_at' => now(),
                ]);
                $this->command?->info("✓ Administrator account created for: {$email}");
            }
        }

        $this->command?->line("--------------------------------------------------");
        $this->command?->line("  Admin Workspace URL : http://127.0.0.1:8000/admin");
        $this->command?->line("  Admin Email         : {$email}");
        $this->command?->line("  Admin Password      : {$password}");
        $this->command?->line("--------------------------------------------------");
    }
}
