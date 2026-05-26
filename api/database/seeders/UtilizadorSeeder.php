<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class UtilizadorSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Password hash para 'password'
        $password = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

        $especialidades = [
            'Clínica Geral', 'Cardiologia', 'Pediatria', 'Ortopedia', 
            'Neurologia', 'Ginecologia/Obstetrícia', 'Psiquiatria', 
            'Traumatologia', 'Dermatologia', 'Oftalmologia', 
            'Otorrinolaringologia', 'Gastroenterologia', 'Urologia', 
            'Pneumologia', 'Endocrinologia', 'Oncologia', 'Nefrologia', 
            'Infeciologia'
        ];

        $users = [
            // Admin
            [
                'id' => 1,
                'nome' => 'Administrador Geral',
                'email' => 'admin@tria.pt',
                'password_hash' => $password,
                'role' => 'admin',
                'nr_utente' => null,
                'nr_funcionario' => null,
                'especialidade' => null,
                'hospital_id' => null
            ],
            // Staff Ourém
            [
                'id' => 2,
                'nome' => 'Carla Secretaria (Ourém)',
                'email' => 'carla@tria.pt',
                'password_hash' => $password,
                'role' => 'secretaria',
                'nr_utente' => null,
                'nr_funcionario' => 'SEC001',
                'especialidade' => null,
                'hospital_id' => 1
            ],
            // Staff Leiria
            [
                'id' => 4,
                'nome' => 'Sónia Secretaria (Leiria)',
                'email' => 'sonia@tria.pt',
                'password_hash' => $password,
                'role' => 'secretaria',
                'nr_utente' => null,
                'nr_funcionario' => 'SEC002',
                'especialidade' => null,
                'hospital_id' => 2
            ],
        ];

        // Criar um médico para cada especialidade em Ourém (Hospital ID 1)
        $idStart = 20;
        foreach ($especialidades as $index => $esp) {
            $slug = strtolower(explode('/', str_replace(' ', '', $esp))[0]);
            $users[] = [
                'id' => $idStart + $index,
                'nome' => "Dr. " . explode('/', $esp)[0] . " (Ourém)",
                'email' => "medico.{$slug}@tria.pt",
                'password_hash' => $password,
                'role' => 'medico',
                'nr_utente' => null,
                'nr_funcionario' => "MED" . str_pad($index + 1, 3, '0', STR_PAD_LEFT),
                'especialidade' => $esp,
                'hospital_id' => 1
            ];
        }

        // Adicionar Utentes
        $users[] = ['id' => 6, 'nome' => 'Ana Ferreira', 'email' => 'ana@tria.pt', 'password_hash' => $password, 'role' => 'utente', 'nr_utente' => '111222333', 'nr_funcionario' => null, 'especialidade' => null, 'hospital_id' => null];
        $users[] = ['id' => 7, 'nome' => 'Tiago Mendes', 'email' => 'tiago@tria.pt', 'password_hash' => $password, 'role' => 'utente', 'nr_utente' => '444555666', 'nr_funcionario' => null, 'especialidade' => null, 'hospital_id' => null];
        $users[] = ['id' => 8, 'nome' => 'João Silva', 'email' => 'joao@tria.pt', 'password_hash' => $password, 'role' => 'utente', 'nr_utente' => '777888999', 'nr_funcionario' => null, 'especialidade' => null, 'hospital_id' => null];
        $users[] = ['id' => 9, 'nome' => 'Inês Rodrigues', 'email' => 'ines@tria.pt', 'password_hash' => $password, 'role' => 'utente', 'nr_utente' => '999000111', 'nr_funcionario' => null, 'especialidade' => null, 'hospital_id' => null];
        $users[] = ['id' => 10, 'nome' => 'Marta Costa', 'email' => 'marta@tria.pt', 'password_hash' => $password, 'role' => 'utente', 'nr_utente' => '222333444', 'nr_funcionario' => null, 'especialidade' => null, 'hospital_id' => null];

        DB::table('utilizadores')->insert($users);
    }
}
