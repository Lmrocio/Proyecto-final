<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\SiteConfig;
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

        $this->seedSiteConfig();

        $teacher = User::query()->where('role', 'teacher')->first();

        if (!$teacher) {
            return;
        }

        $courses = [
            [
                'title' => 'General English B1',
                'meeting_link' => 'https://meet.google.com/abc-defg-hij',
                'start_date' => now()->startOfWeek()->toDateString(),
                'end_date' => now()->addMonths(3)->toDateString(),
            ],
            [
                'title' => 'First Certificate Prep',
                'meeting_link' => null,
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

        $this->call([
            StudentDashboardDemoSeeder::class,
        ]);
    }

    private function seedSiteConfig(): void
    {
        $existingConfig = SiteConfig::query()->first();

        if ($existingConfig) {
            if (!$existingConfig->ui_variant) {
                $existingConfig->update([
                    'ui_variant' => 'v1',
                ]);
            }

            return;
        }

        SiteConfig::create([
            'theme_name' => 'openclassy',
            'colors' => [
                'primary' => '#333D29',
                'primary_contrast' => '#EBE2C3',
                'surface' => '#EBE2C3',
                'surface_strong' => '#DBCEA1',
                'text_main' => '#391F08',
                'text_muted' => '#673D17',
                'danger' => '#7F4F24',
                'ok' => '#687E51',
            ],
            'ui_variant' => 'v1',
        ]);
    }
}
