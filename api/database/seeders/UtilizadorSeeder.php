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
        // Limpar dados existentes
        DB::table('utilizadores')->delete();

        // Password hash para 'password'
        $password = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

        $especialidades = [
            'Clínica Geral', 'Cardiologia', 'Pediatria', 'Ortopedia', 
            'Neurologia', 'Ginecologia/Obstetrícia', 'Psiquiatria', 
            'Dermatologia', 'Oftalmologia', 'Otorrinolaringologia', 
            'Gastroenterologia', 'Urologia', 'Pneumologia', 
            'Endocrinologia', 'Oncologia'
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
                'nr_funcionario' => 'ADM001',
                'especialidade' => null,
                'hospital_id' => null,
                'idade' => 45,
                'altura' => null,
                'morada' => 'Sede SNS, Lisboa',
                'descricao' => 'Administrador do Sistema'
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
                'hospital_id' => 1,
                'idade' => 32,
                'altura' => null,
                'morada' => 'Rua das Flores, Ourém',
                'descricao' => 'Secretariado Ourém'
            ],
            // Staff Leiria
            [
                'id' => 3,
                'nome' => 'Sónia Secretaria (Leiria)',
                'email' => 'sonia@tria.pt',
                'password_hash' => $password,
                'role' => 'secretaria',
                'nr_utente' => null,
                'nr_funcionario' => 'SEC002',
                'especialidade' => null,
                'hospital_id' => 2,
                'idade' => 29,
                'altura' => null,
                'morada' => 'Av. Marquês de Pombal, Leiria',
                'descricao' => 'Secretariado Leiria'
            ],
        ];

        // Médicos por Hospital
        $idStart = 10;
        $hospitaisIds = [1, 2, 3]; // Ourém, Leiria, Santarém

        foreach ($hospitaisIds as $hId) {
            foreach ($especialidades as $index => $esp) {
                $slug = strtolower(str_replace(['/', ' '], ['', ''], $esp));
                $hospitalNome = $hId == 1 ? "Ourém" : ($hId == 2 ? "Leiria" : "Santarém");
                
                $users[] = [
                    'id' => $idStart++,
                    'nome' => "Dr(a). " . explode('/', $esp)[0] . " ({$hospitalNome})",
                    'email' => "medico.{$slug}.h{$hId}@tria.pt",
                    'password_hash' => $password,
                    'role' => 'medico',
                    'nr_utente' => null,
                    'nr_funcionario' => "MED" . str_pad($idStart, 3, '0', STR_PAD_LEFT),
                    'especialidade' => $esp,
                    'hospital_id' => $hId,
                    'idade' => rand(30, 65),
                    'altura' => null,
                    'morada' => "Residência Médica {$hospitalNome}",
                    'descricao' => "Especialista em {$esp}"
                ];
            }
        }

        // Utentes (Pacientes)
        $utentes = [
            [
                'id' => 500,
                'nome' => 'Ana Maria Ferreira',
                'email' => 'ana@tria.pt',
                'password_hash' => $password,
                'role' => 'utente',
                'nr_utente' => '111222333',
                'nr_funcionario' => null,
                'especialidade' => null,
                'hospital_id' => null,
                'idade' => 28,
                'altura' => 165,
                'morada' => 'Rua das Camélias, 12, Ourém',
                'descricao' => 'Alergia a Penicilina. Histórico de Hipertensão controlada.'
            ],
            [
                'id' => 501,
                'nome' => 'Tiago André Mendes',
                'email' => 'tiago@tria.pt',
                'password_hash' => $password,
                'role' => 'utente',
                'nr_utente' => '444555666',
                'nr_funcionario' => null,
                'especialidade' => null,
                'hospital_id' => null,
                'idade' => 34,
                'altura' => 182,
                'morada' => 'Av. da Liberdade, 45, Leiria',
                'descricao' => 'Diabetes Tipo 2. Praticante de desporto regular.'
            ],
            [
                'id' => 502,
                'nome' => 'João Paulo Silva',
                'email' => 'joao@tria.pt',
                'password_hash' => $password,
                'role' => 'utente',
                'nr_utente' => '777888999',
                'nr_funcionario' => null,
                'especialidade' => null,
                'hospital_id' => null,
                'idade' => 52,
                'altura' => 175,
                'morada' => 'Rua do Comércio, Santarém',
                'descricao' => 'Fumador. Problemas respiratórios ligeiros no inverno.'
            ],
            [
                'id' => 503,
                'nome' => 'Inês Catarina Rodrigues',
                'email' => 'ines@tria.pt',
                'password_hash' => $password,
                'role' => 'utente',
                'nr_utente' => '999000111',
                'nr_funcionario' => null,
                'especialidade' => null,
                'hospital_id' => null,
                'idade' => 19,
                'altura' => 160,
                'morada' => 'Rua da Universidade, Coimbra',
                'descricao' => 'Asma infantil. Sem medicação atual.'
            ],
            [
                'id' => 504,
                'nome' => 'Marta Sofia Costa',
                'email' => 'marta@tria.pt',
                'password_hash' => $password,
                'role' => 'utente',
                'nr_utente' => '222333444',
                'nr_funcionario' => null,
                'especialidade' => null,
                'hospital_id' => null,
                'idade' => 67,
                'altura' => 158,
                'morada' => 'Largo do Coreto, Tomar',
                'descricao' => 'Osteoporose. Toma suplementação de Cálcio e Vitamina D.'
            ],
            [
                'id' => 505,
                'nome' => 'Ricardo Jorge Santos',
                'email' => 'ricardo@tria.pt',
                'password_hash' => $password,
                'role' => 'utente',
                'nr_utente' => '555666777',
                'nr_funcionario' => null,
                'especialidade' => null,
                'hospital_id' => null,
                'idade' => 42,
                'altura' => 178,
                'morada' => 'Rua Direita, Ourém',
                'descricao' => 'Sem antecedentes clínicos relevantes.'
            ],
        ];

        DB::table('utilizadores')->insert(array_merge($users, $utentes));
    }
}
