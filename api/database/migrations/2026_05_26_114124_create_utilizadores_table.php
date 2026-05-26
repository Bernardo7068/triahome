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
        Schema::create('utilizadores', function (Blueprint $table) {
            $table->id();
            $table->string('nome');
            $table->string('email')->unique();
            $table->string('password_hash');
            $table->string('role');
            $table->string('nr_utente')->unique()->nullable();
            $table->string('nr_funcionario')->unique()->nullable();
            $table->string('especialidade')->nullable();
            $table->foreignId('hospital_id')->nullable()->constrained('hospitais')->nullOnDelete();
            $table->boolean('ativo')->default(true);
            $table->dateTime('criado_em')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('utilizadores');
    }
};
