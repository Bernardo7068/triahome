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
        Schema::create('hospitais', function (Blueprint $table) {
            $table->id();
            $table->string('nome');
            $table->string('morada');
            $table->string('cidade');
            $table->string('telefone')->nullable();
            $table->integer('capacidade_urgencia')->default(50);
            $table->integer('lotacao_atual')->default(0);
            $table->dateTime('criado_em')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hospitais');
    }
};
