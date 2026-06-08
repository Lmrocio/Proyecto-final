<?php

namespace Tests\Feature;

use App\Models\SiteConfig;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\DatabaseTestCase;

class SiteConfigApiTest extends DatabaseTestCase
{
    use RefreshDatabase;

    public function test_public_endpoint_returns_default_site_config(): void
    {
        $response = $this->getJson('/api/site-config');

        $response
            ->assertOk()
            ->assertJsonPath('config.theme_name', 'openclassy')
            ->assertJsonPath('config.ui_variant', 'v1')
            ->assertJsonPath('config.branding.site_name', 'OpenClassy')
            ->assertJsonPath('config.branding.logo_type', 'text')
            ->assertJsonPath('config.branding.logo_img_url', null)
            ->assertJsonPath('config.branding.isotype_img_url', null);

        $this->assertSame(1, SiteConfig::query()->count());
    }

    public function test_admin_can_update_ui_variant(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        Sanctum::actingAs($admin);

        $response = $this->putJson('/api/admin/settings', [
            'ui_variant' => 'v2',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('config.ui_variant', 'v2');

        $this->assertDatabaseHas('site_configs', [
            'ui_variant' => 'v2',
        ]);
    }

    public function test_admin_can_update_branding_payload(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        Sanctum::actingAs($admin);

        $response = $this->putJson('/api/admin/settings', [
            'ui_variant' => 'v1',
            'branding' => [
                'site_name' => 'Academia Delta',
                'logo_type' => 'image',
                'logo_img_url' => 'https://cdn.example.com/logo.svg',
                'isotype_img_url' => 'https://cdn.example.com/isotype.svg',
            ],
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('config.branding.site_name', 'Academia Delta')
            ->assertJsonPath('config.branding.logo_type', 'image')
            ->assertJsonPath('config.branding.logo_img_url', 'https://cdn.example.com/logo.svg')
            ->assertJsonPath('config.branding.isotype_img_url', 'https://cdn.example.com/isotype.svg');

        $this->assertDatabaseHas('site_configs', [
            'ui_variant' => 'v1',
        ]);
    }

    public function test_non_admin_users_cannot_update_site_config(): void
    {
        $student = User::factory()->create(['role' => 'student']);

        Sanctum::actingAs($student);

        $this->putJson('/api/admin/settings', [
            'ui_variant' => 'v3',
        ])
            ->assertForbidden()
            ->assertJson([
                'message' => 'Forbidden.',
            ]);
    }
}