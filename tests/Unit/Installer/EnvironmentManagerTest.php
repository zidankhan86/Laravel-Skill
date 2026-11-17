<?php

namespace Tests\Unit\Installer;

use App\Installer\EnvironmentManager;
use Tests\TestCase;

class EnvironmentManagerTest extends TestCase
{
    protected string $testEnvPath;
    protected string $testExamplePath;

    protected function setUp(): void
    {
        parent::setUp();
        $this->testEnvPath = storage_path('framework/testing/test.env');
        $this->testExamplePath = storage_path('framework/testing/test.env.example');

        @mkdir(dirname($this->testEnvPath), 0755, true);
        file_put_contents($this->testExamplePath, "APP_NAME=Laravel\nAPP_ENV=local\nAPP_KEY=\n");
    }

    protected function tearDown(): void
    {
        @unlink($this->testEnvPath);
        @unlink($this->testExamplePath);
        parent::tearDown();
    }

    public function test_it_generates_valid_production_env_file(): void
    {
        $manager = new EnvironmentManager($this->testEnvPath, $this->testExamplePath);
        $res = $manager->generate([
            'APP_NAME' => 'My Portfolio Site',
            'APP_URL' => 'https://example.com',
            'DB_HOST' => '127.0.0.1',
            'DB_DATABASE' => 'portfolio_prod',
            'DB_USERNAME' => 'root',
            'DB_PASSWORD' => 'secret_123',
        ]);

        $this->assertTrue($res['success']);
        $this->assertNotEmpty($res['appKey']);
        $this->assertStringStartsWith('base64:', $res['appKey']);
        $this->assertFileExists($this->testEnvPath);

        $content = file_get_contents($this->testEnvPath);
        $this->assertStringContainsString('APP_NAME="My Portfolio Site"', $content);
        $this->assertStringContainsString('APP_ENV=production', $content);
        $this->assertStringContainsString('DB_DATABASE=portfolio_prod', $content);
        $this->assertStringContainsString('SESSION_DRIVER=database', $content);
    }
}
