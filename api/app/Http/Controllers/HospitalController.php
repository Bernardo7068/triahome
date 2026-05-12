<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request; // <-- ESTA LINHA É A QUE EVITA O ERRO 500!
use Illuminate\Support\Facades\DB;

class HospitalController extends Controller {

    public function getPainelMedico(Request $request) {
        try {
            $hospitalId = $request->query('hospital_id');
            // Proteção extra caso o React envie a palavra 'undefined'
            if ($hospitalId === 'undefined') $hospitalId = null;

            $query = DB::table('triagens')
                ->join('utilizadores', 'triagens.utente_id', '=', 'utilizadores.id')
                ->leftJoin('fila_espera', 'triagens.id', '=', 'fila_espera.triagem_id')
                ->select(
                    'triagens.id as triagem_id',
                    'triagens.utente_id', // Faltava isto para finalizar a consulta!
                    'utilizadores.nome as nome_utente',
                    'triagens.cor_manchester',
                    'triagens.resumo_ia', // Faltava isto para veres a queixa no popup!
                    'triagens.estado as estado_triagem', 
                    'fila_espera.estado as estado_fila',
                    'triagens.hospital_id'
                );

            // Filtra pelo hospital do médico logado
            if (!empty($hospitalId)) {
                $query->where('triagens.hospital_id', $hospitalId);
            }

            // Ordenação por prioridade Manchester
            $dados = $query->orderByRaw("CASE 
                WHEN triagens.cor_manchester = 'vermelho' THEN 1 
                WHEN triagens.cor_manchester = 'laranja' THEN 2 
                WHEN triagens.cor_manchester = 'amarelo' THEN 3 
                WHEN triagens.cor_manchester = 'verde' THEN 4 
                ELSE 5 END")->get();

            return response()->json($dados);

        } catch (\Exception $e) {
            // Se falhar, agora ele envia o erro exato para a consola do teu browser!
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function getLotacao() {
        // Usa a VIEW de lotação
        return DB::select("SELECT * FROM v_lotacao_hospitais");
    }

    public function chamarUtente(Request $request, $triagem_id) {
        // Atualiza a fila de espera para "chamado" (Retirei o chamado_em que dava erro)
        DB::table('fila_espera')
            ->where('triagem_id', $triagem_id)
            ->update(['estado' => 'chamado']);

        return response()->json(['message' => 'Utente chamado com sucesso']);
    }
}