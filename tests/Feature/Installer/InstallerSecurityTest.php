<?php

namespace Tests\Feature\Installer;

use App\Installer\InstallationLock;
use Tests\TestCase;

class InstallerSecurityTest extends TestCase
{
    protected function tearDown(): void
    {
        InstallationLock::fakeInstalled(null);
        parent::tearDown();
    }

    public function test_installer_is_blocked_when_locked(): void
    {
        InstallationLock::fakeInstalled(true);

        // Web request to /install must redirect to /
        $webRes = $this->get('/install');
        $webRes->assertRedirect('/');

        // API request to /api/installer/* must return 403
        $apiRes = $this->postJson('/api/installer/test-database', [
            'host' => '127.0.0.1',
            'database' => 'test',
            'username' => 'root',
        ]);
        $apiRes->assertStatus(403);
        $apiRes->assertJson(['error' => 'Application is already installed and the installer is locked.']);
    }

    public function test_uninstalled_site_redirects_to_installer(): void
    {
        InstallationLock::fakeInstalled(false);

        // Public web visit should redirect to /install
        $res = $this->get('/');
        $res->assertRedirect('/install');

        // API visit should return 503 with installer URL
        $apiRes = $this->getJson('/api/health');
        $apiRes->assertStatus(503);
        $apiRes->assertJsonStructure(['error', 'installer_url']);
    }

    public function test_admin_creation_rejects_weak_passwords(): void
    {
        InstallationLock::fakeInstalled(false);

        $res = $this->postJson('/api/installer/step', [
            'step' => 'create_admin',
            'payload' => [
                'admin' => [
                    'email' => 'admin@test.local',
                    'password' => 'short123', // < 14 chars!
                ],
            ],
        ]);

        $res->assertStatus(422);
        $res->assertJson(['success' => false]);
        $this->assertStringContainsString('14 characters', $res->json('message'));
    }
}
