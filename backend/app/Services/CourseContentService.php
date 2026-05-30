<?php

namespace App\Services;

use App\Models\Assignment;
use App\Models\Course;
use App\Models\Material;
use Illuminate\Support\Collection;

class CourseContentService
{
    /**
     * Agrupa los materiales y las tareas de un curso por unidad para componer
     * la vista de contenidos del alumno.
     *
     * @return array<string, mixed>
     */
    public function forCourse(Course $course): array
    {
        $course->loadMissing('teacher:id,name');

        $materials = $course->materials()->latest()->get();
        $assignments = $course->assignments()->orderBy('due_date')->get();

        $materialsByUnit = $materials->groupBy(fn (Material $material): string => $material->unit_name ?? 'Unidad general');
        $assignmentsByUnit = $assignments->groupBy(fn (Assignment $assignment): string => $assignment->unit_name ?? 'Unidad general');

        $unitNames = $materialsByUnit->keys()
            ->merge($assignmentsByUnit->keys())
            ->unique()
            ->values();

        $units = $unitNames->map(function (string $unitName) use ($materialsByUnit, $assignmentsByUnit): array {
            $unitMaterials = $materialsByUnit->get($unitName, collect());
            $unitAssignments = $assignmentsByUnit->get($unitName, collect());

            return [
                'unit_name' => $unitName,
                'materials' => $this->mapMaterials($unitMaterials),
                'assignments' => $this->mapAssignments($unitAssignments),
                'resource_counts' => [
                    'file' => $unitMaterials->where('type', 'file')->count(),
                    'link' => $unitMaterials->where('type', 'link')->count(),
                    'video' => $unitMaterials->where('type', 'video')->count(),
                    'audio' => $unitMaterials->where('type', 'audio')->count(),
                    'assignment' => $unitAssignments->count(),
                ],
            ];
        });

        return [
            'course' => [
                'id' => $course->id,
                'title' => $course->title,
                'teacher_name' => $course->teacher?->name,
                'meeting_link' => $course->meeting_link,
            ],
            'units' => $units,
        ];
    }

    /**
     * @param  Collection<int, Material>  $materials
     * @return Collection<int, array<string, mixed>>
     */
    private function mapMaterials(Collection $materials): Collection
    {
        return $materials->map(fn (Material $material): array => [
            'id' => $material->id,
            'title' => $material->title,
            'type' => $material->type,
            'path' => $material->path,
            'size' => $material->size,
            'unit_name' => $material->unit_name,
        ])->values();
    }

    /**
     * @param  Collection<int, Assignment>  $assignments
     * @return Collection<int, array<string, mixed>>
     */
    private function mapAssignments(Collection $assignments): Collection
    {
        return $assignments->map(fn (Assignment $assignment): array => [
            'id' => $assignment->id,
            'title' => $assignment->title,
            'description' => $assignment->description,
            'due_date' => $assignment->due_date?->toDateTimeString(),
            'unit_name' => $assignment->unit_name,
        ])->values();
    }
}
