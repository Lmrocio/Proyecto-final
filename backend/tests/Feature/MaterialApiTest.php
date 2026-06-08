<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Material;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\DatabaseTestCase;

class MaterialApiTest extends DatabaseTestCase
{
    use RefreshDatabase;

    public function test_teacher_can_store_audio_materials_with_unit_name(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $course = Course::create([
            'title' => 'Listening Lab',
            'teacher_id' => $teacher->id,
            'meeting_link' => 'https://meet.example.com/listening-lab',
            'start_date' => '2026-06-01',
            'end_date' => '2026-06-30',
        ]);

        Sanctum::actingAs($teacher);

        $response = $this->postJson('/api/materials', [
            'course_id' => $course->id,
            'title' => 'Listening Practice 01',
            'unit_name' => 'UNIT 1',
            'type' => 'audio',
            'path' => 'https://cdn.example.com/audio/listening-practice-01.mp3',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('type', 'audio')
            ->assertJsonPath('unit_name', 'UNIT 1');

        $material = Material::query()->firstOrFail();

        $this->assertSame('audio', $material->type);
        $this->assertSame('UNIT 1', $material->unit_name);
        $this->assertSame('https://cdn.example.com/audio/listening-practice-01.mp3', $material->path);
    }

    public function test_file_materials_still_require_an_uploaded_file(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $course = Course::create([
            'title' => 'Files Lab',
            'teacher_id' => $teacher->id,
            'meeting_link' => 'https://meet.example.com/files-lab',
            'start_date' => '2026-06-01',
            'end_date' => '2026-06-30',
        ]);

        Sanctum::actingAs($teacher);

        $this->postJson('/api/materials', [
            'course_id' => $course->id,
            'title' => 'Workbook PDF',
            'type' => 'file',
            'path' => 'https://cdn.example.com/files/workbook.pdf',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['file']);
    }
}