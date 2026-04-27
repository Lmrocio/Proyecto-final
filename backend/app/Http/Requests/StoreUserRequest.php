<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'role' => ['required', 'in:admin,teacher,student'],
            'password' => ['required', 'string', Password::min(8)->letters()->mixedCase()->numbers()],
            'phone' => ['nullable', 'string', 'max:30'],
            'profile_photo' => ['nullable', 'string', 'max:255'],
            'accessibility_settings' => ['nullable', 'array'],
        ];
    }
}
