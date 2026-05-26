<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class HospitalSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Limpar dados existentes para evitar duplicados se correres o seeder várias vezes
        DB::table('hospitais')->delete();

        DB::table('hospitais')->insert([
            [
                'id' => 1, 
                'nome' => 'Hospital de Ourém', 
                'morada' => 'Rua da Saúde, 123', 
                'cidade' => 'Ourém', 
                'telefone' => '249111222',
                'capacidade_urgencia' => 50
            ],
            [
                'id' => 2, 
                'nome' => 'Hospital de Leiria', 
                'morada' => 'Perto do Estádio, s/n', 
                'cidade' => 'Leiria', 
                'telefone' => '244333444',
                'capacidade_urgencia' => 120
            ],
            [
                'id' => 3, 
                'nome' => 'Hospital de Santarém', 
                'morada' => 'Av. Central, 50', 
                'cidade' => 'Santarém', 
                'telefone' => '243555666',
                'capacidade_urgencia' => 80
            ],
            [
                'id' => 4, 
                'nome' => 'Hospital de Coimbra', 
                'morada' => 'Rua Larga, UC', 
                'cidade' => 'Coimbra', 
                'telefone' => '239444555',
                'capacidade_urgencia' => 200
            ],
            [
                'id' => 5, 
                'nome' => 'Hospital de Tomar', 
                'morada' => 'Alameda do Convento, 10', 
                'cidade' => 'Tomar', 
                'telefone' => '249321654',
                'capacidade_urgencia' => 40
            ],
        ]);
    }
}
