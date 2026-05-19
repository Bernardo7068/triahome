<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        DB::table('utilizadores')->updateOrInsert(
            ['email' => 'admin@tria.pt'],
            [
                'nome' => 'Administrador Geral',
                'password_hash' => bcrypt('password'),
                'role' => 'admin',
            ]
        );

        $this->call(ConsultasHistoricasSeeder::class);
    }
}
