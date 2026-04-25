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
            $table->string('guest_email');
            $table->text('writing_text');
            $table->enum('result_mcer', ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])->nullable();
            $table->jsonb('ai_analysis')->nullable();
            $table->timestamps();

            $table->index(['guest_email', 'result_mcer']);
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
