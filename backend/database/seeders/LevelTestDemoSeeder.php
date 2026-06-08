<?php

namespace Database\Seeders;

use App\Models\LevelTest;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class LevelTestDemoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $obsoleteDemoEmails = [
            'rocio.llorente@example.com',
            'francisco.martin@example.com',
            'mariana.costa@example.com',
            'alejandro.serrano@example.com',
            'bianca.romero@example.com',
            'carlos.benitez@example.com',
            'diana.prieto@example.com',
            'oliver.hayes@example.com',
            'sophia.wilson@example.com',
            'liam.turner@example.com',
            'mia.santos@example.com',
            'noah.clarke@example.com',
            'patricia.green@example.com',
            'kelly.white@example.com',
            'nicolas.vidal@example.com',
        ];

        LevelTest::query()->whereIn('guest_email', $obsoleteDemoEmails)->delete();
        DB::table('users')->whereIn('email', $obsoleteDemoEmails)->delete();

        $records = [
            ['name' => 'Rocio Garcia Lopez', 'email' => 'rocio.garcia@openclassy.test', 'level' => 'B1', 'score' => 24, 'topic' => 'Summer intensive course', 'date' => now()->subHours(1)],
            ['name' => 'Francisco Martinez Perez', 'email' => 'francisco.martinez@openclassy.test', 'level' => 'A1', 'score' => 8, 'topic' => 'First conversation goals', 'date' => now()->subHours(2)],
            ['name' => 'Mariana Hernandez Sanchez', 'email' => 'mariana.hernandez@openclassy.test', 'level' => 'A2', 'score' => 17, 'topic' => 'Business travel', 'date' => now()->subDays(2)],
            ['name' => 'Alejandro Fernandez Diaz', 'email' => 'alejandro.fernandez@openclassy.test', 'level' => 'B2', 'score' => 31, 'topic' => 'TOEFL preparation', 'date' => now()->subDays(3)],
            ['name' => 'Bianca Gonzalez Romero', 'email' => 'bianca.gonzalez@openclassy.test', 'level' => 'A1', 'score' => 7, 'topic' => 'English for beginners', 'date' => now()->subDays(4)],
            ['name' => 'Carlos Ramirez Torres', 'email' => 'carlos.ramirez@openclassy.test', 'level' => 'C1', 'score' => 36, 'topic' => 'Academic English', 'date' => now()->subDays(5)],
            ['name' => 'Diana Cruz Morales', 'email' => 'diana.cruz@openclassy.test', 'level' => 'C2', 'score' => 39, 'topic' => 'Pronunciation coaching', 'date' => now()->subDays(6)],
            ['name' => 'Oliver Jimenez Castillo', 'email' => 'oliver.jimenez@openclassy.test', 'level' => 'B1', 'score' => 26, 'topic' => 'Travel English', 'date' => now()->subDays(7)],
            ['name' => 'Sophia Vasquez Mendoza', 'email' => 'sophia.vasquez@openclassy.test', 'level' => 'B2', 'score' => 30, 'topic' => 'English at work', 'date' => now()->subDays(8)],
            ['name' => 'Liam Moreno Ortega', 'email' => 'liam.moreno@openclassy.test', 'level' => 'A2', 'score' => 16, 'topic' => 'Conversational English', 'date' => now()->subDays(9)],
        ];

        foreach ($records as $record) {
            [$firstName, $lastName] = explode(' ', $record['name'], 2);

            $userId = DB::table('users')->where('email', $record['email'])->value('id');

            if (!$userId) {
                $userId = (string) Str::uuid();
            }

            $userData = [
                'id' => $userId,
                'name' => $record['name'],
                'email' => $record['email'],
                'role' => 'student',
                'password' => Hash::make('Password123!'),
                'phone' => null,
                'profile_photo' => null,
                'accessibility_settings' => json_encode([
                    'high_contrast' => false,
                    'font_size' => 'normal',
                ]),
                'email_verified_at' => now(),
                'updated_at' => now(),
                'created_at' => now(),
            ];

            if (Schema::hasColumn('users', 'first_name') && Schema::hasColumn('users', 'last_name')) {
                $userData['first_name'] = $firstName;
                $userData['last_name'] = $lastName;
            }

            if (Schema::hasColumn('users', 'is_active')) {
                $userData['is_active'] = true;
            }

            if (!DB::table('users')->where('email', $record['email'])->exists()) {
                DB::table('users')->insert($userData);
            }

            $levelTest = LevelTest::query()->updateOrCreate(
                ['guest_email' => $record['email']],
                [
                    'user_id' => $userId,
                    'topic' => $record['topic'],
                    'test_date' => $record['date']->toDateString(),
                    'score' => $record['score'],
                    'suggested_level' => $record['level'],
                    'comments' => 'Registro demo para validar el dashboard administrativo.',
                    'writing_text' => 'This seeded essay text is long enough to represent a real level test submission for the admin dashboard layout.',
                    'ai_analysis' => [
                        'cefr_level' => $record['level'],
                        'total_score' => $record['score'],
                    ],
                ]
            );

            $levelTest->forceFill([
                'created_at' => $record['date'],
                'updated_at' => $record['date'],
            ])->save();
        }
    }
}