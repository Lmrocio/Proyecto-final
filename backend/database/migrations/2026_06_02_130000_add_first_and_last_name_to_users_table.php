<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('first_name')->default('')->after('id');
            $table->string('last_name')->default('')->after('first_name');
            $table->index(['last_name', 'first_name']);
        });

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
        Schema::table('users', function (Blueprint $table): void {
            $table->dropIndex(['last_name', 'first_name']);
            $table->dropColumn(['first_name', 'last_name']);
        });
    }
};
