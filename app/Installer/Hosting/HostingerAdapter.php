<?php

namespace App\Installer\Hosting;

class HostingerAdapter implements HostingProviderInterface
{
    protected string $apiBaseUrl = 'https://api.hostinger.com/v1';
    protected ?\Closure $httpHandler = null;

    public function __construct(?\Closure $httpHandler = null)
    {
        $this->httpHandler = $httpHandler;
    }

    public function getId(): string
    {
        return 'hostinger';
    }

    public function getName(): string
    {
        return 'Hostinger hPanel';
    }

    public function supportsAutoDatabase(): bool
    {
        return true;
    }

    /**
     * Verify Hostinger API token.
     */
    public function verifyCredentials(array $credentials): array
    {
        $token = trim($credentials['api_token'] ?? '');
        if (empty($token)) {
            return [
                'valid' => false,
                'message' => 'Hostinger API token is required.',
            ];
        }

        $response = $this->makeRequest('GET', '/hosting/websites', $token);

        if ($response['status'] === 200) {
            $websites = $response['data']['data'] ?? $response['data'] ?? [];
            return [
                'valid' => true,
                'message' => 'Hostinger API authentication verified.',
                'data' => [
                    'websites' => is_array($websites) ? $websites : [],
                ],
            ];
        }

        if ($response['status'] === 401 || $response['status'] === 403) {
            return [
                'valid' => false,
                'message' => 'Invalid Hostinger API token or insufficient permissions.',
            ];
        }

        return [
            'valid' => false,
            'message' => $response['data']['message'] ?? 'Could not connect to Hostinger API (HTTP ' . $response['status'] . ').',
        ];
    }

    /**
     * Create MySQL database and user using Hostinger API.
     */
    public function createDatabase(array $credentials, string $dbName, string $dbUser, string $dbPass): array
    {
        $token = trim($credentials['api_token'] ?? '');
        $websiteId = trim($credentials['website_id'] ?? '');

        if (empty($token)) {
            return [
                'success' => false,
                'message' => 'Hostinger API token is required.',
            ];
        }

        // Sanitize database and user name according to Hostinger requirements
        $cleanDbName = strtolower(preg_replace('/[^a-zA-Z0-9_]/', '', $dbName));
        $cleanDbUser = strtolower(preg_replace('/[^a-zA-Z0-9_]/', '', $dbUser));

        $payload = [
            'name' => $cleanDbName,
            'username' => $cleanDbUser,
            'password' => $dbPass,
        ];

        $endpoint = !empty($websiteId)
            ? "/hosting/websites/{$websiteId}/databases"
            : '/databases';

        $response = $this->makeRequest('POST', $endpoint, $token, $payload);

        if ($response['status'] >= 200 && $response['status'] < 300) {
            $data = $response['data']['data'] ?? $response['data'] ?? [];
            return [
                'success' => true,
                'database' => $data['name'] ?? $cleanDbName,
                'username' => $data['username'] ?? $cleanDbUser,
                'password' => $dbPass,
                'host' => $data['host'] ?? 'localhost',
                'port' => (int) ($data['port'] ?? 3306),
                'message' => 'Database successfully provisioned via Hostinger API.',
            ];
        }

        $errorMsg = $response['data']['message']
            ?? $response['data']['error']
            ?? 'Hostinger database creation failed (HTTP ' . $response['status'] . ').';

        return [
            'success' => false,
            'message' => $errorMsg,
        ];
    }

    /**
     * Perform HTTP request to Hostinger API or mock handler.
     */
    protected function makeRequest(string $method, string $path, string $token, array $body = []): array
    {
        if ($this->httpHandler !== null) {
            return ($this->httpHandler)($method, $path, $token, $body);
        }

        $url = $this->apiBaseUrl . $path;
        $headers = [
            'Authorization: Bearer ' . $token,
            'Accept: application/json',
            'Content-Type: application/json',
            'User-Agent: TanvirPortfolioInstaller/1.0',
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_TIMEOUT, 20);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
        } elseif ($method !== 'GET') {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        }

        $rawResponse = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($rawResponse === false) {
            return [
                'status' => 0,
                'data' => ['message' => 'cURL error: ' . $curlError],
            ];
        }

        $decoded = json_decode($rawResponse, true);

        return [
            'status' => $status,
            'data' => is_array($decoded) ? $decoded : ['raw' => $rawResponse],
        ];
    }

    /**
     * Set a custom HTTP handler for testing.
     */
    public function setHttpHandler(?\Closure $handler): void
    {
        $this->httpHandler = $handler;
    }
}
