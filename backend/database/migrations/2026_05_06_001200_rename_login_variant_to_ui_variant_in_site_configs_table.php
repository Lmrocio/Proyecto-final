<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('site_configs', 'ui_variant')) {
            return;
        }

        Schema::table('site_configs', function (Blueprint $table) {
            if (Schema::hasColumn('site_configs', 'login_variant')) {
                $table->renameColumn('login_variant', 'ui_variant');
                return;
            }

            $table->string('ui_variant')->default('v1');
        });
    }

    public function down(): void
    {
        if (Schema::hasColumn('site_configs', 'login_variant')) {
            return;
        }

        Schema::table('site_configs', function (Blueprint $table) {
            if (Schema::hasColumn('site_configs', 'ui_variant')) {
                $table->renameColumn('ui_variant', 'login_variant');
            }
        });
    }
};
