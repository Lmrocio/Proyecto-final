<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LevelTest extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'guest_email',
        'writing_text',
        'result_mcer',
        'ai_analysis',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'ai_analysis' => 'array',
        ];
    }
}
