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
        $type = $this->input('type');
        $pathRule = 'required';
        $fileRule = 'prohibited';

        if ($type === 'file') {
            $pathRule = 'nullable';
            $fileRule = 'required';
        } elseif ($type === 'audio') {
            $pathRule = 'required_without:file';
            $fileRule = 'required_without:path';
        }

        return [
            'course_id' => ['required', 'string', 'uuid', 'exists:courses,id'],
            'title' => ['required', 'string', 'max:255'],
            'unit_name' => ['nullable', 'string', 'max:255'],
            'type' => ['required', 'in:file,link,video,audio'],
            'path' => [
                'nullable',
                'string',
                $pathRule,
            ],
            'file' => [
                'nullable',
                'file',
                'max:20480',
                $fileRule,
            ],
        ];
    }
}
