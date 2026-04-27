<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCourseRequest extends FormRequest
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
            'title' => ['sometimes', 'string', 'max:255'],
            'teacher_id' => ['sometimes', 'string', 'uuid', 'exists:users,id'],
            'meeting_link' => ['nullable', 'url', 'max:500'],
            'start_date' => ['sometimes', 'date'],
            'end_date' => ['sometimes', 'date', 'after_or_equal:start_date'],
            'bonus_id' => ['nullable', 'string', 'uuid', 'exists:bonuses,id'],
        ];
    }
}
