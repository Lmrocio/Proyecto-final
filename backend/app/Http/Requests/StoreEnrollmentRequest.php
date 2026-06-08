<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEnrollmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'student_id' => ['required', 'string', 'uuid', 'exists:users,id'],
            'course_id' => ['required', 'string', 'uuid', 'exists:courses,id'],
            'status' => ['sometimes', 'in:active,inactive'],
        ];
    }
}
