<?php

namespace App\Providers;

use App\Installer\InstallationLock;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (!(new InstallationLock())->isInstalled()) {
            InstallationLock::configurePreInstallRuntime();
        }
    }
}
