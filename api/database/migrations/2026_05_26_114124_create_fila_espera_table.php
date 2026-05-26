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
        Schema::create('fila_espera', function (Blueprint $table) {
            $table->id();
            $table->foreignId('triagem_id')->unique()->constrained('triagens')->cascadeOnDelete();
            $table->foreignId('hospital_id')->constrained('hospitais')->cascadeOnDelete();
            $table->integer('posicao');
            $table->string('estado')->default('aguardar');
            $table->dateTime('criado_em')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fila_espera');
    }
};
