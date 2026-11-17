<?php

namespace App\Installer\Hosting;

class CpanelAdapter implements HostingProviderInterface
{
    protected ?\Closure $httpHandler = null;

    public function __construct(?\Closure $httpHandler = null)
    {
        $this->httpHandler = $httpHandler;
    }

    public function getId(): string
    {
        return 'cpanel';
    }

    public function getName(): string
    {
        return 'cPanel';
    }

    public function supportsAutoDatabase(): bool
    {
        return true;
    }

    /**
     * Verify cPanel API credentials.
     */
    public function verifyCredentials(array $credentials): array
    {
        $host = trim($credentials['cpanel_host'] ?? '127.0.0.1');
        $user = trim($credentials['cpanel_user'] ?? '');
        $token = trim($credentials['api_token'] ?? '');
        $port = (int) ($credentials['cpanel_port'] ?? 2083);

        if (empty($user) || empty($token)) {
            return [
                'valid' => false,
                'message' => 'cPanel username and API token are required.',
            ];
        }

        $res = $this->callUapi($host, $port, $user, $token, 'Variables', 'get_user_information');

        if ($res['status'] === 200 && ($res['data']['status'] ?? 0) === 1) {
            return [
                'valid' => true,
                'message' => 'cPanel authentication verified.',
                'data' => $res['data']['data'] ?? [],
            ];
        }

        $errMsg = $res['data']['errors'][0]
            ?? $res['data']['message']
            ?? 'cPanel authentication failed (HTTP ' . $res['status'] . ').';

        return [
            'valid' => false,
            'message' => $errMsg,
        ];
    }

    /**
     * Create database, user, and assign privileges via cPanel UAPI.
     */
    public function createDatabase(array $credentials, string $dbName, string $dbUser, string $dbPass): array
    {
        $host = trim($credentials['cpanel_host'] ?? '127.0.0.1');
        $cpanelUser = trim($credentials['cpanel_user'] ?? '');
        $token = trim($credentials['api_token'] ?? '');
        $port = (int) ($credentials['cpanel_port'] ?? 2083);

        if (empty($cpanelUser) || empty($token)) {
            return [
                'success' => false,
                'message' => 'cPanel username and API token are required.',
            ];
        }

        // Clean names (letters and numbers only, max 7 chars for suffix so user_name <= 16 chars)
        $cleanSuffixDb = substr(preg_replace('/[^a-zA-Z0-9]/', '', $dbName), 0, 7);
        $cleanSuffixUser = substr(preg_replace('/[^a-zA-Z0-9]/', '', $dbUser), 0, 7);

        // 1. Create Database: Mysql::create_database
        $createDbRes = $this->callUapi($host, $port, $cpanelUser, $token, 'Mysql', 'create_database', [
            'name' => $cleanSuffixDb,
        ]);

        if (($createDbRes['data']['status'] ?? 0) !== 1) {
            $err = $createDbRes['data']['errors'][0] ?? 'Failed to create database via cPanel UAPI.';
            return [
                'success' => false,
                'message' => $err,
            ];
        }

        // Calculate actual prefixed name: {cpanelUser}_{cleanSuffixDb}
        $fullDbName = $cpanelUser . '_' . $cleanSuffixDb;

        // 2. Create User: Mysql::create_user
        $createUserRes = $this->callUapi($host, $port, $cpanelUser, $token, 'Mysql', 'create_user', [
            'name' => $cleanSuffixUser,
            'password' => $dbPass,
        ]);

        if (($createUserRes['data']['status'] ?? 0) !== 1) {
            $err = $createUserRes['data']['errors'][0] ?? 'Failed to create database user via cPanel UAPI.';
            return [
                'success' => false,
                'message' => $err,
            ];
        }

        $fullUserName = $cpanelUser . '_' . $cleanSuffixUser;

        // 3. Set Privileges: Mysql::set_privileges_on_database
        $privRes = $this->callUapi($host, $port, $cpanelUser, $token, 'Mysql', 'set_privileges_on_database', [
            'user' => $fullUserName,
            'database' => $fullDbName,
            'privileges' => 'ALL PRIVILEGES',
        ]);

        if (($privRes['data']['status'] ?? 0) !== 1) {
            $err = $privRes['data']['errors'][0] ?? 'Failed to grant database privileges via cPanel UAPI.';
            return [
                'success' => false,
                'message' => $err,
            ];
        }

        return [
            'success' => true,
            'database' => $fullDbName,
            'username' => $fullUserName,
            'password' => $dbPass,
            'host' => '127.0.0.1',
            'port' => 3306,
            'message' => "cPanel database {$fullDbName} provisioned and user {$fullUserName} assigned successfully.",
        ];
    }

    /**
     * Dispatch cPanel UAPI request or call mock handler.
     */
    protected function callUapi(string $host, int $port, string $user, string $token, string $module, string $function, array $params = []): array
    {
        if ($this->httpHandler !== null) {
            return ($this->httpHandler)($host, $port, $user, $token, $module, $function, $params);
        }

        $scheme = ($port === 2082) ? 'http' : 'https';
        $query = http_build_query($params);
        $url = "{$scheme}://{$host}:{$port}/execute/{$module}/{$function}" . ($query ? "?{$query}" : '');

        $headers = [
            "Authorization: cpanel {$user}:{$token}",
            'Accept: application/json',
            'User-Agent: TanvirPortfolioInstaller/1.0',
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_TIMEOUT, 20);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Some shared hosts use self-signed certs for internal cPanel ports

        $rawResponse = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($rawResponse === false) {
            return [
                'status' => 0,
                'data' => ['message' => 'cURL error connecting to cPanel: ' . $curlError],
            ];
        }

        $decoded = json_decode($rawResponse, true);

        return [
            'status' => $status,
            'data' => is_array($decoded) ? $decoded : ['raw' => $rawResponse],
        ];
    }

    public function setHttpHandler(?\Closure $handler): void
    {
        $this->httpHandler = $handler;
    }
}
