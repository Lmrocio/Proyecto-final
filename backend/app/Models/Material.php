<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Material extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'course_id',
        'title',
        'unit_name',
        'type',
        'path',
        'size',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'size' => 'integer',
        ];
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Limita la consulta a los materiales visibles para el usuario segun su rol:
     * el profesor los de sus cursos, el alumno los de los cursos en los que esta
     * matriculado y activo, y el administrador todos.
     */
    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        if ($user->role === 'teacher') {
            return $query->whereHas('course', function (Builder $courseQuery) use ($user): void {
                $courseQuery->where('teacher_id', $user->id);
            });
        }

        if ($user->role === 'student') {
            return $query->whereHas('course.enrollments', function (Builder $enrollmentQuery) use ($user): void {
                $enrollmentQuery
                    ->where('student_id', $user->id)
                    ->where('status', 'active');
            });
        }

        return $query;
    }
}
