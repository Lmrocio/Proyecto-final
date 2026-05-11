<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreLevelTestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'topic' => is_string($this->input('topic')) ? trim($this->input('topic')) : $this->input('topic'),
            'composition' => is_string($this->input('composition')) ? trim($this->input('composition')) : $this->input('composition'),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'topic' => ['required', 'string', 'min:5', 'max:500'],
            'composition' => ['required', 'string', 'max:12000'],
        ];
    }
}
