<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE materials DROP CONSTRAINT IF EXISTS materials_type_check');
            DB::statement("ALTER TABLE materials ADD CONSTRAINT materials_type_check CHECK (type IN ('file', 'link', 'video', 'audio'))");
            return;
        }

        Schema::table('materials', function (Blueprint $table) {
            $table->enum('type', ['file', 'link', 'video', 'audio'])->change();
        });
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::table('materials')->where('type', 'audio')->update(['type' => 'video']);
            DB::statement('ALTER TABLE materials DROP CONSTRAINT IF EXISTS materials_type_check');
            DB::statement("ALTER TABLE materials ADD CONSTRAINT materials_type_check CHECK (type IN ('file', 'link', 'video'))");
            return;
        }

        Schema::table('materials', function (Blueprint $table) {
            $table->enum('type', ['file', 'link', 'video'])->change();
        });
    }
};
