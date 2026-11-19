<?php

namespace App\Installer;

use App\Models\User;
use Database\Seeders\InitialContentSeeder;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class InstallationManager
{
    protected RequirementsChecker $requirementsChecker;
    protected DatabaseManager $databaseManager;
    protected EnvironmentManager $environmentManager;
    protected InstallationLock $installationLock;
    protected string $stateFile;

    public function __construct(
        ?RequirementsChecker $requirementsChecker = null,
        ?DatabaseManager $databaseManager = null,
        ?EnvironmentManager $environmentManager = null,
        ?InstallationLock $installationLock = null
    ) {
        $this->requirementsChecker = $requirementsChecker ?: new RequirementsChecker();
        $this->databaseManager = $databaseManager ?: new DatabaseManager();
        $this->environmentManager = $environmentManager ?: new EnvironmentManager();
        $this->installationLock = $installationLock ?: new InstallationLock();
        $storage = (function_exists('app') && app()->has('path.storage')) ? storage_path() : dirname(__DIR__, 2) . '/storage';
        $this->stateFile = $storage . '/installer_state.json';
    }

    /**
     * Get or initialize installation state.
     */
    public function getState(): array
    {
        if (file_exists($this->stateFile)) {
            $raw = @file_get_contents($this->stateFile);
            $data = json_decode($raw, true);
            if (is_array($data)) {
                return $data;
            }
        }

        return [
            'current_step' => 'welcome',
            'completed_steps' => [],
            'database' => [],
            'site' => [],
            'created_at' => date('c'),
        ];
    }

    /**
     * Save temporary installation state.
     */
    public function saveState(array $state): void
    {
        $dir = dirname($this->stateFile);
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }
        @file_put_contents($this->stateFile, json_encode($state, JSON_PRETTY_PRINT));
    }

    /**
     * Clear temporary installation state upon completion.
     */
    public function clearState(): void
    {
        if (file_exists($this->stateFile)) {
            @unlink($this->stateFile);
        }
    }

    /**
     * Execute a specific automated installation sub-step.
     *
     * @param string $action
     * @param array $payload
     * @return array{success: bool, step: string, message: string, details?: array}
     */
    public function executeStep(string $action, array $payload = []): array
    {
        if ($this->installationLock->isInstalled()) {
            return [
                'success' => false,
                'step' => $action,
                'message' => 'Application is already installed and locked.',
            ];
        }

        switch ($action) {
            case 'validate_requirements':
                return $this->stepValidateRequirements();

            case 'configure_environment':
                return $this->stepConfigureEnvironment($payload);

            case 'run_migrations':
                return $this->stepRunMigrations();

            case 'seed_content':
                return $this->stepSeedContent();

            case 'create_admin':
                return $this->stepCreateAdmin($payload);

            case 'optimize_system':
                return $this->stepOptimizeSystem();

            case 'verify_installation':
                return $this->stepVerifyInstallation();

            case 'finalize_lock':
                return $this->stepFinalizeLock($payload);

            default:
                return [
                    'success' => false,
                    'step' => $action,
                    'message' => "Unknown installation step '{$action}'.",
                ];
        }
    }

    /**
     * Step 1: Validate server requirements.
     */
    protected function stepValidateRequirements(): array
    {
        $results = $this->requirementsChecker->check();
        if (!$results['canProceed']) {
            return [
                'success' => false,
                'step' => 'validate_requirements',
                'message' => 'Server requirements check failed. Please resolve critical requirements before proceeding.',
                'details' => $results,
            ];
        }

        return [
            'success' => true,
            'step' => 'validate_requirements',
            'message' => 'All server requirements and directory permissions verified.',
        ];
    }

    /**
     * Step 2: Configure .env environment file.
     */
    protected function stepConfigureEnvironment(array $payload): array
    {
        $db = $payload['database'] ?? [];
        $site = $payload['site'] ?? [];

        // Validate DB connection first
        $testRes = $this->databaseManager->testConnection([
            'host' => $db['host'] ?? '127.0.0.1',
            'port' => (int) ($db['port'] ?? 3306),
            'database' => $db['database'] ?? '',
            'username' => $db['username'] ?? '',
            'password' => $db['password'] ?? '',
        ]);

        if (!$testRes['connected']) {
            return [
                'success' => false,
                'step' => 'configure_environment',
                'message' => 'Database connection failed: ' . $testRes['message'],
            ];
        }

        // Generate .env
        $envConfig = [
            'APP_NAME' => $site['site_name'] ?? 'Portfolio CMS',
            'APP_URL' => rtrim($site['site_url'] ?? url('/'), '/'),
            'DB_HOST' => $db['host'] ?? '127.0.0.1',
            'DB_PORT' => $db['port'] ?? '3306',
            'DB_DATABASE' => $db['database'] ?? '',
            'DB_USERNAME' => $db['username'] ?? '',
            'DB_PASSWORD' => $db['password'] ?? '',
        ];

        $envRes = $this->environmentManager->generate($envConfig);
        if (!$envRes['success']) {
            return [
                'success' => false,
                'step' => 'configure_environment',
                'message' => $envRes['message'],
            ];
        }

        // Dynamically update runtime database connection configuration
        config([
            'database.default' => 'mysql',
            'database.connections.mysql.host' => $envConfig['DB_HOST'],
            'database.connections.mysql.port' => $envConfig['DB_PORT'],
            'database.connections.mysql.database' => $envConfig['DB_DATABASE'],
            'database.connections.mysql.username' => $envConfig['DB_USERNAME'],
            'database.connections.mysql.password' => $envConfig['DB_PASSWORD'],
            'app.name' => $envConfig['APP_NAME'],
            'app.url' => $envConfig['APP_URL'],
            'app.key' => $envRes['appKey'],
        ]);

        DB::purge('mysql');
        DB::reconnect('mysql');

        // Update state
        $state = $this->getState();
        $state['database'] = [
            'host' => $envConfig['DB_HOST'],
            'port' => $envConfig['DB_PORT'],
            'database' => $envConfig['DB_DATABASE'],
            'username' => $envConfig['DB_USERNAME'],
        ];
        $state['site'] = [
            'site_name' => $envConfig['APP_NAME'],
            'site_url' => $envConfig['APP_URL'],
        ];
        $this->saveState($state);

        return [
            'success' => true,
            'step' => 'configure_environment',
            'message' => 'Environment (.env) configured and database connected successfully.',
        ];
    }

    /**
     * Step 3: Run Laravel migrations safely.
     */
    protected function stepRunMigrations(): array
    {
        try {
            // Run standard migrations without dropping tables
            Artisan::call('migrate', [
                '--force' => true,
            ]);

            $output = Artisan::output();

            return [
                'success' => true,
                'step' => 'run_migrations',
                'message' => 'Database schema migrations executed successfully.',
                'details' => ['output' => trim($output)],
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'step' => 'run_migrations',
                'message' => 'Migration failed: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Step 4: Seed initial default content and settings.
     */
    protected function stepSeedContent(): array
    {
        try {
            $seeder = new InitialContentSeeder();
            $seeder->run();

            return [
                'success' => true,
                'step' => 'seed_content',
                'message' => 'Default portfolio content and system settings initialized.',
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'step' => 'seed_content',
                'message' => 'Initial seeding failed: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Step 5: Create initial administrator account.
     */
    protected function stepCreateAdmin(array $payload): array
    {
        $admin = $payload['admin'] ?? [];
        $email = strtolower(trim($admin['email'] ?? ''));
        $password = (string) ($admin['password'] ?? '');

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return [
                'success' => false,
                'step' => 'create_admin',
                'message' => 'A valid administrator email address is required.',
            ];
        }

        if (strlen($password) < 14 || strlen($password) > 72) {
            return [
                'success' => false,
                'step' => 'create_admin',
                'message' => 'Admin password must be between 14 characters and 72 bytes.',
            ];
        }

        // Single-owner check
        $existing = DB::table('users')->first();
        if ($existing) {
            return [
                'success' => true,
                'step' => 'create_admin',
                'message' => 'Administrator account already exists.',
            ];
        }

        $userId = (string) Str::uuid();
        $hash = Hash::make($password, ['rounds' => 12]);

        DB::table('users')->insert([
            'id' => $userId,
            'email' => $email,
            'password_hash' => $hash,
            'created_at' => now(),
        ]);

        return [
            'success' => true,
            'step' => 'create_admin',
            'message' => "Administrator account ({$email}) created securely.",
        ];
    }

    /**
     * Step 6: Optimize system, clear old caches, create storage link.
     */
    protected function stepOptimizeSystem(): array
    {
        try {
            // Attempt storage:link if not already linked (graceful fallback on shared hosts)
            try {
                if (!file_exists(public_path('storage'))) {
                    Artisan::call('storage:link');
                }
            } catch (\Throwable $e) {
                // Symlinks may be disabled by hosting policy; non-critical
            }

            // Clear any stale cached configuration
            try {
                Artisan::call('config:clear');
                Artisan::call('cache:clear');
            } catch (\Throwable $e) {
                // Ignore
            }

            return [
                'success' => true,
                'step' => 'optimize_system',
                'message' => 'Application storage and caching optimized for production.',
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'step' => 'optimize_system',
                'message' => 'System optimization warning: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Step 7: Verify final application health.
     */
    protected function stepVerifyInstallation(): array
    {
        try {
            // Check essential database tables
            $requiredTables = ['users', 'settings', 'content', 'requests', 'sessions'];
            $missing = [];

            foreach ($requiredTables as $t) {
                if (!DB::getSchemaBuilder()->hasTable($t)) {
                    $missing[] = $t;
                }
            }

            if (count($missing) > 0) {
                return [
                    'success' => false,
                    'step' => 'verify_installation',
                    'message' => 'Database verification failed. Missing tables: ' . implode(', ', $missing),
                ];
            }

            // Check that at least one admin exists
            $adminCount = DB::table('users')->count();
            if ($adminCount === 0) {
                return [
                    'success' => false,
                    'step' => 'verify_installation',
                    'message' => 'Verification failed: No administrator account was found.',
                ];
            }

            return [
                'success' => true,
                'step' => 'verify_installation',
                'message' => 'All database tables and administrator accounts verified successfully.',
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'step' => 'verify_installation',
                'message' => 'Installation verification failed: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Step 8: Finalize and create permanent lockfile.
     */
    protected function stepFinalizeLock(array $payload): array
    {
        $site = $payload['site'] ?? [];
        $admin = $payload['admin'] ?? [];

        $locked = $this->installationLock->lock([
            'site_name' => $site['site_name'] ?? 'Portfolio CMS',
            'site_url' => $site['site_url'] ?? url('/'),
            'admin_email' => $admin['email'] ?? '',
        ]);

        if (!$locked) {
            return [
                'success' => false,
                'step' => 'finalize_lock',
                'message' => 'Failed to write installation lockfile. Please verify storage permissions.',
            ];
        }

        $this->clearState();

        return [
            'success' => true,
            'step' => 'finalize_lock',
            'message' => 'Application installation complete. Installer permanently locked for security.',
        ];
    }
}
