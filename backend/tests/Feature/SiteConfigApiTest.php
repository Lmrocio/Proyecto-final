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
            ->assertJsonPath('config.ui_variant', 'v1');

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