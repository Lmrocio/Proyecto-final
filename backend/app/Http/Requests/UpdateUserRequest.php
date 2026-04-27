<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
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
        /** @var User $routeUser */
        $routeUser = $this->route('user');

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => [
                'sometimes',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($routeUser->id),
            ],
            'role' => ['sometimes', 'in:admin,teacher,student'],
            'password' => ['sometimes', 'string', Password::min(8)->letters()->mixedCase()->numbers()],
            'phone' => ['nullable', 'string', 'max:30'],
            'profile_photo' => ['nullable', 'string', 'max:255'],
            'accessibility_settings' => ['nullable', 'array'],
        ];
    }
}
