<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    // Listar todos os utilizadores com o nome do hospital
    public function listarUtilizadores() {
        return DB::table('utilizadores as u')
            ->leftJoin('hospitais as h', 'u.hospital_id', '=', 'h.id')
            ->select('u.*', 'h.nome as hospital_nome')
            ->orderBy('u.role', 'asc')
            ->get();
    }

    // Listar todos os hospitais
    public function listarHospitais() {
        return DB::table('hospitais')->get();
    }

    // Criar um novo médico ou secretaria (Função de RH/TI)
    public function criarUtilizador(Request $request) {
        $id = DB::table('utilizadores')->insertGetId([
            'nome' => $request->nome,
            'email' => $request->email,
            'password_hash' => password_hash($request->password, PASSWORD_BCRYPT),
            'role' => $request->role,
            'hospital_id' => $request->hospital_id,
            'nr_funcionario' => $request->nr_funcionario,
            'especialidade' => $request->especialidade
        ]);
        
        return response()->json(['message' => 'Criado com sucesso', 'id' => $id]);
    }
}