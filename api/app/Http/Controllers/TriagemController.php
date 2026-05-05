<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Triagem;
use App\Models\User;
// IMPORTANTE: Adiciona estas duas linhas abaixo para resolver o erro 500
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB; 

class TriagemController extends Controller {

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
            $triagem = DB::table('triagens')->where('utente_id', $user->id)->orderBy('id', 'desc')->first();

            if ($triagem) {
                DB::table('triagens')->where('id', $triagem->id)->update(['estado' => 'em_espera']); 

                DB::table('fila_espera')->updateOrInsert(
                    ['triagem_id' => $triagem->id],
                    [
                        'hospital_id' => $triagem->hospital_id ?? 1,
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

    public function proximoPaciente() {
        try {
            $proximo = DB::table('v_painel_medico')
                ->where('estado_fila', 'aguardar')
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

    // --- FINALIZAR CONSULTA (CORRIGIDO) ---
    public function finalizarConsulta(Request $request) {
        try {
            DB::beginTransaction();

            // Removi 'criado_em' para evitar erros se a coluna não existir
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

    // --- HISTÓRICO (CORRIGIDO) ---
    public function historico($id = null, $role = null) {
        try {
            $query = DB::table('consultas as c')
                ->join('utilizadores as u', 'c.utente_id', '=', 'u.id')
                ->join('utilizadores as m', 'c.medico_id', '=', 'm.id')
                ->join('triagens as t', 'c.triagem_id', '=', 't.id')
                ->leftJoin('hospitais as h', 't.hospital_id', '=', 'h.id') // Usei leftJoin por segurança
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
}