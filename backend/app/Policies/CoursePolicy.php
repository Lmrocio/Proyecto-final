<?php

namespace App\Policies;

use App\Models\Course;
use App\Models\User;

class CoursePolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'teacher', 'student'], true);
    }

    public function view(User $user, Course $course): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        if ($user->role === 'teacher') {
            return $course->teacher_id === $user->id;
        }

        return $course->enrollments()
            ->where('student_id', $user->id)
            ->where('status', 'active')
            ->exists();
    }

    public function create(User $user): bool
    {
        return $user->role === 'admin';
    }

    public function update(User $user, Course $course): bool
    {
        return $user->role === 'admin' || ($user->role === 'teacher' && $course->teacher_id === $user->id);
    }

    public function delete(User $user, Course $course): bool
    {
        return $user->role === 'admin';
    }
}
