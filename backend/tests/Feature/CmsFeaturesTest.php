<?php

namespace Tests\Feature;

use App\Models\Content;
use App\Models\LeadRequest;
use App\Models\Media;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class CmsFeaturesTest extends TestCase
{
    use DatabaseTransactions;

    protected User $adminUser;
    protected string $csrf;

    protected function setUp(): void
    {
        parent::setUp();
        $this->adminUser = User::where('email', 'devtanvirhossain@gmail.com')->first();
        $this->csrf = 'cms_test_csrf_token_12345';
    }

    protected function adminRequest(string $method, string $uri, array $data = [])
    {
        return $this->withSession([
            'userId' => $this->adminUser->id,
            'csrf' => $this->csrf,
        ])->withHeaders([
            'Origin' => 'http://localhost:3000',
            'X-CSRF-Token' => $this->csrf,
        ])->json($method, $uri, $data);
    }

    /**
     * Feature 1: Admin Authentication Lifecycle
     */
    public function test_feature_1_admin_authentication_lifecycle(): void
    {
        // 1. Session check
        $res = $this->getJson('/api/auth/session');
        $res->assertStatus(200);
        $res->assertJsonStructure(['authenticated', 'csrf']);

        // 2. Login with owner credentials
        $loginRes = $this->withSession(['csrf' => $this->csrf])
            ->withHeaders([
                'Origin' => 'http://localhost:3000',
                'X-CSRF-Token' => $this->csrf,
            ])->postJson('/api/auth/login', [
                'email' => 'devtanvirhossain@gmail.com',
                'password' => 'WrongPass!',
            ]);
        $loginRes->assertStatus(401);

        // 3. Logout
        $logoutRes = $this->adminRequest('POST', '/api/auth/logout');
        $logoutRes->assertStatus(200);
        $logoutRes->assertJson(['ok' => true]);
    }

    /**
     * Feature 2 & 5: Content CRUD, Publishing & Soft-Delete Actions
     */
    public function test_feature_2_and_5_content_crud_and_status_actions(): void
    {
        // 1. Create content item
        $createRes = $this->adminRequest('POST', '/api/admin/content/services', [
            'title' => 'Automated eCommerce Funnel',
            'slug' => 'automated-ecommerce-funnel',
            'summary' => 'High-conversion funnel design',
            'body' => '<p>Full funnel implementation.</p>',
            'status' => 'draft',
            'featured' => true,
            'sort_order' => 10,
            'fields' => ['icon' => 'Zap', 'features' => ['Fast', 'Reliable']],
        ]);
        $createRes->assertStatus(201);
        $createRes->assertJsonStructure(['id']);
        $contentId = $createRes->json('id');

        // 2. Read created item
        $getRes = $this->adminRequest('GET', '/api/admin/content/services?q=Automated');
        $getRes->assertStatus(200);
        $this->assertTrue(collect($getRes->json('items'))->contains('id', $contentId));

        // 3. Update content with version check
        $updateRes = $this->adminRequest('PUT', "/api/admin/content/services/{$contentId}", [
            'title' => 'Automated eCommerce Funnel V2',
            'slug' => 'automated-ecommerce-funnel',
            'summary' => 'Updated funnel summary',
            'body' => '<p>Updated body copy.</p>',
            'status' => 'published',
            'featured' => true,
            'sort_order' => 5,
            'fields' => ['icon' => 'Zap', 'features' => ['Upgraded']],
            'version' => 1,
        ]);
        $updateRes->assertStatus(200);
        $updateRes->assertJson(['ok' => true]);

        // 4. Soft delete action
        $deleteRes = $this->adminRequest('POST', "/api/admin/content/services/{$contentId}/delete");
        $deleteRes->assertStatus(200);
        $this->assertNotNull(Content::find($contentId)->deleted_at);

        // 5. Restore action
        $restoreRes = $this->adminRequest('POST', "/api/admin/content/services/{$contentId}/restore");
        $restoreRes->assertStatus(200);
        $this->assertNull(Content::find($contentId)->deleted_at);
    }

    /**
     * Features 3, 7, 8, 14: Appearance, Palette, Design Themes & General Settings
     */
    public function test_features_3_7_8_14_appearance_design_themes_and_settings(): void
    {
        $appearance = Setting::find('appearance');
        $this->assertNotNull($appearance);

        // Update appearance with custom palette and design theme options
        $updateRes = $this->adminRequest('PUT', '/api/admin/settings/appearance', [
            'version' => $appearance->version,
            'value' => [
                'websitePrimaryColor' => '#103b2a',
                'adminPrimaryColor' => '#d0f56a',
                'websiteGreenColor' => '#103b2a',
                'websiteLimeColor' => '#d0f56a',
                'websiteLavenderColor' => '#d8cdf3',
                'websiteTheme' => 'dark',
                'adminTheme' => 'light',
                'websiteLoadingBar' => 'on',
                'websiteDesign' => 'editorial',
                'websiteDensity' => 'comfortable',
                'websiteCorners' => 'rounded',
                'websiteMotion' => 'subtle',
                'studioPortraitShape' => 'oval',
                'executivePortraitSide' => 'left',
            ],
        ]);
        $updateRes->assertStatus(200);

        // Verify public appearance endpoint reflects the updated palette
        $publicRes = $this->getJson('/api/public/appearance');
        $publicRes->assertStatus(200);
        $this->assertEquals('#103b2a', $publicRes->json('websitePrimaryColor'));
        $this->assertEquals('on', $publicRes->json('websiteLoadingBar'));
    }

    /**
     * Features 4 & 6: Media Management, Binary MEDIUMBLOB Storage, and Content Relationships
     */
    public function test_features_4_and_6_media_management_and_content_relationships(): void
    {
        // 1. Upload valid binary PNG
        $pngBytes = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');
        $file = UploadedFile::fake()->createWithContent('test_asset.png', $pngBytes);

        $uploadRes = $this->withSession([
            'userId' => $this->adminUser->id,
            'csrf' => $this->csrf,
        ])->withHeaders([
            'Origin' => 'http://localhost:3000',
            'X-CSRF-Token' => $this->csrf,
        ])->post('/api/admin/media', [
            'file' => $file,
            'alt' => 'Test Asset Alt Text',
        ]);
        $uploadRes->assertStatus(201);
        $mediaId = $uploadRes->json('id');

        // Verify binary storage in media table
        $media = Media::find($mediaId);
        $this->assertNotNull($media);
        $this->assertEquals('image/png', $media->mime);
        $this->assertEquals(strlen($pngBytes), $media->size);

        // 2. Update media metadata (alt, name)
        $metaRes = $this->adminRequest('PUT', "/api/admin/media/{$mediaId}", [
            'alt' => 'Updated Alt Text',
            'name' => 'renamed_asset.png',
            'version' => 1,
        ]);
        $metaRes->assertStatus(200);

        // 3. Replace media file with new binary bytes
        $replacementBytes = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==');
        $replaceFile = UploadedFile::fake()->createWithContent('replacement.png', $replacementBytes);

        $replaceRes = $this->withSession([
            'userId' => $this->adminUser->id,
            'csrf' => $this->csrf,
        ])->withHeaders([
            'Origin' => 'http://localhost:3000',
            'X-CSRF-Token' => $this->csrf,
        ])->post("/api/admin/media/{$mediaId}/file", [
            '_method' => 'PUT',
            'file' => $replaceFile,
            'version' => 2,
        ]);
        $replaceRes->assertStatus(200);

        // 4. Attach media to a content item (content_media relationship)
        $content = Content::first();
        DB::table('content_media')->insert([
            'content_id' => $content->id,
            'media_id' => $mediaId,
        ]);

        // 5. Query media usage
        $usageRes = $this->adminRequest('GET', "/api/admin/media/{$mediaId}/usage");
        $usageRes->assertStatus(200);
        $this->assertTrue(collect($usageRes->json('content'))->contains('id', $content->id));

        // 6. Delete media while referenced (must fail with 409 Conflict)
        $deleteFail = $this->adminRequest('DELETE', "/api/admin/media/{$mediaId}");
        $deleteFail->assertStatus(409);
        $deleteFail->assertJson(['error' => 'Asset is referenced; inspect usage first']);

        // 7. Remove pivot and successfully delete
        DB::table('content_media')->where('media_id', $mediaId)->delete();
        $deleteSuccess = $this->adminRequest('DELETE', "/api/admin/media/{$mediaId}");
        $deleteSuccess->assertStatus(200);
        $this->assertNull(Media::find($mediaId));
    }

    /**
     * Features 9, 10, 11: Navigation, Gallery Controls, and Homepage Section Ordering
     */
    public function test_features_9_10_11_navigation_gallery_and_section_ordering(): void
    {
        // 1. Update Navigation Menu and Social Order
        $nav = Setting::find('navigation');
        $navRes = $this->adminRequest('PUT', '/api/admin/settings/navigation', [
            'version' => $nav->version,
            'value' => array_merge($nav->value, [
                'menu' => "Home|/\nServices|/#services\nProjects|/#projects\nContact|/#booking",
                'socialOrder' => 'facebook,linkedin,github,twitter',
            ]),
        ]);
        $navRes->assertStatus(200);

        // 2. Update Homepage Sections, Order, and Gallery Visibility
        $home = Setting::find('homepage');
        $homeRes = $this->adminRequest('PUT', '/api/admin/settings/homepage', [
            'version' => $home->version,
            'value' => array_merge($home->value, [
                'galleryTitle' => 'Our Featured Work & Events',
                'galleryDescription' => 'Visual highlights of our client events',
                'sections' => 'hero,services,projects,gallery,booking,footer',
                'sectionOrder' => 'hero,services,projects,gallery,booking,footer',
            ]),
        ]);
        $homeRes->assertStatus(200);

        // Verify public bootstrap site endpoint returns the updated homepage and navigation
        $siteRes = $this->getJson('/api/public/site');
        $siteRes->assertStatus(200);
        $this->assertEquals('Our Featured Work & Events', $siteRes->json('settings.homepage.galleryTitle'));
        $this->assertStringContainsString('Services|/#services', $siteRes->json('settings.navigation.menu'));
    }

    /**
     * Features 12 & 13: Editable Section and Form Labels (UI Settings)
     */
    public function test_features_12_and_13_editable_section_and_form_labels(): void
    {
        $ui = Setting::find('ui');
        $uiRes = $this->adminRequest('PUT', '/api/admin/settings/ui', [
            'version' => $ui->version,
            'value' => array_merge($ui->value, [
                'Hero_1' => 'CUSTOM PORTFOLIO HEADER',
                'bookingHeading' => 'Schedule Your Free Growth Call',
                'sendBooking' => 'Reserve Your Spot Now',
                'nameLabel' => 'Your Full Name',
            ]),
        ]);
        $uiRes->assertStatus(200);

        $siteRes = $this->getJson('/api/public/site');
        $siteRes->assertStatus(200);
        $this->assertEquals('CUSTOM PORTFOLIO HEADER', $siteRes->json('settings.ui.Hero_1'));
        $this->assertEquals('Schedule Your Free Growth Call', $siteRes->json('settings.ui.bookingHeading'));
    }

    /**
     * Features 15, 16, 17, 18: Integrations (Facebook, GTM, TikTok Pixels)
     */
    public function test_features_15_16_17_18_integrations_and_pixel_validation(): void
    {
        $integ = Setting::find('integrations');

        // 1. Invalid GTM ID format rejected
        $badGtm = $this->adminRequest('PUT', '/api/admin/settings/integrations', [
            'version' => $integ->version,
            'value' => array_merge($integ->value, [
                'gtmId' => 'INVALID-GTM-ID',
                'gtmEnabled' => 'on',
            ]),
        ]);
        $badGtm->assertStatus(400);

        // 2. Valid integration configuration accepted
        $goodInteg = $this->adminRequest('PUT', '/api/admin/settings/integrations', [
            'version' => $integ->version,
            'value' => [
                'facebookEnabled' => 'on',
                'facebookId' => '123456789012345',
                'gtmEnabled' => 'on',
                'gtmId' => 'GTM-ABCD123',
                'tiktokEnabled' => 'on',
                'tiktokId' => 'ABC123XYZ456789',
            ],
        ]);
        $goodInteg->assertStatus(200);

        $updated = Setting::find('integrations');
        $this->assertEquals('on', $updated->value['facebookEnabled']);
        $this->assertEquals('GTM-ABCD123', $updated->value['gtmId']);
    }

    /**
     * Feature 19: Custom HTML/CSS/JS Settings
     */
    public function test_feature_19_custom_code_settings(): void
    {
        $code = Setting::find('customCode');
        $res = $this->adminRequest('PUT', '/api/admin/settings/customCode', [
            'version' => $code->version,
            'value' => [
                'enabled' => 'on',
                'headerHtml' => '<meta name="custom-audit" content="tanvir-portfolio">',
                'headerCss' => '.custom-banner { display: block; }',
                'headerJs' => 'console.log("Custom code active");',
                'bodyHtml' => '<div id="tracking-pixel"></div>',
                'bodyCss' => '',
                'bodyJs' => '',
            ],
        ]);
        $res->assertStatus(200);

        $updated = Setting::find('customCode');
        $this->assertEquals('on', $updated->value['enabled']);
        $this->assertStringContainsString('custom-audit', $updated->value['headerHtml']);
    }

    /**
     * Feature 20: Header and Footer Logos Management
     */
    public function test_feature_20_logos_settings(): void
    {
        $logos = Setting::find('logos');

        // Image mode requires an image URL
        $badLogo = $this->adminRequest('PUT', '/api/admin/settings/logos', [
            'version' => $logos->version,
            'value' => [
                'headerMode' => 'image',
                'headerImage' => '',
                'headerAlt' => '',
                'footerMode' => 'text',
                'footerImage' => '',
                'footerAlt' => '',
            ],
        ]);
        $badLogo->assertStatus(400);

        // Valid logo settings
        $goodLogo = $this->adminRequest('PUT', '/api/admin/settings/logos', [
            'version' => $logos->version,
            'value' => [
                'headerMode' => 'image',
                'headerImage' => 'https://tanvirhossain.online/assets/logo.png',
                'headerAlt' => 'Tanvir Logo',
                'footerMode' => 'text',
                'footerImage' => '',
                'footerAlt' => '',
            ],
        ]);
        $goodLogo->assertStatus(200);
    }

    /**
     * Features 21, 22, 23, 24: Lead Management, Inbox, and Status Transitions
     */
    public function test_features_21_22_23_24_lead_workflow(): void
    {
        $dedup = (string) Str::uuid();

        // 1. Submit public booking lead
        $futureDate = now()->addDays(3)->format('Y-m-d H:i:s');
        $leadRes = $this->withHeaders(['Origin' => 'http://localhost:3000'])
            ->postJson('/api/requests', [
                'kind' => 'booking',
                'name' => 'Enterprise Client',
                'email' => 'client@enterprise.com',
                'phone' => '+8801712345678',
                'service' => 'Full Funnel Automation',
                'message' => 'We want to scale our shop to 10k orders/day.',
                'requested_at' => $futureDate,
                'timezone' => 'Asia/Dhaka',
                'dedup_key' => $dedup,
                'website' => '',
            ]);
        $leadRes->assertStatus(202);

        $lead = LeadRequest::where('dedup_key', $dedup)->first();
        $this->assertNotNull($lead);
        $this->assertEquals('new', $lead->status);

        // 2. Admin inbox retrieval
        $inboxRes = $this->adminRequest('GET', "/api/admin/requests/{$lead->id}");
        $inboxRes->assertStatus(200);
        $this->assertEquals('Enterprise Client', $inboxRes->json('name'));

        // 3. Status transition: new -> contacted -> scheduled -> completed
        $stages = ['contacted', 'scheduled', 'completed'];
        $currentVersion = $lead->version;

        foreach ($stages as $stage) {
            $transRes = $this->adminRequest('PUT', "/api/admin/requests/{$lead->id}", [
                'status' => $stage,
                'notes' => "Progressing to {$stage}",
                'version' => $currentVersion,
            ]);
            $transRes->assertStatus(200);
            $this->assertEquals($stage, $transRes->json('status'));
            $currentVersion = $transRes->json('version');
        }

        // Verify final stage in database
        $this->assertEquals('completed', LeadRequest::find($lead->id)->status);
    }

    /**
     * Feature 25: Optimistic Concurrency Versioning Conflict
     */
    public function test_feature_25_optimistic_concurrency_conflict(): void
    {
        $home = Setting::find('homepage');
        $staleVersion = $home->version - 1; // Purposely stale version

        $conflictRes = $this->adminRequest('PUT', '/api/admin/settings/homepage', [
            'version' => $staleVersion,
            'value' => $home->value,
        ]);

        $conflictRes->assertStatus(409);
        $conflictRes->assertJson(['error' => 'Settings changed; reload before saving']);
    }

    /**
     * Visual In-Place Editor: Atomic Batch Updates and Rollback on Failure
     */
    public function test_visual_editor_atomic_batch_updates_and_rollback(): void
    {
        // 1. Snapshot retrieval
        $snapRes = $this->adminRequest('GET', '/api/admin/editor');
        $snapRes->assertStatus(200);
        $snapRes->assertJsonStructure(['settings', 'content']);

        $about = Setting::find('about');
        $content = Content::published()->first();

        // 2. Successful atomic batch update across both settings and content
        $batchRes = $this->adminRequest('PATCH', '/api/admin/editor', [
            'changes' => [
                [
                    'kind' => 'settings',
                    'id' => 'about',
                    'path' => 'AboutMeSection_1',
                    'value' => 'TRANSFORMING E-COMMERCE',
                    'version' => $about->version,
                ],
                [
                    'kind' => 'content',
                    'id' => $content->id,
                    'path' => 'title',
                    'value' => $content->title . ' (Updated via Visual Editor)',
                    'version' => $content->version,
                ],
            ],
        ]);
        $batchRes->assertStatus(200);
        $batchRes->assertJson(['ok' => true]);

        // 3. Atomic rollback test: invalid change causes whole batch to rollback
        $aboutFresh = Setting::find('about');
        $contentFresh = Content::find($content->id);

        $badBatch = $this->adminRequest('PATCH', '/api/admin/editor', [
            'changes' => [
                [
                    'kind' => 'settings',
                    'id' => 'about',
                    'path' => 'AboutMeSection_1',
                    'value' => 'SHOULD BE ROLLED BACK',
                    'version' => $aboutFresh->version,
                ],
                [
                    'kind' => 'settings',
                    'id' => 'about',
                    'path' => 'canonicalDomain', // Managed only in admin!
                    'value' => 'https://hacker.com',
                    'version' => $aboutFresh->version,
                ],
            ],
        ]);
        $badBatch->assertStatus(400);

        // Verify rollback: AboutMeSection_1 must NOT have changed to 'SHOULD BE ROLLED BACK'
        $aboutRollback = Setting::find('about');
        $this->assertEquals('TRANSFORMING E-COMMERCE', $aboutRollback->value['AboutMeSection_1']);
    }

    /**
     * Public robots.txt and sitemap.xml Endpoints
     */
    public function test_seo_robots_and_sitemap_endpoints(): void
    {
        $robotsRes = $this->get('/robots.txt');
        $robotsRes->assertStatus(200);
        $robotsRes->assertHeader('Content-Type', 'text/plain; charset=UTF-8');
        $this->assertStringContainsString('Disallow: /admin', $robotsRes->getContent());
        $this->assertStringContainsString('Sitemap:', $robotsRes->getContent());

        $sitemapRes = $this->get('/sitemap.xml');
        $sitemapRes->assertStatus(200);
        $sitemapRes->assertHeader('Content-Type', 'application/xml');
        $this->assertStringContainsString('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', $sitemapRes->getContent());
        $this->assertStringContainsString('<loc>', $sitemapRes->getContent());
    }
}
