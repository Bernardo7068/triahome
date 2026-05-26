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
        Schema::create('triagens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('utente_id')->constrained('utilizadores')->cascadeOnDelete();
            $table->foreignId('hospital_id')->constrained('hospitais')->cascadeOnDelete();
            $table->string('cor_manchester')->nullable();
            $table->integer('nivel_prioridade')->nullable();
            $table->text('resumo_ia')->nullable();
            $table->string('especialidade')->nullable();
            $table->text('conselhos_autocuidado')->nullable();
            $table->string('estado')->default('pendente');
            $table->dateTime('criado_em')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('triagens');
    }
};
