<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CreateOwnerCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'portfolio:owner:create {--email= : Admin email} {--password= : Admin password}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Bootstrap initial portfolio administrator account';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $pdo = DB::connection()->getPdo();

        // 1. Acquire MySQL advisory lock to prevent concurrent bootstrapping
        $lockStmt = $pdo->query("SELECT GET_LOCK('portfolio_owner_bootstrap', 10) AS acquired");
        $lockResult = $lockStmt->fetch(\PDO::FETCH_ASSOC);

        if (!$lockResult || (int) $lockResult['acquired'] !== 1) {
            $this->error('Bootstrap already running or lock acquisition timed out.');
            return Command::FAILURE;
        }

        try {
            // 2. Check single-owner constraint: bootstrap is disabled if owner exists
            $existing = DB::table('users')->first();
            if ($existing) {
                $this->error('Owner already exists; bootstrap is disabled.');
                return Command::FAILURE;
            }

            // 3. Prompt or read email
            $email = $this->option('email');
            if (empty($email)) {
                $email = $this->ask('Owner email');
            }
            $email = strtolower(trim((string) $email));

            // Validate email format
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $this->error('Invalid email address format.');
                return Command::FAILURE;
            }

            // 4. Prompt or read password (hidden input)
            $password = $this->option('password');
            if (empty($password)) {
                $password = $this->secret('Password (hidden, minimum 14 characters, max 72 bytes)');
            }
            $password = (string) $password;

            // Validate password length
            if (strlen($password) < 14 || strlen($password) > 72) {
                $this->error('Invalid password length (must be between 14 characters and 72 bytes).');
                return Command::FAILURE;
            }

            // 5. Hash password with bcrypt cost 12
            $hash = Hash::make($password, ['rounds' => 12]);

            // 6. Insert new owner
            $userId = (string) Str::uuid();
            DB::table('users')->insert([
                'id' => $userId,
                'email' => $email,
                'password_hash' => $hash,
                'created_at' => now(),
            ]);

            $this->info("Owner created successfully. User ID: {$userId}");
            return Command::SUCCESS;
        } finally {
            $pdo->query("SELECT RELEASE_LOCK('portfolio_owner_bootstrap')");
        }
    }
}
