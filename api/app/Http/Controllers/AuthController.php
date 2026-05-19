<?php

namespace App\Http\Controllers;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller {
    public function login(Request $request) 
{
    // Procura o utilizador pelo email
    $user = User::where('email', $request->email)->first();

    // Debug
    Log::info('Login attempt', [
        'email' => $request->email,
        'user_found' => $user ? 'sim' : 'nao',
        'user_id' => $user?->id
    ]);

    // Se o user não existe OU a password enviada não corresponde à password com hash na BD
    if (!$user || !Hash::check($request->password, $user->password_hash)) {
        return response()->json([
            'message' => 'Credenciais inválidas',
            'debug' => [
                'user_exists' => $user ? 'sim' : 'nao',
                'password_check' => $user ? Hash::check($request->password, $user->password_hash) : 'n/a'
            ]
        ], 401);
    }

    // Prepara dados do utilizador com role incluído
    $userData = [
        'id' => $user->id,
        'nome' => $user->nome,
        'email' => $user->email,
        'role' => $user->role,
        'hospital_id' => $user->hospital_id,
        'nr_funcionario' => $user->nr_funcionario,
        'especialidade' => $user->especialidade,
        'nr_utente' => $user->nr_utente,
    ];

    return response()->json([
        'user' => $userData,
        'token' => 'token-simulado' 
    ]);
}

public function register(Request $request) 
    {
        // 1. Valida os campos do Utente
        try {
            $validated = $request->validate([
                'nome' => 'required|string|max:255',
                'email' => 'required|email|unique:utilizadores,email',
                'password' => 'required|string|min:6',
                // Campos específicos do Utente:
                'nr_utente' => 'required|string|max:20|unique:utilizadores,nr_utente',
                'hospital_id' => 'required|exists:hospitais,id'
            ], [
                'email.unique' => 'Este email já está registado.',
                'nr_utente.unique' => 'Este Número de Utente já existe no sistema.',
                'hospital_id.exists' => 'O hospital selecionado não é válido.'
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Erro na validação',
                'errors' => $e->errors()
            ], 422);
        }

        // 2. Criação do Utente (A role é FORÇADA a 'utente' por segurança)
        $user = User::create([
            'nome' => $validated['nome'],
            'email' => $validated['email'],
            'password_hash' => Hash::make($validated['password']),
            'role' => 'utente', // Bloqueio de segurança anti-hackers
            'nr_utente' => $validated['nr_utente'],
            'hospital_id' => $validated['hospital_id'],
        ]);

        return response()->json([
            'message' => 'Utente registado com sucesso',
            'user' => [
                'id' => $user->id,
                'nome' => $user->nome,
                'email' => $user->email,
                'role' => $user->role,
                'hospital_id' => $user->hospital_id,
            ],
            'token' => 'token-simulado'
        ], 201);
    }

    public function editarPerfil(Request $request, $id) 
{
    // 1. Procura o utilizador na base de dados
    $user = User::find($id);

    if (!$user) {
        return response()->json(['message' => 'Utilizador não encontrado.'], 404);
    }

    // 2. Validação dos dados (incluindo os novos campos médicos)
    try {
        $validated = $request->validate([
            'nome' => 'required|string|max:255',
            'email' => 'required|email|unique:utilizadores,email,' . $id, // Permite manter o próprio email
            'idade' => 'nullable|integer|min:0|max:120',
            'altura' => 'nullable|integer|min:0|max:250',
            'morada' => 'nullable|string|max:500',
            'hospital_id' => 'nullable|exists:hospitais,id',
            'descricao' => 'nullable|string',
            'password' => 'nullable|string|min:6', // Password é opcional na edição
        ], [
            'email.unique' => 'Este e-mail já está em uso por outro utilizador.',
            'password.min' => 'A nova palavra-passe deve ter pelo menos 6 caracteres.'
        ]);
    } catch (\Illuminate\Validation\ValidationException $e) {
        return response()->json([
            'message' => 'Erro na validação dos dados.',
            'errors' => $e->errors()
        ], 422);
    }

    // 3. Atualiza os campos na tabela
    $user->nome = $validated['nome'];
    $user->email = $validated['email'];
    $user->idade = $validated['idade'] ?? $user->idade;
    $user->altura = $validated['altura'] ?? $user->altura;
    $user->morada = $validated['morada'] ?? $user->morada;
    $user->hospital_id = $validated['hospital_id'] ?? $user->hospital_id;
    $user->descricao = $validated['descricao'] ?? $user->descricao;

    // Se o utilizador digitou uma nova password, fazemos o hash dela antes de guardar
    if (!empty($validated['password'])) {
        $user->password_hash = Hash::make($validated['password']);
    }

    $user->save();

    // 4. Devolve o utilizador atualizado de volta para o React sincronizar o estado
    return response()->json([
        'message' => 'Perfil clínico atualizado com sucesso!',
        'user' => [
            'id' => $user->id,
            'nome' => $user->nome,
            'email' => $user->email,
            'role' => $user->role,
            'hospital_id' => $user->hospital_id,
            'nr_utente' => $user->nr_utente,
            'idade' => $user->idade,
            'altura' => $user->altura,
            'morada' => $user->morada,
            'descricao' => $user->descricao,
        ]
    ]);
}
}