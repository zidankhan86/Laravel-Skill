<?php

namespace Tests\Unit\Installer;

use App\Installer\Hosting\CpanelAdapter;
use App\Installer\Hosting\GenericHostingAdapter;
use App\Installer\Hosting\HostingerAdapter;
use Tests\TestCase;

class HostingAdaptersTest extends TestCase
{
    public function test_hostinger_adapter_verifies_valid_api_token(): void
    {
        $mockHandler = function (string $method, string $path, string $token, array $body) {
            $this->assertSame('GET', $method);
            $this->assertSame('/hosting/websites', $path);
            $this->assertSame('valid_token_123', $token);

            return [
                'status' => 200,
                'data' => [
                    'data' => [
                        ['id' => 'site_1', 'domain' => 'example.com'],
                    ],
                ],
            ];
        };

        $adapter = new HostingerAdapter($mockHandler);
        $res = $adapter->verifyCredentials(['api_token' => 'valid_token_123']);

        $this->assertTrue($res['valid']);
        $this->assertStringContainsString('verified', strtolower($res['message']));
        $this->assertCount(1, $res['data']['websites']);
    }

    public function test_hostinger_adapter_handles_unauthorized_token(): void
    {
        $mockHandler = function () {
            return [
                'status' => 401,
                'data' => ['message' => 'Unauthenticated'],
            ];
        };

        $adapter = new HostingerAdapter($mockHandler);
        $res = $adapter->verifyCredentials(['api_token' => 'invalid_token']);

        $this->assertFalse($res['valid']);
        $this->assertStringContainsString('invalid hostinger api token', strtolower($res['message']));
    }

    public function test_hostinger_adapter_provisions_database_successfully(): void
    {
        $mockHandler = function (string $method, string $path, string $token, array $body) {
            $this->assertSame('POST', $method);
            $this->assertSame('/hosting/websites/site_1/databases', $path);
            $this->assertSame('my_db', $body['name']);
            $this->assertSame('my_user', $body['username']);

            return [
                'status' => 201,
                'data' => [
                    'data' => [
                        'name' => 'u123_my_db',
                        'username' => 'u123_my_user',
                        'host' => 'sql123.hostinger.com',
                        'port' => 3306,
                    ],
                ],
            ];
        };

        $adapter = new HostingerAdapter($mockHandler);
        $res = $adapter->createDatabase(
            ['api_token' => 'token_xyz', 'website_id' => 'site_1'],
            'my_db',
            'my_user',
            'SecretPass123!'
        );

        $this->assertTrue($res['success']);
        $this->assertSame('u123_my_db', $res['database']);
        $this->assertSame('u123_my_user', $res['username']);
        $this->assertSame('sql123.hostinger.com', $res['host']);
    }

    public function test_cpanel_adapter_verifies_uapi_credentials(): void
    {
        $mockHandler = function ($host, $port, $user, $token, $module, $func) {
            $this->assertSame('127.0.0.1', $host);
            $this->assertSame(2083, $port);
            $this->assertSame('cpuser', $user);
            $this->assertSame('token123', $token);
            $this->assertSame('Variables', $module);

            return [
                'status' => 200,
                'data' => [
                    'status' => 1,
                    'data' => ['user' => 'cpuser'],
                    'errors' => null,
                ],
            ];
        };

        $adapter = new CpanelAdapter($mockHandler);
        $res = $adapter->verifyCredentials([
            'cpanel_host' => '127.0.0.1',
            'cpanel_port' => 2083,
            'cpanel_user' => 'cpuser',
            'api_token' => 'token123',
        ]);

        $this->assertTrue($res['valid']);
    }

    public function test_cpanel_adapter_provisions_database_and_assigns_user(): void
    {
        $calls = [];
        $mockHandler = function ($host, $port, $user, $token, $module, $func, $params) use (&$calls) {
            $calls[] = $func;
            return [
                'status' => 200,
                'data' => [
                    'status' => 1,
                    'data' => true,
                    'errors' => null,
                ],
            ];
        };

        $adapter = new CpanelAdapter($mockHandler);
        $res = $adapter->createDatabase(
            [
                'cpanel_host' => '127.0.0.1',
                'cpanel_port' => 2083,
                'cpanel_user' => 'cpuser',
                'api_token' => 'token123',
            ],
            'portdb',
            'portusr',
            'StrongPass!9876'
        );

        $this->assertTrue($res['success']);
        $this->assertContains('create_database', $calls);
        $this->assertContains('create_user', $calls);
        $this->assertContains('set_privileges_on_database', $calls);
        $this->assertSame('cpuser_portdb', $res['database']);
        $this->assertSame('cpuser_portusr', $res['username']);
    }

    public function test_generic_adapter_indicates_manual_credentials(): void
    {
        $adapter = new GenericHostingAdapter();
        $this->assertFalse($adapter->supportsAutoDatabase());

        $verify = $adapter->verifyCredentials([]);
        $this->assertTrue($verify['valid']);

        $create = $adapter->createDatabase([], 'db', 'usr', 'pwd');
        $this->assertFalse($create['success']);
    }
}
