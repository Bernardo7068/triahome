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

    // Debug
    \Log::info('Login attempt', [
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

    return response()->json([
        'user' => $user,
        'token' => 'token-simulado' 
    ]);
}
}