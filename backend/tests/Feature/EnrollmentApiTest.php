<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\DatabaseTestCase;

class EnrollmentApiTest extends DatabaseTestCase
{
    use RefreshDatabase;

    public function test_enrollments_index_requires_authentication(): void
    {
        $this->getJson('/api/enrollments')->assertUnauthorized();
    }

    public function test_student_only_sees_their_own_enrollments(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $student = User::factory()->create(['role' => 'student']);
        $otherStudent = User::factory()->create(['role' => 'student']);
        $course = $this->createCourse($teacher);

        $own = Enrollment::create([
            'student_id' => $student->id,
            'course_id' => $course->id,
            'status' => 'active',
        ]);

        Enrollment::create([
            'student_id' => $otherStudent->id,
            'course_id' => $course->id,
            'status' => 'active',
        ]);

        Sanctum::actingAs($student);

        $this->getJson('/api/enrollments')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $own->id);
    }

    public function test_teacher_only_sees_enrollments_of_their_courses(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $otherTeacher = User::factory()->create(['role' => 'teacher']);
        $student = User::factory()->create(['role' => 'student']);

        $ownCourse = $this->createCourse($teacher);
        $otherCourse = $this->createCourse($otherTeacher);

        $visible = Enrollment::create([
            'student_id' => $student->id,
            'course_id' => $ownCourse->id,
            'status' => 'active',
        ]);

        Enrollment::create([
            'student_id' => $student->id,
            'course_id' => $otherCourse->id,
            'status' => 'active',
        ]);

        Sanctum::actingAs($teacher);

        $this->getJson('/api/enrollments')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $visible->id);
    }

    public function test_admin_can_create_enrollment(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $teacher = User::factory()->create(['role' => 'teacher']);
        $student = User::factory()->create(['role' => 'student']);
        $course = $this->createCourse($teacher);

        Sanctum::actingAs($admin);

        $this->postJson('/api/enrollments', [
            'student_id' => $student->id,
            'course_id' => $course->id,
        ])
            ->assertCreated()
            ->assertJsonPath('student_id', $student->id)
            ->assertJsonPath('course_id', $course->id)
            ->assertJsonPath('status', 'active');

        $this->assertDatabaseHas('enrollments', [
            'student_id' => $student->id,
            'course_id' => $course->id,
            'status' => 'active',
        ]);
    }

    public function test_enrollment_creation_rejects_non_student_ids(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $teacher = User::factory()->create(['role' => 'teacher']);
        $course = $this->createCourse($teacher);

        Sanctum::actingAs($admin);

        $this->postJson('/api/enrollments', [
            'student_id' => $teacher->id,
            'course_id' => $course->id,
        ])
            ->assertUnprocessable()
            ->assertJson(['message' => 'student_id must belong to a student user.']);
    }

    public function test_non_admin_cannot_create_enrollment(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $student = User::factory()->create(['role' => 'student']);
        $course = $this->createCourse($teacher);

        Sanctum::actingAs($teacher);

        $this->postJson('/api/enrollments', [
            'student_id' => $student->id,
            'course_id' => $course->id,
        ])->assertForbidden();
    }

    public function test_student_cannot_view_another_students_enrollment(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $student = User::factory()->create(['role' => 'student']);
        $otherStudent = User::factory()->create(['role' => 'student']);
        $course = $this->createCourse($teacher);

        $enrollment = Enrollment::create([
            'student_id' => $otherStudent->id,
            'course_id' => $course->id,
            'status' => 'active',
        ]);

        Sanctum::actingAs($student);

        $this->getJson('/api/enrollments/'.$enrollment->id)->assertForbidden();
    }

    private function createCourse(User $teacher): Course
    {
        return Course::create([
            'title' => 'Course '.str()->random(6),
            'teacher_id' => $teacher->id,
            'meeting_link' => 'https://meet.example.com/'.str()->random(6),
            'start_date' => '2026-06-01',
            'end_date' => '2026-06-30',
        ]);
    }
}
