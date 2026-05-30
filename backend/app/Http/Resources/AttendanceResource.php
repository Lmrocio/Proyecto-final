<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttendanceResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'course_id' => $this->course_id,
            'date' => $this->date?->toDateString(),
            'status' => $this->status,
            'is_online' => $this->is_online,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'user' => $this->whenLoaded('user', fn (): array => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
                'role' => $this->user->role,
            ]),
            'course' => $this->whenLoaded('course', fn (): array => [
                'id' => $this->course->id,
                'title' => $this->course->title,
                'teacher_id' => $this->course->teacher_id,
            ]),
        ];
    }
}
