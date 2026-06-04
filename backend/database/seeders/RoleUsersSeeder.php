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
                'first_name' => 'Admin',
                'last_name' => 'OpenClassy',
                'email' => 'admin@openclassy.test',
                'role' => 'admin',
            ],
            [
                'first_name' => 'Teacher',
                'last_name' => 'OpenClassy',
                'email' => 'teacher@openclassy.test',
                'role' => 'teacher',
            ],
            [
                'first_name' => 'Student',
                'last_name' => 'OpenClassy',
                'email' => 'student@openclassy.test',
                'role' => 'student',
            ],
        ];

        foreach ($users as $data) {
            User::updateOrCreate(
                ['email' => $data['email']],
                [
                    'first_name' => $data['first_name'],
                    'last_name' => $data['last_name'],
                    'name' => trim($data['first_name'].' '.$data['last_name']),
                    'role' => $data['role'],
                    'is_active' => true,
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
