<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\LevelTest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\DatabaseTestCase;

class AdminDashboardSummaryApiTest extends DatabaseTestCase
{
    use RefreshDatabase;

    public function test_admin_can_read_dashboard_summary_from_database(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $teacher = User::factory()->create(['role' => 'teacher']);
        User::factory()->create(['role' => 'teacher', 'is_active' => false]);
        User::factory()->count(2)->create(['role' => 'student']);
        User::factory()->create(['role' => 'student', 'is_active' => false]);

        Course::create([
            'title' => 'Curso activo',
            'teacher_id' => $teacher->id,
            'start_date' => now()->subDay()->toDateString(),
            'end_date' => now()->addDay()->toDateString(),
        ]);

        Course::create([
            'title' => 'Curso cerrado',
            'teacher_id' => $teacher->id,
            'start_date' => now()->subMonth()->toDateString(),
            'end_date' => now()->subDay()->toDateString(),
        ]);

        LevelTest::create([
            'guest_email' => 'lead.actual@example.com',
            'topic' => 'Online learning',
            'test_date' => now()->toDateString(),
            'score' => 30,
            'suggested_level' => 'B2',
            'comments' => 'Lead de este mes.',
            'writing_text' => 'Long enough essay text stored from the AI evaluation.',
            'ai_analysis' => ['cefr_level' => 'B2', 'total_score' => 30],
        ]);

        $previousLead = LevelTest::create([
            'guest_email' => 'lead.anterior@example.com',
            'topic' => 'Travel plans',
            'test_date' => now()->subMonth()->toDateString(),
            'score' => 18,
            'suggested_level' => 'A2',
            'comments' => 'Lead anterior.',
            'writing_text' => 'Another long enough essay text stored from the AI evaluation.',
            'ai_analysis' => ['cefr_level' => 'A2', 'total_score' => 18],
        ]);
        $previousLead->forceFill([
            'created_at' => now()->subMonth(),
            'updated_at' => now()->subMonth(),
        ])->save();

        Sanctum::actingAs($admin);

        $this->getJson('/api/admin/dashboard')
            ->assertOk()
            ->assertJson([
                'active_students' => 2,
                'active_teachers' => 1,
                'active_courses' => 1,
                'monthly_leads' => 1,
                'recent_level_test_leads' => 1,
            ]);
    }

    public function test_non_admin_cannot_read_dashboard_summary(): void
    {
        $student = User::factory()->create(['role' => 'student']);

        Sanctum::actingAs($student);

        $this->getJson('/api/admin/dashboard')->assertForbidden();
    }
}