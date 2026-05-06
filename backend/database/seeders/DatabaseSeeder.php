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
                'primary' => '#0f766e',
                'primary_contrast' => '#ecfeff',
                'surface' => '#f8fafc',
                'surface_strong' => '#ffffff',
                'text_main' => '#0f172a',
                'text_muted' => '#475569',
                'danger' => '#b91c1c',
                'ok' => '#166534',
            ],
            'ui_variant' => 'v1',
        ]);
    }
}
