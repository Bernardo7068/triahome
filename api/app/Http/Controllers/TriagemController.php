<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Triagem;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB; 

class TriagemController extends Controller {

    // O UTENTE cria a triagem escolhendo um hospital_id no formulário
    public function store(Request $request) {
        $triagem = Triagem::create([
            'utente_id' => $request->utente_id,
            'hospital_id' => $request->hospital_id,
            'estado' => 'pendente'
        ]);

        try {
            $prompt = "Avalia estes sintomas e dá apenas a cor de Manchester (vermelho, laranja, amarelo, verde ou azul): " . $request->sintomas;
            
            $response = Http::post('http://192.168.67.251:5000', [
                'model' => 'llama3',
                'prompt' => $prompt,
                'stream' => false
            ]);

            $cor = strtolower(trim($response->json('response')));

            $triagem->update([
                'cor_manchester' => $cor,
                'resumo_ia' => $response->json('response'),
                'estado' => 'em_espera'
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => 'IA Indisponível'], 500);
        }

        return response()->json($triagem);
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
            // Busca a triagem mais recente deste utente
            $triagem = DB::table('triagens')->where('utente_id', $user->id)->orderBy('id', 'desc')->first();

            if ($triagem) {
                DB::table('triagens')->where('id', $triagem->id)->update(['estado' => 'em_espera']); 

                DB::table('fila_espera')->updateOrInsert(
                    ['triagem_id' => $triagem->id],
                    [
                        'hospital_id' => $triagem->hospital_id, // Mantém o hospital original da triagem
                        'posicao' => 1,
                        'estado' => 'aguardar', 
                        'criado_em' => now()
                    ]
                );

                return response()->json(['message' => 'Sucesso!']);
            }
            return response()->json(['message' => 'Utente não encontrado'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    // O MÉDICO chama o próximo do SEU hospital
    public function proximoPaciente(Request $request) {
        try {
            $hospital_id = $request->query('hospital_id'); // Recebido do Frontend

            $proximo = DB::table('v_painel_medico')
                ->where('estado_fila', 'aguardar')
                ->where('hospital_id', $hospital_id) // FILTRO POR HOSPITAL
                ->orderBy('nivel_prioridade', 'asc')
                ->orderBy('posicao', 'asc')
                ->first();

            if ($proximo) {
                DB::table('fila_espera')
                    ->where('triagem_id', $proximo->triagem_id)
                    ->update([
                        'estado' => 'em_consulta',
                        'chamado_em' => now()
                    ]);

                return response()->json($proximo);
            }
            return response()->json(['message' => 'Fila vazia'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function finalizarConsulta(Request $request) {
        try {
            DB::beginTransaction();

            $consultaId = DB::table('consultas')->insertGetId([
                'triagem_id'    => $request->triagem_id,
                'medico_id'     => $request->medico_id,
                'utente_id'     => $request->utente_id,
                'diagnostico'   => $request->diagnostico,
                'prescricao'    => $request->prescricao,
                'data_consulta' => now()
            ]);

            DB::table('triagens')
                ->where('id', $request->triagem_id)
                ->update(['estado' => 'finalizado']);

            DB::table('fila_espera')
                ->where('triagem_id', $request->triagem_id)
                ->update(['estado' => 'concluido']);

            DB::commit();
            return response()->json(['message' => 'Consulta finalizada!', 'id' => $consultaId]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erro: ' . $e->getMessage()], 500);
        }
    }

    // Histórico Global do Utente ou específico do Médico
    public function historico($id = null, $role = null) {
        try {
            $query = DB::table('consultas as c')
                ->join('utilizadores as u', 'c.utente_id', '=', 'u.id')
                ->join('utilizadores as m', 'c.medico_id', '=', 'm.id')
                ->join('triagens as t', 'c.triagem_id', '=', 't.id')
                ->leftJoin('hospitais as h', 't.hospital_id', '=', 'h.id')
                ->select(
                    'c.*', 
                    'u.nome as nome_utente', 'u.nr_utente',
                    'm.nome as nome_medico',
                    't.cor_manchester', 't.resumo_ia',
                    'h.nome as nome_hospital'
                );

            if ($role === 'utente') $query->where('c.utente_id', $id);
            if ($role === 'medico') $query->where('c.medico_id', $id);

            return response()->json($query->orderBy('c.data_consulta', 'desc')->get());
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // A SECRETARIA só vê quem está pendente para o SEU hospital
    public function filaSecretaria(Request $request) {
        try {
            $hospital_id = $request->query('hospital_id'); // Recebido do Frontend

            $lista = DB::table('triagens')
                ->join('utilizadores', 'triagens.utente_id', '=', 'utilizadores.id')
                ->where('utilizadores.role', 'utente') 
                ->where('triagens.hospital_id', $hospital_id) // FILTRO POR HOSPITAL
                ->whereIn('triagens.estado', ['pendente', 'checkin_feito'])
                ->select('triagens.*', 'utilizadores.nome', 'utilizadores.nr_utente')
                ->orderBy('triagens.id', 'asc')
                ->get();

            return response()->json($lista);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}