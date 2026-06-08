<?php

namespace Database\Seeders;

use App\Models\Assignment;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Message;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class StudentDashboardDemoSeeder extends Seeder
{
    public function run(): void
    {
        $student = User::query()->where('role', 'student')->first();
        $teacher = User::query()->where('role', 'teacher')->first();
        $admin = User::query()->where('role', 'admin')->first();

        if (!$student || !$teacher) {
            return;
        }

        $courses = Course::query()
            ->whereIn('title', [
                'General English B1',
                'First Certificate Prep',
                'Business English',
            ])
            ->get()
            ->keyBy('title');

        if ($courses->isEmpty()) {
            return;
        }

        foreach ($courses as $course) {
            Enrollment::query()->updateOrCreate(
                [
                    'student_id' => $student->id,
                    'course_id' => $course->id,
                ],
                [
                    'status' => 'active',
                ]
            );
        }

        $assignments = [
            [
                'course' => 'General English B1',
                'title' => 'Vocabulary Quiz Travel Plans',
                'unit_name' => 'UNIT 1',
                'description' => 'Repasa el vocabulario de viajes y completa el quiz antes de clase.',
                'due_date' => Carbon::now()->setTime(9, 0)->addDay(),
                'submission' => null,
            ],
            [
                'course' => 'General English B1',
                'title' => 'Speaking Audio My Last Holiday',
                'unit_name' => 'UNIT 1',
                'description' => 'Sube un audio de 2 minutos contando tus ultimas vacaciones.',
                'due_date' => Carbon::now()->setTime(18, 30)->addDays(2),
                'submission' => [
                    'content' => 'Audio enviado por el alumno para correccion.',
                    'grade' => null,
                    'teacher_feedback' => null,
                ],
            ],
            [
                'course' => 'General English B1',
                'title' => 'Grammar Worksheet Present Perfect',
                'unit_name' => 'UNIT 2',
                'description' => 'Completa la ficha de present perfect y adjunta una foto legible.',
                'due_date' => Carbon::now()->setTime(12, 15)->addDays(4),
                'submission' => null,
            ],
            [
                'course' => 'First Certificate Prep',
                'title' => 'Reading Mock Part 5',
                'unit_name' => 'EXAM PRACTICE',
                'description' => 'Haz el reading cronometrado y anota dudas para la tutoria.',
                'due_date' => Carbon::now()->setTime(16, 0)->addDays(5),
                'submission' => [
                    'content' => 'Respuestas entregadas en PDF.',
                    'grade' => 8.50,
                    'teacher_feedback' => 'Buen trabajo. Revisa solo las preposiciones de la pregunta 14.',
                ],
            ],
            [
                'course' => 'First Certificate Prep',
                'title' => 'Writing Essay Climate Action',
                'unit_name' => 'WRITING',
                'description' => 'Redacta un essay de 220 palabras sobre medidas contra el cambio climatico.',
                'due_date' => Carbon::now()->setTime(10, 0)->addDays(7),
                'submission' => null,
            ],
            [
                'course' => 'First Certificate Prep',
                'title' => 'Use of English Open Cloze',
                'unit_name' => 'GRAMMAR BOOST',
                'description' => 'Entrega el open cloze con captura del resultado final.',
                'due_date' => Carbon::now()->setTime(19, 0)->addDays(8),
                'submission' => null,
            ],
            [
                'course' => 'Business English',
                'title' => 'Meeting Minutes Client Kickoff',
                'unit_name' => 'UNIT 3',
                'description' => 'Resume la reunion inicial con el cliente en ingles profesional.',
                'due_date' => Carbon::now()->setTime(8, 45)->addDays(10),
                'submission' => [
                    'content' => 'Documento compartido con decisiones y tareas.',
                    'grade' => 9.20,
                    'teacher_feedback' => 'Muy claro y bien estructurado.',
                ],
            ],
            [
                'course' => 'Business English',
                'title' => 'Email Follow Up Negotiation',
                'unit_name' => 'UNIT 3',
                'description' => 'Escribe un follow up despues de una negociacion comercial.',
                'due_date' => Carbon::now()->setTime(15, 30)->addDays(11),
                'submission' => null,
            ],
            [
                'course' => 'Business English',
                'title' => 'Presentation Pitch Deck Vocabulary',
                'unit_name' => 'UNIT 4',
                'description' => 'Completa la actividad de vocabulario para presentaciones.',
                'due_date' => Carbon::now()->setTime(11, 0)->addDays(13),
                'submission' => null,
            ],
            [
                'course' => 'General English B1',
                'title' => 'Listening Worksheet City Breaks',
                'unit_name' => 'UNIT 2',
                'description' => 'Responde al listening sobre city breaks y marca el vocabulario nuevo.',
                'due_date' => Carbon::now()->setTime(17, 15)->addDays(15),
                'submission' => null,
            ],
        ];

        foreach ($assignments as $assignmentData) {
            $course = $courses->get($assignmentData['course']);

            if (!$course) {
                continue;
            }

            $assignment = Assignment::query()->updateOrCreate(
                [
                    'course_id' => $course->id,
                    'title' => $assignmentData['title'],
                ],
                [
                    'unit_name' => $assignmentData['unit_name'],
                    'description' => $assignmentData['description'],
                    'due_date' => $assignmentData['due_date'],
                ]
            );

            if (!$assignmentData['submission']) {
                continue;
            }

            Submission::query()->updateOrCreate(
                [
                    'assignment_id' => $assignment->id,
                    'student_id' => $student->id,
                ],
                $assignmentData['submission']
            );
        }

        $messages = [
            [
                'sender' => $teacher,
                'body' => 'Recuerda traer tus dudas para el speaking mock del viernes. Usaremos vocabulario de travel plans y holiday experiences.',
                'is_read' => false,
                'created_at' => Carbon::now()->subHours(2),
            ],
            [
                'sender' => $teacher,
                'body' => 'He revisado tu Reading Mock Part 5. Busca en el panel la retroalimentacion y corrige las preposiciones del ejercicio 14.',
                'is_read' => false,
                'created_at' => Carbon::now()->subHours(5),
            ],
            [
                'sender' => $teacher,
                'body' => 'La tarea Writing Essay Climate Action tiene una nueva rubrica. Revisa cohesion, linking words y conclusion.',
                'is_read' => false,
                'created_at' => Carbon::now()->subDay(),
            ],
            [
                'sender' => $teacher,
                'body' => 'Buen trabajo en Meeting Minutes Client Kickoff. Tu resumen fue claro y muy profesional.',
                'is_read' => true,
                'created_at' => Carbon::now()->subDays(2),
            ],
            [
                'sender' => $teacher,
                'body' => 'Para Business English, prepara vocabulario de negotiation, pricing y follow up emails para la proxima sesion.',
                'is_read' => false,
                'created_at' => Carbon::now()->subDays(3),
            ],
            [
                'sender' => $teacher,
                'body' => 'Tu audio My Last Holiday se ha recibido correctamente. Envia una segunda version si quieres mejorar pronunciacion.',
                'is_read' => true,
                'created_at' => Carbon::now()->subDays(4),
            ],
            [
                'sender' => $admin ?? $teacher,
                'body' => 'Se ha actualizado el calendario academico con una clase extra de pronunciation clinic el proximo martes.',
                'is_read' => false,
                'created_at' => Carbon::now()->subDays(5),
            ],
            [
                'sender' => $admin ?? $teacher,
                'body' => 'Tu matricula sigue activa. Puedes consultar nuevas tareas en el calendario del aula virtual.',
                'is_read' => true,
                'created_at' => Carbon::now()->subDays(6),
            ],
            [
                'sender' => $teacher,
                'body' => 'Busca en el material complementario la plantilla de essay y el checklist para writing exam.',
                'is_read' => false,
                'created_at' => Carbon::now()->subDays(7),
            ],
            [
                'sender' => $teacher,
                'body' => 'En la proxima clase haremos debate sobre climate action. Lleva tres argumentos a favor y uno en contra.',
                'is_read' => true,
                'created_at' => Carbon::now()->subDays(9),
            ],
        ];

        foreach ($messages as $messageData) {
            $message = Message::query()->updateOrCreate(
                [
                    'sender_id' => $messageData['sender']->id,
                    'body' => $messageData['body'],
                ],
                [
                    'created_at' => $messageData['created_at'],
                    'updated_at' => $messageData['created_at'],
                ]
            );

            $hasRecipient = $message->recipients()
                ->where('users.id', $student->id)
                ->exists();

            $pivotData = [
                'is_read' => $messageData['is_read'],
                'read_at' => $messageData['is_read'] ? $messageData['created_at']->copy()->addHours(6) : null,
                'created_at' => $messageData['created_at'],
                'updated_at' => $messageData['created_at'],
            ];

            if ($hasRecipient) {
                $message->recipients()->updateExistingPivot($student->id, $pivotData);
                continue;
            }

            $message->recipients()->attach($student->id, $pivotData);
        }
    }
}