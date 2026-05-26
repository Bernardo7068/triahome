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
        Schema::create('auditoria_acessos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('utilizadores')->cascadeOnDelete();
            $table->string('acao'); // Ex: 'acessou_relatorio', 'editou_utente', 'exportou_dados'
            $table->string('detalhes')->nullable(); // Ex: 'Utente ID #45', 'Consulta #12'
            $table->string('ip_address')->nullable();
            $table->dateTime('criado_em')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('auditoria_acessos');
    }
};
