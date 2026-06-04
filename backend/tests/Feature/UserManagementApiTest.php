<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\DatabaseTestCase;

class UserManagementApiTest extends DatabaseTestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_users(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/users', [
            'first_name' => 'Teacher',
            'last_name' => 'Created From Test',
            'email' => 'teacher.created@example.com',
            'role' => 'teacher',
            'password' => 'Password123',
            'phone' => '600123123',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('first_name', 'Teacher')
            ->assertJsonPath('last_name', 'Created From Test')
            ->assertJsonPath('email', 'teacher.created@example.com')
            ->assertJsonPath('role', 'teacher');

        $createdUser = User::query()->where('email', 'teacher.created@example.com')->firstOrFail();

        $this->assertTrue(Hash::check('Password123', $createdUser->password));
    }

    public function test_admin_can_manage_user_active_state(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/users', [
            'first_name' => 'Inactive',
            'last_name' => 'Student',
            'email' => 'inactive.student@example.com',
            'role' => 'student',
            'password' => 'Password123',
            'is_active' => false,
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('is_active', false);

        $createdUser = User::query()->where('email', 'inactive.student@example.com')->firstOrFail();

        $this->assertFalse($createdUser->is_active);

        $this->putJson('/api/users/'.$createdUser->id, [
            'is_active' => true,
        ])
            ->assertOk()
            ->assertJsonPath('is_active', true);

        $this->assertTrue($createdUser->fresh()->is_active);
    }

    public function test_admin_cannot_deactivate_their_own_account(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        Sanctum::actingAs($admin);

        $this->putJson('/api/users/'.$admin->id, [
            'is_active' => false,
        ])
            ->assertUnprocessable()
            ->assertJson([
                'message' => 'You cannot deactivate your own account.',
            ]);

        $this->assertTrue($admin->fresh()->is_active);
    }

    public function test_non_admin_users_cannot_create_users(): void
    {
        $student = User::factory()->create(['role' => 'student']);

        Sanctum::actingAs($student);

        $this->postJson('/api/users', [
            'first_name' => 'Blocked',
            'last_name' => 'User',
            'email' => 'blocked@example.com',
            'role' => 'teacher',
            'password' => 'Password123',
        ])
            ->assertForbidden()
            ->assertJson([
                'message' => 'Forbidden.',
            ]);
    }

    public function test_admin_cannot_delete_their_own_account(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        Sanctum::actingAs($admin);

        $this->deleteJson('/api/users/'.$admin->id)
            ->assertUnprocessable()
            ->assertJson([
                'message' => 'You cannot delete your own account.',
            ]);
    }
}