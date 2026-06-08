<?php

namespace App\Services;

use App\Models\Assignment;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

class StudentAssignmentService
{
    /**
     * @return Collection<int, Assignment>
     */
    public function forStudent(User $student): Collection
    {
        return Assignment::query()
            ->whereHas('course.students', function ($query) use ($student): void {
                $query
                    ->where('users.id', $student->id)
                    ->where('enrollments.status', 'active');
            })
            ->with([
                'course.teacher:id,name',
                'submissions' => fn ($query) => $query->where('student_id', $student->id),
            ])
            ->orderBy('due_date')
            ->get();
    }
}