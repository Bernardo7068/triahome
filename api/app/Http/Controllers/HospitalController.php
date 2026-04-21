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
}