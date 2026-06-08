<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->sender ? "Mensaje de {$this->sender->name}" : 'Notificacion',
            'body' => $this->body,
            'is_read' => (bool) ($this->pivot?->is_read ?? false),
            'read_at' => $this->pivot?->read_at,
            'created_at' => $this->created_at?->toISOString(),
            'sender' => $this->sender ? [
                'id' => $this->sender->id,
                'name' => $this->sender->name,
                'email' => $this->sender->email,
            ] : null,
        ];
    }
}