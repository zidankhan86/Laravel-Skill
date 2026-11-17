<?php

namespace Tests\Unit\Installer;

use App\Installer\RequirementsChecker;
use Tests\TestCase;

class RequirementsCheckerTest extends TestCase
{
    public function test_it_verifies_php_version_correctly(): void
    {
        $checker = new RequirementsChecker();
        $results = $checker->check();

        $this->assertArrayHasKey('php', $results);
        $this->assertArrayHasKey('current', $results['php']);
        $this->assertArrayHasKey('passed', $results['php']);
        $this->assertTrue($results['php']['passed'], 'Current PHP version must satisfy minimum requirements');
    }

    public function test_it_checks_required_php_extensions(): void
    {
        $checker = new RequirementsChecker();
        $results = $checker->check();

        $this->assertArrayHasKey('extensions', $results);
        $required = $results['extensions']['required'];

        $this->assertArrayHasKey('pdo', $required);
        $this->assertArrayHasKey('pdo_mysql', $required);
        $this->assertArrayHasKey('mbstring', $required);
        $this->assertArrayHasKey('openssl', $required);
        $this->assertArrayHasKey('fileinfo', $required);

        $this->assertTrue($required['pdo']['loaded']);
        $this->assertTrue($required['pdo_mysql']['loaded']);
        $this->assertTrue($results['extensions']['allRequiredPassed']);
    }

    public function test_it_verifies_directory_write_permissions(): void
    {
        $checker = new RequirementsChecker();
        $results = $checker->check();

        $this->assertArrayHasKey('permissions', $results);
        $paths = $results['permissions']['paths'];

        $this->assertArrayHasKey('storage', $paths);
        $this->assertArrayHasKey('bootstrap/cache', $paths);
        $this->assertTrue($paths['storage']['writable'], 'storage directory must be writable');
        $this->assertTrue($paths['bootstrap/cache']['writable'], 'bootstrap/cache must be writable');
        $this->assertTrue($results['permissions']['allWritable']);
    }

    public function test_it_reports_limits_and_disk_space(): void
    {
        $checker = new RequirementsChecker();
        $results = $checker->check();

        $this->assertArrayHasKey('limits', $results);
        $this->assertArrayHasKey('memory_limit', $results['limits']);
        $this->assertArrayHasKey('disk', $results);
        $this->assertArrayHasKey('sufficient', $results['disk']);
        $this->assertTrue($results['canProceed']);
    }
}
