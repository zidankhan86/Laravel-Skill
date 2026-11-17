<?php

namespace App\Installer\Hosting;

interface HostingProviderInterface
{
    /**
     * Unique identifier for the provider.
     */
    public function getId(): string;

    /**
     * Human-friendly display name.
     */
    public function getName(): string;

    /**
     * Whether this provider supports automated API-driven database provisioning.
     */
    public function supportsAutoDatabase(): bool;

    /**
     * Verify the supplied API credentials or account details.
     *
     * @param array $credentials
     * @return array{valid: bool, message: string, data?: array}
     */
    public function verifyCredentials(array $credentials): array;

    /**
     * Create a MySQL database and user via the provider's API.
     *
     * @param array $credentials Provider API auth details
     * @param string $dbName Requested database name (without prefix)
     * @param string $dbUser Requested database username (without prefix)
     * @param string $dbPass Generated or requested database password
     * @return array{
     *     success: bool,
     *     database?: string,
     *     username?: string,
     *     password?: string,
     *     host?: string,
     *     port?: int,
     *     message: string
     * }
     */
    public function createDatabase(array $credentials, string $dbName, string $dbUser, string $dbPass): array;
}
