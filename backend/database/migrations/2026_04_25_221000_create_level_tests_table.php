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
        Schema::create('level_tests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('guest_email')->nullable();
            $table->date('test_date')->nullable();
            $table->unsignedTinyInteger('score')->nullable();
            $table->enum('suggested_level', ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])->nullable();
            $table->foreignUuid('evaluator_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('comments')->nullable();
            $table->text('writing_text')->nullable();
            $table->jsonb('ai_analysis')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'suggested_level', 'test_date']);
            $table->index('guest_email');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('level_tests');
    }
};
