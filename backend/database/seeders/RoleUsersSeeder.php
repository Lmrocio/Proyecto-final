<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class RoleUsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = [
            [
                'name' => 'Admin OpenClassy',
                'email' => 'admin@openclassy.test',
                'role' => 'admin',
            ],
            [
                'name' => 'Teacher OpenClassy',
                'email' => 'teacher@openclassy.test',
                'role' => 'teacher',
            ],
            [
                'name' => 'Student OpenClassy',
                'email' => 'student@openclassy.test',
                'role' => 'student',
            ],
        ];

        foreach ($users as $data) {
            User::updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'role' => $data['role'],
                    'password' => Hash::make('Password123!'),
                    'phone' => null,
                    'profile_photo' => null,
                    'accessibility_settings' => [
                        'high_contrast' => false,
                        'font_size' => 'normal',
                    ],
                    'email_verified_at' => now(),
                ]
            );
        }
    }
}
