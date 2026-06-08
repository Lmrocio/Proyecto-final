<?php

namespace Tests\Feature;

use App\Models\LevelTest;
use App\Services\LevelTestCorrectionService;
use Tests\TestCase;

class LevelTestCorrectionTest extends TestCase
{
    public function test_level_test_endpoint_returns_structured_evaluation(): void
    {
        $this->app->instance(LevelTestCorrectionService::class, new class extends LevelTestCorrectionService
        {
            public function evaluate(string $topic, string $composition, string $systemPrompt): LevelTest
            {
                return new LevelTest([
                    'topic' => $topic,
                    'score' => 30,
                    'suggested_level' => 'B2',
                    'comments' => 'Sigue ampliando conectores y matices para acercarte a C1.',
                    'writing_text' => $composition,
                    'ai_analysis' => [
                        'cefr_level' => 'B2',
                        'total_score' => 30,
                        'scores' => [
                            'task_achievement' => 8,
                            'coherence_cohesion' => 7,
                            'lexical_resource' => 8,
                            'grammatical_accuracy' => 7,
                        ],
                        'strengths' => ['Ideas claras', 'Buen rango de vocabulario'],
                        'improvements' => [
                            [
                                'issue' => 'Algunos conectores se repiten.',
                                'suggestion' => 'Alterna however, therefore y nevertheless según la relación lógica.',
                            ],
                        ],
                        'next_level_advice' => 'Sigue ampliando conectores y matices para acercarte a C1.',
                    ],
                ]);
            }
        });

        $composition = str_repeat(
            'This essay explains both opinions with clear examples and a balanced conclusion for the reader. ',
            7
        );

        $response = $this->postJson('/api/level-tests', [
            'topic' => 'Should online learning replace traditional classrooms?',
            'composition' => $composition,
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('cefr_level', 'B2')
            ->assertJsonPath('total_score', 30)
            ->assertJsonPath('scores.task_achievement', 8)
            ->assertJsonPath('improvements.0.issue', 'Algunos conectores se repiten.');
    }

    public function test_level_test_endpoint_rejects_short_compositions(): void
    {
        $response = $this->postJson('/api/level-tests', [
            'topic' => 'Should online learning replace traditional classrooms?',
            'composition' => 'This is too short for a precise writing evaluation.',
        ]);

        $response
            ->assertStatus(422)
            ->assertJson([
                'message' => 'Escribe al menos 150 palabras para una evaluación precisa',
            ]);
    }

    public function test_level_test_endpoint_rejects_compositions_below_one_hundred_fifty_words(): void
    {
        $response = $this->postJson('/api/level-tests', [
            'topic' => 'Should online learning replace traditional classrooms?',
            'composition' => implode(' ', array_fill(0, 149, 'word')),
        ]);

        $response
            ->assertStatus(422)
            ->assertJson([
                'message' => 'Escribe al menos 150 palabras para una evaluación precisa',
            ]);
    }

    public function test_level_test_endpoint_rejects_non_english_compositions(): void
    {
        $composition = str_repeat(
            'Esta redacción explica mis ideas sobre la educación porque pienso que las clases ayudan mucho a los estudiantes y desarrolla varios argumentos en español para comprobar la validación del idioma. ',
            8
        );

        $response = $this->postJson('/api/level-tests', [
            'topic' => 'Should online learning replace traditional classrooms?',
            'composition' => $composition,
        ]);

        $response
            ->assertStatus(422)
            ->assertJson([
                'message' => 'Por favor, escribe tu redacción en inglés',
            ]);
    }
}
