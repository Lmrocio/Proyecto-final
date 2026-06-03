<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CourseResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'teacher_id' => $this->teacher_id,
            'meeting_link' => $this->meeting_link,
            'start_date' => $this->start_date?->toISOString(),
            'end_date' => $this->end_date?->toISOString(),
            'schedule' => $this->schedule,
            'bonus_id' => $this->bonus_id,
            'students_count' => (int) ($this->active_students_count ?? $this->enrollments_count ?? 0),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'teacher' => $this->whenLoaded('teacher', fn (): array => [
                'id' => $this->teacher->id,
                'name' => $this->teacher->name,
                'first_name' => $this->teacher->first_name,
                'last_name' => $this->teacher->last_name,
                'email' => $this->teacher->email,
            ]),
            'bonus' => $this->whenLoaded('bonus', fn (): ?array => $this->bonus ? [
                'id' => $this->bonus->id,
                'name' => $this->bonus->name,
                'type' => $this->bonus->type,
                'price' => $this->bonus->price,
            ] : null),
        ];
    }
}
