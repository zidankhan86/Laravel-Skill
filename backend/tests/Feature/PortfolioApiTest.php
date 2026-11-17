<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Str;
use Tests\TestCase;

class PortfolioApiTest extends TestCase
{
    use DatabaseTransactions;
    /**
     * Test health check.
     */
    public function test_health_check_returns_ok(): void
    {
        $response = $this->getJson('/api/health');
        $response->assertStatus(200)
            ->assertJson(['status' => 'ok']);
    }

    /**
     * Test public appearance endpoint.
     */
    public function test_public_appearance_returns_valid_palette(): void
    {
        $response = $this->getJson('/api/public/appearance');
        $response->assertStatus(200);
    }

    /**
     * Test public site bootstrap endpoint.
     */
    public function test_public_site_returns_content_and_settings(): void
    {
        $response = $this->getJson('/api/public/site');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'content',
                'settings' => [
                    'about',
                    'appearance',
                    'brand',
                    'homepage',
                    'navigation',
                    'settings',
                    'ui',
                ],
            ]);
    }

    /**
     * Test anonymous request to admin endpoint is rejected with 401.
     */
    public function test_admin_dashboard_rejects_anonymous_access(): void
    {
        $response = $this->getJson('/api/admin/dashboard');
        $response->assertStatus(401)
            ->assertJson(['error' => 'Sign in required']);
    }

    /**
     * Test session initialization returns CSRF token.
     */
    public function test_auth_session_provides_csrf_token(): void
    {
        $response = $this->getJson('/api/auth/session');
        $response->assertStatus(200)
            ->assertJsonStructure(['authenticated', 'csrf']);
    }

    /**
     * Test login authentication with owner credentials and CSRF.
     */
    public function test_login_flow_with_owner_credentials(): void
    {
        // 1. Get session and CSRF
        $sessionRes = $this->getJson('/api/auth/session');
        $csrf = $sessionRes->json('csrf');

        // 2. Attempt login
        $loginRes = $this->withHeaders([
            'Origin' => 'http://localhost:3000',
            'X-CSRF-Token' => $csrf,
        ])->postJson('/api/auth/login', [
            'email' => 'devtanvirhossain@gmail.com',
            'password' => 'Y8jzJRLvNGFkXZAiuXd_Al-BbYeOzZ6_',
        ]);

        $loginRes->assertStatus(200)
            ->assertJson(['authenticated' => true]);

        // 3. Access admin dashboard with authenticated session
        $dashRes = $this->withHeaders([
            'Origin' => 'http://localhost:3000',
            'X-CSRF-Token' => $loginRes->json('csrf'),
        ])->getJson('/api/admin/dashboard');

        $dashRes->assertStatus(200)
            ->assertJsonStructure(['counts', 'requests', 'recent']);
    }

    /**
     * Test lead submission endpoint with validation and honeypot.
     */
    public function test_lead_submission_validates_and_accepts_clean_inquiry(): void
    {
        $response = $this->withHeaders([
            'Origin' => 'http://localhost:3000',
        ])->postJson('/api/requests', [
            'kind' => 'contact',
            'name' => 'Automated Test Visitor',
            'email' => 'visitor@test.local',
            'phone' => '+8801700000000',
            'service' => 'eCommerce Strategy',
            'message' => 'Testing automated Laravel 12 API migration.',
            'timezone' => 'Asia/Dhaka',
            'dedup_key' => (string) Str::uuid(),
            'website' => '',
        ]);

        $response->assertStatus(202)
            ->assertJsonStructure(['message']);
    }

    /**
     * Test honeypot rejection on lead submission.
     */
    public function test_lead_submission_rejects_spambot_with_honeypot(): void
    {
        $response = $this->withHeaders([
            'Origin' => 'http://localhost:3000',
        ])->postJson('/api/requests', [
            'kind' => 'contact',
            'name' => 'Spam Bot',
            'email' => 'spam@bot.local',
            'message' => 'Spam content',
            'dedup_key' => (string) Str::uuid(),
            'website' => 'https://spam.website.test',
        ]);

        $response->assertStatus(400);
    }
}
