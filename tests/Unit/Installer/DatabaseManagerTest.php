<?php

namespace Tests\Unit\Installer;

use App\Installer\DatabaseManager;
use Tests\TestCase;

class DatabaseManagerTest extends TestCase
{
    public function test_it_successfully_connects_to_test_database(): void
    {
        $manager = new DatabaseManager();
        $res = $manager->testConnection([
            'host' => '127.0.0.1',
            'port' => 3306,
            'database' => 'tanvir_portfolio_local',
            'username' => 'root',
            'password' => '',
        ]);

        $this->assertTrue($res['connected']);
        $this->assertTrue($res['hasDatabase']);
        $this->assertTrue($res['hasPrivileges']);
        $this->assertStringContainsString('successfully connected', strtolower($res['message']));
    }

    public function test_it_handles_invalid_credentials_gracefully(): void
    {
        $manager = new DatabaseManager();
        $res = $manager->testConnection([
            'host' => '127.0.0.1',
            'port' => 3306,
            'database' => 'tanvir_portfolio_local',
            'username' => 'nonexistent_user_' . time(),
            'password' => 'wrong_password',
        ]);

        $this->assertFalse($res['connected']);
        $this->assertFalse($res['hasPrivileges']);
        $this->assertStringContainsString('access denied', strtolower($res['message']));
    }

    public function test_it_handles_missing_required_parameters(): void
    {
        $manager = new DatabaseManager();
        $res = $manager->testConnection([
            'host' => '',
            'database' => '',
            'username' => '',
        ]);

        $this->assertFalse($res['connected']);
        $this->assertStringContainsString('required', strtolower($res['message']));
    }
}
