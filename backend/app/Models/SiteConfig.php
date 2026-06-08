<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Branding JSONB contract:
 * {
 *   "site_name": string,
 *   "logo_type": "text"|"image",
 *   "logo_img_url": string|null,
 *   "isotype_img_url": string|null
 * }
 *
 * PostgreSQL JSONB keeps this payload flexible without rigid schema migrations
 * when the white-label identity evolves.
 */
class SiteConfig extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'theme_name',
        'colors',
        'bilingual_pulse',
        'branding',
        'ui_variant',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'colors' => 'array',
            'bilingual_pulse' => 'array',
            'branding' => 'array',
        ];
    }
}
