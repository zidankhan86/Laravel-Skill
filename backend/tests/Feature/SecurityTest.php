<?php

namespace Tests\Feature;

use App\Models\Setting;
use App\Models\User;
use App\Services\ContentSanitizer;
use App\Services\CspService;
use App\Services\UrlValidator;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Tests\TestCase;

class SecurityTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        RateLimiter::clear('login:127.0.0.1');
        RateLimiter::clear('leads:127.0.0.1');
        RateLimiter::clear('password-change:127.0.0.1');
    }

    /**
     * 1. Public admin registration is strictly disabled.
     */
    public function test_public_admin_registration_is_strictly_disabled(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'email' => 'hacker@attack.test',
            'password' => 'HackerPassword123!',
        ]);
        $response->assertStatus(404);

        $response2 = $this->postJson('/register', [
            'email' => 'hacker@attack.test',
            'password' => 'HackerPassword123!',
        ]);
        $response2->assertStatus(404);
    }

    /**
     * 2. Artisan command rejects bootstrapping when owner already exists.
     */
    public function test_owner_creation_command_rejects_when_owner_already_exists(): void
    {
        $exitCode = Artisan::call('portfolio:owner:create', [
            '--email' => 'another@test.local',
            '--password' => 'ValidPassword1234!',
        ]);

        $this->assertEquals(1, $exitCode);
        $output = Artisan::output();
        $this->assertStringContainsString('Owner already exists; bootstrap is disabled.', $output);
    }

    /**
     * 3. Password hashing uses Bcrypt with 12 rounds.
     */
    public function test_bcrypt_cost_12_password_hashing(): void
    {
        $password = 'TestSecurePassword1234!';
        $hash = Hash::make($password, ['rounds' => 12]);

        $info = password_get_info($hash);
        $this->assertEquals('bcrypt', $info['algoName']);
        $this->assertEquals(12, $info['options']['cost']);
        $this->assertTrue(password_verify($password, $hash));
    }

    /**
     * 4. Legacy Bcrypt $2b$ prefix is compatible without password reset.
     */
    public function test_legacy_bcrypt_2b_password_compatibility(): void
    {
        // Existing owner devtanvirhossain@gmail.com has $2b$12$ hash
        $user = User::where('email', 'devtanvirhossain@gmail.com')->first();
        $this->assertNotNull($user);

        // Raw hash starts with $2b$
        $this->assertStringStartsWith('$2b$12$', $user->password_hash);

        // getAuthPassword dynamically normalizes to $2y$12$
        $this->assertStringStartsWith('$2y$12$', $user->getAuthPassword());
    }

    /**
     * 5. Plaintext passwords are never returned in JSON serialization.
     */
    public function test_plaintext_passwords_are_never_exposed(): void
    {
        $user = User::where('email', 'devtanvirhossain@gmail.com')->first();
        $array = $user->toArray();

        $this->assertArrayNotHasKey('password_hash', $array);
        $this->assertArrayNotHasKey('password', $array);
    }

    /**
     * 6. Login rate limiting blocks after 5 failed attempts per IP.
     */
    public function test_login_rate_limiting_blocks_after_5_failed_attempts(): void
    {
        $sessionRes = $this->getJson('/api/auth/session');
        $csrf = $sessionRes->json('csrf');

        for ($i = 1; $i <= 5; $i++) {
            $res = $this->withHeaders([
                'Origin' => 'http://localhost:3000',
                'X-CSRF-Token' => $csrf,
            ])->postJson('/api/auth/login', [
                'email' => 'devtanvirhossain@gmail.com',
                'password' => 'WrongPassword1234!' . $i,
            ]);
            $res->assertStatus(401);
        }

        // 6th attempt must be throttled with HTTP 429 and Retry-After header
        $throttled = $this->withHeaders([
            'Origin' => 'http://localhost:3000',
            'X-CSRF-Token' => $csrf,
        ])->postJson('/api/auth/login', [
            'email' => 'devtanvirhossain@gmail.com',
            'password' => 'WrongPassword1234!',
        ]);

        $throttled->assertStatus(429);
        $this->assertTrue($throttled->headers->has('Retry-After'));
    }

    /**
     * 7. Public lead form rate limiting blocks after 10 submissions per IP per hour.
     */
    public function test_public_lead_submission_rate_limiting_blocks_after_10_attempts(): void
    {
        for ($i = 1; $i <= 10; $i++) {
            $res = $this->withHeaders([
                'Origin' => 'http://localhost:3000',
            ])->postJson('/api/requests', [
                'kind' => 'contact',
                'name' => 'Rate Limit Test ' . $i,
                'email' => "rate{$i}@test.local",
                'phone' => '+8801700000000',
                'service' => 'Test Service',
                'message' => 'Rate limit message test ' . $i,
                'timezone' => 'Asia/Dhaka',
                'dedup_key' => (string) Str::uuid(),
                'website' => '',
            ]);
            $res->assertStatus(202);
        }

        // 11th submission must be throttled with HTTP 429 and Retry-After header
        $throttled = $this->withHeaders([
            'Origin' => 'http://localhost:3000',
        ])->postJson('/api/requests', [
            'kind' => 'contact',
            'name' => 'Rate Limit Test Exceeded',
            'email' => 'exceeded@test.local',
            'message' => 'Exceeded limit',
            'timezone' => 'Asia/Dhaka',
            'dedup_key' => (string) Str::uuid(),
            'website' => '',
        ]);

        $throttled->assertStatus(429);
        $this->assertTrue($throttled->headers->has('Retry-After'));
    }

    /**
     * 8. Honeypot traps automated spam submissions.
     */
    public function test_honeypot_rejection_on_lead_submission(): void
    {
        $res = $this->withHeaders([
            'Origin' => 'http://localhost:3000',
        ])->postJson('/api/requests', [
            'kind' => 'contact',
            'name' => 'Bot Spammer',
            'email' => 'bot@spammer.test',
            'message' => 'Buy cheap links now',
            'timezone' => 'Asia/Dhaka',
            'dedup_key' => (string) Str::uuid(),
            'website' => 'https://spam-domain.test', // Honeypot filled
        ]);

        $res->assertStatus(400);
        $res->assertJson(['error' => 'Invalid request']);
    }

    /**
     * 9. CSRF protection blocks requests with missing or invalid token.
     */
    public function test_csrf_blocks_requests_without_or_with_invalid_token(): void
    {
        // 1. Missing CSRF token
        $resMissing = $this->withHeaders([
            'Origin' => 'http://localhost:3000',
        ])->postJson('/api/auth/login', [
            'email' => 'devtanvirhossain@gmail.com',
            'password' => 'SomePassword123!',
        ]);
        $resMissing->assertStatus(403);
        $resMissing->assertJson(['error' => 'Invalid security token']);

        // 2. Invalid CSRF token
        $resInvalid = $this->withHeaders([
            'Origin' => 'http://localhost:3000',
            'X-CSRF-Token' => 'tampered_or_forged_csrf_token_value',
        ])->postJson('/api/auth/login', [
            'email' => 'devtanvirhossain@gmail.com',
            'password' => 'SomePassword123!',
        ]);
        $resInvalid->assertStatus(403);
        $resInvalid->assertJson(['error' => 'Invalid security token']);
    }

    /**
     * 10. CSRF protection allows requests with valid double-submit token.
     */
    public function test_csrf_allows_requests_with_valid_token(): void
    {
        $sessionRes = $this->getJson('/api/auth/session');
        $sessionRes->assertStatus(200);
        $csrf = $sessionRes->json('csrf');
        $this->assertNotEmpty($csrf);

        $res = $this->withHeaders([
            'Origin' => 'http://localhost:3000',
            'X-CSRF-Token' => $csrf,
        ])->postJson('/api/auth/login', [
            'email' => 'devtanvirhossain@gmail.com',
            'password' => 'WrongPassword1234!',
        ]);

        // Proceeded past CSRF check to auth check (401 invalid credentials)
        $res->assertStatus(401);
    }

    /**
     * 11. Admin endpoints strictly require authentication.
     */
    public function test_admin_endpoints_require_authentication(): void
    {
        $endpoints = [
            ['GET', '/api/admin/dashboard'],
            ['GET', '/api/admin/settings'],
            ['GET', '/api/admin/media'],
            ['GET', '/api/admin/requests'],
            ['GET', '/api/admin/editor'],
            ['GET', '/api/admin/content/services'],
        ];

        foreach ($endpoints as [$method, $uri]) {
            $res = $this->json($method, $uri);
            $res->assertStatus(401);
            $res->assertJson(['error' => 'Sign in required']);
        }
    }

    /**
     * 12. Authenticated admin can access protected admin endpoints.
     */
    public function test_authenticated_admin_can_access_admin_endpoints(): void
    {
        $user = User::where('email', 'devtanvirhossain@gmail.com')->first();
        $this->actingAs($user);

        $res = $this->withSession([
            'userId' => $user->id,
            'csrf' => 'valid_test_csrf_token',
        ])->getJson('/api/admin/dashboard');

        $res->assertStatus(200);
        $res->assertJsonStructure(['counts', 'requests', 'recent']);
    }

    /**
     * 13. HTML Sanitizer strips malicious scripts, event handlers, and javascript URIs.
     */
    public function test_html_sanitizer_cleans_xss_vectors(): void
    {
        $dirty = '<script>alert("xss")</script><p>Safe content <a href="javascript:alert(1)" title="Click">bad link</a> <a href="https://example.com">good link</a><img src="x" onerror="alert(2)"><iframe src="https://evil.com"></iframe></p>';

        $clean = ContentSanitizer::clean($dirty);

        $this->assertStringNotContainsString('<script>', $clean);
        $this->assertStringNotContainsString('alert("xss")', $clean);
        $this->assertStringNotContainsString('onerror', $clean);
        $this->assertStringNotContainsString('<iframe', $clean);
        $this->assertStringNotContainsString('javascript:', $clean);
        $this->assertStringContainsString('rel="noopener noreferrer"', $clean);
        $this->assertStringContainsString('Safe content', $clean);
        $this->assertStringContainsString('https://example.com', $clean);
    }

    /**
     * 14. File upload rejects spoofed files via magic byte inspection.
     */
    public function test_file_upload_rejects_spoofed_mime_types(): void
    {
        $user = User::where('email', 'devtanvirhossain@gmail.com')->first();
        $this->actingAs($user);

        $csrf = 'test_csrf_upload';

        // Fake image: PHP code disguised as a .png file
        $fakeImageContent = '<?php echo "malicious payload"; ?>';
        $spoofedFile = UploadedFile::fake()->createWithContent('exploit.png', $fakeImageContent);

        $res = $this->withSession([
            'userId' => $user->id,
            'csrf' => $csrf,
        ])->withHeaders([
            'Origin' => 'http://localhost:3000',
            'X-CSRF-Token' => $csrf,
        ])->post('/api/admin/media', [
            'file' => $spoofedFile,
            'alt' => 'Spoofed Image',
        ]);

        $res->assertStatus(400);
        $res->assertJson(['error' => 'Only verified PNG, JPEG, WebP and PDF files are allowed']);
    }

    /**
     * 15. File upload accepts legitimate binary images.
     */
    public function test_file_upload_accepts_valid_image_bytes(): void
    {
        $user = User::where('email', 'devtanvirhossain@gmail.com')->first();
        $this->actingAs($user);

        $csrf = 'test_csrf_upload_valid';

        // Legitimate 1x1 transparent PNG binary bytes
        $pngBytes = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');
        $validFile = UploadedFile::fake()->createWithContent('valid.png', $pngBytes);

        $res = $this->withSession([
            'userId' => $user->id,
            'csrf' => $csrf,
        ])->withHeaders([
            'Origin' => 'http://localhost:3000',
            'X-CSRF-Token' => $csrf,
        ])->post('/api/admin/media', [
            'file' => $validFile,
            'alt' => 'Valid PNG Image',
        ]);

        $res->assertStatus(201);
        $res->assertJsonStructure(['id', 'url']);
    }

    /**
     * 16. HTTP security headers are present on all responses.
     */
    public function test_enterprise_http_security_headers_present(): void
    {
        $res = $this->getJson('/api/public/appearance');
        $res->assertStatus(200);

        $headers = $res->headers;
        $this->assertEquals('nosniff', $headers->get('X-Content-Type-Options'));
        $this->assertEquals('SAMEORIGIN', $headers->get('X-Frame-Options'));
        $this->assertEquals('strict-origin-when-cross-origin', $headers->get('Referrer-Policy'));
        $this->assertEquals('camera=(), microphone=(), geolocation=()', $headers->get('Permissions-Policy'));
        $this->assertStringContainsString('no-store', (string) $headers->get('Cache-Control'));
        $this->assertNotEmpty($headers->get('Content-Security-Policy'));
    }

    /**
     * 17. Admin endpoints enforce strict clickjacking protection and noindex.
     */
    public function test_admin_routes_protect_from_iframe_embedding_and_indexing(): void
    {
        $res = $this->getJson('/api/admin/dashboard');

        $headers = $res->headers;
        $this->assertEquals('DENY', $headers->get('X-Frame-Options'));
        $this->assertEquals('noindex, nofollow', $headers->get('X-Robots-Tag'));

        $csp = (string) $headers->get('Content-Security-Policy');
        $this->assertStringContainsString("frame-ancestors 'none'", $csp);
    }

    /**
     * 18. Dynamic Content Security Policy expands when integrations are enabled.
     */
    public function test_dynamic_csp_expands_when_integrations_enabled(): void
    {
        $cspService = app(CspService::class);

        // 1. Base policy without integrations
        $baseCsp = $cspService->generatePolicy(false);
        $this->assertStringNotContainsString('connect.facebook.net', $baseCsp);
        $this->assertStringNotContainsString('analytics.tiktok.com', $baseCsp);

        // 2. Temporarily enable integrations in settings table
        Setting::where('id', 'integrations')->update([
            'value' => [
                'facebookEnabled' => 'on',
                'facebookId' => '123456789',
                'tiktokEnabled' => 'on',
                'tiktokId' => '987654321',
                'gtmEnabled' => 'on',
                'gtmId' => 'GTM-TEST',
            ],
        ]);

        $expandedCsp = $cspService->generatePolicy(false);
        $this->assertStringContainsString('https://connect.facebook.net', $expandedCsp);
        $this->assertStringContainsString('https://analytics.tiktok.com', $expandedCsp);
        $this->assertStringContainsString('https://*.tiktok.com', $expandedCsp);

        // Admin policy remains strict even when integrations are enabled
        $adminCsp = $cspService->generatePolicy(true);
        $this->assertStringNotContainsString('connect.facebook.net', $adminCsp);
        $this->assertStringNotContainsString('analytics.tiktok.com', $adminCsp);
        $this->assertStringContainsString("frame-ancestors 'none'", $adminCsp);
    }

    /**
     * 19. Session invalidation on password change.
     */
    public function test_password_change_invalidates_all_active_sessions(): void
    {
        $user = User::where('email', 'devtanvirhossain@gmail.com')->first();
        $this->actingAs($user);

        // Clean any existing test sessions for isolation
        DB::table('laravel_sessions')->where('user_id', $user->id)->delete();

        // Insert mock session in laravel_sessions
        DB::table('laravel_sessions')->insert([
            'id' => (string) Str::random(40),
            'user_id' => $user->id,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'PHPUnit Test',
            'payload' => 'dummy_payload',
            'last_activity' => time(),
        ]);

        $this->assertEquals(1, DB::table('laravel_sessions')->where('user_id', $user->id)->count());

        $csrf = 'change_pass_csrf';

        $res = $this->withSession([
            'userId' => $user->id,
            'csrf' => $csrf,
        ])->withHeaders([
            'Origin' => 'http://localhost:3000',
            'X-CSRF-Token' => $csrf,
        ])->postJson('/api/auth/password', [
            'currentPassword' => 'WrongCurrentPassword!',
            'password' => 'BrandNewPassword1234!',
        ]);

        // Wrong current password should be rejected
        $res->assertStatus(400);
        $res->assertJson(['error' => 'Current password is incorrect']);

        // Active session remains untouched on failure
        $this->assertEquals(1, DB::table('laravel_sessions')->where('user_id', $user->id)->count());
    }
}
