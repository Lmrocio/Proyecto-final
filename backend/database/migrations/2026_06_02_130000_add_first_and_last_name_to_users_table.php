<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public $withinTransaction = false;

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $addFirstName = !Schema::hasColumn('users', 'first_name');
        $addLastName = !Schema::hasColumn('users', 'last_name');

        if ($addFirstName || $addLastName) {
            Schema::table('users', function (Blueprint $table): void {
                if (!Schema::hasColumn('users', 'first_name')) {
                    $table->string('first_name')->default('');
                }

                if (!Schema::hasColumn('users', 'last_name')) {
                    $table->string('last_name')->default('');
                }
            });
        }

        if (!Schema::hasIndex('users', ['last_name', 'first_name'])) {
            Schema::table('users', function (Blueprint $table): void {
                $table->index(['last_name', 'first_name']);
            });
        }

        DB::table('users')
            ->select(['id', 'name'])
            ->orderBy('id')
            ->get()
            ->each(function (object $user): void {
                $fullName = trim((string) ($user->name ?? ''));
                if ($fullName === '') {
                    return;
                }

                $parts = preg_split('/\s+/', $fullName, 2) ?: [];
                $firstName = trim((string) ($parts[0] ?? ''));
                $lastName = trim((string) ($parts[1] ?? ''));

                DB::table('users')
                    ->where('id', $user->id)
                    ->update([
                        'first_name' => $firstName,
                        'last_name' => $lastName,
                    ]);
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasIndex('users', ['last_name', 'first_name'])) {
            Schema::table('users', function (Blueprint $table): void {
                $table->dropIndex(['last_name', 'first_name']);
            });
        }

        Schema::table('users', function (Blueprint $table): void {
            if (Schema::hasColumn('users', 'first_name')) {
                $table->dropColumn('first_name');
            }

            if (Schema::hasColumn('users', 'last_name')) {
                $table->dropColumn('last_name');
            }
        });
    }
};
