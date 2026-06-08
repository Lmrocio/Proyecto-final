<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LevelTestLeadResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->user?->name ?? 'Lead sin cuenta',
            'guest_email' => $this->guest_email,
            'email' => $this->user?->email ?? $this->guest_email,
            'topic' => $this->topic,
            'cefr_level' => $this->suggested_level,
            'total_score' => $this->score,
            'test_date' => $this->test_date?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}