<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GradeSubmissionRequest extends FormRequest
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
            'grade' => ['nullable', 'numeric', 'min:0', 'max:100', 'required_without:teacher_feedback'],
            'teacher_feedback' => ['nullable', 'string', 'max:5000', 'required_without:grade'],
        ];
    }
}
