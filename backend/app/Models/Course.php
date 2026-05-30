<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Course extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'title',
        'teacher_id',
        'meeting_link',
        'start_date',
        'end_date',
        'bonus_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
        ];
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function bonus(): BelongsTo
    {
        return $this->belongsTo(Bonus::class);
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    public function students(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'enrollments', 'course_id', 'student_id')
            ->withPivot('status')
            ->withTimestamps();
    }

    public function materials(): HasMany
    {
        return $this->hasMany(Material::class);
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(Assignment::class);
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    /**
     * Limita la consulta a los cursos visibles para el usuario segun su rol:
     * el profesor ve los suyos, el alumno los que tiene matriculados y activos,
     * y el administrador todos.
     */
    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        if ($user->role === 'teacher') {
            return $query->where('teacher_id', $user->id);
        }

        if ($user->role === 'student') {
            return $query->whereHas('enrollments', function (Builder $enrollmentQuery) use ($user): void {
                $enrollmentQuery
                    ->where('student_id', $user->id)
                    ->where('status', 'active');
            });
        }

        return $query;
    }
}
