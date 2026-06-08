<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class StudentUsersDemoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $teacherId = $this->ensureTeacher();
        $bonuses = $this->ensureBonuses();
        $courses = $this->ensureCourses($teacherId, $bonuses);

        $students = [
            ['first_name' => 'Rocio', 'last_name' => 'Garcia Lopez', 'email' => 'rocio.garcia@openclassy.test', 'phone' => '+34 600 110 201', 'course' => 'Intensivo de verano', 'bonus' => 'Inscripcion anticipada', 'is_active' => true],
            ['first_name' => 'Francisco', 'last_name' => 'Martinez Perez', 'email' => 'francisco.martinez@openclassy.test', 'phone' => '+34 600 110 202', 'course' => 'Conversacion avanzada', 'bonus' => 'Descuento por registro', 'is_active' => false],
            ['first_name' => 'Mariana', 'last_name' => 'Hernandez Sanchez', 'email' => 'mariana.hernandez@openclassy.test', 'phone' => '+34 600 110 203', 'course' => 'Ingles para negocios', 'bonus' => 'Bonus por pronto pago', 'is_active' => false],
            ['first_name' => 'Alejandro', 'last_name' => 'Fernandez Diaz', 'email' => 'alejandro.fernandez@openclassy.test', 'phone' => '+34 600 110 204', 'course' => 'Preparacion para TOEFL', 'bonus' => 'Promocion exclusiva', 'is_active' => false],
            ['first_name' => 'Bianca', 'last_name' => 'Gonzalez Romero', 'email' => 'bianca.gonzalez@openclassy.test', 'phone' => '+34 600 110 205', 'course' => 'Ingles para principiantes', 'bonus' => 'Tarifa reducida', 'is_active' => false],
            ['first_name' => 'Carlos', 'last_name' => 'Ramirez Torres', 'email' => 'carlos.ramirez@openclassy.test', 'phone' => '+34 600 110 206', 'course' => 'Ingles academico', 'bonus' => 'Ahorro por solicitudes', 'is_active' => false],
            ['first_name' => 'Diana', 'last_name' => 'Cruz Morales', 'email' => 'diana.cruz@openclassy.test', 'phone' => '+34 600 110 207', 'course' => 'Curso de pronunciacion', 'bonus' => 'Ofertas limitadas', 'is_active' => false],
            ['first_name' => 'Oliver', 'last_name' => 'Jimenez Castillo', 'email' => 'oliver.jimenez@openclassy.test', 'phone' => '+34 600 110 208', 'course' => 'Ingles para viajes', 'bonus' => 'Beneficios por tiempo', 'is_active' => true],
            ['first_name' => 'Sophia', 'last_name' => 'Vasquez Mendoza', 'email' => 'sophia.vasquez@openclassy.test', 'phone' => '+34 600 110 209', 'course' => 'Ingles en el trabajo', 'bonus' => 'Registro prioritario', 'is_active' => false],
            ['first_name' => 'Liam', 'last_name' => 'Moreno Ortega', 'email' => 'liam.moreno@openclassy.test', 'phone' => '+34 600 110 210', 'course' => 'Ingles conversacional', 'bonus' => 'Ventajas anticipadas', 'is_active' => false],
        ];

        $this->cleanupObsoleteDemoStudents($students);

        foreach ($students as $student) {
            $studentId = DB::table('users')->where('email', $student['email'])->value('id') ?? (string) Str::uuid();
            $courseId = $courses[$student['course']] ?? null;

            if (!$courseId) {
                continue;
            }

            DB::table('users')->updateOrInsert(
                ['email' => $student['email']],
                $this->buildUserPayload($studentId, $student)
            );

            DB::table('enrollments')
                ->where('student_id', $studentId)
                ->where('course_id', '<>', $courseId)
                ->delete();

            DB::table('enrollments')->updateOrInsert(
                [
                    'student_id' => $studentId,
                    'course_id' => $courseId,
                ],
                [
                    'id' => DB::table('enrollments')
                        ->where('student_id', $studentId)
                        ->where('course_id', $courseId)
                        ->value('id') ?? (string) Str::uuid(),
                    'status' => 'active',
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }
    }

    /**
     * @param array<int, array<string, mixed>> $students
     */
    private function cleanupObsoleteDemoStudents(array $students): void
    {
        $currentDemoEmails = array_map(
            static fn (array $student): string => $student['email'],
            $students
        );

        $protectedDemoEmails = [...$currentDemoEmails, 'student@openclassy.test'];

        DB::table('users')
            ->where('role', 'student')
            ->where('email', 'like', '%@openclassy.test')
            ->whereNotIn('email', $protectedDemoEmails)
            ->delete();
    }

    private function ensureTeacher(): string
    {
        $teacherId = DB::table('users')->where('email', 'teacher@openclassy.test')->value('id') ?? (string) Str::uuid();

        DB::table('users')->updateOrInsert(
            ['email' => 'teacher@openclassy.test'],
            $this->buildUserPayload($teacherId, [
                'first_name' => 'Teacher',
                'last_name' => 'OpenClassy',
                'email' => 'teacher@openclassy.test',
                'phone' => null,
                'role' => 'teacher',
            ])
        );

        return $teacherId;
    }

    /**
     * @return array<string, string>
     */
    private function ensureBonuses(): array
    {
        $bonuses = [
            ['name' => 'Inscripcion anticipada', 'type' => 'pack', 'price' => 59.00, 'description' => 'Condiciones preferentes para altas formalizadas antes del inicio del curso.'],
            ['name' => 'Descuento por registro', 'type' => 'monthly', 'price' => 79.00, 'description' => 'Cuota mensual bonificada para alumnos registrados desde campanas de captacion.'],
            ['name' => 'Bonus por pronto pago', 'type' => 'pack', 'price' => 129.00, 'description' => 'Pack promocional aplicado al abonar el curso por adelantado.'],
            ['name' => 'Promocion exclusiva', 'type' => 'pack', 'price' => 149.00, 'description' => 'Condicion comercial especial para preparacion intensiva.'],
            ['name' => 'Tarifa reducida', 'type' => 'monthly', 'price' => 69.00, 'description' => 'Cuota reducida para cursos de iniciacion.'],
            ['name' => 'Ahorro por solicitudes', 'type' => 'pack', 'price' => 109.00, 'description' => 'Bono orientado a alumnado con solicitudes academicas recurrentes.'],
            ['name' => 'Ofertas limitadas', 'type' => 'pack', 'price' => 89.00, 'description' => 'Promocion temporal para cursos especificos.'],
            ['name' => 'Beneficios por tiempo', 'type' => 'monthly', 'price' => 99.00, 'description' => 'Ventaja comercial asociada a permanencia en la academia.'],
            ['name' => 'Registro prioritario', 'type' => 'pack', 'price' => 119.00, 'description' => 'Bono para alumnos que requieren incorporacion preferente.'],
            ['name' => 'Ventajas anticipadas', 'type' => 'monthly', 'price' => 85.00, 'description' => 'Cuota con beneficio por reserva temprana.'],
        ];

        $ids = [];

        foreach ($bonuses as $bonus) {
            $bonusId = DB::table('bonuses')->where('name', $bonus['name'])->value('id') ?? (string) Str::uuid();

            DB::table('bonuses')->updateOrInsert(
                ['name' => $bonus['name']],
                [
                    'id' => $bonusId,
                    'type' => $bonus['type'],
                    'price' => $bonus['price'],
                    'description' => $bonus['description'],
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );

            $ids[$bonus['name']] = $bonusId;
        }

        return $ids;
    }

    /**
     * @param array<string, string> $bonuses
     * @return array<string, string>
     */
    private function ensureCourses(string $teacherId, array $bonuses): array
    {
        $courses = [
            ['title' => 'Intensivo de verano', 'bonus' => 'Inscripcion anticipada', 'start_offset' => 0, 'end_offset' => 90, 'meeting_link' => 'https://meet.google.com/openclassy-verano', 'schedule' => 'L/X 17:00-18:30'],
            ['title' => 'Conversacion avanzada', 'bonus' => 'Descuento por registro', 'start_offset' => 2, 'end_offset' => 80, 'meeting_link' => 'https://meet.example.com/conversacion-avanzada', 'schedule' => 'M/J 18:00-19:30'],
            ['title' => 'Ingles para negocios', 'bonus' => 'Bonus por pronto pago', 'start_offset' => 4, 'end_offset' => 100, 'meeting_link' => 'https://meet.example.com/business', 'schedule' => 'V 10:00-12:00'],
            ['title' => 'Preparacion para TOEFL', 'bonus' => 'Promocion exclusiva', 'start_offset' => 6, 'end_offset' => 120, 'meeting_link' => null, 'schedule' => 'M/J 19:30-21:00'],
            ['title' => 'Ingles para principiantes', 'bonus' => 'Tarifa reducida', 'start_offset' => 8, 'end_offset' => 95, 'meeting_link' => 'https://meet.example.com/principiantes', 'schedule' => 'L/X 16:00-17:00'],
            ['title' => 'Ingles academico', 'bonus' => 'Ahorro por solicitudes', 'start_offset' => 10, 'end_offset' => 130, 'meeting_link' => 'https://meet.example.com/academico', 'schedule' => 'S 09:30-11:00'],
            ['title' => 'Curso de pronunciacion', 'bonus' => 'Ofertas limitadas', 'start_offset' => 12, 'end_offset' => 70, 'meeting_link' => 'https://meet.example.com/pronunciacion', 'schedule' => 'V 17:00-18:00'],
            ['title' => 'Ingles para viajes', 'bonus' => 'Beneficios por tiempo', 'start_offset' => 14, 'end_offset' => 85, 'meeting_link' => 'https://meet.example.com/viajes', 'schedule' => 'J 18:00-19:30'],
            ['title' => 'Ingles en el trabajo', 'bonus' => 'Registro prioritario', 'start_offset' => 16, 'end_offset' => 110, 'meeting_link' => 'https://meet.example.com/trabajo', 'schedule' => 'M 08:30-10:00'],
            ['title' => 'Ingles conversacional', 'bonus' => 'Ventajas anticipadas', 'start_offset' => 18, 'end_offset' => 75, 'meeting_link' => 'https://meet.example.com/conversacional', 'schedule' => 'S 11:00-12:30'],
        ];

        $ids = [];

        foreach ($courses as $course) {
            $courseId = DB::table('courses')->where('title', $course['title'])->value('id') ?? (string) Str::uuid();
            $courseData = [
                'id' => $courseId,
                'teacher_id' => $teacherId,
                'meeting_link' => $course['meeting_link'],
                'start_date' => now()->addDays($course['start_offset'])->toDateString(),
                'end_date' => now()->addDays($course['end_offset'])->toDateString(),
                'bonus_id' => $bonuses[$course['bonus']] ?? null,
                'updated_at' => now(),
                'created_at' => now(),
            ];

            if (Schema::hasColumn('courses', 'description')) {
                $courseData['description'] = 'Curso demo para validar la gestion administrativa de alumnado.';
            }

            if (Schema::hasColumn('courses', 'schedule')) {
                $courseData['schedule'] = $course['schedule'];
            }

            DB::table('courses')->updateOrInsert(
                ['title' => $course['title']],
                $courseData
            );

            $ids[$course['title']] = $courseId;
        }

        return $ids;
    }

    /**
     * @param array<string, mixed> $user
     * @return array<string, mixed>
     */
    private function buildUserPayload(string $userId, array $user): array
    {
        $firstName = $user['first_name'];
        $lastName = $user['last_name'];
        $role = $user['role'] ?? 'student';
        $payload = [
            'id' => $userId,
            'name' => trim($firstName.' '.$lastName),
            'role' => $role,
            'phone' => $user['phone'],
            'profile_photo' => null,
            'accessibility_settings' => json_encode([
                'high_contrast' => false,
                'font_size' => 'normal',
            ]),
            'email_verified_at' => now(),
            'password' => Hash::make('Password123!'),
            'updated_at' => now(),
            'created_at' => now(),
        ];

        if (Schema::hasColumn('users', 'is_active')) {
            $payload['is_active'] = $user['is_active'] ?? true;
        }

        if (Schema::hasColumn('users', 'first_name') && Schema::hasColumn('users', 'last_name')) {
            $payload['first_name'] = $firstName;
            $payload['last_name'] = $lastName;
        }

        return $payload;
    }
}
