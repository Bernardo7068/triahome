<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("DROP VIEW IF EXISTS v_painel_medico");
        DB::statement("
            CREATE VIEW v_painel_medico AS
            SELECT 
                t.id AS triagem_id,
                t.hospital_id,
                t.utente_id,
                u.nome AS nome_utente,
                t.cor_manchester,
                t.nivel_prioridade,
                t.resumo_ia,
                t.especialidade,
                t.estado AS estado_triagem,
                f.estado AS estado_fila,
                f.posicao
            FROM triagens t
            JOIN utilizadores u ON t.utente_id = u.id
            LEFT JOIN fila_espera f ON t.id = f.triagem_id
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("DROP VIEW IF EXISTS v_painel_medico");
    }
};
