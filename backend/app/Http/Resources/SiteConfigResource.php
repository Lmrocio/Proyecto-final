<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SiteConfigResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'theme_name' => $this->theme_name,
            'colors' => $this->colors,
            'bilingual_pulse' => $this->bilingual_pulse,
            'branding' => $this->branding,
            'ui_variant' => $this->ui_variant,
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}