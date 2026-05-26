<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Triagem;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB; 
use Illuminate\Support\Facades\Log;

class TriagemController extends Controller
{
    // A IA (Python) chama este endpoint para guardar o resultado final
    public function guardarResultadoTriagem(Request $request)
    {
        $headers = [
            'Access-Control-Allow-Origin' => '*',
            'Access-Control-Allow-Methods' => 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers' => 'Content-Type, X-Requested-With, Authorization'
        ];

        if ($request->isMethod('OPTIONS')) {
            return response()->json('OK', 200, $headers);
        }

        try {
            Log::info('Tentando guardar resultado final', [
                'utente_id' => $request->utente_id,
                'hospital_id' => $request->hospital_id,
                'categoria' => $request->categoria,
                'especialidade' => $request->especialidade
            ]);

            $cor_mapa = [
                'Vermelho' => 'vermelho',
                'Laranja' => 'laranja',
                'Amarelo' => 'amarelo',
                'Verde' => 'verde',
                'Autocuidado' => 'azul',
                'Azul' => 'azul'
            ];
            $categoria_input = $request->categoria ?? 'Verde';
            $cor = $cor_mapa[$categoria_input] ?? 'verde';
            
            // Procura pela triagem mais recente que ainda não foi concluída
            $triagem = Triagem::where('utente_id', $request->utente_id)
                ->whereIn('estado', ['pendente', 'checkin_feito', 'em_espera'])
                ->orderBy('id', 'desc')
                ->first();
            
            if ($triagem) {
                // Atualiza triagem existente
                $triagem->update([
                    'cor_manchester' => $cor,
                    'nivel_prioridade' => $this->nivelPrioridadePorCor($cor),
                    'resumo_ia' => $request->resumo_clinico ?? ($request->justificacao . "\nAção: " . $request->acao),
                    'especialidade' => $request->especialidade ?? 'Clínica Geral',
                    'conselhos_autocuidado' => $request->acao,
                    'estado' => 'pendente'  // Força volta para pendente para a secretaria ver
                ]);
                Log::info('Triagem ATUALIZADA com sucesso', ['id' => $triagem->id]);
            } else {
                // Cria nova triagem
                $triagem = Triagem::create([
                    'utente_id' => $request->utente_id,
                    'hospital_id' => $request->hospital_id ?? 1,
                    'cor_manchester' => $cor,
                    'nivel_prioridade' => $this->nivelPrioridadePorCor($cor),
                    'resumo_ia' => $request->resumo_clinico ?? ($request->justificacao . "\nAção: " . $request->acao),
                    'especialidade' => $request->especialidade ?? 'Clínica Geral',
                    'conselhos_autocuidado' => $request->acao,
                    'estado' => 'pendente' 
                ]);
                Log::info('Triagem CRIADA com sucesso', ['id' => $triagem->id]);
            }

            // Garante que está na fila se não for autocuidado (azul)
            if ($cor !== 'azul') {
                DB::table('fila_espera')->updateOrInsert(
                    ['triagem_id' => $triagem->id],
                    [
                        'hospital_id' => $triagem->hospital_id ?? 1,
                        'posicao' => 1,
                        'estado' => 'aguardar',
                        'criado_em' => now()
                    ]
                );
            }

            return response()->json([
                'message' => 'Triagem guardada com sucesso',
                'triagem' => $triagem
            ], 201, $headers);
        } catch (\Exception $e) {
            Log::error('Erro ao guardar triagem: ' . $e->getMessage());
            return response()->json([
                'error' => 'Erro ao guardar triagem',
                'details' => $e->getMessage()
            ], 500, isset($headers) ? $headers : []);
        }
    }

    private function nivelPrioridadePorCor($cor) {
        $mapa = [
            'vermelho' => 1,
            'laranja' => 2,
            'amarelo' => 3,
            'verde' => 4,
            'azul' => 5
        ];
        return $mapa[strtolower($cor)] ?? 5;
    }

    // O UTENTE vê o seu estado no hospital onde foi triado
    public function estadoAtual($utente_id) {
        $user = User::find($utente_id);
        if (!$user) return response()->json(null);

        $triagem = DB::table('v_painel_medico')
            ->where('nome_utente', $user->nome)
            ->whereIn('estado_fila', ['aguardar', 'chamado', 'pendente', 'em_consulta'])
            ->first();

        return response()->json($triagem);
    }

    public function chamarUtentePorNome($nome_utente) {
        try {
            $user = DB::table('utilizadores')->where('nome', $nome_utente)->first();
            
            // 1. Proteção: Se o user não existir, não avança
            if (!$user) {
                return response()->json(['message' => 'Utente não encontrado'], 404);
            }

            // 2. Busca a triagem deste utente MAS que esteja especificamente "pendente"
            $triagem = DB::table('triagens')
                ->where('utente_id', $user->id)
                ->where('estado', 'pendente') // <--- ESTA É A CORREÇÃO CRUCIAL
                ->orderBy('id', 'desc')
                ->first();

            if ($triagem) {
                // 3. Atualiza os estados corretamente
                DB::table('triagens')->where('id', $triagem->id)->update(['estado' => 'em_espera']);

                DB::table('fila_espera')->updateOrInsert(
                    ['triagem_id' => $triagem->id],
                    [
                        'hospital_id' => $triagem->hospital_id,
                        'posicao' => 1,
                        'estado' => 'aguardar',
                        'criado_em' => now()
                    ]
                );

                return response()->json(['message' => 'Sucesso!']);
            }
            
            return response()->json(['message' => 'Nenhuma triagem pendente para validar.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    // O MÉDICO chama o próximo do SEU hospital
    public function proximoPaciente(Request $request) {
        try {
            $hospital_id = $request->query('hospital_id');
            $medico_id = $request->query('medico_id');

            // PROTEÇÃO EXTRA: Se vier vazio ou "undefined", assume Hospital 1
            if (empty($hospital_id) || $hospital_id === 'undefined') {
                $hospital_id = 1;
            }

            // Buscar a especialidade do médico logado
            $especialidadeMedico = null;
            if ($medico_id) {
                $medico = DB::table('utilizadores')->where('id', $medico_id)->first();
                $especialidadeMedico = $medico ? $medico->especialidade : null;
            }

            $query = DB::table('fila_espera as f')
                ->join('triagens as t', 'f.triagem_id', '=', 't.id')
                ->join('utilizadores as u', 't.utente_id', '=', 'u.id')
                ->select(
                    't.id as triagem_id',
                    't.utente_id',
                    'u.nome as nome_utente',
                    'u.nr_utente',
                    'u.idade',
                    'u.altura',
                    'u.morada',
                    'u.descricao as descricao_utente',
                    't.cor_manchester',
                    't.resumo_ia',
                    't.especialidade',
                    't.estado as estado_triagem',
                    'f.estado as estado_fila',
                    't.hospital_id',
                    't.criado_em as hora_entrada',
                    'f.posicao'
                )
                ->where('f.estado', 'aguardar')
                ->where('t.hospital_id', $hospital_id);

            // Lógica de Especialidade:
            // Se o médico NÃO for Clínica Geral, ele só chama pacientes da sua especialidade.
            // Se for Clínica Geral, ele pode chamar qualquer um.
            if ($especialidadeMedico && $especialidadeMedico !== 'Clínica Geral') {
                $query->where('t.especialidade', $especialidadeMedico);
            }

            $proximo = $query->orderByRaw("CASE 
                    WHEN t.cor_manchester = 'vermelho' THEN 1 
                    WHEN t.cor_manchester = 'laranja' THEN 2 
                    WHEN t.cor_manchester = 'amarelo' THEN 3 
                    WHEN t.cor_manchester = 'verde' THEN 4 
                    ELSE 5 END")
                ->orderBy('f.posicao', 'asc')
                ->first();

            if ($proximo) {
                DB::table('fila_espera')
                    ->where('triagem_id', $proximo->triagem_id)
                    ->update([
                        'estado' => 'em_consulta'
                    ]);

                return response()->json($proximo);
            }
            return response()->json(['message' => 'Fila vazia'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        $request->validate([
            'utente_id' => 'required|exists:utilizadores,id',
            'sintomas' => 'required|string',
        ]);

        try {
            $prompt = "Avalia estes sintomas e dá apenas a cor de Manchester (vermelho, laranja, amarelo, verde ou azul): " . $request->sintomas;
            
            $response = Http::post('http://localhost:5000', [
                'model' => 'llama3',
                'prompt' => $prompt,
                'stream' => false
            ]);

            if ($response->successful()) {
                $cor_ia = strtolower(trim($response->json()['response']));
                
                $triagem = Triagem::create([
                    'utente_id' => $request->utente_id,
                    'hospital_id' => 1,
                    'cor_manchester' => $cor_ia,
                    'nivel_prioridade' => $this->nivelPrioridadePorCor($cor_ia),
                    'resumo_ia' => $request->sintomas,
                    'estado' => 'pendente',
                ]);

                return response()->json($triagem, 201);
            }

            return response()->json(['message' => 'Erro na IA'], 500);

        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function getTriagensPorHospital(Request $request)
    {
        $hospitalId = $request->query('hospital_id');
        
        $query = DB::table('triagens')
            ->join('utilizadores', 'triagens.utente_id', '=', 'utilizadores.id')
            ->select('triagens.*', 'utilizadores.nome as nome_utente')
            ->where('triagens.estado', '!=', 'finalizado');

        if ($hospitalId) {
            $query->where('triagens.hospital_id', $hospitalId);
        }

        $query->orderByRaw("CASE 
            WHEN triagens.cor_manchester = 'vermelho' THEN 1 
            WHEN triagens.cor_manchester = 'laranja' THEN 2 
            WHEN triagens.cor_manchester = 'amarelo' THEN 3 
            WHEN triagens.cor_manchester = 'verde' THEN 4 
            ELSE 5 END");

        return response()->json($query->get());
    }

    public function filaSecretaria(Request $request)
    {
        $hospitalId = $request->query('hospital_id');

        $query = DB::table('triagens')
            ->join('utilizadores', 'triagens.utente_id', '=', 'utilizadores.id')
            ->select(
                'triagens.id',
                'utilizadores.nome', // Nome que vem da tabela utilizadores
                'utilizadores.nr_utente',
                'utilizadores.idade',
                'utilizadores.morada',
                'triagens.cor_manchester',
                'triagens.especialidade',
                'triagens.estado',
                'triagens.criado_em'
            )
            // CRUCIAL: Garantir que filtramos por pendente OU checkin_feito se necessário
            ->where('triagens.estado', 'pendente');

        if ($hospitalId) {
            $query->where('triagens.hospital_id', $hospitalId);
        }

        return response()->json($query->get());
    }

    // Esta função servirá tanto para a Secretaria como para a Visão Geral do Médico
    public function filaHospital(Request $request)
    {
        $hospitalId = $request->query('hospital_id');

        $query = DB::table('triagens')
            ->join('utilizadores', 'triagens.utente_id', '=', 'utilizadores.id')
            // O leftJoin é o segredo: ele traz o utente mesmo que ele ainda não esteja na fila_espera
            ->leftJoin('fila_espera', 'triagens.id', '=', 'fila_espera.triagem_id')
            ->select(
                'triagens.id as triagem_id',
                'utilizadores.nome as nome_utente',
                'utilizadores.nr_utente',
                'utilizadores.idade',
                'triagens.cor_manchester',
                'triagens.especialidade',
                'triagens.estado as estado_triagem', // pendente, em_espera, finalizado
                'fila_espera.estado as estado_fila',   // aguardar, em_consulta, concluido (pode ser null)
                'triagens.criado_em'
            );

        if ($hospitalId) {
            $query->where('triagens.hospital_id', $hospitalId);
        }

        $query->orderByRaw("CASE 
            WHEN triagens.cor_manchester = 'vermelho' THEN 1 
            WHEN triagens.cor_manchester = 'laranja' THEN 2 
            WHEN triagens.cor_manchester = 'amarelo' THEN 3 
            WHEN triagens.cor_manchester = 'verde' THEN 4 
            ELSE 5 END");

        return response()->json($query->get());
    }

    public function finalizarConsulta(Request $request) {
        try {
            DB::beginTransaction();

            $triagem_id = $request->input('triagem_id');
            $medico_id = $request->input('medico_id');
            $utente_id = $request->input('utente_id');
            $diagnostico = $request->input('diagnostico');
            $prescricao = $request->input('prescricao');

            // 1. Atualizar triagem para finalizado
            DB::table('triagens')->where('id', $triagem_id)->update(['estado' => 'finalizado']);

            // 2. Atualizar fila_espera para concluido
            DB::table('fila_espera')->where('triagem_id', $triagem_id)->update(['estado' => 'concluido']);

            // 3. Criar ou atualizar registo na tabela consultas
            $triagem = DB::table('triagens')->where('id', $triagem_id)->first();
            DB::table('consultas')->updateOrInsert(
                ['triagem_id' => $triagem_id],
                [
                    'medico_id' => $medico_id,
                    'utente_id' => $utente_id,
                    'hospital_id' => $triagem->hospital_id,
                    'diagnostico' => $diagnostico,
                    'prescricao' => $prescricao,
                    'data_consulta' => now()
                ]
            );

            DB::commit();
            return response()->json(['message' => 'Consulta finalizada com sucesso']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function historico($id, $role) {
        $query = DB::table('consultas')
            ->join('triagens', 'consultas.triagem_id', '=', 'triagens.id')
            ->join('utilizadores as u', 'consultas.utente_id', '=', 'u.id')
            ->join('utilizadores as m', 'consultas.medico_id', '=', 'm.id')
            ->join('hospitais as h', 'consultas.hospital_id', '=', 'h.id')
            ->select(
                'consultas.*',
                'u.nome as nome_utente',
                'u.nr_utente',
                'u.idade',
                'u.altura',
                'u.morada as morada_utente',
                'u.descricao as descricao_utente',
                'm.nome as nome_medico',
                'm.nr_funcionario as nr_cedula_medico',
                'triagens.id as triagem_id',
                'triagens.cor_manchester',
                'triagens.resumo_ia',
                'triagens.especialidade',
                'triagens.conselhos_autocuidado',
                'h.nome as nome_hospital',
                'h.morada as morada_hospital',
                'h.telefone as telefone_hospital'
            );

        if ($role === 'medico') {
            $query->where('consultas.medico_id', $id);
        } elseif ($role === 'utente') {
            $query->where('consultas.utente_id', $id);
        } elseif ($role === 'admin') {
            // Admin vê tudo do hospital a que está alocado
            $admin = DB::table('utilizadores')->where('id', $id)->first();
            if ($admin && $admin->hospital_id) {
                $query->where('consultas.hospital_id', $admin->hospital_id);
            }
        }

        return response()->json($query->orderBy('data_consulta', 'desc')->get());
    }
}
