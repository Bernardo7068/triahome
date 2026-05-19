<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

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

    // Criar um novo utilizador do Staff (Médico, Secretaria ou outro Admin)
    public function criarUtilizador(Request $request) {
        
        $validated = $request->validate([
            'nome' => 'required|string|max:255',
            'email' => 'required|email|unique:utilizadores,email',
            'password' => 'required|string|min:6',
            'role' => 'required|in:secretaria,medico,admin', // Permite criar outros admins
            'hospital_id' => 'required|exists:hospitais,id',
            'nr_funcionario' => 'required_if:role,medico,secretaria|nullable|string|unique:utilizadores,nr_funcionario',
            'especialidade' => 'nullable|string'
        ], [
            'email.unique' => 'Este e-mail já está em uso.',
            'nr_funcionario.unique' => 'Este Número de Funcionário já existe.'
        ]);

        $user = User::create([
            'nome' => $validated['nome'],
            'email' => $validated['email'],
            'password_hash' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'hospital_id' => $validated['hospital_id'],
            'nr_funcionario' => $validated['role'] !== 'admin' ? $validated['nr_funcionario'] : null,
            'especialidade' => $validated['role'] === 'medico' ? $validated['especialidade'] : null
        ]);
        
        return response()->json([
            'message' => 'Utilizador criado com sucesso no sistema!', 
            'user' => $user
        ], 201);
    }

    // =============================================================
    // NOVA FUNÇÃO: Permite ao Admin editar QUALQUER utilizador
    // =============================================================
    public function editarUtilizador(Request $request, $id) {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'Utilizador não encontrado.'], 404);
        }

        $validated = $request->validate([
            'nome' => 'required|string|max:255',
            'email' => 'required|email|unique:utilizadores,email,' . $id,
            'role' => 'required|in:utente,secretaria,medico,admin',
            'hospital_id' => 'required|exists:hospitais,id',
            // Campos específicos de staff
            'nr_funcionario' => 'nullable|string|unique:utilizadores,nr_funcionario,' . $id,
            'especialidade' => 'nullable|string',
            // Campos específicos de utente
            'nr_utente' => 'nullable|string|unique:utilizadores,nr_utente,' . $id,
            'idade' => 'nullable|integer',
            'altura' => 'nullable|integer',
            'morada' => 'nullable|string',
            'descricao' => 'nullable|string',
            'password' => 'nullable|string|min:6' // Mudar password é opcional
        ]);

        // Atualização dos dados comuns
        $user->nome = $validated['nome'];
        $user->email = $validated['email'];
        $user->role = $validated['role'];
        $user->hospital_id = $validated['hospital_id'];

        // Se for Utente, guarda dados clínicos
        if ($validated['role'] === 'utente') {
            $user->nr_utente = $validated['nr_utente'] ?? "";
            $user->idade = $validated['idade'] ?? 0;
            $user->altura = $validated['altura'] ?? 0;
            $user->morada = $validated['morada'] ?? "";
            $user->descricao = $validated['descricao'] ?? ""; // Se vazio, envia texto limpo
            $user->nr_funcionario = null;
            $user->especialidade = null;
        } else {
            // Se for Staff (médico, secretaria, admin), evitamos o NULL nas colunas restritas:
            $user->nr_funcionario = $validated['nr_funcionario'] ?? null;
            $user->especialidade = $validated['role'] === 'medico' ? ($validated['especialidade'] ?? null) : null;
            
            // Injeta strings vazias ou valores padrão em vez de NULL por causa do bloqueio da BD
            $user->nr_utente = "";
            $user->idade = 0;
            $user->altura = 0;
            $user->morada = "";
            $user->descricao = ""; // <--- MÁGICA AQUI: Evita o erro de NOT NULL constraint
        }

        // Se o admin redefiniu a password
        if (!empty($validated['password'])) {
            $user->password_hash = Hash::make($validated['password']);
        }

        $user->save();

        return response()->json(['message' => 'Utilizador atualizado com sucesso pelo Administrador!']);
    }
}