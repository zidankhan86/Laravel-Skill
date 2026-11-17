<?php

namespace App\Installer\Hosting;

class GenericHostingAdapter implements HostingProviderInterface
{
    public function getId(): string
    {
        return 'generic';
    }

    public function getName(): string
    {
        return 'Generic Shared Hosting';
    }

    public function supportsAutoDatabase(): bool
    {
        return false;
    }

    public function verifyCredentials(array $credentials): array
    {
        return [
            'valid' => true,
            'message' => 'Generic shared hosting selected. Please configure MySQL database credentials manually.',
        ];
    }

    public function createDatabase(array $credentials, string $dbName, string $dbUser, string $dbPass): array
    {
        return [
            'success' => false,
            'message' => 'Automated database creation is not supported for generic hosting. Please create the database in your hosting control panel and enter the credentials directly.',
        ];
    }
}
