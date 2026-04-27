<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RoleUsersSeeder::class,
        ]);

        $teacher = User::query()->where('role', 'teacher')->first();

        if (!$teacher) {
            return;
        }

        $courses = [
            [
                'title' => 'General English B1',
                'meeting_link' => 'https://meet.example.com/general-english-b1',
                'start_date' => now()->startOfWeek()->toDateString(),
                'end_date' => now()->addMonths(3)->toDateString(),
            ],
            [
                'title' => 'First Certificate Prep',
                'meeting_link' => 'https://meet.example.com/fce-prep',
                'start_date' => now()->addWeek()->toDateString(),
                'end_date' => now()->addMonths(4)->toDateString(),
            ],
            [
                'title' => 'Business English',
                'meeting_link' => 'https://meet.example.com/business-english',
                'start_date' => now()->addDays(10)->toDateString(),
                'end_date' => now()->addMonths(2)->toDateString(),
            ],
        ];

        foreach ($courses as $courseData) {
            Course::query()->updateOrCreate(
                ['title' => $courseData['title']],
                $courseData + [
                    'teacher_id' => $teacher->id,
                    'bonus_id' => null,
                ]
            );
        }
    }
}
