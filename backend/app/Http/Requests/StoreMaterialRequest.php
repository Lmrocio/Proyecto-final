<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMaterialRequest extends FormRequest
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
            'course_id' => ['required', 'string', 'uuid', 'exists:courses,id'],
            'title' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:file,link,video'],
            'path' => ['nullable', 'string', 'required_unless:type,file'],
            'file' => ['nullable', 'file', 'max:20480', 'required_if:type,file'],
        ];
    }
}
