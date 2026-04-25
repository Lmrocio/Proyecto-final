<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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
