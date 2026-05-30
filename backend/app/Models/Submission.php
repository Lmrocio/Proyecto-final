<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Submission extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'assignment_id',
        'student_id',
        'content',
        'file_path',
        'grade',
        'teacher_feedback',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'grade' => 'decimal:2',
        ];
    }

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(Assignment::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    /**
     * Limita la consulta a las entregas visibles para el usuario segun su rol:
     * el profesor las de los cursos que imparte, el alumno las suyas y el
     * administrador todas.
     */
    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        if ($user->role === 'teacher') {
            return $query->whereHas('assignment.course', function (Builder $courseQuery) use ($user): void {
                $courseQuery->where('teacher_id', $user->id);
            });
        }

        if ($user->role === 'student') {
            return $query->where('student_id', $user->id);
        }

        return $query;
    }
}
