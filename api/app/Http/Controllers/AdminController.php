<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AdminController extends Controller
{
    // Resumo para o dashboard (contadores)
    public function resumoDashboard(Request $request) {
        $query = DB::table('utilizadores');
        if ($request->has('hospital_id')) {
            $query->where('hospital_id', $request->hospital_id);
        }
        $totais = $query->select('role', DB::raw('count(*) as total'))
            ->groupBy('role')
            ->pluck('total', 'role');
        return response()->json($totais);
    }

    // Listar todos os utilizadores com paginação e pesquisa
    public function listarUtilizadores(Request $request) {
        $query = DB::table('utilizadores as u')
            ->leftJoin('hospitais as h', 'u.hospital_id', '=', 'h.id')
            ->select('u.*', 'h.nome as hospital_nome');

        if ($request->has('hospital_id')) {
            $query->where('u.hospital_id', $request->hospital_id);
        }

        // Filtro por role
        if ($request->has('role') && !empty($request->role) && $request->role !== 'todos') {
            if ($request->role === 'medico') {
                $query->whereIn('u.role', ['medico', 'diretor']);
            } else {
                $query->where('u.role', $request->role);
            }
        }

        // Pesquisa global
        if ($request->has('search') && !empty($request->search)) {
            $search = strtolower($request->search);
            $query->where(function($q) use ($search) {
                $q->whereRaw('LOWER(u.nome) LIKE ?', ["%{$search}%"])
                  ->orWhereRaw('LOWER(u.email) LIKE ?', ["%{$search}%"])
                  ->orWhere('u.nr_utente', 'LIKE', "%{$search}%")
                  ->orWhere('u.nr_funcionario', 'LIKE', "%{$search}%");
            });
        }

        // Retorna 15 por página
        return response()->json($query->orderBy('u.criado_em', 'desc')->paginate(15));
    }

    // Listar Auditoria com paginação
    public function listarAuditoria(Request $request) {
        $query = DB::table('auditoria_acessos as a')
            ->join('utilizadores as u', 'a.user_id', '=', 'u.id')
            ->select('a.*', 'u.nome as autor_nome', 'u.role as autor_role');

        return response()->json($query->orderBy('a.criado_em', 'desc')->paginate(20));
    }

    // Registar Auditoria (Chamado pelo Frontend ou internamente)
    public function registarAuditoria(Request $request) {
        $validated = $request->validate([
            'user_id' => 'required|exists:utilizadores,id',
            'acao' => 'required|string|max:255',
            'detalhes' => 'nullable|string|max:255'
        ]);

        DB::table('auditoria_acessos')->insert([
            'user_id' => $validated['user_id'],
            'acao' => $validated['acao'],
            'detalhes' => $validated['detalhes'],
            'ip_address' => $request->ip(),
            'criado_em' => now()
        ]);

        return response()->json(['message' => 'Auditoria registada.']);
    }

    // Listar todos os hospitais
    public function listarHospitais() {
        return DB::table('hospitais')->get();
    }

    // Criar um novo utilizador (Staff ou Utente)
    public function criarUtilizador(Request $request) {
        
        $validated = $request->validate([
            'nome' => 'required|string|max:255',
            'email' => 'required|email|unique:utilizadores,email',
            'password' => 'required|string|min:6',
            'role' => 'required|in:utente,secretaria,medico,admin,diretor', 
            'hospital_id' => 'required|exists:hospitais,id',
            'nr_funcionario' => 'required_if:role,medico,secretaria,diretor|nullable|string|unique:utilizadores,nr_funcionario',
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
            'nr_funcionario' => ($validated['role'] !== 'admin' && $validated['role'] !== 'utente') ? ((isset($validated['nr_funcionario']) && $validated['nr_funcionario'] !== '') ? $validated['nr_funcionario'] : null) : null,
            'especialidade' => ($validated['role'] === 'medico' || $validated['role'] === 'diretor') ? ((isset($validated['especialidade']) && $validated['especialidade'] !== '') ? $validated['especialidade'] : null) : null,
            'nr_utente' => null,
            'idade' => null,
            'altura' => null,
            'morada' => null,
            'descricao' => null
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
            'role' => 'required|in:utente,secretaria,medico,admin,diretor',
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
            $user->nr_utente = (isset($validated['nr_utente']) && $validated['nr_utente'] !== '') ? $validated['nr_utente'] : null;
            $user->idade = (isset($validated['idade']) && $validated['idade'] !== '') ? $validated['idade'] : null;
            $user->altura = (isset($validated['altura']) && $validated['altura'] !== '') ? $validated['altura'] : null;
            $user->morada = (isset($validated['morada']) && $validated['morada'] !== '') ? $validated['morada'] : null;
            $user->descricao = (isset($validated['descricao']) && $validated['descricao'] !== '') ? $validated['descricao'] : null;
            $user->nr_funcionario = null;
            $user->especialidade = null;
        } else {
            // Se for Staff (médico, secretaria, admin, diretor)
            $user->nr_funcionario = (isset($validated['nr_funcionario']) && $validated['nr_funcionario'] !== '') ? $validated['nr_funcionario'] : null;
            $user->especialidade = ($validated['role'] === 'medico' || $validated['role'] === 'diretor') ? ((isset($validated['especialidade']) && $validated['especialidade'] !== '') ? $validated['especialidade'] : null) : null;
            
            $user->nr_utente = null;
            $user->idade = null;
            $user->altura = null;
            $user->morada = null;
            $user->descricao = null;
        }

        // Se o admin redefiniu a password
        if (!empty($validated['password'])) {
            $user->password_hash = Hash::make($validated['password']);
        }

        $user->save();

        return response()->json(['message' => 'Utilizador atualizado com sucesso pelo Administrador!']);
    }
}