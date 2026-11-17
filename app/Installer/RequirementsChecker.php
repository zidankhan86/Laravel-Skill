<?php

namespace App\Installer;

class RequirementsChecker
{
    protected const MIN_PHP_VERSION = '8.2.0';

    protected const REQUIRED_EXTENSIONS = [
        'pdo' => 'PHP Data Objects (PDO)',
        'pdo_mysql' => 'MySQL PDO Driver',
        'openssl' => 'OpenSSL Cryptography',
        'mbstring' => 'Multibyte String Support',
        'fileinfo' => 'File Information / MIME Detection',
        'tokenizer' => 'Tokenizer Support',
        'xml' => 'XML Parser',
        'ctype' => 'Ctype Character Checking',
        'json' => 'JSON Parser & Encoder',
        'bcmath' => 'BCMath Arbitrary Precision',
        'curl' => 'cURL HTTP Client',
        'filter' => 'Data Filtering & Sanitization',
        'hash' => 'Hashing Framework',
        'session' => 'Session Management',
    ];

    protected const OPTIONAL_EXTENSIONS = [
        'gd' => 'GD Image Processing',
        'zip' => 'ZIP Archive Handling',
    ];

    /**
     * Check all requirements and return structured health results.
     *
     * @return array{
     *     php: array,
     *     extensions: array,
     *     permissions: array,
     *     limits: array,
     *     disk: array,
     *     canProceed: bool
     * }
     */
    public function check(): array
    {
        $php = $this->checkPhpVersion();
        $extensions = $this->checkExtensions();
        $permissions = $this->checkPermissions();
        $limits = $this->checkLimits();
        $disk = $this->checkDiskSpace();

        $canProceed = $php['passed'] &&
            $extensions['allRequiredPassed'] &&
            $permissions['allWritable'];

        return [
            'php' => $php,
            'extensions' => $extensions,
            'permissions' => $permissions,
            'limits' => $limits,
            'disk' => $disk,
            'canProceed' => $canProceed,
        ];
    }

    /**
     * Check PHP version.
     */
    protected function checkPhpVersion(): array
    {
        $current = PHP_VERSION;
        $passed = version_compare($current, self::MIN_PHP_VERSION, '>=');

        return [
            'current' => $current,
            'minimum' => self::MIN_PHP_VERSION,
            'passed' => $passed,
            'message' => $passed
                ? "PHP {$current} meets the minimum requirement (>= " . self::MIN_PHP_VERSION . ')'
                : "PHP {$current} is too old. Please upgrade to PHP " . self::MIN_PHP_VERSION . ' or newer in your hosting control panel.',
        ];
    }

    /**
     * Check required and optional PHP extensions.
     */
    protected function checkExtensions(): array
    {
        $required = [];
        $allRequiredPassed = true;

        foreach (self::REQUIRED_EXTENSIONS as $ext => $name) {
            $loaded = extension_loaded($ext);
            if (!$loaded) {
                $allRequiredPassed = false;
            }
            $required[$ext] = [
                'name' => $name,
                'loaded' => $loaded,
                'required' => true,
            ];
        }

        $optional = [];
        foreach (self::OPTIONAL_EXTENSIONS as $ext => $name) {
            $optional[$ext] = [
                'name' => $name,
                'loaded' => extension_loaded($ext),
                'required' => false,
            ];
        }

        return [
            'required' => $required,
            'optional' => $optional,
            'allRequiredPassed' => $allRequiredPassed,
        ];
    }

    /**
     * Check write permissions for essential directories and files.
     */
    protected function checkPermissions(): array
    {
        $pathsToCheck = [
            'storage' => storage_path(),
            'storage/app' => storage_path('app'),
            'storage/framework' => storage_path('framework'),
            'storage/framework/sessions' => storage_path('framework/sessions'),
            'storage/framework/views' => storage_path('framework/views'),
            'storage/framework/cache' => storage_path('framework/cache'),
            'storage/logs' => storage_path('logs'),
            'bootstrap/cache' => base_path('bootstrap/cache'),
        ];

        // Ensure directories exist first if possible
        foreach ($pathsToCheck as $relative => $path) {
            if (!is_dir($path)) {
                @mkdir($path, 0755, true);
            }
        }

        $results = [];
        $allWritable = true;

        foreach ($pathsToCheck as $relative => $path) {
            $isWritable = is_dir($path) && is_writable($path);
            if (!$isWritable) {
                $allWritable = false;
            }
            $results[$relative] = [
                'path' => $path,
                'writable' => $isWritable,
                'exists' => is_dir($path),
            ];
        }

        // Also check if base directory can write .env
        $envPath = base_path('.env');
        $baseWritable = is_writable(base_path()) || (file_exists($envPath) && is_writable($envPath));
        if (!$baseWritable) {
            $allWritable = false;
        }
        $results['.env'] = [
            'path' => $envPath,
            'writable' => $baseWritable,
            'exists' => file_exists($envPath),
        ];

        return [
            'paths' => $results,
            'allWritable' => $allWritable,
        ];
    }

    /**
     * Check PHP configuration limits.
     */
    protected function checkLimits(): array
    {
        $memoryLimit = ini_get('memory_limit') ?: '128M';
        $maxExecutionTime = ini_get('max_execution_time') ?: '30';
        $uploadMaxFilesize = ini_get('upload_max_filesize') ?: '2M';
        $postMaxSize = ini_get('post_max_size') ?: '8M';

        return [
            'memory_limit' => $memoryLimit,
            'max_execution_time' => (int) $maxExecutionTime,
            'upload_max_filesize' => $uploadMaxFilesize,
            'post_max_size' => $postMaxSize,
        ];
    }

    /**
     * Check available disk space if supported.
     */
    protected function checkDiskSpace(): array
    {
        $freeBytes = null;
        if (function_exists('disk_free_space')) {
            $freeBytes = @disk_free_space(base_path());
        }

        $freeMb = $freeBytes !== false && $freeBytes !== null
            ? round($freeBytes / 1024 / 1024, 2)
            : null;

        return [
            'freeBytes' => $freeBytes,
            'freeMb' => $freeMb,
            'sufficient' => $freeMb === null || $freeMb >= 50, // Minimum 50 MB
        ];
    }
}
