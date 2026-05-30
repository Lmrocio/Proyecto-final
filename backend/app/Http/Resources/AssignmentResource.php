<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssignmentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'course_id' => $this->course_id,
            'title' => $this->title,
            'unit_name' => $this->unit_name,
            'description' => $this->description,
            'due_date' => $this->due_date?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'course' => $this->whenLoaded('course', fn (): array => [
                'id' => $this->course->id,
                'title' => $this->course->title,
                'teacher_id' => $this->course->teacher_id,
                'teacher' => $this->course->relationLoaded('teacher') && $this->course->teacher ? [
                    'id' => $this->course->teacher->id,
                    'name' => $this->course->teacher->name,
                    'email' => $this->course->teacher->email,
                ] : null,
            ]),
            'submissions_count' => $this->whenCounted('submissions'),
        ];
    }
}