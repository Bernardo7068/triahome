<?php

namespace App\Http\Controllers;
use Illuminate\Http\Request;
use App\Models\Triagem;
use Illuminate\Support\Facades\Http;

class TriagemController extends Controller {
    public function store(Request $request) {
        // 1. Criar registo na BD
        $triagem = Triagem::create([
            'utente_id' => $request->utente_id,
            'hospital_id' => $request->hospital_id,
            'estado' => 'pendente'
        ]);

        // 2. Chamar a 2ª API (Ollama)
        try {
            $prompt = "Avalia estes sintomas e dá apenas a cor de Manchester: " . $request->sintomas;
            
            $response = Http::post('http://localhost:11434/api/generate', [
                'model' => 'llama3',
                'prompt' => $prompt,
                'stream' => false
            ]);

            $cor = strtolower(trim($response->json('response'))); // ex: "amarelo"

            // 3. Atualizar BD com a decisão da IA
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
        // Primeiro, descobrimos o nome da Ana
        $user = \App\Models\User::find($utente_id);

        // Depois, procuramos na View usando o NOME (já que a View não tem ID)
        $triagem = \DB::table('v_painel_medico')
            ->where('nome_utente', $user->nome)
            ->whereIn('estado_fila', ['aguardar', 'chamado', 'pendente'])
            ->first();

        return response()->json($triagem);
    }

    // 2. A Secretaria clica em "Chamar"
// SECRETARIA VALIDA A ENTRADA
public function chamarUtentePorNome($nome_utente) {
    try {
        $user = \DB::table('utilizadores')->where('nome', $nome_utente)->first();
        $triagem = \DB::table('triagens')->where('utente_id', $user->id)->orderBy('id', 'desc')->first();

        if ($triagem) {
            // 1. Muda o estado da TRIAGEM para algo que a secretaria já não veja como "pendente"
            \DB::table('triagens')
                ->where('id', $triagem->id)
                ->update(['estado' => 'em_espera']); 

            // 2. Garante que na FILA_ESPERA o estado é 'aguardar' 
            // (que é o que o Médico agora está a filtrar)
            \DB::table('fila_espera')
                ->updateOrInsert(
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

    // MÉDICO CHAMA O PRÓXIMO
    public function proximoPaciente() {
        $proximo = \DB::table('v_painel_medico')
            ->where('estado_fila', 'em_espera') // <-- Só chama quem JÁ FEZ Check-in
            ->orderBy('nivel_prioridade', 'asc')
            ->orderBy('posicao', 'asc')
            ->first();

        if ($proximo) {
            $idCorreto = isset($proximo->triagem_id) ? $proximo->triagem_id : $proximo->id;
            \DB::table('fila_espera')->where('triagem_id', $idCorreto)
                ->update(['estado' => 'em_consulta', 'chamado_em' => now()]);
        }
        return response()->json($proximo);
    }
}