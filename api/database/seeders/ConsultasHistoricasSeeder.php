<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class ConsultasHistoricasSeeder extends Seeder
{
    public function run(): void
    {
        $targetTotal = 60;
        $existingTotal = DB::table('consultas')->count();
        $toCreate = $targetTotal - $existingTotal;

        if ($toCreate <= 0) {
            return;
        }

        DB::table('hospitais')->updateOrInsert(
            ['id' => 2],
            [
                'nome' => 'Hospital de Leiria',
                'morada' => 'Rua da Saude, 45',
                'cidade' => 'Leiria',
                'telefone' => '244333444',
            ]
        );

        DB::table('hospitais')->updateOrInsert(
            ['id' => 3],
            [
                'nome' => 'Hospital de Santarem',
                'morada' => 'Avenida Central, 50',
                'cidade' => 'Santarem',
                'telefone' => '243555666',
            ]
        );

        DB::table('utilizadores')->updateOrInsert(
            ['email' => 'helena@tria.pt'],
            [
                'nome' => 'Dra. Helena',
                'password_hash' => bcrypt('password'),
                'role' => 'medico',
                'nr_funcionario' => 'MED002',
                'especialidade' => 'Traumatologia',
                'hospital_id' => 2,
            ]
        );

        DB::table('utilizadores')->updateOrInsert(
            ['email' => 'rui@tria.pt'],
            [
                'nome' => 'Dr. Rui',
                'password_hash' => bcrypt('password'),
                'role' => 'medico',
                'nr_funcionario' => 'MED003',
                'especialidade' => 'Medicina Interna',
                'hospital_id' => 3,
            ]
        );

        $cases = [
            [
                'cor_manchester' => 'vermelho',
                'nivel_prioridade' => 1,
                'resumo_ia' => 'Dor toracica intensa, sudorese fria e dispneia sugerem sindrome coronaria aguda.',
                'diagnostico' => 'Sindroma coronaria aguda',
                'prescricao' => 'ECG imediato, troponinas, oxigenoterapia e observacao em urgencia.',
            ],
            [
                'cor_manchester' => 'laranja',
                'nivel_prioridade' => 2,
                'resumo_ia' => 'Febre alta com tosse produtiva e saturacao reduzida apontam para infeccao respiratoria relevante.',
                'diagnostico' => 'Pneumonia comunitaria',
                'prescricao' => 'Antibiotico empirico, radiografia toracica e controlo clinico em 48 horas.',
            ],
            [
                'cor_manchester' => 'amarelo',
                'nivel_prioridade' => 3,
                'resumo_ia' => 'Dor abdominal recorrente sem sinais de choque, necessita avaliacao medica e exames complementares.',
                'diagnostico' => 'Dor abdominal inespecifica',
                'prescricao' => 'Analgesia, dieta ligeira e reavaliacao se surgirem sinais de alarme.',
            ],
            [
                'cor_manchester' => 'verde',
                'nivel_prioridade' => 4,
                'resumo_ia' => 'Entorse do tornozelo apos queda, sem deformidade aparente nem deficits neurovasculares.',
                'diagnostico' => 'Entorse do tornozelo',
                'prescricao' => 'Repouso, gelo, compressao, elevacao e antiinflamatorio se necessario.',
            ],
            [
                'cor_manchester' => 'azul',
                'nivel_prioridade' => 5,
                'resumo_ia' => 'Queixas ligeiras de dor lombar sem irradiacao, compativeis com quadro de baixa prioridade.',
                'diagnostico' => 'Lombalgia mecanica',
                'prescricao' => 'Paracetamol, alongamentos suaves e sinais de alarme explicados ao utente.',
            ],
            [
                'cor_manchester' => 'amarelo',
                'nivel_prioridade' => 3,
                'resumo_ia' => 'Cefaleia intensa com nauseas, mas sem perda de consciencia ou deficit focal.',
                'diagnostico' => 'Enxaqueca',
                'prescricao' => 'Hidratacao, analgesia e antiemetico se necessario.',
            ],
            [
                'cor_manchester' => 'laranja',
                'nivel_prioridade' => 2,
                'resumo_ia' => 'Dispneia progressiva em doente com antecedentes de asma sugere exacerbacao moderada.',
                'diagnostico' => 'Exacerbacao de asma',
                'prescricao' => 'Broncodilatador inalado, corticoide e observacao clinica.',
            ],
            [
                'cor_manchester' => 'verde',
                'nivel_prioridade' => 4,
                'resumo_ia' => 'Sintomas urinarios discretos e sem febre, compativeis com infeccao urinaria simples.',
                'diagnostico' => 'Infeccao urinaria nao complicada',
                'prescricao' => 'Hidratacao, antibiotico oral e repeticao de urina se persistir.',
            ],
            [
                'cor_manchester' => 'vermelho',
                'nivel_prioridade' => 1,
                'resumo_ia' => 'Alteracao do estado de consciencia e hipotensao exigem intervencao urgente.',
                'diagnostico' => 'Choque septico',
                'prescricao' => 'Fluidoterapia, hemoculturas, antibiotico IV e internamento urgente.',
            ],
            [
                'cor_manchester' => 'amarelo',
                'nivel_prioridade' => 3,
                'resumo_ia' => 'Dor no peito de curta duracao, sem alteracoes vitais graves no momento.',
                'diagnostico' => 'Dor toracica inespecifica',
                'prescricao' => 'Observacao, ECG de controlo e analgesia se necessario.',
            ],
            [
                'cor_manchester' => 'verde',
                'nivel_prioridade' => 4,
                'resumo_ia' => 'Ferida superficial no dedo com sangramento controlado e sem infeccao aparente.',
                'diagnostico' => 'Ferida superficial',
                'prescricao' => 'Limpeza, penso simples e verificacao da vacina antitetanica.',
            ],
            [
                'cor_manchester' => 'laranja',
                'nivel_prioridade' => 2,
                'resumo_ia' => 'Dor renal tipo colica com nauseas e hematuria, sugestiva de litase.',
                'diagnostico' => 'Colica renal',
                'prescricao' => 'Analgesia, antiemetico e referencia para imagiologia.',
            ],
        ];

        $utentes = [3, 4, 5, 6];
        $medicos = [2, 8, 9];
        $hospitais = [1, 1, 2, 2, 3];
        $baseDate = Carbon::now()->subDays(14);

        DB::transaction(function () use ($toCreate, $cases, $utentes, $medicos, $hospitais, $baseDate) {
            for ($i = 0; $i < $toCreate; $i++) {
                $case = $cases[$i % count($cases)];
                $utenteId = $utentes[$i % count($utentes)];
                $hospitalId = $hospitais[$i % count($hospitais)];
                $medicoId = $medicos[$i % count($medicos)];
                $dataConsulta = $baseDate->copy()->subDays($i * 3)->addHours($i % 8);

                $triagemId = DB::table('triagens')->insertGetId([
                    'utente_id' => $utenteId,
                    'hospital_id' => $hospitalId,
                    'cor_manchester' => $case['cor_manchester'],
                    'nivel_prioridade' => $case['nivel_prioridade'],
                    'resumo_ia' => $case['resumo_ia'],
                    'estado' => 'finalizado',
                    'criado_em' => $dataConsulta->toDateTimeString(),
                ]);

                DB::table('consultas')->insert([
                    'triagem_id' => $triagemId,
                    'medico_id' => $medicoId,
                    'utente_id' => $utenteId,
                    'hospital_id' => $hospitalId,
                    'diagnostico' => $case['diagnostico'],
                    'prescricao' => $case['prescricao'],
                    'data_consulta' => $dataConsulta->copy()->addHours(2)->toDateTimeString(),
                ]);
            }
        });
    }
}