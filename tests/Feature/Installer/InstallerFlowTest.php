<?php

namespace Tests\Feature\Installer;

use App\Installer\InstallationLock;
use Tests\TestCase;

class InstallerFlowTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        InstallationLock::fakeInstalled(false);
    }

    protected function tearDown(): void
    {
        InstallationLock::fakeInstalled(null);
        parent::tearDown();
    }

    public function test_installer_wizard_renders_when_unlocked(): void
    {
        $res = $this->get('/install');
        $res->assertStatus(200);
        $res->assertInertia(fn ($page) => $page->component('Installer/Wizard'));
    }

    public function test_api_requirements_returns_valid_structure(): void
    {
        $res = $this->getJson('/api/installer/requirements');
        $res->assertStatus(200);
        $res->assertJsonStructure([
            'php' => ['current', 'minimum', 'passed'],
            'extensions' => ['required', 'allRequiredPassed'],
            'permissions' => ['paths', 'allWritable'],
            'limits',
            'canProceed',
        ]);
    }

    public function test_api_test_database_validates_inputs(): void
    {
        $res = $this->postJson('/api/installer/test-database', []);
        $res->assertStatus(400); // Handled by custom validation handler in bootstrap
    }

    public function test_api_test_database_succeeds_with_local_credentials(): void
    {
        $res = $this->postJson('/api/installer/test-database', [
            'host' => '127.0.0.1',
            'port' => 3306,
            'database' => 'tanvir_portfolio_local',
            'username' => 'root',
            'password' => '',
        ]);
        $res->assertStatus(200);
        $res->assertJson(['connected' => true]);
    }

    public function test_step_execution_validates_step_name(): void
    {
        $res = $this->postJson('/api/installer/step', [
            'step' => 'invalid_step_name',
        ]);
        $res->assertStatus(400);
    }
}
