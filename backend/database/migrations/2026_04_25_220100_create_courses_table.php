<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('courses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->foreignUuid('teacher_id')->constrained('users')->cascadeOnDelete();
            $table->string('meeting_link')->nullable();
            $table->date('start_date');
            $table->date('end_date');
            $table->foreignUuid('bonus_id')->nullable()->constrained('bonuses')->nullOnDelete();
            $table->timestamps();

            $table->index(['teacher_id', 'start_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('courses');
    }
};
