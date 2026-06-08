<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        $role = $this->user()?->role;

        return $role === 'admin' || $role === 'teacher';
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'user_id' => ['required', 'string', 'uuid', 'exists:users,id'],
            'course_id' => ['required', 'string', 'uuid', 'exists:courses,id'],
            'date' => ['required', 'date'],
            'status' => ['required', 'in:present,absent,justified'],
            'is_online' => ['sometimes', 'boolean'],
        ];
    }
}
