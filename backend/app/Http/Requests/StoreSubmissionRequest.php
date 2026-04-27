<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSubmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'student';
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'assignment_id' => ['required', 'string', 'uuid', 'exists:assignments,id'],
            'content' => ['nullable', 'string', 'max:10000', 'required_without:file'],
            'file' => ['nullable', 'file', 'max:20480', 'required_without:content'],
        ];
    }
}
