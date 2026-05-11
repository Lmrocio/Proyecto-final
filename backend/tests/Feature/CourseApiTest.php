<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\DatabaseTestCase;

class CourseApiTest extends DatabaseTestCase
{
    use RefreshDatabase;

    public function test_courses_index_requires_authentication(): void
    {
        $this->getJson('/api/courses')->assertUnauthorized();
    }

    public function test_student_only_sees_active_enrolled_courses(): void
    {
        $student = User::factory()->create(['role' => 'student']);
        $teacher = User::factory()->create(['role' => 'teacher']);

        $visibleCourse = $this->createCourse($teacher, 'English B2 - Visible');
        $inactiveCourse = $this->createCourse($teacher, 'English B1 - Inactive');
        $otherCourse = $this->createCourse($teacher, 'Speaking Club - Hidden');

        Enrollment::create([
            'student_id' => $student->id,
            'course_id' => $visibleCourse->id,
            'status' => 'active',
        ]);

        Enrollment::create([
            'student_id' => $student->id,
            'course_id' => $inactiveCourse->id,
            'status' => 'inactive',
        ]);

        Sanctum::actingAs($student);

        $response = $this->getJson('/api/courses');

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $visibleCourse->id)
            ->assertJsonMissing(['title' => $inactiveCourse->title])
            ->assertJsonMissing(['title' => $otherCourse->title]);
    }

    public function test_admin_can_create_course_for_teacher_user(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $teacher = User::factory()->create(['role' => 'teacher']);

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/courses', [
            'title' => 'CAE Intensive',
            'teacher_id' => $teacher->id,
            'meeting_link' => 'https://meet.example.com/cae-intensive',
            'start_date' => '2026-06-01',
            'end_date' => '2026-07-31',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('title', 'CAE Intensive')
            ->assertJsonPath('teacher_id', $teacher->id);

        $this->assertDatabaseHas('courses', [
            'title' => 'CAE Intensive',
            'teacher_id' => $teacher->id,
        ]);
    }

    public function test_course_creation_rejects_non_teacher_ids(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $student = User::factory()->create(['role' => 'student']);

        Sanctum::actingAs($admin);

        $this->postJson('/api/courses', [
            'title' => 'Conversation Lab',
            'teacher_id' => $student->id,
            'start_date' => '2026-06-01',
            'end_date' => '2026-06-30',
        ])
            ->assertUnprocessable()
            ->assertJson([
                'message' => 'teacher_id must belong to a teacher user.',
            ]);
    }

    private function createCourse(User $teacher, string $title): Course
    {
        return Course::create([
            'title' => $title,
            'teacher_id' => $teacher->id,
            'meeting_link' => 'https://meet.example.com/'.str()->slug($title),
            'start_date' => '2026-06-01',
            'end_date' => '2026-06-30',
        ]);
    }
}