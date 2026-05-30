<?php

namespace App\Policies;

use App\Models\Enrollment;
use App\Models\User;

class EnrollmentPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'teacher', 'student'], true);
    }

    public function view(User $user, Enrollment $enrollment): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        if ($user->role === 'teacher') {
            return $enrollment->course()->where('teacher_id', $user->id)->exists();
        }

        return $enrollment->student_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->role === 'admin';
    }

    public function update(User $user, Enrollment $enrollment): bool
    {
        return $user->role === 'admin';
    }

    public function delete(User $user, Enrollment $enrollment): bool
    {
        return $user->role === 'admin';
    }
}
