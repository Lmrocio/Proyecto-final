<?php

namespace Tests\Feature;

use App\Models\Bonus;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\DatabaseTestCase;

class BonusApiTest extends DatabaseTestCase
{
    use RefreshDatabase;

    public function test_bonuses_index_requires_authentication(): void
    {
        $this->getJson('/api/bonuses')->assertUnauthorized();
    }

    public function test_authenticated_user_can_list_bonuses(): void
    {
        $student = User::factory()->create(['role' => 'student']);

        Bonus::create([
            'name' => 'Bono mensual',
            'type' => 'monthly',
            'price' => 49.90,
        ]);

        Sanctum::actingAs($student);

        $this->getJson('/api/bonuses')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Bono mensual');
    }

    public function test_admin_can_create_bonus(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        Sanctum::actingAs($admin);

        $this->postJson('/api/bonuses', [
            'name' => 'Pack 10 clases',
            'type' => 'pack',
            'price' => 120,
            'description' => 'Diez sesiones de conversacion',
        ])
            ->assertCreated()
            ->assertJsonPath('name', 'Pack 10 clases')
            ->assertJsonPath('type', 'pack');

        $this->assertDatabaseHas('bonuses', [
            'name' => 'Pack 10 clases',
            'type' => 'pack',
        ]);
    }

    public function test_bonus_creation_validates_type(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        Sanctum::actingAs($admin);

        $this->postJson('/api/bonuses', [
            'name' => 'Bono invalido',
            'type' => 'yearly',
            'price' => 10,
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['type']);
    }

    public function test_non_admin_cannot_create_bonus(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);

        Sanctum::actingAs($teacher);

        $this->postJson('/api/bonuses', [
            'name' => 'Bono',
            'type' => 'monthly',
            'price' => 10,
        ])->assertForbidden();
    }
}
