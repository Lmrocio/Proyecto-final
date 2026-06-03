<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EnrollmentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'student_id' => $this->student_id,
            'course_id' => $this->course_id,
            'status' => $this->status,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'student' => $this->whenLoaded('student', fn (): array => [
                'id' => $this->student->id,
                'name' => $this->student->name,
                'first_name' => $this->student->first_name,
                'last_name' => $this->student->last_name,
                'email' => $this->student->email,
                'role' => $this->student->role,
                'phone' => $this->student->phone,
            ]),
            'course' => $this->whenLoaded('course', fn (): array => [
                'id' => $this->course->id,
                'title' => $this->course->title,
                'teacher_id' => $this->course->teacher_id,
                'bonus_id' => $this->course->bonus_id,
            ]),
        ];
    }
}
