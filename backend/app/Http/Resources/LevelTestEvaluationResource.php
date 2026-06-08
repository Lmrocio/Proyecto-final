<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LevelTestEvaluationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $analysis = is_array($this->ai_analysis) ? $this->ai_analysis : [];
        $scores = is_array($analysis['scores'] ?? null) ? $analysis['scores'] : [];

        return [
            'cefr_level' => $analysis['cefr_level'] ?? $this->suggested_level,
            'total_score' => $analysis['total_score'] ?? $this->score,
            'scores' => [
                'task_achievement' => $scores['task_achievement'] ?? null,
                'coherence_cohesion' => $scores['coherence_cohesion'] ?? null,
                'lexical_resource' => $scores['lexical_resource'] ?? null,
                'grammatical_accuracy' => $scores['grammatical_accuracy'] ?? null,
            ],
            'strengths' => array_values($analysis['strengths'] ?? []),
            'improvements' => array_values($analysis['improvements'] ?? []),
            'next_level_advice' => $analysis['next_level_advice'] ?? $this->comments,
        ];
    }
}
