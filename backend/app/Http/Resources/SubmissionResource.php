<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SubmissionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'assignment_id' => $this->assignment_id,
            'student_id' => $this->student_id,
            'content' => $this->content,
            'file_path' => $this->file_path,
            'grade' => $this->grade,
            'teacher_feedback' => $this->teacher_feedback,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'student' => $this->whenLoaded('student', fn (): array => [
                'id' => $this->student->id,
                'name' => $this->student->name,
                'email' => $this->student->email,
                'role' => $this->student->role,
            ]),
            'assignment' => $this->whenLoaded('assignment', fn (): array => [
                'id' => $this->assignment->id,
                'course_id' => $this->assignment->course_id,
                'title' => $this->assignment->title,
                'due_date' => $this->assignment->due_date?->toISOString(),
            ]),
        ];
    }
}
