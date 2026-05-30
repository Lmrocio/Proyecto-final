<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Enrollment extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'student_id',
        'course_id',
        'status',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Limita la consulta a las matriculas visibles para el usuario segun su rol:
     * el profesor ve las de sus cursos, el alumno las suyas y el administrador todas.
     */
    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        if ($user->role === 'teacher') {
            return $query->whereHas('course', function (Builder $courseQuery) use ($user): void {
                $courseQuery->where('teacher_id', $user->id);
            });
        }

        if ($user->role === 'student') {
            return $query->where('student_id', $user->id);
        }

        return $query;
    }
}
