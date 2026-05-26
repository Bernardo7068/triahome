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
        // Limpar dados existentes
        DB::table('fila_espera')->delete();
        DB::table('triagens')->delete();

        // Utentes IDs: 500, 501, 502, 503, 504, 505
        // Hospitais IDs: 1 (Ourém), 2 (Leiria), 3 (Santarém)

        $triagens = [
            // Ourém (H1)
            ['utente_id' => 500, 'hospital_id' => 1, 'cor_manchester' => 'amarelo', 'nivel_prioridade' => 3, 'resumo_ia' => 'Gripe forte e febre persistente.', 'estado' => 'pendente', 'criado_em' => now()->subMinutes(30)],
            ['utente_id' => 501, 'hospital_id' => 1, 'cor_manchester' => 'verde', 'nivel_prioridade' => 4, 'resumo_ia' => 'Dor no joelho após exercício.', 'estado' => 'checkin_feito', 'criado_em' => now()->subMinutes(45)],
            ['utente_id' => 502, 'hospital_id' => 1, 'cor_manchester' => 'laranja', 'nivel_prioridade' => 2, 'resumo_ia' => 'Dificuldade respiratória e dor no peito.', 'estado' => 'em_espera', 'criado_em' => now()->subMinutes(60)],
            ['utente_id' => 503, 'hospital_id' => 1, 'cor_manchester' => 'vermelho', 'nivel_prioridade' => 1, 'resumo_ia' => 'Suspeita de AVC, dormência no braço esquerdo.', 'estado' => 'em_espera', 'criado_em' => now()->subMinutes(10)],

            // Leiria (H2)
            ['utente_id' => 504, 'hospital_id' => 2, 'cor_manchester' => 'vermelho', 'nivel_prioridade' => 1, 'resumo_ia' => 'Paragem cardiorrespiratória iminente.', 'estado' => 'pendente', 'criado_em' => now()->subMinutes(5)],
            ['utente_id' => 505, 'hospital_id' => 2, 'cor_manchester' => 'amarelo', 'nivel_prioridade' => 3, 'resumo_ia' => 'Possível fratura no braço.', 'estado' => 'em_espera', 'criado_em' => now()->subMinutes(20)],
            ['utente_id' => 500, 'hospital_id' => 2, 'cor_manchester' => 'verde', 'nivel_prioridade' => 4, 'resumo_ia' => 'Picada de inseto com inchaço local.', 'estado' => 'checkin_feito', 'criado_em' => now()->subMinutes(15)],
            
            // Santarém (H3)
            ['utente_id' => 501, 'hospital_id' => 3, 'cor_manchester' => 'laranja', 'nivel_prioridade' => 2, 'resumo_ia' => 'Queimadura de 2º grau na mão.', 'estado' => 'em_espera', 'criado_em' => now()->subMinutes(120)],
            ['utente_id' => 502, 'hospital_id' => 3, 'cor_manchester' => 'amarelo', 'nivel_prioridade' => 3, 'resumo_ia' => 'Dor lombar aguda incapacitante.', 'estado' => 'pendente', 'criado_em' => now()->subMinutes(10)],
        ];

        foreach ($triagens as $t) {
            $id = DB::table('triagens')->insertGetId($t);
            
            // Inserir na Fila de Espera (quem está em_espera ou checkin_feito)
            if (in_array($t['estado'], ['em_espera', 'checkin_feito'])) {
                DB::table('fila_espera')->insert([
                    'triagem_id' => $id,
                    'hospital_id' => $t['hospital_id'],
                    'posicao' => DB::table('fila_espera')->where('hospital_id', $t['hospital_id'])->count() + 1,
                    'estado' => 'aguardar'
                ]);
            }
        }
    }
}
