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
        DB::table('hospitais')->insert([
            ['id' => 1, 'nome' => 'Hospital de Ourém', 'morada' => 'Rua da Saúde, 123', 'cidade' => 'Ourém', 'telefone' => '249111222'],
            ['id' => 2, 'nome' => 'Hospital de Leiria', 'morada' => 'Perto do Estádio, s/n', 'cidade' => 'Leiria', 'telefone' => '244333444'],
            ['id' => 3, 'nome' => 'Hospital de Santarém', 'morada' => 'Av. Central, 50', 'cidade' => 'Santarém', 'telefone' => '243555666'],
        ]);
    }
}
