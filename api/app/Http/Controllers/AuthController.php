<?php

namespace App\Http\Controllers;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller {
    public function login(Request $request) 
{
    // Procura o utilizador pelo email
    $user = User::where('email', $request->email)->first();

    // Se o user não existe OU a password enviada é diferente da que está na BD
    // Nota: Estamos a comparar texto direto para facilitar o teu teste
    if (!$user || $request->password !== $user->password_hash) {
        return response()->json([
            'message' => 'Credenciais inválidas',
            'debug_enviado' => $request->password,
            'debug_na_bd' => $user ? $user->password_hash : 'não encontrado'
        ], 401);
    }

    return response()->json([
        'user' => $user,
        'token' => 'token-simulado' 
    ]);
}
}