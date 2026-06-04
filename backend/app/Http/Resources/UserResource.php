<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Lista blanca de atributos expuestos. Nunca incluye password ni tokens.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $fullName = trim((string) ($this->first_name ?? '').' '.(string) ($this->last_name ?? ''));

        return [
            'id' => $this->id,
            'name' => $fullName !== '' ? $fullName : $this->name,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'email' => $this->email,
            'role' => $this->role,
            'is_active' => (bool) ($this->is_active ?? true),
            'phone' => $this->phone,
            'profile_photo' => $this->profile_photo,
            'accessibility_settings' => $this->accessibility_settings,
            'messaging_settings' => $this->accessibility_settings['messaging'] ?? null,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
