<?php

namespace App\Http\Controllers\Installer;

use App\Http\Controllers\Controller;
use App\Installer\DatabaseManager;
use App\Installer\Hosting\CpanelAdapter;
use App\Installer\Hosting\GenericHostingAdapter;
use App\Installer\Hosting\HostingerAdapter;
use App\Installer\Hosting\HostingProviderInterface;
use App\Installer\HostingDetector;
use App\Installer\InstallationLock;
use App\Installer\InstallationManager;
use App\Installer\RequirementsChecker;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class InstallerController extends Controller
{
    protected RequirementsChecker $requirements;
    protected HostingDetector $detector;
    protected DatabaseManager $databaseManager;
    protected InstallationManager $installationManager;
    protected InstallationLock $lock;

    public function __construct(
        RequirementsChecker $requirements,
        HostingDetector $detector,
        DatabaseManager $databaseManager,
        InstallationManager $installationManager,
        InstallationLock $lock
    ) {
        $this->requirements = $requirements;
        $this->detector = $detector;
        $this->databaseManager = $databaseManager;
        $this->installationManager = $installationManager;
        $this->lock = $lock;
    }

    /**
     * Render the Inertia Installation Wizard.
     */
    public function index(): InertiaResponse
    {
        return Inertia::render('Installer/Wizard', [
            'requirements' => $this->requirements->check(),
            'detectedHosting' => $this->detector->detect(),
            'state' => $this->installationManager->getState(),
            'defaultAppUrl' => url('/'),
            'csrf_token' => csrf_token(),
        ]);
    }

    /**
     * API: Re-check server requirements.
     */
    public function checkRequirements(): JsonResponse
    {
        return response()->json($this->requirements->check());
    }

    /**
     * API: Test manual database connection.
     */
    public function testDatabase(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'host' => 'required|string|max:255',
            'port' => 'nullable|integer|between:1,65535',
            'database' => 'required|string|max:100',
            'username' => 'required|string|max:100',
            'password' => 'nullable|string|max:255',
        ]);

        $res = $this->databaseManager->testConnection([
            'host' => $validated['host'],
            'port' => (int) ($validated['port'] ?? 3306),
            'database' => $validated['database'],
            'username' => $validated['username'],
            'password' => $validated['password'] ?? '',
        ]);

        return response()->json($res, $res['connected'] ? 200 : 422);
    }

    /**
     * API: Verify hosting provider API credentials.
     */
    public function verifyHosting(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'provider' => 'required|string|in:hostinger,cpanel,generic',
            'credentials' => 'required|array',
        ]);

        $adapter = $this->getHostingAdapter($validated['provider']);
        $result = $adapter->verifyCredentials($validated['credentials']);

        return response()->json($result, $result['valid'] ? 200 : 422);
    }

    /**
     * API: Automatically provision a database via hosting provider API.
     */
    public function createHostingDatabase(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'provider' => 'required|string|in:hostinger,cpanel,generic',
            'credentials' => 'required|array',
            'database' => 'required|string|max:32',
            'username' => 'required|string|max:32',
            'password' => 'required|string|min:8|max:64',
        ]);

        $adapter = $this->getHostingAdapter($validated['provider']);

        if (!$adapter->supportsAutoDatabase()) {
            return response()->json([
                'success' => false,
                'message' => 'The selected provider does not support automated database creation.',
            ], 422);
        }

        $res = $adapter->createDatabase(
            $validated['credentials'],
            $validated['database'],
            $validated['username'],
            $validated['password']
        );

        return response()->json($res, $res['success'] ? 200 : 422);
    }

    /**
     * API: Execute an automated installation sub-step.
     */
    public function executeStep(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'step' => 'required|string|in:validate_requirements,configure_environment,run_migrations,seed_content,create_admin,optimize_system,verify_installation,finalize_lock',
            'payload' => 'nullable|array',
        ]);

        $step = $validated['step'];
        $payload = $validated['payload'] ?? [];

        $result = $this->installationManager->executeStep($step, $payload);

        return response()->json($result, $result['success'] ? 200 : 422);
    }

    /**
     * API: Retrieve current installation state.
     */
    public function getState(): JsonResponse
    {
        return response()->json($this->installationManager->getState());
    }

    /**
     * Resolve hosting adapter instance.
     */
    protected function getHostingAdapter(string $provider): HostingProviderInterface
    {
        return match ($provider) {
            'hostinger' => new HostingerAdapter(),
            'cpanel' => new CpanelAdapter(),
            default => new GenericHostingAdapter(),
        };
    }
}
