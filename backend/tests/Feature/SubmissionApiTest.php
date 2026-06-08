<?php

namespace Tests\Feature;

use App\Models\Assignment;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\DatabaseTestCase;

class SubmissionApiTest extends DatabaseTestCase
{
    use RefreshDatabase;

    public function test_enrolled_student_can_submit_assignment(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $student = User::factory()->create(['role' => 'student']);
        $course = $this->createCourse($teacher);
        $this->enroll($student, $course);
        $assignment = $this->createAssignment($course);

        Sanctum::actingAs($student);

        $this->postJson('/api/submissions', [
            'assignment_id' => $assignment->id,
            'content' => 'Mi redaccion sobre el tema.',
        ])
            ->assertCreated()
            ->assertJsonPath('assignment_id', $assignment->id)
            ->assertJsonPath('student_id', $student->id);

        $this->assertDatabaseHas('submissions', [
            'assignment_id' => $assignment->id,
            'student_id' => $student->id,
        ]);
    }

    public function test_non_enrolled_student_cannot_submit_assignment(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $student = User::factory()->create(['role' => 'student']);
        $course = $this->createCourse($teacher);
        $assignment = $this->createAssignment($course);

        Sanctum::actingAs($student);

        $this->postJson('/api/submissions', [
            'assignment_id' => $assignment->id,
            'content' => 'Intento sin matricula.',
        ])
            ->assertUnprocessable()
            ->assertJson(['message' => 'You must be enrolled in the assignment course to submit work.']);
    }

    public function test_submission_requires_content_or_file(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $student = User::factory()->create(['role' => 'student']);
        $course = $this->createCourse($teacher);
        $this->enroll($student, $course);
        $assignment = $this->createAssignment($course);

        Sanctum::actingAs($student);

        $this->postJson('/api/submissions', [
            'assignment_id' => $assignment->id,
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['content']);
    }

    public function test_student_only_sees_their_own_submissions(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $student = User::factory()->create(['role' => 'student']);
        $otherStudent = User::factory()->create(['role' => 'student']);
        $course = $this->createCourse($teacher);
        $assignment = $this->createAssignment($course);

        $own = Submission::create([
            'assignment_id' => $assignment->id,
            'student_id' => $student->id,
            'content' => 'Mia',
        ]);

        Submission::create([
            'assignment_id' => $assignment->id,
            'student_id' => $otherStudent->id,
            'content' => 'Ajena',
        ]);

        Sanctum::actingAs($student);

        $this->getJson('/api/submissions')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $own->id);
    }

    public function test_teacher_can_grade_submission_from_own_course(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $student = User::factory()->create(['role' => 'student']);
        $course = $this->createCourse($teacher);
        $assignment = $this->createAssignment($course);

        $submission = Submission::create([
            'assignment_id' => $assignment->id,
            'student_id' => $student->id,
            'content' => 'Entrega',
        ]);

        Sanctum::actingAs($teacher);

        $this->patchJson('/api/submissions/'.$submission->id.'/grade', [
            'grade' => 8.5,
            'teacher_feedback' => 'Buen trabajo.',
        ])
            ->assertOk()
            ->assertJsonPath('grade', '8.50');

        $this->assertDatabaseHas('submissions', [
            'id' => $submission->id,
            'teacher_feedback' => 'Buen trabajo.',
        ]);
    }

    public function test_teacher_cannot_grade_submission_from_another_course(): void
    {
        $owner = User::factory()->create(['role' => 'teacher']);
        $otherTeacher = User::factory()->create(['role' => 'teacher']);
        $student = User::factory()->create(['role' => 'student']);
        $course = $this->createCourse($owner);
        $assignment = $this->createAssignment($course);

        $submission = Submission::create([
            'assignment_id' => $assignment->id,
            'student_id' => $student->id,
            'content' => 'Entrega',
        ]);

        Sanctum::actingAs($otherTeacher);

        $this->patchJson('/api/submissions/'.$submission->id.'/grade', [
            'grade' => 5,
        ])->assertForbidden();
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

    private function createAssignment(Course $course): Assignment
    {
        return Assignment::create([
            'course_id' => $course->id,
            'title' => 'Tarea '.str()->random(6),
            'description' => 'Descripcion de la tarea.',
            'due_date' => '2026-06-15 23:59:00',
        ]);
    }

    private function enroll(User $student, Course $course): void
    {
        Enrollment::create([
            'student_id' => $student->id,
            'course_id' => $course->id,
            'status' => 'active',
        ]);
    }
}
