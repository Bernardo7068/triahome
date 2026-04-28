<?php

namespace App\Http\Controllers;
use Illuminate\Support\Facades\DB;

class HospitalController extends Controller {
    public function getPainelMedico() {
        // Usa a VIEW que criaste no SQL
        return DB::select("SELECT * FROM v_painel_medico");
    }

    public function getLotacao() {
        // Usa a VIEW de lotação
        return DB::select("SELECT * FROM v_lotacao_hospitais");
    }

    public function chamarUtente(Request $request, $triagem_id) {
    // Atualiza a fila de espera para "chamado"
    \DB::table('fila_espera')
        ->where('triagem_id', $triagem_id)
        ->update(['estado' => 'chamado', 'chamado_em' => now()]);

    // Opcional: Podias passar o número do guiché no request
    return response()->json(['message' => 'Utente chamado com sucesso']);
}


}