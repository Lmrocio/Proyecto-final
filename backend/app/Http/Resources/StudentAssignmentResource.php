<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentAssignmentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $submission = $this->submissions->first();

        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'unit_name' => $this->unit_name,
            'due_date' => $this->due_date?->toISOString(),
            'status' => $this->resolveStatus($submission),
            'course' => [
                'id' => $this->course?->id,
                'title' => $this->course?->title,
                'teacher_name' => $this->course?->teacher?->name,
                'meeting_link' => $this->course?->meeting_link,
            ],
            'submission' => $submission ? [
                'id' => $submission->id,
                'grade' => $submission->grade,
                'teacher_feedback' => $submission->teacher_feedback,
                'submitted_at' => $submission->created_at?->toISOString(),
            ] : null,
        ];
    }

    private function resolveStatus(mixed $submission): string
    {
        if ($submission?->grade !== null) {
            return 'graded';
        }

        if ($submission) {
            return 'submitted';
        }

        if ($this->due_date && $this->due_date->isPast()) {
            return 'overdue';
        }

        return 'pending';
    }
}