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
        Schema::create('consultas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('triagem_id')->unique()->constrained('triagens')->cascadeOnDelete();
            $table->foreignId('medico_id')->nullable()->constrained('utilizadores')->nullOnDelete();
            $table->foreignId('utente_id')->nullable()->constrained('utilizadores')->nullOnDelete();
            $table->foreignId('hospital_id')->nullable()->constrained('hospitais');
            $table->text('diagnostico')->nullable();
            $table->text('prescricao')->nullable();
            $table->dateTime('data_consulta')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('consultas');
    }
};
