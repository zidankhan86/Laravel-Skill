<?php

namespace App\Installer;

use PDO;
use PDOException;

class DatabaseManager
{
    /**
     * Test connection to MySQL server with the provided credentials.
     *
     * @param array{
     *     host: string,
     *     port?: int,
     *     database: string,
     *     username: string,
     *     password?: string
     * } $config
     * @return array{
     *     connected: bool,
     *     hasDatabase: bool,
     *     hasExistingTables: bool,
     *     hasPrivileges: bool,
     *     message: string,
     *     details?: array
     * }
     */
    public function testConnection(array $config): array
    {
        $host = trim($config['host'] ?? '127.0.0.1');
        $port = (int) ($config['port'] ?? 3306);
        $dbName = trim($config['database'] ?? '');
        $username = trim($config['username'] ?? '');
        $password = (string) ($config['password'] ?? '');

        if (empty($host) || empty($dbName) || empty($username)) {
            return [
                'connected' => false,
                'hasDatabase' => false,
                'hasExistingTables' => false,
                'hasPrivileges' => false,
                'message' => 'Host, database name, and username are required.',
            ];
        }

        // 1. First test connection to the specific database
        try {
            $dsn = "mysql:host={$host};port={$port};dbname={$dbName};charset=utf8mb4";
            $pdo = new PDO($dsn, $username, $password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_TIMEOUT => 8,
            ]);

            // Check if existing domain tables are present
            $existingTables = $this->checkExistingTables($pdo);

            // Check permissions with a safe temporary table
            $privilegesOk = $this->checkPrivileges($pdo);

            return [
                'connected' => true,
                'hasDatabase' => true,
                'hasExistingTables' => $existingTables['hasDomainTables'],
                'hasPrivileges' => $privilegesOk,
                'message' => 'Successfully connected to database!',
                'details' => [
                    'database' => $dbName,
                    'existingTables' => $existingTables['tables'],
                    'hasPrivileges' => $privilegesOk,
                ],
            ];
        } catch (PDOException $e) {
            $errorCode = $e->getCode();
            $errorMsg = $e->getMessage();

            // Check if error is specifically "Unknown database" (MySQL error 1049)
            if (str_contains($errorMsg, 'Unknown database') || $errorCode == 1049) {
                // Try connecting to MySQL server without dbname to see if credentials are valid and user can create DB
                $serverConnect = $this->tryCreateDatabaseIfPermitted($host, $port, $username, $password, $dbName);
                if ($serverConnect['success']) {
                    return [
                        'connected' => true,
                        'hasDatabase' => true,
                        'hasExistingTables' => false,
                        'hasPrivileges' => true,
                        'message' => "Database '{$dbName}' did not exist, but was created successfully!",
                    ];
                }

                return [
                    'connected' => false,
                    'hasDatabase' => false,
                    'hasExistingTables' => false,
                    'hasPrivileges' => false,
                    'message' => "Database '{$dbName}' does not exist on the server. Please create it first in your hosting control panel.",
                ];
            }

            // Access denied (1045)
            if (str_contains($errorMsg, 'Access denied') || $errorCode == 1045) {
                return [
                    'connected' => false,
                    'hasDatabase' => false,
                    'hasExistingTables' => false,
                    'hasPrivileges' => false,
                    'message' => "Access denied for user '{$username}'. Please verify the database username and password.",
                ];
            }

            return [
                'connected' => false,
                'hasDatabase' => false,
                'hasExistingTables' => false,
                'hasPrivileges' => false,
                'message' => 'Database connection failed: ' . $this->sanitizeErrorMessage($errorMsg),
            ];
        }
    }

    /**
     * Try creating the database if the user has CREATE privilege on the server.
     */
    protected function tryCreateDatabaseIfPermitted(string $host, int $port, string $username, string $password, string $dbName): array
    {
        try {
            $serverDsn = "mysql:host={$host};port={$port};charset=utf8mb4";
            $serverPdo = new PDO($serverDsn, $username, $password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_TIMEOUT => 5,
            ]);

            // Sanitize database name
            $cleanDb = preg_replace('/[^a-zA-Z0-9_]/', '', $dbName);
            $serverPdo->exec("CREATE DATABASE IF NOT EXISTS `{$cleanDb}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

            return ['success' => true];
        } catch (\Throwable $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Check if existing domain tables are present in the target database.
     */
    protected function checkExistingTables(PDO $pdo): array
    {
        $domainTables = ['users', 'content', 'settings', 'requests', 'media'];
        $found = [];

        try {
            $stmt = $pdo->query('SHOW TABLES');
            $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

            foreach ($domainTables as $dt) {
                if (in_array($dt, $tables, true)) {
                    $found[] = $dt;
                }
            }
        } catch (\Throwable $e) {
            // Ignore error
        }

        return [
            'hasDomainTables' => count($found) > 0,
            'tables' => $found,
        ];
    }

    /**
     * Verify write and table creation privileges on the target database.
     */
    protected function checkPrivileges(PDO $pdo): bool
    {
        $testTable = '__installer_priv_test_' . time();
        try {
            $pdo->exec("CREATE TABLE `{$testTable}` (id INT PRIMARY KEY, name VARCHAR(50)) ENGINE=InnoDB");
            $pdo->exec("INSERT INTO `{$testTable}` (id, name) VALUES (1, 'test')");
            $pdo->exec("UPDATE `{$testTable}` SET name = 'test2' WHERE id = 1");
            $pdo->exec("DELETE FROM `{$testTable}` WHERE id = 1");
            $pdo->exec("DROP TABLE `{$testTable}`");
            return true;
        } catch (\Throwable $e) {
            // Try cleaning up if failed halfway
            try {
                $pdo->exec("DROP TABLE IF EXISTS `{$testTable}`");
            } catch (\Throwable) {}
            return false;
        }
    }

    /**
     * Remove sensitive internal paths or credentials from error message.
     */
    protected function sanitizeErrorMessage(string $msg): string
    {
        // Strip out passwords if present in DSN error
        return preg_replace('/password=[^;\s)]*/i', 'password=***', $msg);
    }
}
