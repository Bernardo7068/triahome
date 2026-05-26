<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TriagemSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Inserir Triagens
        DB::table('triagens')->insert([
            // Ourém
            ['id' => 1, 'utente_id' => 6, 'hospital_id' => 1, 'cor_manchester' => 'amarelo', 'nivel_prioridade' => 3, 'resumo_ia' => 'Gripe forte e febre persistente.', 'estado' => 'pendente'],
            ['id' => 2, 'utente_id' => 7, 'hospital_id' => 1, 'cor_manchester' => 'verde', 'nivel_prioridade' => 4, 'resumo_ia' => 'Dor no joelho após exercício.', 'estado' => 'checkin_feito'],
            ['id' => 3, 'utente_id' => 8, 'hospital_id' => 1, 'cor_manchester' => 'laranja', 'nivel_prioridade' => 2, 'resumo_ia' => 'Dificuldade respiratória e dor no peito.', 'estado' => 'em_espera'],
            // Leiria
            ['id' => 4, 'utente_id' => 9, 'hospital_id' => 2, 'cor_manchester' => 'vermelho', 'nivel_prioridade' => 1, 'resumo_ia' => 'Paragem cardiorrespiratória iminente.', 'estado' => 'pendente'],
            ['id' => 5, 'utente_id' => 10, 'hospital_id' => 2, 'cor_manchester' => 'amarelo', 'nivel_prioridade' => 3, 'resumo_ia' => 'Possível fratura no braço.', 'estado' => 'em_espera'],
        ]);

        // 2. Inserir na Fila de Espera (apenas quem está em_espera ou checkin_feito)
        DB::table('fila_espera')->insert([
            ['triagem_id' => 3, 'hospital_id' => 1, 'posicao' => 1, 'estado' => 'aguardar'],
            ['triagem_id' => 5, 'hospital_id' => 2, 'posicao' => 1, 'estado' => 'aguardar'],
        ]);
    }
}
