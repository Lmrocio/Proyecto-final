<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public $withinTransaction = false;

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasColumn('courses', 'description') || !Schema::hasColumn('courses', 'schedule')) {
            Schema::table('courses', function (Blueprint $table): void {
                if (!Schema::hasColumn('courses', 'description')) {
                    $table->text('description')->nullable();
                }

                if (!Schema::hasColumn('courses', 'schedule')) {
                    $table->string('schedule')->nullable();
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table): void {
            if (Schema::hasColumn('courses', 'description')) {
                $table->dropColumn('description');
            }

            if (Schema::hasColumn('courses', 'schedule')) {
                $table->dropColumn('schedule');
            }
        });
    }
};
