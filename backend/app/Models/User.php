<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, HasUuids, Notifiable;

    public $incrementing = false;

    protected $keyType = 'string';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'first_name',
        'last_name',
        'name',
        'email',
        'role',
        'is_active',
        'accessibility_settings',
        'profile_photo',
        'phone',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'accessibility_settings' => 'array',
            'is_active' => 'boolean',
            'password' => 'hashed',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (self $user): void {
            if (!self::hasActiveStatusColumn()) {
                unset($user->attributes['is_active']);
            }

            [$firstName, $lastName] = self::normalizeNameParts(
                $user->first_name,
                $user->last_name,
                $user->name,
            );

            if (!self::hasSplitNameColumns()) {
                $user->name = trim($firstName.' '.$lastName);
                unset($user->attributes['first_name'], $user->attributes['last_name']);

                return;
            }

            $user->first_name = $firstName;
            $user->last_name = $lastName;
            $user->name = trim($firstName.' '.$lastName);
        });
    }

    private static function hasSplitNameColumns(): bool
    {
        return Schema::hasColumn('users', 'first_name') && Schema::hasColumn('users', 'last_name');
    }

    private static function hasActiveStatusColumn(): bool
    {
        return Schema::hasColumn('users', 'is_active');
    }

    /**
     * @return array{0:string,1:string}
     */
    private static function normalizeNameParts(mixed $firstName, mixed $lastName, mixed $fullName): array
    {
        $normalizedFirstName = trim((string) ($firstName ?? ''));
        $normalizedLastName = trim((string) ($lastName ?? ''));

        if ($normalizedFirstName === '' && $normalizedLastName === '') {
            return self::splitFullName((string) ($fullName ?? ''));
        }

        return [$normalizedFirstName, $normalizedLastName];
    }

    /**
     * @return array{0:string,1:string}
     */
    private static function splitFullName(string $fullName): array
    {
        $normalizedFullName = trim((string) preg_replace('/\s+/', ' ', $fullName));

        if ($normalizedFullName === '') {
            return ['', ''];
        }

        $parts = explode(' ', $normalizedFullName, 2);

        return [$parts[0], $parts[1] ?? ''];
    }

    public function getFullNameAttribute(): string
    {
        return trim(($this->first_name ?? '').' '.($this->last_name ?? ''));
    }

    public function taughtCourses(): HasMany
    {
        return $this->hasMany(Course::class, 'teacher_id');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class, 'student_id');
    }

    public function courses(): BelongsToMany
    {
        return $this->belongsToMany(Course::class, 'enrollments', 'student_id', 'course_id')
            ->withPivot('status')
            ->withTimestamps();
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(Submission::class, 'student_id');
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    public function sentMessages(): HasMany
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    public function receivedMessages(): BelongsToMany
    {
        return $this->belongsToMany(Message::class, 'message_recipient', 'recipient_id', 'message_id')
            ->withPivot('is_read', 'read_at')
            ->withTimestamps();
    }
}
