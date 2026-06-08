<?php

namespace Tests\Feature;

use App\Models\LevelTest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\DatabaseTestCase;

class LevelTestLeadsApiTest extends DatabaseTestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_level_test_leads(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        LevelTest::create([
            'guest_email' => 'lead@example.com',
            'topic' => 'Online learning',
            'test_date' => now()->toDateString(),
            'score' => 30,
            'suggested_level' => 'B2',
            'comments' => 'Buen potencial comercial.',
            'writing_text' => 'Long enough essay text stored from the AI evaluation.',
            'ai_analysis' => ['cefr_level' => 'B2', 'total_score' => 30],
        ]);

        Sanctum::actingAs($admin);

        $this->getJson('/api/level-tests')
            ->assertOk()
            ->assertJsonPath('data.0.email', 'lead@example.com')
            ->assertJsonPath('data.0.cefr_level', 'B2')
            ->assertJsonPath('data.0.total_score', 30);
    }

    public function test_non_admin_cannot_list_level_test_leads(): void
    {
        $student = User::factory()->create(['role' => 'student']);

        Sanctum::actingAs($student);

        $this->getJson('/api/level-tests')->assertForbidden();
    }
}