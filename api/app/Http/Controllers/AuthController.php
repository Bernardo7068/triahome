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
        // Valida os campos obrigatórios
        try {
            $validated = $request->validate([
                'nome' => 'required|string|max:255',
                'email' => 'required|email|unique:utilizadores,email',
                'password' => 'required|string|min:6',
                'role' => 'required|in:utente,secretaria,medico,admin',
                'nr_utente' => 'nullable|unique:utilizadores,nr_utente',
                'nr_identificacao' => 'nullable|string|max:20',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Erro na validação',
                'errors' => $e->errors()
            ], 422);
        }

        // Por segurança, força que o registo via API seja sempre "utente"
        // (Médicos, Secretarias, Admins devem ser criados manualmente por admin)
        $role = $request->input('role', 'utente');
        if ($role !== 'utente') {
            $role = 'utente'; // Force sempre para utente
        }

        // Cria novo utilizador
        $user = User::create([
            'nome' => $validated['nome'],
            'email' => $validated['email'],
            'password_hash' => Hash::make($validated['password']),
            'role' => $role,
            'nr_utente' => $validated['nr_utente'] ?? null,
        ]);

        // Devolve o utilizador criado (sem exposição de password)
        $userData = [
            'id' => $user->id,
            'nome' => $user->nome,
            'email' => $user->email,
            'role' => $user->role,
            'hospital_id' => $user->hospital_id,
            'nr_utente' => $user->nr_utente,
        ];

        return response()->json([
            'message' => 'Utilizador registado com sucesso',
            'user' => $userData,
            'token' => 'token-simulado'
        ], 201);
    }
}